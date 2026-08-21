'use client';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Appointment } from '@/lib/types';

const STATUSES = ['Requested', 'Confirmed', 'Declined'];
const STATUS_AR: Record<string, string> = { Requested: 'مطلوب', Confirmed: 'مؤكد', Declined: 'مرفوض' };

export default function AppointmentsPage() {
  const { data: appts, loading, error, reload } = useAdminFetch<Appointment[]>('/appointments');
  const { call, toast, L, AR } = useAdmin();

  const onStatus = async (id: string | number, status: string) => {
    try { await call(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); toast(L('Updated', 'اتحدّث')); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); reload(); }
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!appts) return null;

  return (
    <>
      <div className="adm-head"><h1>{L('Appointments', 'المواعيد')}</h1></div>
      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 160px' }}>
        <span>{L('Client', 'العميلة')}</span><span>{L('Date', 'التاريخ')}</span><span>{L('Type', 'النوع')}</span><span>{L('Status', 'الحالة')}</span>
      </div>
      {appts.length ? appts.map((a) => (
        <div className="adm-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 160px' }} key={a.id}>
          <div><span>{a.name}</span><div className="lbl" style={{ color: 'var(--ink-faint)' }}>{a.email}</div></div>
          <span className="body" style={{ fontSize: 12 }}>{a.date || '—'} · {a.time || ''}</span>
          <span className="body" style={{ fontSize: 12 }}>{a.type || '—'}<br />{a.mode || ''}</span>
          <select defaultValue={a.status} onChange={(e) => onStatus(a.id, e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{AR() ? STATUS_AR[s] : s}</option>)}
          </select>
        </div>
      )) : <p className="body" style={{ padding: '26px 0' }}>{L('No appointments yet.', 'مافيش مواعيد لسه.')}</p>}
    </>
  );
}
