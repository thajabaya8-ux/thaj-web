'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useSite, effectivePrice, availableStock, colorSoldOut } from '@/lib/siteContext';
import { SIZES, SIZE_MTM, sizeRangeLabel } from '@/lib/siteContext';
import { trackPixel } from '@/lib/pixel';
import ProductCard from '@/components/ProductCard';
import EdHead from '@/components/EdHead';
import ReviewForm from '@/components/ReviewForm';

export default function ProductPage() {
  return (
    <Suspense fallback={null}>
      <ProductPageInner />
    </Suspense>
  );
}

function ProductPageInner() {
  const { id } = useParams<{ id: string }>();
  const { L, AR, esc, num, fa, collName, pName, money, byId, pieces, collections, wish, toggleWish, addToCart, AVAIL_AR, settings } = useSite();
  const p = byId(id) || pieces[0];
  // A colour picked from the product's own card in a grid (shop, related,
  // etc.) rides along as ?color= so the piece opens already showing what
  // the customer tapped — falls back to the first colour, same as before,
  // when there's no query param or it doesn't match one of this piece's colours.
  const colorParam = useSearchParams().get('color');
  const [size, setSize] = useState<string | null>(null);
  const [withPants, setWithPants] = useState(false);
  const [active, setActive] = useState(0);
  const [color, setColor] = useState<string | null>(() => {
    if (colorParam && p?.colors?.some((c) => c.id === colorParam)) return colorParam;
    return p?.colors?.[0]?.id || null;
  });
  const galGesture = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!p) return;
    trackPixel('ViewContent', { content_ids: [p.id], content_name: p.n, content_type: 'product', value: effectivePrice(p), currency: p.currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p?.id]);

  if (!p) return null;
  const rel = pieces.filter((x) => x.coll === p.coll && x.id !== p.id).slice(0, 3);
  const saved = wish.includes(p.id);
  const sizes = [...(p.sizes.length ? p.sizes : SIZES), L(SIZE_MTM.en, SIZE_MTM.ar)];
  const activeColor = p.colors.find((c) => c.id === color) || null;
  const selectColor = (cid: string) => { setColor(cid); setActive(0); };
  // The trousers photo (if any) rides along at the end of the same
  // gallery, tagged, instead of only ever living inside the small
  // pants-select thumbnail — so it's browsable/swipeable like any other
  // product shot, but always clearly labelled as trousers, not confused
  // for another abaya photo. A selected colour with its own photos takes
  // over the whole gallery (not just prepended) — mixing that colour's
  // shots with every other colour's would defeat the point of picking one.
  const galleryImgs = activeColor?.images.length ? activeColor.images : (p.images.length ? p.images : [p.img]);
  const gallery = [
    ...galleryImgs.map((img) => ({ img, isPants: false })),
    ...(p.pantsImg ? [{ img: p.pantsImg, isPants: true }] : [])
  ];
  const activeItem = gallery[active] || gallery[0];
  const activeImg = activeItem?.img || p.img;
  const activeIsPants = !!activeItem?.isPants;
  // Out of real stock overrides whatever the admin last set availability
  // to, without touching that stored value — restocking brings it back.
  const soldOut = p.av === 'Sold Out' || availableStock(p) <= 0;
  // A piece with colours can still be "available" overall while the one
  // colour currently picked is itself out — that's blocked separately,
  // right at the Add button, without touching the piece-wide soldOut badge.
  const activeColorOut = !!activeColor && colorSoldOut(activeColor);
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
    [L('Availability', 'التوفر'), soldOut ? L('Sold Out', 'نفدت الكمية') : esc(AR() ? (AVAIL_AR[p.av] || p.av) : p.av)]
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
            <img key={activeImg} src={`/${activeImg}`} alt={activeIsPants ? L('Trousers', 'البنطلون') : pName(p)} />
            {activeIsPants && <span className="gal-pants-tag">{L('Trousers', 'البنطلون')}</span>}
            {gallery.length > 1 && (
              <>
                <button type="button" className="gal-arrow prev" onClick={() => goGal(-1)} aria-label={L('Previous photo', 'الصورة السابقة')}>‹</button>
                <button type="button" className="gal-arrow next" onClick={() => goGal(1)} aria-label={L('Next photo', 'الصورة التالية')}>›</button>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="gal-thumbs">
              {gallery.map((g, i) => (
                <button key={g.img + i} type="button" className={i === active ? 'on' : ''} onClick={() => setActive(i)}>
                  <img src={`/${g.img}`} alt="" />
                  {g.isPants && <span className="gal-pants-tag">{L('Trousers', 'بنطلون')}</span>}
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
          {!p.pantsImg && (
            <div className="price rv">
              {onSale ? (<><span className="price-strike">{money(p.price, p.currency)}</span> <span className="price-sale">{money(p.salePrice!, p.currency)}</span></>) : money(p.price, p.currency)}
            </div>
          )}

          <p className="body desc rv">{esc(L(p.d, p.dAr))}</p>

          {/* Kept together, in this order, on purpose: toggling trousers
              here immediately changes the price breakdown right below it,
              not a block further up the page that scrolls out of view the
              moment this is tapped. */}
          {p.pantsImg && (
            <>
              {/* className stays a static string on purpose — see the
                  .filters fix in app/(site)/shop/page.tsx for why: .rv's
                  reveal "in" class is added imperatively by RouteEffects,
                  and a state-dependent className here made React overwrite
                  that attribute the moment this was toggled, so the whole
                  card snapped back to invisible right as it was tapped. */}
              <div className="rv pants-select" data-on={withPants || undefined}>
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
              <div className="rv price-breakdown">
                <div className="pb-row">
                  <span>{L('Abaya', 'العباية')}</span>
                  <b>{onSale ? (<><span className="price-strike">{money(p.price, p.currency)}</span> {money(p.salePrice!, p.currency)}</>) : money(p.price, p.currency)}</b>
                </div>
                {withPants && <div className="pb-row"><span>{L('Trousers', 'البنطلون')}</span><b>{money(p.pantsPrice || 0, p.currency)}</b></div>}
                <div className="pb-row pb-total"><span>{L('Total', 'الإجمالي')}</span><b>{money(total, p.currency)}</b></div>
              </div>
            </>
          )}

          {p.colors.length > 0 && (
            <div className="rv">
              <div className="lbl" style={{ color: 'var(--ink-faint)' }}>
                {L('Colour', 'اللون')}
                {activeColor && <span className="colour-name"> — {esc(L(activeColor.nameEn, activeColor.nameAr))}</span>}
              </div>
              <div className="colours">
                {p.colors.map((c) => {
                  const out = colorSoldOut(c);
                  return (
                    <button
                      key={c.id} type="button" className={`colour-dot ${color === c.id ? 'on' : ''} ${out ? 'out' : ''}`}
                      style={{ '--dot': c.hex } as React.CSSProperties}
                      onClick={() => selectColor(c.id)} aria-pressed={color === c.id}
                      aria-label={`${esc(L(c.nameEn, c.nameAr))}${out ? ` — ${L('Sold Out', 'نفدت الكمية')}` : ''}`}
                    >
                      <span className="dot" />
                    </button>
                  );
                })}
              </div>
              {activeColorOut && (
                <p className="body" style={{ fontSize: 11, color: '#B75B5B', marginTop: 8 }}>
                  {L('This colour is sold out.', 'اللون ده نفدت الكمية بتاعته.')}
                </p>
              )}
            </div>
          )}
          <div className="rv">
            <div className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Height', 'الطول')}</div>
            <div className="sizes">
              {sizes.map((s) => (
                <button key={s} className={size === s ? 'on' : ''} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
            <div className="body" style={{ fontSize: 11, lineHeight: 1.9 }}>{L('Pick the length closest to your height, in cm. Made to measure adds three weeks.', 'اختاري الطول الأقرب لطولك، بالسنتيمتر. التفصيل بيزوّد تلات أسابيع.')}</div>
            <div className="body" style={{ fontSize: 10.5, lineHeight: 2, color: 'var(--ink-faint)' }}>
              {SIZES.filter((s) => sizes.includes(s)).map((s) => {
                const r = sizeRangeLabel(s)!;
                return L(`${s}: ${r.en}. `, `${s}: ${r.ar}. `);
              })}
            </div>
          </div>
          <div className="acts rv">
            {soldOut || activeColorOut ? (
              <button className="btn fill" disabled style={{ opacity: .5, cursor: 'default' }}>{L('Sold out', 'نفدت الكمية')}</button>
            ) : (
              <button className="btn fill" onClick={() => addToCart(p.id, size || '160', withPants, activeColor?.id)}>{L('Add to selection', 'ضيفي لاختيارك')}</button>
            )}
            <button className="btn" onClick={() => toggleWish(p.id)}>{saved ? L('Saved to archive', 'محفوظة في أرشيفك') : L('Save to archive', 'احفظي في أرشيفك')}</button>
          </div>
          {(settings.return_policy_en || settings.return_policy_ar) && (
            <p className="body rv" style={{ fontSize: 11, lineHeight: 1.9, color: 'var(--ink-faint)', marginBottom: 24 }}>
              {L(esc(settings.return_policy_en), esc(settings.return_policy_ar))}
            </p>
          )}
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
