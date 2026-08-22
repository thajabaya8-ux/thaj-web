'use client';
import { useEffect, useRef, useState } from 'react';
import type { Governorate } from '@/lib/types';

export default function GovernorateSelect({ governorates, value, onChange, L, placeholder, loading, error }: {
  governorates: Governorate[] | null;
  value: string;
  onChange: (key: string) => void;
  L: <T = string>(e?: T, a?: T) => T;
  placeholder: string;
  loading?: boolean;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const money = (n: number) => `${n.toLocaleString('en-US')} ${L('EGP', 'ج.م')}`;
  const selected = governorates?.find((g) => g.key === value) || null;

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div className="gov-select" ref={ref}>
      <button type="button" className="gov-trigger" disabled={loading} onClick={() => setOpen((o) => !o)}>
        <span>{selected ? L(selected.name, selected.nameAr) : loading ? L('Loading…', 'بيتحمّل…') : placeholder}</span>
        {selected && <b>{money(selected.price)}</b>}
        <i className={`gov-chev ${open ? 'up' : ''}`} />
      </button>
      {open && governorates && governorates.length > 0 && (
        <div className="gov-panel">
          {governorates.map((g) => (
            <button
              type="button" key={g.key} className={`gov-row ${g.key === value ? 'on' : ''}`}
              onClick={() => { onChange(g.key); setOpen(false); }}
            >
              <span>{L(g.name, g.nameAr)}</span>
              <b>{money(g.price)}</b>
            </button>
          ))}
        </div>
      )}
      {error && <div className="adm-error" style={{ minHeight: 'auto', marginTop: 6 }}>{L('Could not load governorates — refresh and try again.', 'معرفناش نحمّل المحافظات — حدّثي الصفحة وجرّبي تاني.')}</div>}
    </div>
  );
}
