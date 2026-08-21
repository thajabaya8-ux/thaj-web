'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';

export default function CartDrawer() {
  const { L, esc, cart, byId, qty, rmItem, cartTotal, itemPrice, SAR, drawerOpen, setDrawerOpen } = useSite();

  return (
    <>
      <div id="scrim" className={drawerOpen ? 'open' : ''} onClick={() => setDrawerOpen(false)} />
      <div id="drawer" className={drawerOpen ? 'open' : ''}>
        <div className="d-head">
          <span className="lbl" id="d-title">{L('Your Selection', 'اختيارك')}</span>
          <button className="link" id="d-close" style={{ border: 0 }} onClick={() => setDrawerOpen(false)}>{L('Close', 'إغلاق')}</button>
        </div>
        <div className="d-body">
          {!cart.length ? (
            <p className="body" style={{ padding: '40px 0' }}>{L('Nothing chosen yet.', 'مافيش حاجة متختارة لسه.')}</p>
          ) : cart.map((c, i) => {
            const p = byId(c.pid);
            if (!p) return null;
            return (
              <div className="citem" key={`${c.pid}-${c.size}-${i}`}>
                <img src={`/${p.img}`} alt="" />
                <div className="ci">
                  <div className="top">
                    <span className="h-s" style={{ fontSize: 17 }}>{esc(p.n)}</span>
                    <span style={{ fontFamily: 'var(--display)', fontSize: 14 }}>{SAR(itemPrice(c) * c.q)}</span>
                  </div>
                  <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{esc(p.ed)} · {L('Size', 'مقاس')} {esc(c.size)}{c.withPants ? ` · ${L('+ Trousers', '+ بنطلون')}` : ''}</span>
                  <div className="qty" style={{ marginTop: 8 }}>
                    <button onClick={() => qty(i, -1)}>−</button><span>{c.q}</span><button onClick={() => qty(i, 1)}>+</button>
                  </div>
                  <button className="rm" onClick={() => rmItem(i)}>{L('Remove', 'إزالة')}</button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="d-foot">
          {!cart.length ? (
            <Link className="btn wide" href="/shop" onClick={() => setDrawerOpen(false)}>{L('Enter the shop', 'ادخلي المتجر')}</Link>
          ) : (
            <>
              <div className="tot"><span className="lbl">{L('Subtotal', 'المجموع')}</span><b>{SAR(cartTotal)}</b></div>
              <Link className="btn fill wide" href="/checkout" onClick={() => setDrawerOpen(false)}>{L('Checkout', 'الدفع')}</Link>
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <Link className="link" href="/cart" onClick={() => setDrawerOpen(false)}>{L('View selection', 'شوفي اختيارك')}</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
