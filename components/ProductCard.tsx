'use client';
import Link from 'next/link';
import { useSite, effectivePrice } from '@/lib/siteContext';
import type { Piece } from '@/lib/types';

export default function ProductCard({ piece, className }: { piece?: Piece | null; className?: string }) {
  const { L, AR, esc, pName, money, wish, toggleWish, quickAdd, AVAIL_AR } = useSite();
  if (!piece) return null;
  const saved = wish.includes(piece.id);
  const av = AR() ? (AVAIL_AR[piece.av] || piece.av) : piece.av;
  const soldOut = piece.av === 'Sold Out';
  const onSale = piece.salePrice != null;
  const pct = onSale ? Math.round((1 - piece.salePrice! / piece.price) * 100) : 0;

  return (
    <article className={`card rv ${className || ''}`.trim()}>
      <Link href={`/product/${piece.id}`} className="frame" style={{ display: 'block', position: 'relative' }}>
        <div className="veil" />
        {piece.ed && <div className="ed">{esc(piece.ed)}</div>}
        {soldOut ? <div className="sold-badge">{L('Sold Out', 'نفدت الكمية')}</div>
          : onSale ? <div className="sale-badge">−{pct}%</div>
          : piece.pantsImg ? <div className="pants-badge">{L('+ Trousers available', '+ بنطلون متاح')}</div> : null}
        <button
          type="button"
          className={`save ${saved ? 'on' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(piece.id); }}
        >{saved ? '●' : '○'}</button>
        <img src={`/${piece.img}`} alt={pName(piece)} loading="lazy" style={soldOut ? { opacity: .55 } : undefined} />
        {soldOut ? (
          <span className="quick" style={{ opacity: .6, pointerEvents: 'none' }}>{L('Sold out', 'نفدت الكمية')}</span>
        ) : (
          <button
            type="button"
            className="quick"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); quickAdd(piece.id); }}
          >{L('Add', 'أضيفي')} · {money(effectivePrice(piece), piece.currency)}</button>
        )}
      </Link>
      <Link href={`/product/${piece.id}`} className="meta">
        <h3>{pName(piece)}{AR() ? '' : <i>{esc(piece.ar)}</i>}</h3>
        <div className="pr">
          {onSale ? (
            <>
              <span className="price-strike">{money(piece.price, piece.currency)}</span>
              <span className="price-sale">{money(piece.salePrice!, piece.currency)}</span>
            </>
          ) : money(piece.price, piece.currency)}
          <small>{esc(av)}</small>
        </div>
      </Link>
    </article>
  );
}
