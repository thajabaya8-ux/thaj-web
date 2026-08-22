/* The site has no forced customer login — "My THAJ" is a shared demo
   view. It must NOT leak other customers' name/email/phone/shipping;
   orderPublicOut strips them. Order tracking by number lives at
   app/api/orders/[orderNumber]/route.ts instead. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { orderPublicOut } from '@/lib/serverMappers';
import { isEmail, str } from '@/lib/serverValidators';
import { computeOrderTotals } from '@/lib/payment';
import { capiSignalsFromRequest, sendPurchaseToCapi } from '@/lib/metaCapi';
import type { Settings } from '@/lib/types';

export async function GET() {
  const rows = await sql`SELECT * FROM orders ORDER BY id DESC LIMIT 100`;
  return NextResponse.json(rows.map(orderPublicOut));
}

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM orders WHERE order_number LIKE ${`THAJ-${year}-%`}`;
  return `THAJ-${year}-${String(n + 1).padStart(4, '0')}`;
}

const PAYMENT_METHODS = ['vodafone_cash', 'instapay'];

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { items, name, email, phone, shipping, paymentMethod, receiptKey, egpPerSar } = body || {};

  if (!Array.isArray(items) || !items.length || items.length > 30) {
    return NextResponse.json({ error: 'items is required (1-30 pieces)' }, { status: 400 });
  }
  if (email !== undefined && email !== '' && !isEmail(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }
  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return NextResponse.json({ error: 'Choose Vodafone Cash or InstaPay' }, { status: 400 });
  }
  if (!str(receiptKey, 300) || !/^receipts\//.test(receiptKey)) {
    return NextResponse.json({ error: 'A payment receipt photo is required' }, { status: 400 });
  }
  const ship = shipping || {};
  if (!str(ship.name, 200) || !str(ship.phone, 40) || !str(ship.governorate, 100) || !str(ship.city, 100) || !str(ship.address, 500)) {
    return NextResponse.json({ error: 'Full shipping details are required' }, { status: 400 });
  }

  // The shipping fee is never trusted from the client — it's looked up
  // here from whatever price the admin currently has set for this
  // governorate (see /admin/shipping), then frozen into the order below.
  const govRows = await sql`SELECT * FROM governorates WHERE key = ${str(ship.governorate, 100)} AND active = true`;
  if (!govRows.length) return NextResponse.json({ error: 'Choose a valid governorate' }, { status: 400 });
  const governorate = govRows[0];

  // The receipt key must actually belong to an object we hold — this just
  // rejects obviously-malformed values; the receipt's authenticity is a
  // human judgement call the admin makes on Approve/Reject.
  const receiptKeySafe = str(receiptKey, 300);

  const settingsRows = await sql`SELECT key, value FROM settings`;
  const settings: Settings = {};
  for (const r of settingsRows) settings[r.key] = r.value;
  // The rate the shopper saw is echoed back from the client only to keep
  // the total they were quoted stable through checkout; it's clamped to
  // the server's own current rate settings ever drift far, and every
  // other number (subtotal, deposit, shipping) is still computed here.
  const rate = Number.isFinite(parseFloat(egpPerSar)) && parseFloat(egpPerSar) > 0
    ? parseFloat(egpPerSar)
    : parseFloat(settings.egp_per_sar || '13.5');

  // Every piece is priced in exactly one currency (admin-set) — SAR-priced
  // pieces are converted to EGP here via the rate above, EGP-priced pieces
  // are added as-is, so the deposit/total math below always works in one
  // consistent currency regardless of how the cart's pieces are individually priced.
  let subtotalEgp = 0;
  const cleanItems: { id: string; size: string; qty: number; withPants?: boolean }[] = [];
  for (const it of items) {
    const pid = String((it && it.id) || '');
    const rows = await sql`SELECT id, price, pants_price, currency FROM pieces WHERE id = ${pid}`;
    if (!rows.length) return NextResponse.json({ error: `Unknown piece: ${pid}` }, { status: 400 });
    const p = rows[0];
    const qty = Math.min(20, Math.max(1, parseInt(it.qty, 10) || 1));
    // Trousers can only be added alongside the piece they belong to, and
    // only when that piece still offers them server-side — never trust
    // the client's price math.
    const withPants = !!it.withPants && p.pants_price != null;
    const unitPrice = p.price + (withPants ? p.pants_price : 0);
    const unitPriceEgp = p.currency === 'EGP' ? unitPrice : Math.round(unitPrice * rate);
    subtotalEgp += unitPriceEgp * qty;
    cleanItems.push({ id: p.id, size: str(it.size, 40), qty, withPants });
  }

  const { subtotal, shippingFee, total, deposit } = computeOrderTotals(subtotalEgp, governorate.price, settings);

  const shippingJson = JSON.stringify({
    name: str(ship.name, 200), phone: str(ship.phone, 40),
    governorate: governorate.key, governorateName: governorate.name_en, governorateNameAr: governorate.name_ar,
    city: str(ship.city, 100), address: str(ship.address, 500), notes: str(ship.notes, 500)
  });

  const orderNumber = await nextOrderNumber();
  const rows = await sql`INSERT INTO orders
    (order_number, customer_name, email, phone, items, total, status,
     subtotal, shipping_fee, deposit_amount, amount_paid, payment_method, payment_status, receipt_key, shipping_json)
    VALUES (${orderNumber}, ${str(ship.name, 200) || str(name, 200) || null}, ${str(email, 254) || null}, ${str(ship.phone, 40) || str(phone, 40) || null},
      ${JSON.stringify(cleanItems)}, ${total}, 'Under Review',
      ${subtotal}, ${shippingFee}, ${deposit}, 0, ${paymentMethod}, 'under_review', ${receiptKeySafe}, ${shippingJson})
    RETURNING *`;

  // Fire-and-forget server-side mirror of the browser Purchase event — never
  // block or slow the order response on Meta's API being slow or down.
  // No-ops on its own until META_CONVERSIONS_API_TOKEN is configured.
  sendPurchaseToCapi({
    eventId: orderNumber,
    value: total,
    currency: 'EGP',
    contentIds: cleanItems.map((i) => i.id),
    numItems: cleanItems.reduce((s, i) => s + i.qty, 0),
    eventSourceUrl: req.headers.get('referer') || 'https://thaj-web.vercel.app/checkout',
    ...capiSignalsFromRequest(req)
  });

  return NextResponse.json(orderPublicOut(rows[0]), { status: 201 });
}
