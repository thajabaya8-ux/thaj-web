'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Customer } from '@/lib/types';

export default function CustomersPage() {
  const { data: customers, loading, error } = useAdminFetch<Customer[]>('/users');
  const { L, AR } = useAdmin();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return customers || [];
    return (customers || []).filter((c) => (c.name || '').toLowerCase().includes(query) || c.email.toLowerCase().includes(query));
  }, [customers, q]);

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(AR() ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!customers) return null;

  return (
    <>
      <div className="adm-head"><h1>{L('Customers', 'العميلات')}</h1></div>
      <input
        value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Search by name or email', 'دوّري بالاسم أو الإيميل')}
        style={{ background: 'none', border: '1px solid var(--line)', padding: '10px 14px', fontSize: 12.5, width: '100%', maxWidth: 360, marginBottom: 24 }}
      />
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '2fr 100px 1fr 1fr' }}>
        <span>{L('Name / Email', 'الاسم / الإيميل')}</span><span>{L('Status', 'الحالة')}</span>
        <span>{L('Joined', 'تاريخ التسجيل')}</span><span>{L('Last login', 'آخر دخول')}</span>
      </div>
      {filtered.length ? filtered.map((c) => (
        <Link className="adm-row" style={{ gridTemplateColumns: '2fr 100px 1fr 1fr', color: 'inherit', textDecoration: 'none' }} href={`/admin/users/${c.id}`} key={c.id}>
          <div><div className="h-s" style={{ fontSize: 14 }}>{c.name || L('No name', 'بدون اسم')}</div><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{c.email}</div></div>
          <span className={`pill ${c.status === 'active' ? '' : 'bad'}`}>{c.status === 'active' ? L('Active', 'نشطة') : L('Suspended', 'موقوفة')}</span>
          <span className="body" style={{ fontSize: 12 }}>{fmtDate(c.createdAt)}</span>
          <span className="body" style={{ fontSize: 12 }}>{fmtDate(c.lastLogin)}</span>
        </Link>
      )) : <p className="body" style={{ padding: '26px 0' }}>{q ? L('No matches.', 'مفيش نتايج.') : L('No customers yet.', 'مافيش عميلات لسه.')}</p>}
    </>
  );
}
