'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSite } from '@/lib/siteContext';
import type { Order } from '@/lib/types';

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

  useEffect(() => {
    if (!orderNumber) return; // the !orderNumber branch below covers this — no fetch needed
    let cancelled = false;
    fetch(`/api/orders/${encodeURIComponent(orderNumber)}`).then(async (r) => {
      if (cancelled) return;
      setOrder(r.ok ? await r.json() : null);
    }).catch(() => { if (!cancelled) setOrder(null); });
    return () => { cancelled = true; };
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

  if (order === undefined) return null;

  const idx = stageIndex(order);
  const rejected = order.paymentStatus === 'rejected';
  const cancelled = order.st === 'Cancelled';

  return (
    <section className="pad wrap-n" style={{ paddingTop: 'calc(var(--nav-h) + 60px)', paddingBottom: 'clamp(70px,11vh,140px)' }}>
      <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Order received', 'وصلنا طلبك')}</div>
      <h1 className="h-l rv" style={{ marginBottom: 10 }}><span className="clip">{L('Thank you', 'شكرًا لك')}</span></h1>
      <p className="body rv" style={{ marginBottom: 40 }}>
        {L('Order', 'رقم الطلب')} <b style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{esc(order.n)}</b>
      </p>

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
        <div className="pb-row"><span>{L('Order total', 'إجمالي الطلب')}</span><b>{fmt(order.tot)}</b></div>
        <div className="pb-row"><span>{L('Deposit required', 'العربون المطلوب')}</span><b>{fmt(order.depositAmount)}</b></div>
        <div className="pb-row"><span>{L('Amount paid', 'المدفوع')}</span><b>{fmt(order.amountPaid)}</b></div>
        <div className="pb-row pb-total"><span>{L('Remaining on delivery', 'الباقي عند التسليم')}</span><b>{fmt((order.tot || 0) - (order.amountPaid || 0))}</b></div>
      </div>

      <div className="rv" style={{ marginTop: 34, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link className="btn" href="/account">{L('My THAJ', 'حسابي')}</Link>
        <Link className="btn" href="/shop">{L('Continue shopping', 'كمّلي تسوّق')}</Link>
      </div>
    </section>
  );
}
