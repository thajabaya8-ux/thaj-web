'use client';
import Link from 'next/link';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Order } from '@/lib/types';

const PAY_LABEL: Record<string, [string, string]> = {
  under_review: ['Under review', 'قيد المراجعة'], approved: ['Approved', 'معتمد'], rejected: ['Rejected', 'مرفوض']
};
const PAY_CLASS: Record<string, string> = { under_review: '', approved: 'ok', rejected: 'bad' };
const METHOD_LABEL: Record<string, string> = { vodafone_cash: 'Vodafone Cash', instapay: 'InstaPay' };

const fmt = (n?: number) => `${(n || 0).toLocaleString('en-US')} ${'EGP'}`;

export default function OrdersPage() {
  const { data: orders, loading, error } = useAdminFetch<Order[]>('/orders');
  const { L } = useAdmin();

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!orders) return null;

  return (
    <>
      <div className="adm-head"><h1>{L('Orders', 'الطلبات')}</h1></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '1fr 90px 1.5fr 1fr 1fr 130px' }}>
        <span>{L('Order', 'الطلب')}</span><span>{L('Date', 'التاريخ')}</span><span>{L('Customer', 'العميلة')}</span>
        <span>{L('Deposit', 'العربون')}</span><span>{L('Method', 'طريقة الدفع')}</span><span>{L('Payment', 'الدفع')}</span>
      </div>
      {orders.length ? orders.map((o) => (
        <Link className="adm-row" style={{ gridTemplateColumns: '1fr 90px 1.5fr 1fr 1fr 130px', textDecoration: 'none', color: 'inherit' }} key={o.id} href={`/admin/orders/${o.id}`}>
          <span>{o.n}</span>
          <span className="body" style={{ fontSize: 11.5 }}>{(o.d || '').slice(0, 10)}</span>
          <span className="body" style={{ fontSize: 12 }}>{o.name || '—'}<br />{o.email || ''}</span>
          <span>{fmt(o.depositAmount)}</span>
          <span className="body" style={{ fontSize: 12 }}>{o.paymentMethod ? METHOD_LABEL[o.paymentMethod] || o.paymentMethod : '—'}</span>
          <span>
            {o.paymentStatus
              ? <span className={`pill ${PAY_CLASS[o.paymentStatus] || ''}`}>{L(...(PAY_LABEL[o.paymentStatus] || [o.paymentStatus, o.paymentStatus]))}</span>
              : '—'}
          </span>
        </Link>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('No orders yet.', 'مافيش طلبات لسه.')}</p>}
    </>
  );
}
