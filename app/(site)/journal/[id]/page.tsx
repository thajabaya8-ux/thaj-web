'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const { L, esc, journal } = useSite();
  const j = journal.find((x) => x.id === id) || journal[0];
  if (!j) return null;

  return (
    <>
      <Mast label={esc(L(j.cat, j.catAr))} title={esc(L(j.t, j.tAr))} desc="" />
      <section className="wrap-n article" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        <div className="rv" style={{ position: 'relative', overflow: 'hidden', aspectRatio: '16/10', background: 'var(--sand)', marginBottom: 44 }}>
          <div className="veil" /><img src={`/${j.img}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%' }} alt="" />
        </div>
        {L(j.x, j.xAr).map((x, i) => <p className="rv" key={i}>{esc(x)}</p>)}
        <div style={{ textAlign: 'center', marginTop: 50 }}><Link className="link rv" href="/journal">{L('Back to the journal', 'رجوع للمجلة')}</Link></div>
      </section>
    </>
  );
}
