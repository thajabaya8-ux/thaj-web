'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Governorate } from '@/lib/types';

export default function ShippingPage() {
  const { data, loading, error, reload } = useAdminFetch<Governorate[]>('/governorates');
  const { call, toast, L } = useAdmin();
  const [rows, setRows] = useState<Governorate[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Mirrors the fetched list into local state so price/active edits can be
  // applied optimistically without waiting on a reload() round-trip.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (data) setRows(data); }, [data]);

  const patch = useCallback(async (key: string, body: { price?: number; active?: boolean }) => {
    setBusy(key);
    try { await call(`/governorates/${key}`, { method: 'PATCH', body: JSON.stringify(body) }); }
    catch (e) { toast(e instanceof Error ? e.message : String(e)); reload(); }
    finally { setBusy((cur) => (cur === key ? null : cur)); }
  }, [call, toast, reload]);

  const onPriceChange = (key: string, value: string) => {
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n < 0) return;
    clearTimeout(saveTimers.current[key]);
    saveTimers.current[key] = setTimeout(() => patch(key, { price: Math.round(n) }), 500);
  };

  const onActiveToggle = (key: string, active: boolean) => {
    setRows((cur) => cur && cur.map((g) => (g.key === key ? { ...g, active } : g)));
    patch(key, { active });
  };

  if (loading) return null;
  if (error) return <p className="body" style={{ padding: '40px 0', color: '#B75B5B' }}>{error}</p>;
  if (!rows) return null;

  return (
    <>
      <div className="adm-head">
        <h1>{L('Shipping', 'الشحن')}</h1>
        <span className="lbl" style={{ color: 'var(--ink-faint)', maxWidth: 420, textAlign: 'end' }}>
          {L('Set the shipping fee for each governorate, in EGP. Disabled governorates cannot be selected at checkout.', 'حدّدي رسوم الشحن لكل محافظة، بالجنيه المصري. المحافظات المتوقفة مش هتظهر وقت الدفع.')}
        </span>
      </div>

      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '2fr 160px 100px' }}>
        <span>{L('Governorate', 'المحافظة')}</span>
        <span>{L('Fee (EGP)', 'الرسوم (جنيه)')}</span>
        <span>{L('Active', 'مفعّلة')}</span>
      </div>
      {rows.map((g) => (
        <div className="adm-row" style={{ gridTemplateColumns: '2fr 160px 100px', opacity: g.active ? 1 : .5 }} key={g.key}>
          <span>{L(g.name, g.nameAr)}</span>
          <input
            type="number" min="0" step="1" defaultValue={g.price}
            disabled={busy === g.key}
            onChange={(e) => onPriceChange(g.key, e.target.value)}
            style={{ background: 'none', border: '1px solid var(--line)', padding: '8px 10px', fontSize: 12.5, width: 120 }}
          />
          <input
            type="checkbox" checked={g.active} disabled={busy === g.key}
            onChange={(e) => onActiveToggle(g.key, e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--emerald)' }}
          />
        </div>
      ))}
    </>
  );
}
