'use client';
import { useEffect, useState } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';

interface ActivityEvent {
  id: number;
  type: string;
  path: string;
  visitorId: string | null;
  userId: number | null;
  userName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
interface EventsPage { events: ActivityEvent[]; hasMore: boolean }

const TYPE_FILTERS = [
  '', 'pageview', 'ViewContent', 'AddToCart', 'RemoveFromCart', 'UpdateQuantity',
  'SelectColor', 'SelectSize', 'AddToWishlist', 'RemoveFromWishlist', 'InitiateCheckout',
  'CheckoutStep', 'SelectGovernorate', 'SelectPaymentMethod', 'ConfirmOrderClick',
  'Purchase', 'OrderFailed', 'Contact', 'CompleteRegistration',
  'AdminOrderStatusChanged', 'AdminPaymentApproved', 'AdminPaymentRejected', 'AdminOrderDeleted'
];

// A short one-line summary pulled out of whatever this event's metadata
// happens to carry — the raw JSON is still one click away for everything
// else, this just saves opening every single row to see the gist.
function summarize(e: ActivityEvent): string {
  const m = e.metadata || {};
  const parts: string[] = [];
  if (typeof m.product_name === 'string') parts.push(String(m.product_name));
  else if (typeof m.content_name === 'string') parts.push(String(m.content_name));
  if (typeof m.size === 'string') parts.push(`${m.size}cm`);
  if (typeof m.color_name === 'string') parts.push(String(m.color_name));
  if (typeof m.value === 'number') parts.push(`${m.value.toLocaleString('en-US')} ${m.currency || 'EGP'}`);
  if (typeof m.order_number === 'string') parts.push(String(m.order_number));
  if (typeof m.new_status === 'string') parts.push(`→ ${m.new_status}`);
  if (typeof m.method === 'string') parts.push(String(m.method));
  if (typeof m.governorate_name === 'string') parts.push(String(m.governorate_name));
  return parts.join(' · ');
}

export default function ActivityPage() {
  const { L, AR } = useAdmin();
  const [type, setType] = useState('');
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<ActivityEvent[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const path = `/analytics/events?offset=${offset}${type ? `&type=${encodeURIComponent(type)}` : ''}`;
  const { data, loading, error } = useAdminFetch<EventsPage>(path);

  // offset 0 (a fresh filter, or the first page) replaces the list;
  // any later page — "Load more" bumped offset — appends to it instead.
  useEffect(() => {
    if (!data) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows((cur) => (offset === 0 ? data.events : [...cur, ...data.events]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const onFilter = (t: string) => { setType(t); setOffset(0); setRows([]); };

  return (
    <>
      <div className="adm-head">
        <h1>{L('Activity', 'النشاط')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Every event the site and the admin panel fire, most recent first', 'كل الأحداث اللي بتحصل في الموقع ولوحة التحكم، الأحدث أولًا')}</span>
      </div>

      <select value={type} onChange={(e) => onFilter(e.target.value)}
        style={{ background: 'none', border: '1px solid var(--line)', padding: '10px 12px', fontSize: 12.5, marginBottom: 20, minWidth: 220 }}>
        {TYPE_FILTERS.map((t) => <option key={t} value={t}>{t || L('All event types', 'كل أنواع الأحداث')}</option>)}
      </select>

      {error && <p className="body" style={{ color: '#B75B5B' }}>{error}</p>}

      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '140px 1fr 1fr 1.6fr 90px' }}>
        <span>{L('When', 'الوقت')}</span><span>{L('Event', 'الحدث')}</span><span>{L('Who', 'مين')}</span><span>{L('Details', 'التفاصيل')}</span><span></span>
      </div>

      {rows.map((e) => (
        <div key={e.id}>
          <div className="adm-row" style={{ gridTemplateColumns: '140px 1fr 1fr 1.6fr 90px', alignItems: 'start' }}>
            <span className="body" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
              {new Date(e.createdAt).toLocaleString(AR() ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="pill">{e.type}</span>
            <span className="body" style={{ fontSize: 12 }}>
              {e.userName || (e.userId ? `${L('User', 'مستخدم')} #${e.userId}` : e.visitorId ? `${L('Visitor', 'زائر')} ${e.visitorId.slice(0, 8)}` : '—')}
              <div className="lbl" style={{ color: 'var(--ink-faint)', marginTop: 3 }}>{e.path}</div>
            </span>
            <span className="body" style={{ fontSize: 12 }}>{summarize(e) || '—'}</span>
            <button className="link" onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
              {expanded === e.id ? L('Hide', 'إخفاء') : L('Details', 'تفاصيل')}
            </button>
          </div>
          {expanded === e.id && (
            <pre style={{ background: 'var(--sand)', padding: '14px 18px', fontSize: 11.5, overflowX: 'auto', margin: '0 0 4px' }}>
              {JSON.stringify(e.metadata || {}, null, 2)}
            </pre>
          )}
        </div>
      ))}

      {!loading && !rows.length && <p className="body" style={{ padding: '26px 0' }}>{L('No events recorded yet.', 'مفيش أحداث متسجّلة لسه.')}</p>}

      {data?.hasMore && (
        <button className="btn" style={{ marginTop: 20 }} onClick={() => setOffset((o) => o + 50)}>
          {L('Load more', 'عرض المزيد')}
        </button>
      )}
    </>
  );
}
