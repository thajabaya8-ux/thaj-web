'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSite } from '@/lib/siteContext';
import type { Order, SocialLink } from '@/lib/types';

const STAGES: [string, string, string][] = [
  ['Under Review', 'Under review', 'قيد المراجعة'],
  ['Payment Approved', 'Payment approved', 'الدفع معتمد'],
  ['Confirmed', 'Order confirmed', 'الطلب مؤكد'],
  ['Preparing', 'Preparing', 'قيد التجهيز'],
  ['Shipped', 'Shipped', 'تم الشحن'],
  ['Delivered', 'Delivered', 'تم التسليم']
];
const FULFILMENT_ORDER = ['Under Review', 'Confirmed', 'Preparing', 'Shipped', 'Delivered'];

function stageIndex(order: Order): number {
  if (order.st === 'Cancelled') return -1;
  const fi = FULFILMENT_ORDER.indexOf(order.st);
  const base = fi <= 0 ? 0 : fi + 1; // +1 shifts past the inserted "Payment Approved" row
  if (order.paymentStatus === 'approved' && base < 2) return 1; // approved but not yet flipped to Confirmed
  return base;
}

interface SavedShipping {
  orderNumber: string; name?: string; phone?: string;
  govName?: string; govNameAr?: string; city?: string; address?: string; notes?: string;
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmPageInner />
    </Suspense>
  );
}

