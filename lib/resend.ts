/* ==========================================================
   THAJ — order notification email (Resend)
   Fire-and-forget email to the shop's own inbox whenever a new order
   comes in, same pattern as sendPurchaseToCapi in lib/metaCapi.ts —
   best-effort, never blocks or fails order creation on the email
   provider being slow or down. No-ops until RESEND_API_KEY is set.
   ========================================================== */
const NOTIFY_TO = 'Thajabaya4@gmail.com';

interface OrderNotifyInput {
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  governorate: string;
  city: string;
  address: string;
  notes?: string;
  items: { name: string; size: string; qty: number; withPants?: boolean }[];
  total: number;
  deposit: number;
  paymentMethod: string;
}

// Values here come straight from the shopper's own form fields — never
// trust them into raw HTML unescaped, even for an email only the shop
// owner reads.
function esc(v: unknown): string {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export async function sendOrderNotification(input: OrderNotifyInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const row = (label: string, value: string) =>
    `<tr><td style="padding:5px 14px 5px 0;color:#777;white-space:nowrap">${esc(label)}</td><td>${value}</td></tr>`;

  const itemsHtml = input.items
    .map((it) => `<li>${esc(it.name)} — ${esc(it.size)} × ${it.qty}${it.withPants ? ' (+ trousers)' : ''}</li>`)
    .join('');

  const html = `
    <div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.7;color:#222">
      <h2 style="margin:0 0 4px">طلب جديد — ${esc(input.orderNumber)}</h2>
      <p style="font-size:20px;font-weight:bold;margin:4px 0 18px">
        ${esc(input.phone)} — ${esc(input.orderNumber)}
      </p>
      <table style="border-collapse:collapse;font-size:14px">
        ${row('الاسم', esc(input.customerName))}
        ${row('الموبايل', `<b>${esc(input.phone)}</b>`)}
        ${row('رقم الطلب', `<b>${esc(input.orderNumber)}</b>`)}
        ${input.email ? row('الإيميل', esc(input.email)) : ''}
        ${row('المحافظة', esc(input.governorate))}
        ${row('المدينة', esc(input.city))}
        ${row('العنوان', esc(input.address))}
        ${input.notes ? row('ملاحظات', esc(input.notes)) : ''}
        ${row('طريقة الدفع', esc(input.paymentMethod))}
        ${row('الإجمالي', `${input.total.toLocaleString('en-US')} ج.م`)}
        ${row('العربون', `${input.deposit.toLocaleString('en-US')} ج.م`)}
      </table>
      <p style="margin:18px 0 6px"><b>القطع:</b></p>
      <ul style="margin:0;padding-inline-start:20px">${itemsHtml}</ul>
    </div>
  `;

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'THAJ Orders <onboarding@resend.dev>',
        to: [NOTIFY_TO],
        subject: `طلب جديد ${input.orderNumber} · ${input.customerName} · ${input.phone}`,
        html
      })
    });
  } catch {
    // Best-effort — never block or fail order creation on Resend being down.
  }
}
