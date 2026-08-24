'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';

const NAV: [string, string, string][] = [
  ['/admin', 'Dashboard', 'الرئيسية'], ['/admin/collections', 'Categories', 'الفئات'],
  ['/admin/orders', 'Orders', 'الطلبات'], ['/admin/users', 'Customers', 'العميلات'], ['/admin/shipping', 'Shipping', 'الشحن'],
  ['/admin/appointments', 'Appointments', 'المواعيد'],
  ['/admin/reviews', 'Reviews', 'الرسائل'], ['/admin/media', 'Site images', 'صور الموقع'],
  ['/admin/marquee', 'Homepage strip', 'الشريط المتحرك'],
  ['/admin/social', 'Social', 'السوشيال ميديا'], ['/admin/settings', 'Settings', 'الإعدادات']
];

export default function Sidebar() {
  const pathname = usePathname();
  const { me, logout, L, AR, setLang } = useAdmin();
  // Below 820px the sidebar becomes an off-canvas panel, opened from a
  // burger bar — same pattern as the site's own #menu/#menu-scrim, just
  // scoped to admin's own classes since the two never mount together.
  const [open, setOpen] = useState(false);

  // Closing on navigation covers both "tapped a link" and any other way
  // the route changes while the panel happens to be open.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const close = () => setOpen(false);

  return (
    <>
      <div className="adm-mbar">
        <Link className="brand" href="/" title={L('Back to the site', 'العودة للموقع')}><img src="/assets/logo/wordmark-beige.png" alt="THAJ" /></Link>
        <button type="button" className="adm-burger" onClick={() => setOpen(true)} aria-label={L('Menu', 'القائمة')}>
          <i></i><i></i><i></i>
        </button>
      </div>
      <div className={`adm-menu-scrim ${open ? 'open' : ''}`} onClick={close} />
      <aside className={`adm-side ${open ? 'open' : ''}`}>
        <button type="button" className="adm-menu-close" onClick={close}>{L('Close', 'إغلاق')}</button>
        <Link className="brand" href="/" title={L('Back to the site', 'العودة للموقع')}><img src="/assets/logo/wordmark-beige.png" alt="THAJ" /></Link>
        <div className="lang" style={{ marginBottom: 30 }}>
          <button className={!AR() ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          <i>/</i>
          <button className={AR() ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
        </div>
        <nav>
          {NAV.map(([href, en, ar]) => (
            <Link key={href} href={href} className={isActive(href) ? 'on' : ''} onClick={close}>{L(en, ar)}</Link>
          ))}
        </nav>
        <Link className="back-site" href="/" onClick={close}>{L('← View site', 'العودة للموقع ←')}</Link>
        <div className="who">{me?.email}</div>
        <button className="logout" onClick={logout}>{L('Log out', 'تسجيل الخروج')}</button>
      </aside>
    </>
  );
}
