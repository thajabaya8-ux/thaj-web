'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import type { Piece } from '@/lib/types';

export default function ProductCard({ piece, className }: { piece?: Piece | null; className?: string }) {
  const { L, AR, esc, pName, SAR, wish, toggleWish, quickAdd, AVAIL_AR } = useSite();
  if (!piece) return null;
  const saved = wish.includes(piece.id);
  const av = AR() ? (AVAIL_AR[piece.av] || piece.av) : piece.av;

  return (
    <article className={`card rv ${className || ''}`.trim()}>
      <Link href={`/product/${piece.id}`} className="frame" style={{ display: 'block', position: 'relative' }}>
        <div className="veil" />
        <div className="ed">{esc(piece.ed)}</div>
        {piece.pantsImg ? <div className="pants-badge">{L('+ Trousers available', '+ بنطلون متاح')}</div> : null}
        <button
          type="button"
          className={`save ${saved ? 'on' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(piece.id); }}
        >{saved ? '●' : '○'}</button>
        <img src={`/${piece.img}`} alt={pName(piece)} loading="lazy" />
        <button
          type="button"
          className="quick"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickAdd(piece.id); }}
        >{L('Add', 'أضيفي')} · {SAR(piece.price)}</button>
      </Link>
      <Link href={`/product/${piece.id}`} className="meta">
        <h3>{pName(piece)}{AR() ? '' : <i>{esc(piece.ar)}</i>}</h3>
        <div className="pr">{SAR(piece.price)}<small>{esc(av)}</small></div>
      </Link>
    </article>
  );
}
