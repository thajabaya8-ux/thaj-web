'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, SAR } from '@/lib/adminContext';
import type { Order } from '@/lib/types';

const STATUSES = ['In atelier', 'Delivered', 'Cancelled'];
const STATUS_AR: Record<string, string> = { 'In atelier': 'في الأتيليه', Delivered: 'تم التسليم', Cancelled: 'ملغى' };

export default function OrdersPage() {
  const { data: orders, loading, error, reload } = useAdminFetch<Order[]>('/orders');
  const { call, toast, L, AR } = useAdmin();

  const onStatus = async (id: string | number | undefined, status: string) => {
    try { await call(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast(L('Updated', 'اتحدّث')); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); reload(); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!orders) return null;

  return (
    <>
      <div className="adm-head"><h1>{L('Orders', 'الطلبات')}</h1></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '1fr 100px 2fr 1fr 160px' }}>
        <span>{L('Order', 'الطلب')}</span><span>{L('Date', 'التاريخ')}</span><span>{L('Customer', 'العميلة')}</span><span>{L('Total', 'الإجمالي')}</span><span>{L('Status', 'الحالة')}</span>
      </div>
      {orders.length ? orders.map((o) => (
        <div className="adm-row" style={{ gridTemplateColumns: '1fr 100px 2fr 1fr 160px' }} key={o.id}>
          <span>{o.n}</span>
          <span className="body" style={{ fontSize: 11.5 }}>{(o.d || '').slice(0, 10)}</span>
          <span className="body" style={{ fontSize: 12 }}>{o.name || '—'}<br />{o.email || ''}</span>
          <span>{SAR(o.tot)}</span>
          <select defaultValue={o.st} onChange={(e) => onStatus(o.id, e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{AR() ? STATUS_AR[s] : s}</option>)}
          </select>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('No orders yet.', 'مافيش طلبات لسه.')}</p>}
    </>
  );
}
