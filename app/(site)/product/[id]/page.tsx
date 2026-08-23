'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSite, effectivePrice } from '@/lib/siteContext';
import { SIZES, SIZE_MTM } from '@/lib/siteContext';
import { trackPixel } from '@/lib/pixel';
import ProductCard from '@/components/ProductCard';
import EdHead from '@/components/EdHead';
import ReviewForm from '@/components/ReviewForm';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { L, AR, esc, num, fa, collName, pName, money, byId, pieces, collections, wish, toggleWish, addToCart, AVAIL_AR } = useSite();
  const [size, setSize] = useState<string | null>(null);
  const [withPants, setWithPants] = useState(false);
  const [active, setActive] = useState(0);
  const galGesture = useRef<{ x: number; y: number } | null>(null);

  const p = byId(id) || pieces[0];

  useEffect(() => {
    if (!p) return;
    trackPixel('ViewContent', { content_ids: [p.id], content_name: p.n, content_type: 'product', value: effectivePrice(p), currency: p.currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  if (!p) return null;
  const rel = pieces.filter((x) => x.coll === p.coll && x.id !== p.id).slice(0, 3);
  const saved = wish.includes(p.id);
  const sizes = [...SIZES, L(SIZE_MTM.en, SIZE_MTM.ar)];
  const gallery = p.images.length ? p.images : [p.img];
  const activeImg = gallery[active] || p.img;
  const soldOut = p.av === 'Sold Out';
  const onSale = p.salePrice != null;
  const pct = onSale ? Math.round((1 - p.salePrice! / p.price) * 100) : 0;
  const total = effectivePrice(p) + (withPants && p.pantsPrice ? p.pantsPrice : 0);
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

  const goGal = (dir: 1 | -1) => setActive((cur) => (cur + dir + gallery.length) % gallery.length);
  const onGalPointerDown = (e: React.PointerEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('button')) { galGesture.current = null; return; }
    galGesture.current = { x: e.clientX, y: e.clientY };
  };
  const onGalPointerUp = (e: React.PointerEvent) => {
    const g = galGesture.current;
    galGesture.current = null;
    if (!g || gallery.length < 2) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) goGal(dx < 0 ? 1 : -1);
  };

  return (
    <>
      <section className="pdp">
        <div className="gal">
          <div className="gal-main" onPointerDown={onGalPointerDown} onPointerUp={onGalPointerUp}>
            <img src={`/${activeImg}`} alt={pName(p)} />
            {gallery.length > 1 && (
              <>
                <button type="button" className="gal-arrow prev" onClick={() => goGal(-1)} aria-label={L('Previous photo', 'الصورة السابقة')}>‹</button>
                <button type="button" className="gal-arrow next" onClick={() => goGal(1)} aria-label={L('Next photo', 'الصورة التالية')}>›</button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="gal-thumbs">
              {gallery.map((img, i) => (
                <button key={img + i} type="button" className={i === active ? 'on' : ''} onClick={() => setActive(i)}>
                  <img src={`/${img}`} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="info">
          <div className="lbl ed rv">{p.ed ? `${esc(p.ed)} · ` : ''}{collName(p.coll)}</div>
          <h1 className="h-l rv"><span className="clip">{pName(p)}</span></h1>
          {AR() ? null : <div className="arn rv">{esc(p.ar)}</div>}

          {soldOut && <div className="lbl rv" style={{ color: '#B75B5B', marginBottom: 10 }}>{L('Sold Out', 'نفدت الكمية')}</div>}
          {onSale && !p.pantsImg && (
            <div className="lbl rv" style={{ color: 'var(--emerald)', marginBottom: 6 }}>−{pct}% {L('off', 'خصم')}</div>
          )}
          {p.pantsImg ? (
            <div className="rv price-breakdown">
              <div className="pb-row">
                <span>{L('Abaya', 'العباية')}</span>
                <b>{onSale ? (<><span className="price-strike">{money(p.price, p.currency)}</span> {money(p.salePrice!, p.currency)}</>) : money(p.price, p.currency)}</b>
              </div>
              {withPants && <div className="pb-row"><span>{L('Trousers', 'البنطلون')}</span><b>{money(p.pantsPrice || 0, p.currency)}</b></div>}
              <div className="pb-row pb-total"><span>{L('Total', 'الإجمالي')}</span><b>{money(total, p.currency)}</b></div>
            </div>
          ) : (
            <div className="price rv">
              {onSale ? (<><span className="price-strike">{money(p.price, p.currency)}</span> <span className="price-sale">{money(p.salePrice!, p.currency)}</span></>) : money(p.price, p.currency)}
            </div>
          )}

          <p className="body desc rv">{esc(L(p.d, p.dAr))}</p>

          {p.pantsImg && (
            <div className={`rv pants-select${withPants ? ' on' : ''}`}>
              <div className="ps-img">
                <img src={`/${p.pantsImg}`} alt="" />
                <span className="ps-check">
                  <svg viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              </div>
              <div className="pants-select-body">
                <label className="ps-row">
                  <span className="ps-label">{L('Add matching trousers', 'أضيفي البنطلون المطابق')}</span>
                  <input type="checkbox" className="ps-input" checked={withPants} onChange={(e) => setWithPants(e.target.checked)} />
                  <span className="ps-switch" />
                </label>
                <div className="ps-price">{money(p.pantsPrice || 0, p.currency)}</div>
                <p className="ps-note">{L('Sold only with this piece.', 'بتتباع مع القطعة دي بس.')}</p>
              </div>
            </div>
          )}

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
            {soldOut ? (
              <button className="btn fill" disabled style={{ opacity: .5, cursor: 'default' }}>{L('Sold out', 'نفدت الكمية')}</button>
            ) : (
              <button className="btn fill" onClick={() => addToCart(p.id, size || '54', withPants)}>{L('Add to selection', 'ضيفي لاختيارك')}</button>
            )}
            <button className="btn" onClick={() => toggleWish(p.id)}>{saved ? L('Saved to archive', 'محفوظة في أرشيفك') : L('Save to archive', 'احفظي في أرشيفك')}</button>
          </div>
          <div className="spec rv">
            {specs.filter(([, v]) => v).map(([k, v]) => (
              <div className="r" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
            ))}
          </div>
        </div>
      </section>

      {L(p.story, p.storyAr).length > 0 && (
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
      )}

      <section className="pad wrap-n">
        <div className="lbl rv" style={{ color: 'var(--gold)', marginBottom: 18 }}>{L('A note to the atelier', 'رسالة للأتيليه')}</div>
        <ReviewForm pieceId={p.id} />
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
