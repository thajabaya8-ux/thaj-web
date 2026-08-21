'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdmin } from '@/lib/adminContext';

const NAV: [string, string][] = [
  ['/admin', 'Dashboard'], ['/admin/pieces', 'Pieces'], ['/admin/collections', 'Collections'],
  ['/admin/journal', 'Journal'], ['/admin/orders', 'Orders'], ['/admin/appointments', 'Appointments'],
  ['/admin/reviews', 'Reviews'], ['/admin/settings', 'Settings']
];

export default function Sidebar() {
  const pathname = usePathname();
  const { me, logout } = useAdmin();

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <aside className="adm-side">
      <Link className="brand" href="/" title="Back to the site"><img src="/assets/logo/wordmark-beige.png" alt="THAJ" /></Link>
      <nav>
        {NAV.map(([href, label]) => (
          <Link key={href} href={href} className={isActive(href) ? 'on' : ''}>{label}</Link>
        ))}
      </nav>
      <Link className="back-site" href="/">← View site</Link>
      <div className="who">{me?.email}</div>
      <button className="logout" onClick={logout}>Log out</button>
    </aside>
  );
}
