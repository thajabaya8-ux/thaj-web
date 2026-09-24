'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAdminFetch } from '@/lib/useAdminFetch';
import { useAdmin } from '@/lib/adminContext';
import type { Governorate, Settings } from '@/lib/types';

export default function ShippingPage() {
  const { data, loading, error, reload } = useAdminFetch<Governorate[]>('/governorates');
  const { data: settings, loading: loadingSettings } = useAdminFetch<Settings>('/settings');
  const { call, toast, L } = useAdmin();
  const [rows, setRows] = useState<Governorate[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [freeShipping, setFreeShipping] = useState(false);
  const [freeBusy, setFreeBusy] = useState(false);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Mirrors the fetched list into local state so price/active edits can be
  // applied optimistically without waiting on a reload() round-trip.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (data) setRows(data); }, [data]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (settings) setFreeShipping(settings.free_shipping === 'true'); }, [settings]);

  // One flat switch, not per-governorate — see isFreeShipping() in
  // lib/payment.ts, which every price shown anywhere (checkout, cart,
  // product page, the order total itself) is computed through.
  const onToggleFree = async (next: boolean) => {
    setFreeShipping(next);
    setFreeBusy(true);
    try { await call('/settings', { method: 'PUT', body: JSON.stringify({ free_shipping: next ? 'true' : 'false' }) }); }
    catch (e) { setFreeShipping(!next); toast(e instanceof Error ? e.message : String(e)); }
    finally { setFreeBusy(false); }
  };

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

  if (loading || loadingSettings) return null;
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

      <label className="free-ship-toggle">
        <div>
          <b>{L('Free shipping for everyone', 'شحن مجاني للكل')}</b>
          <span>{L('Turns off shipping fees site-wide — checkout, the cart, and every product page will show "Free Shipping" instead of a fee, regardless of governorate.', 'بتلغي رسوم الشحن في كل الموقع — صفحة الدفع، السلة، وكل صفحة منتج هتعرض "شحن مجاني" بدل الرسوم، بغض النظر عن المحافظة.')}</span>
        </div>
        <input
          type="checkbox" checked={freeShipping} disabled={freeBusy}
          onChange={(e) => onToggleFree(e.target.checked)}
          style={{ width: 20, height: 20, accentColor: 'var(--emerald)', flex: '0 0 auto' }}
        />
      </label>

      <div className="adm-row adm-row-head" style={{ gridTemplateColumns: '2fr 160px 100px', opacity: freeShipping ? .4 : 1 }}>
        <span>{L('Governorate', 'المحافظة')}</span>
        <span>{L('Fee (EGP)', 'الرسوم (جنيه)')}</span>
        <span>{L('Active', 'مفعّلة')}</span>
      </div>
      {freeShipping && (
        <p className="body" style={{ fontSize: 11.5, color: 'var(--ink-faint)', margin: '4px 0 14px' }}>
          {L('Free shipping is on, so these per-governorate fees are ignored for now — they\'re kept here so you can switch it back off any time.', 'الشحن المجاني شغال دلوقتي، فرسوم المحافظات دي متجاهلة مؤقتًا — متسيبة هنا عشان لو حبيتي ترجعي تقفليه.')}
        </p>
      )}
      {rows.map((g) => (
        <div className="adm-row" style={{ gridTemplateColumns: '2fr 160px 100px', opacity: g.active && !freeShipping ? 1 : .5 }} key={g.key}>
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
