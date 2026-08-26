'use client';
import { useLayoutEffect } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';

interface OrdersAnalytics {
  totalOrders: number; approvedCount: number; underReviewCount: number; rejectedCount: number;
  totalRevenue: number; totalDeposits: number; avgOrderValue: number;
  byMethod: { method: string; count: number; revenue: number }[];
  byGovernorate: { key: string; name: string; nameAr: string; count: number; revenue: number }[];
  topPieces: { id: string; name: string; nameAr: string; count: number }[];
  revenueByMonth: { month: string; total: number }[];
}

interface PageTraffic { path: string; views: number; events: { type: string; count: number }[] }
interface TrafficAnalytics { days: number; totalViews: number; pages: PageTraffic[] }

const egp = (n: number) => `${(n || 0).toLocaleString('en-US')} EGP`;
const METHOD_LABEL: Record<string, [string, string]> = {
  vodafone_cash: ['Vodafone Cash', 'فودافون كاش'], instapay: ['InstaPay', 'إنستاباي'], unknown: ['Unknown', 'غير معروف']
};

export default function AnalyticsPage() {
  const { L } = useAdmin();
  const { data: orders, loading: loadingOrders, error: ordersError } = useAdminFetch<OrdersAnalytics>('/orders/analytics');
  const { data: traffic, loading: loadingTraffic, error: trafficError } = useAdminFetch<TrafficAnalytics>('/analytics');

  useLayoutEffect(() => {
    if (!orders) return;
    document.querySelectorAll<HTMLElement>('.lbar b').forEach((b) => { b.style.width = b.dataset.w || ''; });
  }, [orders]);

  if (loadingOrders || loadingTraffic) return null;

  const maxRev = orders ? Math.max(1, ...orders.revenueByMonth.map((m) => m.total)) : 1;
  const maxGovCount = orders?.byGovernorate.length ? Math.max(...orders.byGovernorate.map((g) => g.count)) : 1;
  const maxViews = traffic?.pages.length ? Math.max(...traffic.pages.map((p) => p.views)) : 1;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Analytics', 'الإحصائيات')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Sales, and what visitors actually do on the site', 'المبيعات، وإيه اللي الزوار بيعملوه فعليًا في الموقع')}</span>
      </div>

      {ordersError && <p className="body" style={{ color: '#B75B5B' }}>{ordersError}</p>}
      {orders && (
        <section className="dark adm-panel">
          <div className="lbl" style={{ color: 'var(--champagne)', marginBottom: 18 }}>{L('Sales', 'المبيعات')}</div>
          <div className="split" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}>
            <div className="room-fig"><div className="lbl">{L('Orders', 'الطلبات')}</div><b>{orders.totalOrders}</b></div>
            <div className="room-fig"><div className="lbl">{L('Approved', 'معتمد')}</div><b>{orders.approvedCount}</b></div>
            <div className="room-fig"><div className="lbl">{L('Under review', 'قيد المراجعة')}</div><b>{orders.underReviewCount}</b></div>
            <div className="room-fig"><div className="lbl">{L('Revenue', 'الإيرادات')}</div><b style={{ fontSize: 20 }}>{egp(orders.totalRevenue)}</b></div>
            <div className="room-fig"><div className="lbl">{L('Avg. order', 'متوسط الطلب')}</div><b style={{ fontSize: 20 }}>{egp(orders.avgOrderValue)}</b></div>
          </div>

          <div className="lbl" style={{ color: 'var(--champagne)', margin: '44px 0 4px' }}>{L('Revenue · recent months', 'الإيرادات · آخر الشهور')}</div>
          <div className="adm-chart">
            {orders.revenueByMonth.length ? orders.revenueByMonth.map((m) => (
              <div className="bar" key={m.month}>
                <b style={{ height: `${Math.max(4, Math.round((m.total / maxRev) * 100))}%` }} title={egp(m.total)}></b>
                <span>{m.month}</span>
              </div>
            )) : <p className="body">{L('No orders yet.', 'مافيش طلبات لسه.')}</p>}
          </div>

          <div className="split" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 44 }}>
            <div>
              <div className="lbl" style={{ color: 'var(--champagne)', marginBottom: 14 }}>{L('By payment method', 'حسب طريقة الدفع')}</div>
              {orders.byMethod.map((m) => (
                <div className="adm-row" style={{ gridTemplateColumns: '1fr auto auto' }} key={m.method}>
                  <span>{L(...(METHOD_LABEL[m.method] || [m.method, m.method]))}</span>
                  <span>{m.count}</span>
                  <span className="pill g">{egp(m.revenue)}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="lbl" style={{ color: 'var(--champagne)', marginBottom: 14 }}>{L('Top pieces sold', 'الأكثر مبيعًا')}</div>
              {orders.topPieces.length ? orders.topPieces.map((p) => (
                <div className="adm-row" style={{ gridTemplateColumns: '1fr auto' }} key={p.id}>
                  <span>{L(p.name, p.nameAr)}</span><span className="pill g">{p.count}</span>
                </div>
              )) : <p className="body">{L('None yet.', 'ولا واحدة لسه.')}</p>}
            </div>
          </div>

          <div className="lbl" style={{ color: 'var(--champagne)', margin: '44px 0 4px' }}>{L('By governorate', 'حسب المحافظة')}</div>
          {orders.byGovernorate.slice(0, 8).map((g) => (
            <div className="lrow" key={g.key}>
              <div><div className="h-s">{L(g.name, g.nameAr)}</div></div>
              <div className="lbar"><b data-w={`${Math.round((g.count / maxGovCount) * 100)}%`}></b></div>
              <div className="lbl" style={{ color: 'var(--champagne)' }}>{g.count} {L('orders', 'طلب')}</div>
            </div>
          ))}
        </section>
      )}

      {trafficError && <p className="body" style={{ color: '#B75B5B', marginTop: 30 }}>{trafficError}</p>}
      {traffic && (
        <section style={{ marginTop: 30 }}>
          <div className="adm-head" style={{ marginBottom: 18 }}>
            <h2 className="h-s" style={{ fontSize: 20 }}>{L('Site traffic', 'زوار الموقع')}</h2>
            <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L(`Last ${traffic.days} days`, `آخر ${traffic.days} يوم`)}</span>
          </div>
          <section className="dark adm-panel" style={{ marginBottom: 30 }}>
            <div className="split" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
              <div className="room-fig"><div className="lbl">{L('Total page views', 'إجمالي المشاهدات')}</div><b>{traffic.totalViews.toLocaleString('en-US')}</b></div>
            </div>
          </section>
          <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '1fr auto 2fr' }}>
            <span>{L('Page', 'الصفحة')}</span><span>{L('Views', 'المشاهدات')}</span><span>{L('Events on this page', 'الأحداث في الصفحة دي')}</span>
          </div>
          {traffic.pages.length ? traffic.pages.map((p) => (
            <div className="adm-row" style={{ gridTemplateColumns: '1fr auto 2fr' }} key={p.path}>
              <span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>{p.path}</span>
              <span className="pill g">{p.views}</span>
              <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {p.events.length
                  ? p.events.map((e) => <span key={e.type} className="pill">{e.type} · {e.count}</span>)
                  : <span className="lbl" style={{ color: 'var(--ink-faint)' }}>—</span>}
              </span>
            </div>
          )) : <p className="body" style={{ padding: '26px 0' }}>{L('No visits recorded yet.', 'مفيش زيارات مسجّلة لسه.')}</p>}
        </section>
      )}
    </>
  );
}