function ConfirmPageInner() {
  const { L, esc, settings } = useSite();
  const orderNumber = useSearchParams().get('order');
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [shipInfo, setShipInfo] = useState<SavedShipping | null>(null);
  const [social, setSocial] = useState<SocialLink[]>([]);

  useEffect(() => {
    if (!orderNumber) return; // the !orderNumber branch below covers this — no fetch needed
    let cancelled = false;
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`).then(async (r) => {
      if (cancelled) return;
      setOrder(r.ok ? await r.json() : null);
    }).catch(() => { if (!cancelled) setOrder(null); });
    return () => { cancelled = true; };
  }, [orderNumber]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/social').then((r) => (r.ok ? r.json() : [])).then((s: SocialLink[]) => { if (!cancelled) setSocial(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Only used if it matches THIS order — a stale entry from a previous
  // checkout (or none at all, if this link was opened fresh rather than
  // landed on right after paying) just means the waybill doesn't render.
  useEffect(() => {
    if (!orderNumber) return;
    try {
      const raw = sessionStorage.getItem('thaj-last-order-shipping');
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedShipping;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (parsed.orderNumber === orderNumber) setShipInfo(parsed);
    } catch { /* ignore malformed/unavailable storage */ }
  }, [orderNumber]);

  const fmt = (n?: number) => `${(n || 0).toLocaleString('en-US')} ${L('EGP', 'ج.م')}`;

  if (!orderNumber || order === null) {
    return (
      <section className="pad wrap-n" style={{ textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 'calc(var(--nav-h) + 60px)' }}>
        <h1 className="h-l rv"><span className="clip">{L('Thank you', 'شكرًا لك')}</span></h1>
        <p className="body rv" style={{ margin: '26px auto 0', maxWidth: '44ch' }}>
          {L('Your order is with the atelier.', 'طلبك عند الأتيليه.')}
        </p>
        <div className="rv" style={{ marginTop: 34, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="btn" href="/account">{L('My THAJ', 'حسابي')}</Link>
          <Link className="btn" href="/shop">{L('Continue', 'كمّلي')}</Link>
        </div>
      </section>
    );
  }

  if (order === undefined) {
    return (
      <section className="pad wrap-n" style={{ textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 'calc(var(--nav-h) + 60px)' }}>
        <p className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Loading your order…', 'بنجيب طلبك…')}</p>
      </section>
    );
  }

  const idx = stageIndex(order);
  const rejected = order.paymentStatus === 'rejected';
  const cancelled = order.st === 'Cancelled';
  const showNext = !rejected && !cancelled;
  const whatsapp = social.find((s) => s.platform === 'whatsapp');
  const waLink = whatsapp
    ? `${whatsapp.url}${whatsapp.url.includes('?') ? '&' : '?'}text=${encodeURIComponent(L(`Hi, I'd like to confirm my order ${order.n}.`, `مرحبًا، عايزة أأكد طلبي رقم ${order.n}.`))}`
    : null;
  const itemCount = order.items.reduce((s, it) => s + (it.qty || 1), 0);
  const remaining = (order.tot || 0) - (order.amountPaid || 0);
  const discount = (order.originalSubtotal ?? 0) - (order.subtotal ?? 0);
  const govLabel = shipInfo ? L(shipInfo.govName, shipInfo.govNameAr) : '';
  const placedDate = (order.d || '').slice(0, 10);

  return (
    <section className="pad wrap-n" style={{ paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: 'clamp(70px,11vh,140px)' }}>
      <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Order received', 'وصلنا طلبك')}</div>
      <h1 className="h-l rv" style={{ marginBottom: 10 }}><span className="clip">{L('Thank you', 'شكرًا لك')}</span></h1>
      <p className="body rv" style={{ marginBottom: 24 }}>
        {L('Order', 'رقم الطلب')} <b style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{esc(order.n)}</b>
      </p>

      <div className="rv" style={{ background: 'var(--bone-2)', padding: '18px 22px', marginBottom: 40 }}>
        <p className="body" style={{ fontSize: 12.5, marginBottom: 8 }}>
          {L('Track this order any time from your account — see the deposit, what’s been paid, and every stage from here to delivery.', 'تقدري تتابعي طلبك في أي وقت من حسابك — شوفي العربون، المدفوع لحد دلوقتي، وكل مرحلة لحد التسليم.')}
        </p>
        <Link className="link" href="/account">{L('Go to My THAJ', 'روحي لحسابي')}</Link>
      </div>

      {rejected && (
        <div className="track-alert rv">
          <b>{L('Payment not approved', 'الدفع لم يُعتمد')}</b>
          <p>{order.rejectionReason || L('The atelier could not verify this receipt.', 'الأتيليه معرفش يتأكد من الإيصال ده.')}</p>
          <p>{L('Please get in touch so we can help you complete the deposit.', 'تواصلي معانا عشان نساعدك تكمّلي العربون.')} {settings.contact_email ? <a href={`mailto:${settings.contact_email}`}>{settings.contact_email}</a> : null}</p>
        </div>
      )}

      {cancelled && (
        <div className="track-alert rv"><b>{L('Order cancelled', 'الطلب اتلغى')}</b></div>
      )}

      {showNext && idx <= 1 && whatsapp && (
        <div className="wa-cta rv">
          <p className="body">{L('Please go to WhatsApp and send us a message to confirm your order.', 'يرجى التوجه إلى واتساب وإرسال رسالة لتأكيد طلبك.')}</p>
          <a className="btn fill" href={waLink!} target="_blank" rel="noopener noreferrer">{L('Message us on WhatsApp', 'راسلينا على واتساب')}</a>
          <p className="body" style={{ marginTop: 14, fontSize: 11.5, color: 'var(--ink-faint)' }}>
            {L('Your order is under review — the atelier will confirm it with you over WhatsApp once your payment has been checked.', 'طلبك قيد المراجعة من الأتيليه، وهيوصلك تأكيد عبر واتساب بعد ما نراجع الدفع.')}
          </p>
        </div>
      )}

      {!rejected && !cancelled && (
        <div className="track-stages rv">
          {STAGES.map(([key, en, ar], i) => (
            <div className={`ts-row ${i < idx ? 'done' : i === idx ? 'now' : ''}`} key={key}>
              <span className="ts-dot" />
              <span className="ts-label">{L(en, ar)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="price-breakdown rv" style={{ marginTop: 40 }}>
        {discount > 0 && (
          <div className="pb-row"><span>{L('Discount', 'الخصم')}</span><b style={{ color: 'var(--emerald)' }}>−{fmt(discount)}</b></div>
        )}
        <div className="pb-row"><span>{L('Order total', 'إجمالي الطلب')}</span><b>{fmt(order.tot)}</b></div>
        <div className="pb-row"><span>{L('Deposit required', 'العربون المطلوب')}</span><b>{fmt(order.depositAmount)}</b></div>
        <div className="pb-row"><span>{L('Amount paid', 'المدفوع')}</span><b>{fmt(order.amountPaid)}</b></div>
        <div className="pb-row pb-total"><span>{L('Remaining on delivery', 'الباقي عند التسليم')}</span><b>{fmt(remaining)}</b></div>
      </div>

      {showNext && shipInfo && (
        <div className="waybill rv" style={{ marginTop: 40 }}>
          <div className="wb-head">
            <span className="wb-brand">THAJ</span>
            <span className="wb-num">{esc(order.n)}</span>
          </div>
          <div className="wb-row"><span>{L('Date', 'التاريخ')}</span><b>{placedDate}</b></div>
          <div className="wb-row"><span>{L('Recipient', 'المستلمة')}</span><b>{esc(shipInfo.name)}</b></div>
          <div className="wb-row"><span>{L('Phone', 'الموبايل')}</span><b dir="ltr">{esc(shipInfo.phone)}</b></div>
          <div className="wb-row"><span>{L('Address', 'العنوان')}</span><b>{esc([govLabel, shipInfo.city].filter(Boolean).join(', '))}{shipInfo.address ? ` — ${esc(shipInfo.address)}` : ''}</b></div>
          {shipInfo.notes && <div className="wb-row"><span>{L('Notes', 'ملاحظات')}</span><b>{esc(shipInfo.notes)}</b></div>}
          <div className="wb-row"><span>{L('Items', 'عدد القطع')}</span><b>{itemCount}</b></div>
          <div className="wb-row wb-cod"><span>{L('Collect on delivery', 'التحصيل عند التسليم')}</span><b>{fmt(remaining)}</b></div>
          <button type="button" className="btn no-print" style={{ marginTop: 18 }} onClick={() => window.print()}>
            {L('Print / Save as PDF', 'طباعة / حفظ PDF')}
          </button>
        </div>
      )}

      <div className="rv" style={{ marginTop: 34, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link className="btn" href="/account">{L('My THAJ', 'حسابي')}</Link>
        <Link className="btn" href="/shop">{L('Continue shopping', 'كمّلي تسوّق')}</Link>
      </div>
    </section>
  );
}
