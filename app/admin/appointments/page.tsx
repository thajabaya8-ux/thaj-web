'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Appointment } from '@/lib/types';

const STATUSES = ['Requested', 'Confirmed', 'Declined'];

export default function AppointmentsPage() {
  const { data: appts, loading, error, reload } = useAdminFetch<Appointment[]>('/appointments');
  const { call, toast } = useAdmin();

  const onStatus = async (id: string | number, status: string) => {
    try { await call(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast('Updated'); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); reload(); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!appts) return null;

  return (
    <>
      <div className="adm-head"><h1>Appointments</h1></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 160px' }}>
        <span>Client</span><span>Date</span><span>Type</span><span>Status</span>
      </div>
      {appts.length ? appts.map((a) => (
        <div className="adm-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 160px' }} key={a.id}>
          <div><span>{a.name}</span><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{a.email}</div></div>
          <span className="body" style={{ fontSize: 12 }}>{a.date || '—'} · {a.time || ''}</span>
          <span className="body" style={{ fontSize: 12 }}>{a.type || '—'}<br />{a.mode || ''}</span>
          <select defaultValue={a.status} onChange={(e) => onStatus(a.id, e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>No appointments yet.</p>}
    </>
  );
}
