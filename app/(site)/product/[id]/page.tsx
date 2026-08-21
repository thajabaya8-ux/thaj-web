'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useSite } from '@/lib/siteContext';
import { SIZES, SIZE_MTM } from '@/lib/siteContext';
import ProductCard from '@/components/ProductCard';
import EdHead from '@/components/EdHead';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { L, AR, esc, num, fa, collName, pName, SAR, byId, pieces, collections, wish, toggleWish, addToCart, AVAIL_AR } = useSite();
  const [size, setSize] = useState<string | null>(null);

  const p = byId(id) || pieces[0];
  if (!p) return null;
  const rel = pieces.filter((x) => x.coll === p.coll && x.id !== p.id).slice(0, 3);
  const saved = wish.includes(p.id);
  const sizes = [...SIZES, L(SIZE_MTM.en, SIZE_MTM.ar)];
  const specs: [string, string][] = [
    [L('Material', 'الخامة'), esc(L(p.mat, p.matAr))],
    [L('Silhouette', 'السيلويت'), esc(L(p.silf, p.silfAr))],
    [L('Palette', 'الألوان'), esc(L(p.pal, p.palAr))],
    [L('Fabric', 'القماش'), fa(p.fabric)],
    [L('Occasion', 'المناسبة'), fa(p.occ)],
    [L('Year', 'السنة'), num(2026)],
    [L('Edition', 'الإصدار'), esc(p.ed)],
    [L('Availability', 'التوفر'), esc(AR() ? (AVAIL_AR[p.av] || p.av) : p.av)]
  ];

  return (
    <>
      <section className="pdp">
        <div className="gal"><img src={`/${p.img}`} alt={pName(p)} /></div>
        <div className="info">
          <div className="lbl ed rv">{esc(p.ed)} · {collName(p.coll)}</div>
          <h1 className="h-l rv"><span className="clip">{pName(p)}</span></h1>
          {AR() ? null : <div className="arn rv">{esc(p.ar)}</div>}
          <div className="price rv">{SAR(p.price)}</div>
          <p className="body desc rv">{esc(L(p.d, p.dAr))}</p>
          <div className="rv">
            <div className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Size', 'المقاس')}</div>
            <div className="sizes">
              {sizes.map((s) => (
                <button key={s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
            <div className="body" style={{ fontSize: 11, lineHeight: 1.9 }}>{L('Measurements taken from the shoulder. Made to measure adds three weeks.', 'المقاسات محسوبة من الكتف. التفصيل بيزوّد تلات أسابيع.')}</div>
          </div>
          <div className="acts rv">
            <button className="btn fill" onClick={() => addToCart(p.id, size || '54')}>{L('Add to selection', 'ضيفي لاختيارك')}</button>
            <button className="btn" onClick={() => toggleWish(p.id)}>{saved ? L('Saved to archive', 'محفوظة في أرشيفك') : L('Save to archive', 'احفظي في أرشيفك')}</button>
          </div>
          <div className="spec rv">
            {specs.map(([k, v]) => (
              <div className="r" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
            ))}
          </div>
        </div>
      </section>

      <section className="tone pad">
        <div className="wrap story">
          <div style={{ gridColumn: '1/6' }}>
            <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 18 }}>{L('The making', 'الصناعة')}</div>
            {L(p.story, p.storyAr).map((x, i) => (
              <p className="body rv" style={{ marginBottom: 18 }} key={i}>{esc(x)}</p>
            ))}
          </div>
          <div className="rv" style={{ gridColumn: '7/13', position: 'relative', overflow: 'hidden', aspectRatio: '4/3', background: 'var(--sand)' }}>
            <div className="veil" /><img src={`/${p.img}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 60%' }} alt="" />
          </div>
        </div>
      </section>

      {rel.length > 0 && (
        <section className="pad wrap">
          <EdHead n="" title={L('From the same chapter', 'من نفس الفصل')} aside={esc(L(collections[p.coll]?.mood, collections[p.coll]?.moodAr))} />
          <div className="grid-shop">{rel.map((x) => <ProductCard key={x.id} piece={x} />)}</div>
        </section>
      )}
    </>
  );
}
