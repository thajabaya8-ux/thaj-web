'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

export default function CheckoutPage() {
  const { L, esc, pName, cart, byId, cartTotal, SAR, coData, setCoData, coStep, setCoStep, submitOrder } = useSite();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const steps = [L('Details', 'البيانات'), L('Delivery', 'التوصيل'), L('Payment', 'الدفع')];

  useEffect(() => {
    if (!cart.length && !submitting) router.replace('/cart');
  }, [cart.length, submitting, router]);

  if (!cart.length) return null;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const captured: Record<string, string> = {};
    e.currentTarget.querySelectorAll<FormEl>('[data-f]').forEach((el) => { if (el.dataset.f) captured[el.dataset.f] = el.value; });
    const merged = { ...coData, ...captured };
    setCoData(merged);

    if (coStep < 2) { setCoStep(coStep + 1); return; }

    setSubmitting(true);
    await submitOrder();
    router.push('/checkout/confirm');
  };

  return (
    <>
      <Mast label={L('Checkout', 'الدفع')} title={L('Quietly, then done', 'بهدوء، وخلاص')} desc={L('Payment is taken when the piece leaves the atelier, not before.', 'الدفع بيتخصم لما القطعة تخرج من الأتيليه، مش قبل كده.')} />
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        <div className="co">
          <div className="rv">
            <div className="steps">
              {steps.map((s, i) => <span key={s} className={i <= coStep ? 'on' : ''}>{i + 1} · {s}</span>)}
            </div>
            <form className="form" onSubmit={onSubmit}>
              {coStep === 0 && (
                <>
                  <div className="f2">
                    <div className="field"><label>{L('First name', 'الاسم الأول')}</label><input data-f="fn" defaultValue={coData.fn || ''} required /></div>
                    <div className="field"><label>{L('Last name', 'اسم العائلة')}</label><input data-f="ln" defaultValue={coData.ln || ''} required /></div>
                  </div>
                  <div className="field"><label>{L('Email', 'الإيميل')}</label><input data-f="email" type="email" defaultValue={coData.email || ''} required /></div>
                  <div className="field"><label>{L('Phone', 'الموبايل')}</label><input data-f="phone" defaultValue={coData.phone || ''} required placeholder="+966" /></div>
                </>
              )}
              {coStep === 1 && (
                <>
                  <div className="field"><label>{L('Address', 'العنوان')}</label><input data-f="address" defaultValue={coData.address || ''} required placeholder={L('Street, building', 'الشارع، المبنى')} /></div>
                  <div className="f2">
                    <div className="field"><label>{L('City', 'المدينة')}</label><input data-f="city" defaultValue={coData.city || L('Riyadh', 'الرياض')} required /></div>
                    <div className="field"><label>{L('Country', 'الدولة')}</label>
                      <select data-f="country" defaultValue={coData.country}>
                        <option>{L('Saudi Arabia', 'السعودية')}</option><option>{L('United Arab Emirates', 'الإمارات')}</option>
                        <option>{L('Kuwait', 'الكويت')}</option><option>{L('Qatar', 'قطر')}</option><option>{L('Egypt', 'مصر')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="field"><label>{L('Delivery', 'التوصيل')}</label>
                    <select data-f="delivery" defaultValue={coData.delivery}>
                      <option>{L('Standard — 3 to 5 days · complimentary', 'عادي — ٣ لـ ٥ أيام · مجانًا')}</option>
                      <option>{L('Atelier collection — Riyadh', 'استلام من الأتيليه — الرياض')}</option>
                      <option>{L('Express — next day · 90 SAR', 'سريع — تاني يوم · ٩٠ ر.س')}</option>
                    </select>
                  </div>
                </>
              )}
              {coStep === 2 && (
                <>
                  <div className="field"><label>{L('Card number', 'رقم الكارت')}</label><input data-f="card" required placeholder="•••• •••• •••• ••••" /></div>
                  <div className="f2">
                    <div className="field"><label>{L('Expiry', 'الانتهاء')}</label><input data-f="expiry" required placeholder="MM / YY" /></div>
                    <div className="field"><label>CVC</label><input data-f="cvc" required placeholder="•••" /></div>
                  </div>
                  <div className="field"><label>{L('Name on card', 'الاسم على الكارت')}</label><input data-f="nameOnCard" required /></div>
                  <p className="body" style={{ fontSize: 11.5 }}>{L('Payment is taken when the piece leaves the atelier, not before.', 'الدفع بيتخصم لما القطعة تخرج من الأتيليه، مش قبل كده.')}</p>
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {coStep > 0 && <button type="button" className="btn" onClick={() => setCoStep(coStep - 1)}>{L('Back', 'رجوع')}</button>}
                <button className="btn fill" type="submit" style={{ flex: 1 }} disabled={submitting}>
                  {coStep < 2 ? L('Continue', 'كمّلي') : L('Complete order', 'إتمام الطلب')}
                </button>
              </div>
            </form>
          </div>
          <div className="sum rv">
            <div className="lbl" style={{ color: 'var(--ink-faint)', marginBottom: 22 }}>{L('Your selection', 'اختيارك')}</div>
            {cart.map((c, i) => {
              const p = byId(c.pid);
              if (!p) return null;
              return (
                <div className="citem" key={`${c.pid}-${i}`} style={{ gridTemplateColumns: '64px 1fr' }}>
                  <img src={`/${p.img}`} alt="" />
                  <div className="ci">
                    <div className="top">
                      <span className="h-s" style={{ fontSize: 16 }}>{pName(p)}</span>
                      <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>{SAR(p.price * c.q)}</span>
                    </div>
                    <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Size', 'مقاس')} {esc(c.size)} · ×{c.q}</span>
                  </div>
                </div>
              );
            })}
            <div className="tot" style={{ marginTop: 22 }}><span className="lbl">{L('Total', 'الإجمالي')}</span><b>{SAR(cartTotal)}</b></div>
            <p className="body" style={{ fontSize: 11, lineHeight: 1.9 }}>{L('Duties included for GCC. Returns accepted within 14 days on unworn pieces.', 'الرسوم مشمولة لدول الخليج. الإرجاع خلال ١٤ يوم للقطع غير الملبوسة.')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
