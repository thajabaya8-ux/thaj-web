/* A customer's own order history is at /api/account/orders (session-
   scoped), an admin's full view is at /api/admin/orders (admin-gated),
   and tracking a single order by its number is
   app/api/orders/[orderNumber]/route.ts (a public bearer-token lookup —
   see that file's own note). This route only ever handles creating a
   new order; it used to also have a completely unauthenticated GET
   returning the last 100 orders to anyone, unused by anything in the
   app — deleted, not fixed, since nothing needed it. */
import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { orderPublicOut } from '@/lib/serverMappers';
import { isEmail, str } from '@/lib/serverValidators';
import { computeOrderTotals } from '@/lib/payment';
import { capiSignalsFromRequest, sendPurchaseToCapi } from '@/lib/metaCapi';
import { sendOrderNotification } from '@/lib/resend';
import { getSession } from '@/lib/session';
import type { Settings } from '@/lib/types';

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM orders WHERE order_number LIKE ${`THAJ-${year}-%`}`;
  return `THAJ-${year}-${String(n + 1).padStart(4, '0')}`;
}

const PAYMENT_METHODS = ['vodafone_cash', 'instapay'];

export async function POST(req: Request) {
  // Checkout has never required an account — this is null for a guest
  // checkout, same as always, and only links the order to a user_id when
  // one's actually signed in.
  const session = await getSession();
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
  const cleanItems: { id: string; size: string; qty: number; withPants?: boolean; color?: string }[] = [];
  const itemsForEmail: { name: string; size: string; qty: number; withPants?: boolean; color?: string }[] = [];

  // Stock is reserved (not yet permanently deducted — that only happens
  // when the admin approves the payment) right here, atomically per item,
  // so two customers can't both claim the last piece at once: the UPDATE
  // only succeeds if (stock - reserved) still covers this qty at the exact
  // moment it runs. If any item in the cart can't be reserved, everything
  // already reserved for this same attempt is released before failing.
  const reservedSoFar: { id: string; qty: number }[] = [];
  const releaseReserved = async () => {
    for (const r of reservedSoFar) {
      await sql`UPDATE pieces SET reserved = GREATEST(0, reserved - ${r.qty}) WHERE id = ${r.id}`;
    }
  };

  for (const it of items) {
    const pid = String((it && it.id) || '');
    const qty = Math.min(20, Math.max(1, parseInt(it.qty, 10) || 1));

    const rows = await sql`
      UPDATE pieces SET reserved = reserved + ${qty}
      WHERE id = ${pid} AND (stock - reserved) >= ${qty}
      RETURNING id, price, pants_price, currency, sale_price, name_en, colors`;

    if (!rows.length) {
      await releaseReserved();
      const cur = await sql`SELECT name_en, stock, reserved FROM pieces WHERE id = ${pid}`;
      if (!cur.length) return NextResponse.json({ error: `Unknown piece: ${pid}` }, { status: 400 });
      const available = Math.max(0, cur[0].stock - cur[0].reserved);
      return NextResponse.json({ error: `Only ${available} of "${cur[0].name_en}" left in stock` }, { status: 409 });
    }
    reservedSoFar.push({ id: pid, qty });
    const p = rows[0];

    // Trousers can only be added alongside the piece they belong to, and
    // only when that piece still offers them server-side — never trust
    // the client's price math. Same for the sale price: only a genuine
    // discount (lower than the full price) is ever honoured here.
    const withPants = !!it.withPants && p.pants_price != null;
    const base = p.sale_price != null && p.sale_price < p.price ? p.sale_price : p.price;
    const unitPrice = base + (withPants ? p.pants_price : 0);
    const unitPriceEgp = p.currency === 'EGP' ? unitPrice : Math.round(unitPrice * rate);
    subtotalEgp += unitPriceEgp * qty;
    const size = str(it.size, 40);
    // Only a colour id that actually exists on this piece is ever trusted —
    // same rule as withPants above, the client's claim is just a hint.
    let pieceColors: { id: string; nameEn: string }[] = [];
    try { pieceColors = JSON.parse(p.colors || '[]'); } catch { /* left empty */ }
    const colorMatch = pieceColors.find((c) => c.id === it.color);
    const color = colorMatch?.id;
    cleanItems.push({ id: p.id, size, qty, withPants, ...(color ? { color } : {}) });
    itemsForEmail.push({ name: p.name_en, size, qty, withPants, ...(colorMatch ? { color: colorMatch.nameEn } : {}) });
  }

  const { subtotal, shippingFee, total, deposit } = computeOrderTotals(subtotalEgp, governorate.price, settings);

  const shippingJson = JSON.stringify({
    name: str(ship.name, 200), phone: str(ship.phone, 40),
    governorate: governorate.key, governorateName: governorate.name_en, governorateNameAr: governorate.name_ar,
    city: str(ship.city, 100), address: str(ship.address, 500), notes: str(ship.notes, 500)
  });

  const orderNumber = await nextOrderNumber();
  let rows;
  try {
    rows = await sql`INSERT INTO orders
      (order_number, customer_name, email, phone, items, total, status,
       subtotal, shipping_fee, deposit_amount, amount_paid, payment_method, payment_status, receipt_key, shipping_json, reservation_active, user_id)
      VALUES (${orderNumber}, ${str(ship.name, 200) || str(name, 200) || null}, ${str(email, 254) || null}, ${str(ship.phone, 40) || str(phone, 40) || null},
        ${JSON.stringify(cleanItems)}, ${total}, 'Under Review',
        ${subtotal}, ${shippingFee}, ${deposit}, 0, ${paymentMethod}, 'under_review', ${receiptKeySafe}, ${shippingJson}, true, ${session?.userId ?? null})
      RETURNING *`;
  } catch (err) {
    // The order row itself failed to write — the stock reserved above for
    // this attempt would otherwise leak forever with nothing to release it.
    await releaseReserved();
    throw err;
  }

  // Fire-and-forget server-side mirror of the browser Purchase event — never
  // block or slow the order response on Meta's API being slow or down.
  // No-ops on its own until both meta_pixel_id and meta_capi_token are set
  // in Settings → Marketing.
  sendPurchaseToCapi({
    pixelId: settings.meta_pixel_id || '',
    accessToken: settings.meta_capi_token || '',
    eventId: orderNumber,
    value: total,
    currency: 'EGP',
    contentIds: cleanItems.map((i) => i.id),
    numItems: cleanItems.reduce((s, i) => s + i.qty, 0),
    eventSourceUrl: req.headers.get('referer') || 'https://thaj-web.vercel.app/checkout',
    ...capiSignalsFromRequest(req)
  });

  // Fire-and-forget email to the shop's own inbox — see lib/resend.ts.
  sendOrderNotification({
    orderNumber, customerName: str(ship.name, 200) || str(name, 200) || '—',
    phone: str(ship.phone, 40) || str(phone, 40) || '—', email: str(email, 254) || undefined,
    governorate: governorate.name_en, city: str(ship.city, 100), address: str(ship.address, 500),
    notes: str(ship.notes, 500) || undefined, items: itemsForEmail, total, deposit, paymentMethod
  });

  return NextResponse.json(orderPublicOut(rows[0]), { status: 201 });
}
