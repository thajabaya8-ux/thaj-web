'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSite } from '@/lib/siteContext';
import ThajWordmarkAr from './ThajWordmarkAr';

export const NAVLINKS: [string, string, string][] = [
  ['/shop', 'Shop', 'المتجر'],
  ['/collections', 'Collections', 'المجموعات'],
  ['/maison', 'Maison', 'الدار'],
  ['/atelier', 'Atelier', 'الأتيليه'],
  ['/journal', 'Journal', 'المجلة'],
  ['/private', 'Private Room', 'الغرفة الخاصة']
];

export default function Header() {
  const { L, AR, cart, wish, setDrawerOpen, setSearchOpen, setMenuOpen, setLang, currency, setCurrency, authRole } = useSite();
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [onDark, setOnDark] = useState(false);

  const cartCount = cart.reduce((s, c) => s + c.q, 0);

  useEffect(() => {
    const top = document.querySelector<HTMLElement>('main .hero-m, main .hero, main .masthead, main .dark.bleed');
    const update = () => {
      const lim = top ? top.offsetHeight - 70 : 0;
      setSolid(window.scrollY > 10);
      setOnDark(!!top && window.scrollY < lim);
    };
    update();
    window.addEventListener('scroll', update);
    return () => window.removeEventListener('scroll', update);
  }, [pathname]);

  return (
    <header id="hdr" className={`${solid ? 'solid' : ''} ${onDark ? 'on-dark' : ''}`.trim()}>
      <Link className="brand" href="/">
        {AR() ? <ThajWordmarkAr /> : (
          <>
            <img className="lg-lt" src="/assets/logo/wordmark-emerald.png" alt="THAJ" />
            <img className="lg-dk" src="/assets/logo/wordmark-beige.png" alt="THAJ" />
          </>
        )}
      </Link>
      <nav id="nav">
        {NAVLINKS.map(([href, e, a]) => (
          <Link key={href} href={href} className={pathname === href ? 'act' : ''}>{L(e, a)}</Link>
        ))}
      </nav>
      <div className="util">
        <button id="u-search" onClick={() => setSearchOpen(true)}>{L('Search', 'بحث')}</button>
        <Link className="u-hide" id="u-arch" href="/archive">{L('Archive', 'الأرشيف')}</Link>
        <Link id="u-wish" href="/wishlist"><span className="t">{L('Saved', 'المحفوظ')}</span><span className="n">{wish.length}</span></Link>
        <button id="u-cart" onClick={() => setDrawerOpen(true)}><span className="t">{L('Selection', 'اختيارك')}</span><span className="n">{cartCount}</span></button>
        <Link className="u-hide" id="u-acct" href="/account">{L('My THAJ', 'حسابي')}</Link>
        {authRole === 'admin' ? (
          <Link id="u-login" href="/admin">{L('Admin Panel', 'لوحة التحكم')}</Link>
        ) : authRole === 'customer' ? (
          <Link id="u-login" href="/account">{L('My Account', 'حسابي')}</Link>
        ) : (
          <Link id="u-login" href="/login">{L('Login', 'تسجيل الدخول')}</Link>
        )}
        <div className="lang">
          <button id="cur-sar" className={currency === 'SAR' ? 'on' : ''} onClick={() => setCurrency('SAR')}>SAR</button>
          <i>/</i>
          <button id="cur-egp" className={currency === 'EGP' ? 'on' : ''} onClick={() => setCurrency('EGP')}>EGP</button>
        </div>
        <div className="lang">
          <button id="lg-en" className={!AR() ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          <i>/</i>
          <button id="lg-ar" className={AR() ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
        </div>
        <button className="burger" onClick={() => setMenuOpen(true)}><i></i><i></i><i></i></button>
      </div>
    </header>
  );
}
