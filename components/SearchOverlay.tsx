'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import type { Piece } from '@/lib/types';

const SUGG: [string, string][] = [
  ['Black silhouettes', 'سيلويت أسود'], ['Ramadan', 'رمضان'], ['Silk', 'حرير'], ['Evening', 'سهرة'],
  ['Linen', 'كتان'], ['Signature', 'التوقيع'], ['Made to measure', 'تفصيل']
];

export default function SearchOverlay() {
  const { L, AR, esc, pieces, collections, fa, pName, SAR, searchOpen, setSearchOpen } = useSite();
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
    document.body.style.overflow = '';
  }, [searchOpen]);

  const results = useMemo(() => {
    const query = q.toLowerCase().trim();
    const hay = (p: Piece) => {
      const coll = collections[p.coll] || {};
      return [p.n, p.ar, p.mat, p.matAr, p.fabric, p.colour, p.occ, p.sil, p.silf, p.silfAr,
        fa(p.fabric), fa(p.colour), fa(p.occ), fa(p.sil), coll.name, coll.nameAr, p.d, p.dAr]
        .join(' ').toLowerCase();
    };
    if (!query) return pieces.slice(0, 4);
    return pieces.filter((p) => hay(p).includes(query) || query.split(' ').some((w) => w.length > 2 && hay(p).includes(w)));
  }, [q, pieces, collections, fa]);

  const close = () => { setSearchOpen(false); setQ(''); };

  return (
    <div id="search" className={searchOpen ? 'open' : ''}>
      <button className="close" onClick={close}>{L('Close · Esc', 'إغلاق · Esc')}</button>
      <div className="lbl" style={{ color: 'var(--ink-faint)', marginBottom: 22 }}>{L('Search the maison', 'ابحثي في الدار')}</div>
      <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Silk, black, Ramadan…', 'حرير، أسود، رمضان…')} autoComplete="off" />
      <div className="sugg">
        {SUGG.map(([e, a]) => (
          <button key={e} onClick={() => setQ(AR() ? a : e)}>{L(e, a)}</button>
        ))}
      </div>
      <div className="sres">
        {results.length ? results.map((p) => (
          <Link key={p.id} className="card in" href={`/product/${p.id}`} onClick={close}>
            <div className="frame"><img src={`/${p.img}`} alt="" loading="lazy" /></div>
            <div className="meta"><h3>{pName(p)}{AR() ? '' : <i>{esc(p.ar)}</i>}</h3><div className="pr">{SAR(p.price)}</div></div>
          </Link>
        )) : (
          <p className="body" style={{ gridColumn: '1/-1' }}>
            {L('Nothing under that word.', 'مافيش حاجة بالكلمة دي.')}{' '}
            <span className="link" onClick={() => setQ(L('silk', 'حرير'))}>{L('Try silk', 'جرّبي حرير')}</span>
          </p>
        )}
      </div>
    </div>
  );
}
