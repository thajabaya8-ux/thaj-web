'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import Mast from '@/components/Mast';

export default function CartPage() {
  const { L, AR, esc, pName, cart, byId, qty, rmItem, cartTotal, SAR } = useSite();

  if (!cart.length) {
    return (
      <section className="pad wrap-n" style={{ textAlign: 'center', paddingTop: 'calc(var(--nav-h) + 90px)' }}>
        <h1 className="h-l rv"><span className="clip">{L('Your Selection', 'اختيارك')}</span></h1>
        <p className="body rv" style={{ margin: '24px 0 32px' }}>{L('Nothing chosen yet.', 'مافيش حاجة متختارة لسه.')}</p>
        <Link className="btn rv" href="/shop">{L('Enter the shop', 'ادخلي المتجر')}</Link>
      </section>
    );
  }

  const t = AR() ? `${cart.length} قطعة` : `${cart.length} piece${cart.length > 1 ? 's' : ''}`;

  return (
    <>
      <Mast label={L('Your Selection', 'اختيارك')} title={t} desc={L('Sizes and quantities can be changed here before you continue.', 'تقدري تغيّري المقاسات والكميات هنا قبل ما تكمّلي.')} />
      <section className="wrap-n" style={{ paddingBottom: 'clamp(70px,11vh,140px)' }}>
        {cart.map((c, i) => {
          const p = byId(c.pid);
          if (!p) return null;
          return (
            <div className="split cart-row rv" key={`${c.pid}-${c.size}-${i}`} style={{ gridTemplateColumns: 'repeat(12,1fr)', padding: '26px 0', borderBottom: '1px solid var(--line-soft)', alignItems: 'center' }}>
              <div className="cr-img" style={{ gridColumn: '1/3', position: 'relative', overflow: 'hidden', aspectRatio: '3/4', background: 'var(--sand)' }}>
                <img src={`/${p.img}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              </div>
              <div className="cr-info" style={{ gridColumn: '4/8' }}>
                <div className="h-s">{pName(p)}</div>
                <div className="lbl" style={{ color: 'var(--ink-faint)', marginTop: 8 }}>{esc(p.ed)} · {L('Size', 'مقاس')} {esc(c.size)}</div>
              </div>
              <div style={{ gridColumn: '8/11' }}>
                <div className="qty"><button onClick={() => qty(i, -1)}>−</button><span>{c.q}</span><button onClick={() => qty(i, 1)}>+</button></div>
                <button className="rm" style={{ background: 'none', border: 0, cursor: 'pointer', fontSize: 8.5, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginTop: 12 }} onClick={() => rmItem(i)}>{L('Remove', 'إزالة')}</button>
              </div>
              <div style={{ gridColumn: '11/13', textAlign: 'end', fontFamily: 'var(--display)', fontSize: 17 }}>{SAR(p.price * c.q)}</div>
            </div>
          );
        })}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 34 }}>
          <div style={{ width: 'min(360px,100%)' }}>
            <div className="tot"><span className="lbl">{L('Subtotal', 'المجموع')}</span><b>{SAR(cartTotal)}</b></div>
            <div className="tot"><span className="lbl">{L('Shipping', 'الشحن')}</span><span className="body" style={{ fontSize: 12 }}>{L('Calculated at checkout', 'بيتحسب عند الدفع')}</span></div>
            <Link className="btn fill wide" href="/checkout">{L('Proceed', 'كمّلي')}</Link>
            <div style={{ textAlign: 'center', marginTop: 16 }}><Link className="link" href="/shop">{L('Continue', 'كمّلي تسوّق')}</Link></div>
          </div>
        </div>
      </section>
    </>
  );
}
