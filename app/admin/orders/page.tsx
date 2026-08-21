'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin, SAR } from '@/lib/adminContext';
import type { Order } from '@/lib/types';

const STATUSES = ['In atelier', 'Delivered', 'Cancelled'];

export default function OrdersPage() {
  const { data: orders, loading, error, reload } = useAdminFetch<Order[]>('/orders');
  const { call, toast } = useAdmin();

  const onStatus = async (id: string | number | undefined, status: string) => {
    try { await call(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast('Updated'); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); reload(); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!orders) return null;

  return (
    <>
      <div className="adm-head"><h1>Orders</h1></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '1fr 100px 2fr 1fr 160px' }}>
        <span>Order</span><span>Date</span><span>Customer</span><span>Total</span><span>Status</span>
      </div>
      {orders.length ? orders.map((o) => (
        <div className="adm-row" style={{ gridTemplateColumns: '1fr 100px 2fr 1fr 160px' }} key={o.id}>
          <span>{o.n}</span>
          <span className="body" style={{ fontSize: 11.5 }}>{(o.d || '').slice(0, 10)}</span>
          <span className="body" style={{ fontSize: 12 }}>{o.name || '—'}<br />{o.email || ''}</span>
          <span>{SAR(o.tot)}</span>
          <select defaultValue={o.st} onChange={(e) => onStatus(o.id, e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>No orders yet.</p>}
    </>
  );
}
