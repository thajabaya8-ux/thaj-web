'use client';
import Link from 'next/link';
import { useSite } from '@/lib/siteContext';
import { NAVLINKS } from './Header';

export default function MobileMenu() {
  const { L, AR, menuOpen, setMenuOpen, setSearchOpen, setLang, currency, setCurrency, authRole } = useSite();
  const authHref = authRole === 'admin' ? '/admin' : authRole === 'customer' ? '/account' : '/login';
  const authLabel = authRole === 'admin' ? L('Admin Panel', 'لوحة التحكم') : authRole === 'customer' ? L('My Account', 'حسابي') : L('Login', 'تسجيل الدخول');

  const openSearch = () => { setMenuOpen(false); setSearchOpen(true); };

  return (
    <>
      <div id="menu-scrim" className={menuOpen ? 'open' : ''} onClick={() => setMenuOpen(false)} />
      <div id="menu" className={menuOpen ? 'open' : ''}>
        <button className="close" onClick={() => setMenuOpen(false)}>{L('Close', 'إغلاق')}</button>
        <button className="m-search" onClick={openSearch}>{L('Search', 'بحث')}</button>
        <nav className="m-nav">
          {NAVLINKS.map(([href, e, a]) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}>{L(e, a)}</Link>
          ))}
        </nav>
        <div className="m-foot">
          <Link href="/archive" onClick={() => setMenuOpen(false)}>{L('Archive', 'الأرشيف')}</Link>
          <Link href="/account" onClick={() => setMenuOpen(false)}>{L('My THAJ', 'حسابي')}</Link>
          <Link href="/wishlist" onClick={() => setMenuOpen(false)}>{L('My Archive', 'أرشيفي')}</Link>
          <Link href="/room" onClick={() => setMenuOpen(false)}>{L('Control Room', 'غرفة التحكم')}</Link>
          <Link href={authHref} onClick={() => setMenuOpen(false)}>{authLabel}</Link>
          <div className="lang">
            <button className={currency === 'SAR' ? 'on' : ''} onClick={() => setCurrency('SAR')}>SAR</button>
            <i>/</i>
            <button className={currency === 'EGP' ? 'on' : ''} onClick={() => setCurrency('EGP')}>EGP</button>
          </div>
          <div className="lang">
            <button className={!AR() ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
            <i>/</i>
            <button className={AR() ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
          </div>
        </div>
      </div>
    </>
  );
}
