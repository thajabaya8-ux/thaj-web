'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSite, availableStock, colorSoldOut } from '@/lib/siteContext';
import type { Piece } from '@/lib/types';

// A card only ever shows this many dots before folding the rest behind a
// "+N" — a piece can carry up to 8 colours, and eight full-size dots on a
// narrow mobile card is exactly the clutter this feature was asked to avoid.
const MAX_DOTS = 6;

export default function ProductCard({ piece, className }: { piece?: Piece | null; className?: string }) {
  const { L, AR, esc, pName, money, wish, toggleWish, AVAIL_AR } = useSite();
  const [cardColor, setCardColor] = useState<string | null>(null);
  if (!piece) return null;
  const saved = wish.includes(piece.id);
  // Out of real stock overrides whatever the admin last set availability
  // to, without touching that stored value — the moment stock is topped
  // up again it's back to whatever it said before, automatically.
  const soldOut = piece.av === 'Sold Out' || availableStock(piece) <= 0;
  const onSale = piece.salePrice != null;
  const pct = onSale ? Math.round((1 - piece.salePrice! / piece.price) * 100) : 0;
  const activeColor = piece.colors.find((c) => c.id === cardColor) || null;
  // A colour picked right here on the card can be sold out even while the
  // piece overall isn't — worth showing without having to open the
  // product page to find out.
  const activeColorOut = !!activeColor && colorSoldOut(activeColor);
  const shownOut = soldOut || activeColorOut;
  const av = shownOut ? L('Sold Out', 'نفدت الكمية') : (AR() ? (AVAIL_AR[piece.av] || piece.av) : piece.av);
  const img = activeColor?.images[0] || piece.img;
  const href = cardColor ? `/product/${piece.id}?color=${cardColor}` : `/product/${piece.id}`;
  const shownDots = piece.colors.slice(0, MAX_DOTS);
  const hiddenCount = piece.colors.length - shownDots.length;

  return (
    <article className={`card rv ${className || ''}`.trim()}>
      <Link href={href} className="frame" style={{ display: 'block', position: 'relative' }}>
        <div className="veil" />
        {piece.ed && <div className="ed">{esc(piece.ed)}</div>}
        {shownOut ? <div className="sold-badge">{L('Sold Out', 'نفدت الكمية')}</div>
          : onSale ? <div className="sale-badge">−{pct}%</div>
          : piece.pantsImg ? <div className="pants-badge">{L('+ Trousers available', '+ بنطلون متاح')}</div> : null}
        <button
          type="button"
          className={`save ${saved ? 'on' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWish(piece.id); }}
        >{saved ? '●' : '○'}</button>
        <img key={img} src={`/${img}`} alt={pName(piece)} loading="lazy" style={shownOut ? { opacity: .55 } : undefined} />
      </Link>
      {piece.colors.length > 0 && (
        <div className="card-colours">
          {shownDots.map((c) => {
            const out = colorSoldOut(c);
            return (
              <button
                key={c.id} type="button" className={`colour-dot ${cardColor === c.id ? 'on' : ''} ${out ? 'out' : ''}`}
                style={{ '--dot': c.hex } as React.CSSProperties}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCardColor((cur) => (cur === c.id ? null : c.id)); }}
                aria-label={`${esc(L(c.nameEn, c.nameAr))}${out ? ` — ${L('Sold Out', 'نفدت الكمية')}` : ''}`} aria-pressed={cardColor === c.id}
              >
                <span className="dot" />
              </button>
            );
          })}
          {hiddenCount > 0 && <span className="card-colours-more">+{hiddenCount}</span>}
        </div>
      )}
      <Link href={href} className="meta">
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
