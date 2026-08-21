'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';

export default function ConfirmPage() {
  const { L } = useSite();
  return (
    <section className="pad wrap-n" style={{ textAlign: 'center', minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: 'calc(var(--nav-h) + 60px)' }}>
      <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 22 }}>{L('Order received', 'وصلنا طلبك')}</div>
      <h1 className="h-l rv"><span className="clip">{L('Thank you', 'شكرًا لك')}</span></h1>
      <p className="body rv" style={{ margin: '26px auto 0', maxWidth: '44ch' }}>
        {L('Your pieces are with the atelier. You will hear from us when they leave it — and not before, because there is nothing to say until then.', 'قطعك عند الأتيليه. هنكلّمك لما تخرج منه — ومش قبل كده، لأن مافيش حاجة تتقال لحد ساعتها.')}
      </p>
      <div className="rv" style={{ marginTop: 34, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link className="btn" href="/account">{L('My THAJ', 'حسابي')}</Link>
        <Link className="btn" href="/shop">{L('Continue', 'كمّلي')}</Link>
      </div>
    </section>
  );
}
