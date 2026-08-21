'use client';
import { useMemo, useState } from 'react';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';
import ProductCard from '@/components/ProductCard';
import type { Piece } from '@/lib/types';

const SORT_OPTS: [string, string, string][] = [['featured', 'Featured', 'المختار'], ['price-low', 'Price low', 'السعر تصاعدي'],
  ['price-high', 'Price high', 'السعر تنازلي'], ['name', 'Name', 'الاسم']];

export default function ShopPage() {
  const { L, fa, collName, pieces, collections, sort, setSort, facets, setFacets, pName } = useSite();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const uniq = (k: keyof Piece) => ['All', ...new Set(pieces.map((p) => p[k]))];

  const filtered = useMemo(() => {
    let r = pieces.filter((p) =>
      (facets.coll === 'All' || p.coll === facets.coll) &&
      (facets.sil === 'All' || p.sil === facets.sil) &&
      (facets.fabric === 'All' || p.fabric === facets.fabric) &&
      (facets.colour === 'All' || p.colour === facets.colour) &&
      (facets.occ === 'All' || p.occ === facets.occ));
    if (sort === 'price-low') r = [...r].sort((a, b) => a.price - b.price);
    if (sort === 'price-high') r = [...r].sort((a, b) => b.price - a.price);
    if (sort === 'name') r = [...r].sort((a, b) => pName(a).localeCompare(pName(b)));
    return r;
  }, [pieces, facets, sort, pName]);

  const frow = (label: string, key: keyof typeof facets, opts: unknown[], fmt?: (o: string) => string) => (
    <div className="frow" key={key}>
      <span className="lbl">{label}</span>
      <div className="fopts">
        {opts.map((o) => (
          <button key={String(o)} className={facets[key] === o ? 'on' : ''} onClick={() => setFacets((f) => ({ ...f, [key]: o as string }))}>
            {fmt ? fmt(o as string) : fa(o as string)}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Mast
        label={L('The Shop', 'المتجر')}
        title={L('Eleven pieces', 'إحدى عشرة قطعة')}
        desc={L('Filter by chapter, silhouette, fabric, colour or occasion. Every piece is editioned and numbered.', 'فلتري حسب الفصل أو السيلويت أو الخامة أو اللون أو المناسبة. كل قطعة مرقّمة بإصدار.')}
      />
      <section className="wrap" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        <button className="ftoggle rv" onClick={() => setFiltersOpen((o) => !o)}>{L('Filter & refine', 'فلترة وتحديد')}</button>
        <div className={`filters rv ${filtersOpen ? 'open' : ''}`}>
          {frow(L('Collection', 'المجموعة'), 'coll', ['All', ...Object.keys(collections)], (k) => (k === 'All' ? fa('All') : collName(k)))}
          {frow(L('Silhouette', 'السيلويت'), 'sil', uniq('sil'))}
          {frow(L('Fabric', 'الخامة'), 'fabric', uniq('fabric'))}
          {frow(L('Colour', 'اللون'), 'colour', uniq('colour'))}
          {frow(L('Occasion', 'المناسبة'), 'occ', uniq('occ'))}
        </div>
        <div className="shopbar">
          <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L(`${filtered.length} pieces`, `${filtered.length} قطعة`)}</span>
          <div className="fopts">
            {SORT_OPTS.map(([s, e, a]) => (
              <button key={s} className={sort === s ? 'on' : ''} onClick={() => setSort(s)}>{L(e, a)}</button>
            ))}
          </div>
        </div>
        <div className="grid-shop">
          {filtered.length ? filtered.map((p) => <ProductCard key={p.id} piece={p} />) : (
            <div className="empty">
              <div className="h-m">{L('Nothing under those terms.', 'مافيش حاجة بالشروط دي.')}</div>
              <p className="body" style={{ marginTop: 14 }}>{L('Loosen a filter — the house is small.', 'خفّفي فلتر — الدار صغيرة.')}</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
