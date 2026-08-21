'use client';
import { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { SAR } from '@/lib/adminContext';
import type { DashboardData } from '@/lib/types';

function FigTile({ label, val, sub }: { label: ReactNode; val: ReactNode; sub: ReactNode }) {
  return (
    <div className="room-fig">
      <div className="lbl">{label}</div><b>{val}</b>
      <div className="lbl" style={{ color: 'var(--champagne)', marginTop: 12 }}>{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: d, loading, error } = useAdminFetch<DashboardData>('/dashboard');

  useLayoutEffect(() => {
    if (!d) return;
    document.querySelectorAll<HTMLElement>('.lbar b').forEach((b) => { b.style.width = b.dataset.w || ''; });
  }, [d]);

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!d) return null;

  const maxRev = Math.max(1, ...d.revenueByMonth.map((m) => m.total));

  return (
    <>
      <div className="adm-head"><h1>Dashboard</h1><span className="lbl" style={{ color: 'var(--ink-faint)' }}>The state of the house</span></div>
      <section className="dark adm-panel">
        <div className="split" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          <FigTile label="Pieces" val={d.pieces} sub="In the catalogue" />
          <FigTile label="Collections" val={d.collections} sub="Open chapters" />
          <FigTile label="Orders" val={d.ordersPending} sub="Awaiting delivery" />
          <FigTile label="Appointments" val={d.appointmentsPending} sub="Awaiting response" />
        </div>
        <div className="lbl" style={{ color: 'var(--champagne)', margin: '44px 0 18px' }}>Collections · share of the catalogue</div>
        {d.collectionProgress.length ? d.collectionProgress.map((c) => (
          <div className="lrow" key={c.key}>
            <div><div className="h-s">{c.name}</div></div>
            <div className="lbar"><b data-w={`${c.pct}%`}></b></div>
            <div className="lbl" style={{ color: 'var(--champagne)' }}>{c.count} pieces · {c.pct}%</div>
          </div>
        )) : <p className="body">No collections yet.</p>}
        <div className="lbl" style={{ color: 'var(--champagne)', margin: '44px 0 4px' }}>Revenue · recent months</div>
        <div className="adm-chart">
          {d.revenueByMonth.length ? d.revenueByMonth.map((m) => (
            <div className="bar" key={m.month}>
              <b style={{ height: `${Math.max(4, Math.round((m.total / maxRev) * 100))}%` }} title={SAR(m.total)}></b>
              <span>{m.month}</span>
            </div>
          )) : <p className="body">No orders yet.</p>}
        </div>
      </section>
      <div className="split" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <div className="lbl" style={{ color: 'var(--ink-faint)', marginBottom: 14 }}>Recent orders</div>
          {d.recentOrders.length ? d.recentOrders.map((o) => (
            <div className="adm-row" style={{ gridTemplateColumns: '1fr auto auto' }} key={o.n}>
              <span>{o.n}</span><span>{SAR(o.tot)}</span>
              <span className={`pill ${o.st === 'Delivered' ? '' : 'g'}`}>{o.st}</span>
            </div>
          )) : <p className="body">None yet.</p>}
        </div>
        <div>
          <div className="lbl" style={{ color: 'var(--ink-faint)', marginBottom: 14 }}>Recent appointments</div>
          {d.recentAppointments.length ? d.recentAppointments.map((a) => (
            <div className="adm-row" style={{ gridTemplateColumns: '1fr auto' }} key={a.id}>
              <span>{a.name} · {a.date || '—'}</span><span className="pill g">{a.status}</span>
            </div>
          )) : <p className="body">None yet.</p>}
        </div>
      </div>
    </>
  );
}
