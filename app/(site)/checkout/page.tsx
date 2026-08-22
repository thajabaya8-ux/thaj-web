'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSite } from '@/lib/siteContext';
import { computeOrderTotals } from '@/lib/payment';
import Mast from '@/components/Mast';
import type { Governorate, PaymentMethod } from '@/lib/types';

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function PaymentMethodCard({ active, onSelect, name, sub }: {
  active: boolean; onSelect: () => void; name: string; sub: string;
}) {
  return (
    <button type="button" className={`pm-card ${active ? 'on' : ''}`} onClick={onSelect}>
      <span className="pm-radio" />
      <span className="pm-body"><b>{name}</b><small>{sub}</small></span>
    </button>
  );
}

export default function CheckoutPage() {
  const {
    L, esc, pName, cart, byId, itemPrice, cartTotal, SAR, egpPerSar, coData, setCoData, coStep, setCoStep,
    uploadReceipt, submitOrder, settings, toast
  } = useSite();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [receiptKey, setReceiptKey] = useState<string | null>(null);
  const [receiptName, setReceiptName] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const steps = [L('Details', 'البيانات'), L('Shipping', 'الشحن'), L('Payment', 'الدفع')];

  const [govs, setGovs] = useState<Governorate[] | null>(null);
  const [govsError, setGovsError] = useState(false);
  const [govKey, setGovKey] = useState(coData.governorate || '');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/governorates').then(async (r) => {
      if (cancelled) return;
      if (!r.ok) throw new Error();
      setGovs(await r.json());
    }).catch(() => { if (!cancelled) setGovsError(true); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!cart.length && !submitting) router.replace('/cart');
  }, [cart.length, submitting, router]);

  const selectedGov = useMemo(() => govs?.find((g) => g.key === govKey) || null, [govs, govKey]);
  const totals = useMemo(
    () => computeOrderTotals(cartTotal, egpPerSar, selectedGov?.price || 0, settings),
    [cartTotal, egpPerSar, selectedGov, settings]
  );

  if (!cart.length) return null;

  const money = (n: number) => `${n.toLocaleString('en-US')} ${L('EGP', 'ج.م')}`;

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const key = await uploadReceipt(file);
    setUploading(false);
    if (key) { setReceiptKey(key); setReceiptName(file.name); }
    else if (fileRef.current) fileRef.current.value = '';
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const captured: Record<string, string> = {};
    e.currentTarget.querySelectorAll<FormEl>('[data-f]').forEach((el) => { if (el.dataset.f) captured[el.dataset.f] = el.value; });
    const merged = { ...coData, ...captured, governorate: govKey };
    setCoData(merged);

    if (coStep === 1 && !selectedGov) { toast(L('Choose your governorate to see the shipping fee', 'اختاري محافظتك عشان تشوفي رسوم الشحن')); return; }
    if (coStep < 2) { setCoStep(coStep + 1); return; }

    if (!method) { toast(L('Choose a payment method', 'اختاري طريقة الدفع')); return; }
    if (!receiptKey) { toast(L('Upload your transfer receipt to continue', 'ارفعي صورة إيصال التحويل عشان تكمّلي')); return; }

    setSubmitting(true);
    const order = await submitOrder(method, receiptKey);
    setSubmitting(false);
    if (order) router.push(`/checkout/confirm?order=${encodeURIComponent(order.n)}`);
  };

  const methodInfo: Record<PaymentMethod, { name: string; sub: string; account: string; handle: string }> = {
    vodafone_cash: {
      name: 'Vodafone Cash', sub: L('Transfer to a mobile wallet', 'تحويل لمحفظة موبايل'),
      account: settings.vodafone_cash_name || '', handle: settings.vodafone_cash_number || ''
    },
    instapay: {
      name: 'InstaPay', sub: L('Bank transfer via app or link', 'تحويل بنكي بالتطبيق أو لينك'),
      account: settings.instapay_name || '', handle: settings.instapay_handle || ''
    }
  };

  return (
    <>
      <Mast label={L('Checkout', 'الدفع')} title={L('Quietly, then done', 'بهدوء، وخلاص')} desc={L('A 50% deposit confirms the order — the rest is settled on delivery.', 'عربون ٥٠٪ بيأكد الطلب — والباقي بيتحصّل عند التسليم.')} />
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
                  <div className="field"><label>{L('Phone', 'الموبايل')}</label><input data-f="phone" defaultValue={coData.phone || ''} required placeholder="+20" /></div>
                </>
              )}
              {coStep === 1 && (
                <>
                  <div className="f2">
                    <div className="field">
                      <label>{L('Governorate', 'المحافظة')}</label>
                      <select data-f="governorate" value={govKey} onChange={(e) => setGovKey(e.target.value)} required disabled={!govs}>
                        <option value="" disabled>{!govs && !govsError ? L('Loading…', 'بيتحمّل…') : L('Select', 'اختاري')}</option>
                        {(govs || []).map((g) => <option key={g.key} value={g.key}>{L(g.name, g.nameAr)}</option>)}
                      </select>
                      {govsError && <div className="adm-error" style={{ minHeight: 'auto', marginTop: 6 }}>{L('Could not load governorates — refresh and try again.', 'معرفناش نحمّل المحافظات — حدّثي الصفحة وجرّبي تاني.')}</div>}
                    </div>
                    <div className="field"><label>{L('City / area', 'المدينة / المنطقة')}</label><input data-f="city" defaultValue={coData.city || ''} required /></div>
                  </div>
                  {selectedGov && (
                    <div className="ship-fee-line rv">
                      <span>{L('Shipping to', 'الشحن لـ')} {L(selectedGov.name, selectedGov.nameAr)}</span>
                      <b>{money(selectedGov.price)}</b>
                    </div>
                  )}
                  <div className="field"><label>{L('Address', 'العنوان بالتفصيل')}</label>
                    <textarea data-f="address" defaultValue={coData.address || ''} required placeholder={L('Street, building, floor, apartment, landmark', 'الشارع، المبنى، الدور، الشقة، علامة مميزة')} />
                  </div>
                  <div className="field"><label>{L('Delivery notes (optional)', 'ملاحظات التوصيل (اختياري)')}</label><input data-f="notes" defaultValue={coData.notes || ''} /></div>
                </>
              )}
              {coStep === 2 && (
                <>
                  <div className="price-breakdown pay-summary rv">
                    <div className="pb-row"><span>{L('Products', 'المنتجات')}</span><b>{money(totals.subtotal)}</b></div>
                    <div className="pb-row"><span>{L('Shipping', 'الشحن')} {selectedGov ? `· ${L(selectedGov.name, selectedGov.nameAr)}` : ''}</span><b>{money(totals.shippingFee)}</b></div>
                    <div className="pb-row pb-total"><span>{L('Order total', 'إجمالي الطلب')}</span><b>{money(totals.total)}</b></div>
                    <div className="pb-row pb-deposit"><span>{L('Deposit required now', 'العربون المطلوب الآن')}</span><b>{money(totals.deposit)}</b></div>
                    <div className="pb-row"><span>{L('Remaining on delivery', 'الباقي عند التسليم')}</span><b>{money(totals.remaining)}</b></div>
                  </div>

                  <div className="lbl" style={{ color: 'var(--ink-faint)', margin: '28px 0 12px' }}>{L('Pay with', 'الدفع بواسطة')}</div>
                  <div className="pm-grid">
                    <PaymentMethodCard active={method === 'vodafone_cash'} onSelect={() => setMethod('vodafone_cash')} name="Vodafone Cash" sub={methodInfo.vodafone_cash.sub} />
                    <PaymentMethodCard active={method === 'instapay'} onSelect={() => setMethod('instapay')} name="InstaPay" sub={methodInfo.instapay.sub} />
                  </div>

                  {method && (
                    <div className="pm-instructions rv">
                      <div className="lbl" style={{ color: 'var(--gold)', marginBottom: 10 }}>{L('Send the deposit to', 'حوّلي العربون على')}</div>
                      <div className="pm-detail"><span>{L('Account name', 'اسم الحساب')}</span><b>{esc(methodInfo[method].account) || '—'}</b></div>
                      <div className="pm-detail"><span>{method === 'vodafone_cash' ? L('Number', 'الرقم') : L('Handle', 'المعرّف')}</span><b>{esc(methodInfo[method].handle) || '—'}</b></div>
                      <div className="pm-detail pm-detail-amount"><span>{L('Amount', 'المبلغ')}</span><b>{money(totals.deposit)}</b></div>

                      <div className="lbl" style={{ color: 'var(--ink-faint)', margin: '22px 0 10px' }}>{L('Upload your transfer receipt', 'ارفعي صورة إيصال التحويل')}</div>
                      <label className={`receipt-drop ${receiptKey ? 'has-file' : ''} ${uploading ? 'busy' : ''}`}>
                        <input ref={fileRef} type="file" accept="image/*" disabled={uploading} onChange={onFile} />
                        {uploading ? L('Uploading…', 'بيترفع…') : receiptKey ? `✓ ${receiptName}` : L('Choose a photo of the receipt', 'اختاري صورة الإيصال')}
                      </label>
                    </div>
                  )}

                  <p className="body" style={{ fontSize: 11.5, marginTop: 20 }}>
                    {L('Your order is placed as "Under Review" once submitted — the atelier confirms your payment before it moves to preparation.', 'طلبك بيتسجّل بحالة "قيد المراجعة" بعد الإرسال — الأتيليه بيأكد الدفع قبل ما يبدأ التجهيز.')}
                  </p>
                </>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {coStep > 0 && <button type="button" className="btn" onClick={() => setCoStep(coStep - 1)}>{L('Back', 'رجوع')}</button>}
                <button className="btn fill" type="submit" style={{ flex: 1 }} disabled={submitting || uploading}>
                  {submitting ? L('Placing order…', 'بيتسجّل…') : coStep < 2 ? L('Continue', 'كمّلي') : L('Confirm order', 'تأكيد الطلب')}
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
                      <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>{SAR(itemPrice(c) * c.q)}</span>
                    </div>
                    <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Size', 'مقاس')} {esc(c.size)} · ×{c.q}{c.withPants ? ` · ${L('+ Trousers', '+ بنطلون')}` : ''}</span>
                  </div>
                </div>
              );
            })}
            {selectedGov ? (
              <div className="tot" style={{ marginTop: 22 }}><span className="lbl">{L('Deposit due now', 'العربون المطلوب الآن')}</span><b>{money(totals.deposit)}</b></div>
            ) : (
              <p className="body" style={{ fontSize: 12, marginTop: 22, color: 'var(--ink-faint)' }}>{L('Choose a governorate to see your deposit amount.', 'اختاري محافظتك عشان تشوفي مبلغ العربون.')}</p>
            )}
            <p className="body" style={{ fontSize: 11, lineHeight: 1.9 }}>{L('50% deposit confirms the order; the remaining balance is paid on delivery. Returns accepted within 14 days on unworn pieces.', 'عربون ٥٠٪ بيأكد الطلب؛ والباقي بيتدفع عند التسليم. الإرجاع خلال ١٤ يوم للقطع غير الملبوسة.')}</p>
          </div>
        </div>
      </section>
    </>
  );
}
