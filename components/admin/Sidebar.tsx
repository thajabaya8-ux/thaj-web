'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';

const NAV: [string, string, string][] = [
  ['/admin', 'Dashboard', 'الرئيسية'], ['/admin/pieces', 'Pieces', 'القطع'], ['/admin/collections', 'Collections', 'المجموعات'],
  ['/admin/journal', 'Journal', 'المجلة'], ['/admin/orders', 'Orders', 'الطلبات'], ['/admin/appointments', 'Appointments', 'المواعيد'],
  ['/admin/reviews', 'Reviews', 'الرسائل'], ['/admin/media', 'Site images', 'صور الموقع'], ['/admin/settings', 'Settings', 'الإعدادات']
];

export default function Sidebar() {
  const pathname = usePathname();
  const { me, logout, L, AR, setLang } = useAdmin();

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <aside className="adm-side">
      <Link className="brand" href="/" title={L('Back to the site', 'العودة للموقع')}><img src="/assets/logo/wordmark-beige.png" alt="THAJ" /></Link>
      <div className="lang" style={{ marginBottom: 30 }}>
        <button className={!AR() ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
        <i>/</i>
        <button className={AR() ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
      </div>
      <nav>
        {NAV.map(([href, en, ar]) => (
          <Link key={href} href={href} className={isActive(href) ? 'on' : ''}>{L(en, ar)}</Link>
        ))}
      </nav>
      <Link className="back-site" href="/">{L('← View site', 'العودة للموقع ←')}</Link>
      <div className="who">{me?.email}</div>
      <button className="logout" onClick={logout}>{L('Log out', 'تسجيل الخروج')}</button>
    </aside>
  );
}
