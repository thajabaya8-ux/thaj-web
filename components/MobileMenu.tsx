'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import { NAVLINKS } from './Header';

export default function MobileMenu() {
  const { L, AR, cart, wish, menuOpen, setMenuOpen, setSearchOpen, setDrawerOpen, setLang, authRole } = useSite();
  const authHref = authRole === 'admin' ? '/admin' : authRole === 'customer' ? '/account' : '/login';
  const authLabel = authRole === 'admin' ? L('Admin Panel', 'لوحة التحكم') : authRole === 'customer' ? L('My Account', 'حسابي') : L('Login', 'تسجيل الدخول');
  const cartCount = cart.reduce((s, c) => s + c.q, 0);

  const closeMenu = () => setMenuOpen(false);
  const openSearch = () => { setMenuOpen(false); setSearchOpen(true); };
  const openCart = () => { setMenuOpen(false); setDrawerOpen(true); };

  return (
    <>
      <div id="menu-scrim" className={menuOpen ? 'open' : ''} onClick={closeMenu} />
      <div id="menu" className={menuOpen ? 'open' : ''}>
        <button className="close" onClick={closeMenu}>{L('Close', 'إغلاق')}</button>
        <div className="m-util">
          <button onClick={openSearch}>{L('Search', 'بحث')}</button>
          <Link href="/wishlist" onClick={closeMenu}><span className="t">{L('Saved', 'المحفوظ')}</span><span className="n">{wish.length}</span></Link>
          <button onClick={openCart}><span className="t">{L('Selection', 'اختيارك')}</span><span className="n">{cartCount}</span></button>
          <Link href={authHref} onClick={closeMenu}>{authLabel}</Link>
          <div className="lang">
            <button className={!AR() ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
            <i>/</i>
            <button className={AR() ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
          </div>
        </div>
        <nav className="m-nav">
          {NAVLINKS.map(([href, e, a]) => (
            <Link key={href} href={href} onClick={closeMenu}>{L(e, a)}</Link>
          ))}
        </nav>
        <div className="m-foot">
          <Link href="/archive" onClick={closeMenu}>{L('Archive', 'الأرشيف')}</Link>
          <Link href="/account" onClick={closeMenu}>{L('My THAJ', 'حسابي')}</Link>
          <Link href="/wishlist" onClick={closeMenu}>{L('My Archive', 'أرشيفي')}</Link>
        </div>
      </div>
    </>
  );
}
