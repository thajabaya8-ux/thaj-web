'use client';
import { useParams } from 'next/navigation';
import { useSite } from '@/lib/siteContext';
import ProductCard from '@/components/ProductCard';

export default function CollectionPage() {
  const { key: rawKey } = useParams<{ key: string }>();
  const { L, AR, esc, collections, pieces } = useSite();
  const key = collections[rawKey] ? rawKey : 'signature';
  const c = collections[key];
  if (!c) return null;
  const items = pieces.filter((p) => p.coll === key);

  return (
    <>
      <section className="hero bleed rv" style={{ height: 'min(80vh,780px)' }}>
        <img src={`/${c.img}`} alt={L(c.name, c.nameAr)} style={{ objectPosition: '50% 26%' }} />
        <div className="h-in">
          <div className="lbl">{L('Chapter', 'فصل')} · {esc(L(c.mood, c.moodAr))}</div>
          <h1>{esc(L(c.line, c.lineAr))}</h1>
        </div>
      </section>
      <section className="pad wrap-n">
        <div className="split" style={{ gridTemplateColumns: 'repeat(12,1fr)' }}>
          <div style={{ gridColumn: '1/6' }}>
            <h2 className="h-m rv"><span className="clip">{esc(L(c.name, c.nameAr))}</span></h2>
            {AR() ? null : <div className="arabic rv" style={{ fontSize: 22, color: 'var(--ink-faint)', marginTop: 10 }}>{esc(c.ar)}</div>}
          </div>
          <div style={{ gridColumn: '7/13' }}><p className="body rv">{esc(L(c.concept, c.conceptAr))}</p></div>
        </div>
      </section>
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        <div className="grid-shop">{items.map((p) => <ProductCard key={p.id} piece={p} />)}</div>
      </section>
    </>
  );
}
