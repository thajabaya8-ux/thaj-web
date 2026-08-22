'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSite } from '@/lib/siteContext';

export const NAVLINKS: [string, string, string][] = [
  ['/shop', 'Shop', 'المتجر'],
  ['/collections', 'Collections', 'المجموعات'],
  ['/maison', 'Maison', 'الدار'],
  ['/atelier', 'Atelier', 'الأتيليه'],
  ['/journal', 'Journal', 'المجلة'],
  ['/private', 'Private Room', 'الغرفة الخاصة']
];

export default function Header() {
  const { L, setMenuOpen } = useSite();
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);
  const [onDark, setOnDark] = useState(false);

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
        <img className="lg-lt" src="/assets/logo/wordmark-emerald.png" alt="THAJ" />
        <img className="lg-dk" src="/assets/logo/wordmark-beige.png" alt="THAJ" />
      </Link>
      <nav id="nav">
        {NAVLINKS.map(([href, e, a]) => (
          <Link key={href} href={href} className={pathname === href ? 'act' : ''}>{L(e, a)}</Link>
        ))}
      </nav>
      <div className="util">
        <button className="burger" onClick={() => setMenuOpen(true)} aria-label={L('Menu', 'القائمة')}><i></i><i></i><i></i></button>
      </div>
    </header>
  );
}
