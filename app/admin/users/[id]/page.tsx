'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Customer, Order } from '@/lib/types';

const fmt = (n?: number) => `${(n || 0).toLocaleString('en-US')} EGP`;

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customers, loading, reload } = useAdminFetch<Customer[]>('/users');
  const { data: orders } = useAdminFetch<Order[]>('/orders');
  const { call, toast, L, AR } = useAdmin();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const customer = customers?.find((c) => String(c.id) === id);
  const theirOrders = customer ? (orders || []).filter((o) => o.email?.toLowerCase() === customer.email.toLowerCase()) : [];

  const fmtDate = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(AR() ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const toggleStatus = async () => {
    if (!customer) return;
    const next = customer.status === 'active' ? 'suspended' : 'active';
    setBusy(true);
    try { await call(`/users/${customer.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) }); toast(L('Updated', 'اتحدّث')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  const onDelete = async () => {
    if (!customer) return;
    if (!confirm(L('Delete this customer account? This cannot be undone.', 'تحذفي حساب العميلة ده؟ الخطوة دي ما بترجعش.'))) return;
    setBusy(true);
    try { await call(`/users/${customer.id}`, { method: 'DELETE' }); toast(L('Deleted', 'اتمسح')); router.push('/admin/users'); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); setBusy(false); }
  };

  if (loading) return null;
  if (!customer) return <p className="body" style={{ padding: '26px 0' }}>{L('Customer not found.', 'العميلة مش موجودة.')}</p>;

  return (
    <>
      <div className="adm-head">
        <div>
          <h1>{customer.name || L('No name', 'بدون اسم')}</h1>
          <Link className="link" href="/admin/users">{L('← All customers', '← كل العميلات')}</Link>
        </div>
        <span className={`pill ${customer.status === 'active' ? '' : 'bad'}`}>{customer.status === 'active' ? L('Active', 'نشطة') : L('Suspended', 'موقوفة')}</span>
      </div>

      <div className="split" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <div className="lbl" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Profile', 'البيانات')}</div>
          <p className="body" style={{ fontSize: 12.5, lineHeight: 2 }}>
            {customer.email}<br />
            {L('Joined', 'اتسجّلت')} {fmtDate(customer.createdAt)}<br />
            {L('Last login', 'آخر دخول')} {fmtDate(customer.lastLogin)}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button className="btn" disabled={busy} onClick={toggleStatus}>
              {customer.status === 'active' ? L('Suspend account', 'إيقاف الحساب') : L('Reactivate account', 'إعادة تفعيل الحساب')}
            </button>
            <button className="btn" disabled={busy} onClick={onDelete}>{L('Delete account', 'حذف الحساب')}</button>
          </div>
        </div>

        <div>
          <div className="lbl" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Orders', 'الطلبات')}</div>
          {theirOrders.length ? theirOrders.map((o) => (
            <Link className="adm-row" style={{ gridTemplateColumns: '1fr auto auto', textDecoration: 'none', color: 'inherit' }} href={`/admin/orders/${o.id}`} key={o.id}>
              <span>{o.n}</span><span>{fmt(o.tot)}</span><span className="lbl" style={{ color: 'var(--ink-faint)' }}>{o.st}</span>
            </Link>
          )) : <p className="body" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{L('No orders placed with this email yet.', 'مفيش طلبات بالإيميل ده لسه.')}</p>}
        </div>
      </div>
    </>
  );
}
