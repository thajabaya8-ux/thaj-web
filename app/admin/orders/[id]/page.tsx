'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Order, Piece, Settings } from '@/lib/types';

const FULFILMENT_STATUSES = ['Under Review', 'Confirmed', 'Preparing', 'Shipped', 'Delivered', 'Cancelled'];
const STATUS_AR: Record<string, string> = {
  'Under Review': 'قيد المراجعة', Confirmed: 'مؤكد', Preparing: 'بيتجهّز', Shipped: 'اتشحن', Delivered: 'تم التسليم', Cancelled: 'ملغى'
};
const PAY_LABEL: Record<string, [string, string]> = {
  under_review: ['Under review', 'قيد المراجعة'], approved: ['Approved', 'معتمد'], rejected: ['Rejected', 'مرفوض']
};
const PAY_CLASS: Record<string, string> = { under_review: '', approved: 'ok', rejected: 'bad' };
const METHOD_LABEL: Record<string, string> = { vodafone_cash: 'Vodafone Cash', instapay: 'InstaPay' };

const fmt = (n?: number) => `${(n || 0).toLocaleString('en-US')} EGP`;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, loading, error, reload } = useAdminFetch<Order>(`/orders/${id}`);
  const { data: pieces } = useAdminFetch<Piece[]>('/pieces');
  const { data: settings } = useAdminFetch<Settings>('/settings');
  const { call, toast, L, AR } = useAdmin();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const byId = (pid: string) => (pieces || []).find((p) => p.id === pid);

  const onApprove = async () => {
    setBusy(true);
    try { await call(`/orders/${id}/payment`, { method: 'POST', body: JSON.stringify({ action: 'approve' }) }); toast(L('Payment approved', 'الدفع اتاعتمد')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const onReject = async () => {
    setBusy(true);
    try { await call(`/orders/${id}/payment`, { method: 'POST', body: JSON.stringify({ action: 'reject', reason }) }); toast(L('Payment rejected', 'الدفع اترفض')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const onStatus = async (status: string) => {
    try { await call(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast(L('Updated', 'اتحدّث')); reload(); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!order) return null;

  const ship = order.shipping;
  const waNumber = (settings?.admin_whatsapp_number || '').replace(/[^0-9]/g, '');
  const waText = encodeURIComponent(
    `${L('Order', 'طلب')} ${order.n}\n${ship?.name || order.name || ''}\n${ship?.phone || order.phone || ''}\n${L('Deposit', 'العربون')}: ${fmt(order.depositAmount)}`
  );

  return (
    <>
      <div className="adm-head">
        <h1>{order.n}</h1>
        <Link href="/admin/orders" className="body" style={{ fontSize: 11.5 }}>← {L('All orders', 'كل الطلبات')}</Link>
      </div>

      <div className="split" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <div className="lbl" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Items', 'القطع')}</div>
          {order.items.map((it, i) => {
            const p = byId(it.id);
            return (
              <div className="adm-row" style={{ gridTemplateColumns: '48px 1fr 100px' }} key={i}>
                {p ? <img className="thumb" src={`/${p.img}`} alt="" /> : <span />}
                <span className="body" style={{ fontSize: 12.5 }}>
                  {p ? L(p.n, p.ar) : it.id}<br />
                  <span style={{ color: 'var(--ink-faint)' }}>{L('Size', 'مقاس')} {it.size}{it.withPants ? ` · ${L('+ Trousers', '+ بنطلون')}` : ''}</span>
                </span>
                <span>{p ? fmt(p.price + (it.withPants && p.pantsPrice ? p.pantsPrice : 0)) : ''}</span>
              </div>
            );
          })}

          <div className="price-breakdown" style={{ marginTop: 24, maxWidth: 420 }}>
            <div className="pb-row"><span>{L('Products', 'المنتجات')}</span><b>{fmt(order.subtotal)}</b></div>
            <div className="pb-row"><span>{L('Shipping', 'الشحن')}{ship?.governorateName ? ` · ${AR() ? ship.governorateNameAr : ship.governorateName}` : ''}</span><b>{fmt(order.shippingFee)}</b></div>
            <div className="pb-row pb-total"><span>{L('Order total', 'إجمالي الطلب')}</span><b>{fmt(order.tot)}</b></div>
            <div className="pb-row"><span>{L('Deposit required', 'العربون المطلوب')}</span><b>{fmt(order.depositAmount)}</b></div>
            <div className="pb-row"><span>{L('Amount paid', 'المدفوع')}</span><b>{fmt(order.amountPaid)}</b></div>
            <div className="pb-row"><span>{L('Remaining on delivery', 'الباقي عند التسليم')}</span><b>{fmt((order.tot || 0) - (order.amountPaid || 0))}</b></div>
          </div>

          <div className="lbl" style={{ color: 'var(--gold)', margin: '30px 0 14px' }}>{L('Payment', 'الدفع')}</div>
          <p className="body" style={{ fontSize: 12.5, marginBottom: 14 }}>
            {order.paymentMethod ? METHOD_LABEL[order.paymentMethod] || order.paymentMethod : '—'} ·{' '}
            {order.paymentStatus ? <span className={`pill ${PAY_CLASS[order.paymentStatus] || ''}`}>{L(...(PAY_LABEL[order.paymentStatus] || [order.paymentStatus, order.paymentStatus]))}</span> : '—'}
          </p>
          {order.hasReceipt && (
            <a href={`/api/admin/orders/${id}/receipt`} target="_blank" rel="noreferrer">
              <img src={`/api/admin/orders/${id}/receipt`} alt={L('Payment receipt', 'إيصال الدفع')} style={{ maxWidth: 260, display: 'block', border: '1px solid var(--line)', marginBottom: 16 }} />
            </a>
          )}
          {order.paymentStatus === 'under_review' && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
              <button className="btn fill" disabled={busy} onClick={onApprove}>{L('Approve payment', 'اعتماد الدفع')}</button>
              <input placeholder={L('Rejection reason (optional)', 'سبب الرفض (اختياري)')} value={reason} onChange={(e) => setReason(e.target.value)}
                style={{ background: 'none', border: '1px solid var(--line)', padding: '10px 12px', fontSize: 12, flex: '1 1 220px' }} />
              <button className="btn" disabled={busy} onClick={onReject}>{L('Reject payment', 'رفض الدفع')}</button>
            </div>
          )}
          {order.paymentStatus === 'rejected' && order.rejectionReason && (
            <p className="adm-error" style={{ marginTop: 4 }}>{order.rejectionReason}</p>
          )}
        </div>

        <div>
          <div className="lbl" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Customer', 'العميلة')}</div>
          <p className="body" style={{ fontSize: 12.5, lineHeight: 2 }}>
            {ship?.name || order.name || '—'}<br />
            {order.email || '—'}<br />
            {ship?.phone || order.phone || '—'}
          </p>

          <div className="lbl" style={{ color: 'var(--gold)', margin: '24px 0 14px' }}>{L('Shipping', 'الشحن')}</div>
          <p className="body" style={{ fontSize: 12.5, lineHeight: 2 }}>
            {ship?.governorateName ? `${AR() ? ship.governorateNameAr : ship.governorateName}, ` : ''}{ship?.city || ''}<br />
            {ship?.address || '—'}<br />
            {ship?.notes ? `${L('Notes', 'ملاحظات')}: ${ship.notes}` : ''}
          </p>

          <div className="lbl" style={{ color: 'var(--gold)', margin: '24px 0 14px' }}>{L('Fulfilment status', 'حالة الطلب')}</div>
          <select defaultValue={order.st} onChange={(e) => onStatus(e.target.value)} style={{ background: 'none', border: '1px solid var(--line)', padding: '10px 12px', fontSize: 12.5, width: '100%' }}>
            {FULFILMENT_STATUSES.map((s) => <option key={s} value={s}>{AR() ? STATUS_AR[s] : s}</option>)}
          </select>

          {waNumber && (
            <a className="btn" style={{ display: 'block', textAlign: 'center', marginTop: 24 }} href={`https://wa.me/${waNumber}?text=${waText}`} target="_blank" rel="noreferrer">
              {L('Send to WhatsApp', 'إرسال على واتساب')}
            </a>
          )}

          <p className="body" style={{ fontSize: 11, marginTop: 24, color: 'var(--ink-faint)' }}>{L('Placed', 'اتسجّل')} {(order.d || '').slice(0, 16).replace('T', ' ')}</p>
        </div>
      </div>
    </>
  );
}
