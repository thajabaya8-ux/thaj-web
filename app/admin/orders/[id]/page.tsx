'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Order, Piece } from '@/lib/types';

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
  const router = useRouter();
  const { data: order, loading, error, reload } = useAdminFetch<Order>(`/orders/${id}`);
  const { data: pieces } = useAdminFetch<Piece[]>('/pieces');
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
  const onDelete = async () => {
    if (!confirm(L(
      'Delete this order completely? This removes it for good, not just marks it Cancelled — any reserved or deducted stock is given back first. This cannot be undone.',
      'تمسحي الطلب ده نهائيًا؟ الخطوة دي بتشيله خالص مش بس تحطه ملغى — أي مخزون محجوز أو متخصوم هيرجع الأول. الخطوة دي ما بترجعش.'
    ))) return;
    setBusy(true);
    try { await call(`/orders/${id}`, { method: 'DELETE' }); toast(L('Order deleted', 'الطلب اتمسح')); router.push('/admin/orders'); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); setBusy(false); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!order) return null;

  const ship = order.shipping;
  // The CUSTOMER's number, not the admin's own (admin_whatsapp_number is a
  // site setting for a completely different purpose — where THAJ's own
  // WhatsApp contact link on the storefront points to). A local Egyptian
  // number (leading 0, no country code — how customers actually type it
  // at checkout, see the "0"-prefixed values throughout real orders)
  // needs +20 in place of that 0 for wa.me to resolve it at all; a number
  // that already has a country code (+966, …) is left as-is.
  const rawPhone = (ship?.phone || order.phone || '').replace(/[^0-9]/g, '');
  const waNumber = rawPhone.startsWith('0') ? `20${rawPhone.slice(1)}` : rawPhone;
  const waText = encodeURIComponent(
    `${L('Order', 'طلب')} ${order.n}\n${ship?.name || order.name || ''}\n${ship?.phone || order.phone || ''}\n${L('Deposit', 'العربون')}: ${fmt(order.depositAmount)}`
  );
  const itemCount = order.items.reduce((s, it) => s + (it.qty || 1), 0);
  const remaining = (order.tot || 0) - (order.amountPaid || 0);
  const placedDate = (order.d || '').slice(0, 10);

  return (
    <>
      <div className="no-print">
      <div className="adm-head">
        <h1>{order.n}</h1>
        <Link href="/admin/orders" className="body" style={{ fontSize: 11.5 }}>← {L('All orders', 'كل الطلبات')}</Link>
      </div>

      <div className="split" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <div className="lbl" style={{ color: 'var(--gold)', marginBottom: 14 }}>{L('Items', 'القطع')}</div>
          {order.items.map((it, i) => {
            const p = byId(it.id);
            const qty = it.qty || 1;
            const unit = p ? p.price + (it.withPants && p.pantsPrice ? p.pantsPrice : 0) : 0;
            const colr = p && it.color ? p.colors.find((c) => c.id === it.color) : null;
            return (
              <div className="adm-row" style={{ gridTemplateColumns: '48px 1fr 70px 100px' }} key={i}>
                {p ? <img className="thumb" src={`/${colr?.images[0] || p.img}`} alt="" /> : <span />}
                <span className="body" style={{ fontSize: 12.5 }}>
                  {p ? L(p.n, p.ar) : it.id}<br />
                  <span style={{ color: 'var(--ink-faint)' }}>{L('Height', 'الطول')} {it.size}{colr ? ` · ${L(colr.nameEn, colr.nameAr)}` : ''}{it.withPants ? ` · ${L('+ Trousers', '+ بنطلون')}` : ''}</span>
                </span>
                <span className="body" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{L('Qty', 'الكمية')} {qty}</span>
                <span>{p ? fmt(unit * qty) : ''}</span>
              </div>
            );
          })}

          <div className="price-breakdown" style={{ marginTop: 24, maxWidth: 420 }}>
            <div className="pb-row"><span>{L('Products', 'المنتجات')}</span><b>{fmt(order.subtotal)}</b></div>
            {(order.originalSubtotal ?? 0) - (order.subtotal ?? 0) > 0 && (
              <div className="pb-row"><span>{L('Discount', 'الخصم')}</span><b style={{ color: 'var(--emerald)' }}>−{fmt((order.originalSubtotal ?? 0) - (order.subtotal ?? 0))}</b></div>
            )}
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

          <button type="button" className="btn fill" style={{ display: 'block', width: '100%', marginTop: 10 }} onClick={() => window.print()}>
            {L('Print waybill', 'طباعة بوليصة الشحن')}
          </button>

          <p className="body" style={{ fontSize: 11, marginTop: 24, color: 'var(--ink-faint)' }}>{L('Placed', 'اتسجّل')} {(order.d || '').slice(0, 16).replace('T', ' ')}</p>

          <button className="btn" disabled={busy} onClick={onDelete} style={{ display: 'block', width: '100%', marginTop: 24 }}>
            {L('Delete order', 'حذف الطلب')}
          </button>
        </div>
      </div>
      </div>

      <div className="lbl" style={{ color: 'var(--gold)', margin: '30px 0 14px' }}>{L('Waybill', 'بوليصة الشحن')}</div>
      <div className="waybill">
        <div className="wb-head">
          <img className="wb-brand" src="/assets/logo/wordmark-emerald.png" alt="THAJ" />
          <span className="wb-num">{order.n}</span>
        </div>
        <div className="wb-row"><span>{L('Date', 'التاريخ')}</span><b>{placedDate}</b></div>
        <div className="wb-row"><span>{L('Recipient', 'المستلمة')}</span><b>{ship?.name || order.name || '—'}</b></div>
        <div className="wb-row"><span>{L('Phone', 'الموبايل')}</span><b dir="ltr">{ship?.phone || order.phone || '—'}</b></div>
        <div className="wb-row"><span>{L('Address', 'العنوان')}</span><b>{[ship?.governorateName ? (AR() ? ship.governorateNameAr : ship.governorateName) : '', ship?.city].filter(Boolean).join(', ')}{ship?.address ? ` — ${ship.address}` : ''}</b></div>
        {ship?.notes && <div className="wb-row"><span>{L('Notes', 'ملاحظات')}</span><b>{ship.notes}</b></div>}
        <div className="wb-row"><span>{L('Items', 'عدد القطع')}</span><b>{itemCount}</b></div>
        <div className="wb-row wb-cod"><span>{L('Collect on delivery', 'التحصيل عند التسليم')}</span><b>{fmt(remaining)}</b></div>
      </div>
    </>
  );
}
