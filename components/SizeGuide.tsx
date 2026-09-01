'use client';
import { useEffect, useRef, useState } from 'react';
import { sizeRangeCompact } from '@/lib/siteContext';

// One field that opens a table of every height this piece offers, instead
// of a bare row of number buttons a customer has to guess between — the
// actual problem being solved is someone 152cm tall not knowing whether
// that's "150" or "155" until the table spells out each size's range.
export default function SizeGuide({ sizes, value, onChange, L }: {
  sizes: string[];
  value: string | null;
  onChange: (s: string) => void;
  L: <T = string>(e?: T, a?: T) => T;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedRange = value ? sizeRangeCompact(value) : null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="size-select" ref={ref}>
      <button type="button" className="size-trigger" onClick={() => setOpen(true)}>
        <span>{value || L('Select your height', 'اختاري طولك')}</span>
        {selectedRange && <b>{L(selectedRange.en, selectedRange.ar)}</b>}
        <i className="gov-chev" />
      </button>

      <div id="sg-scrim" className={open ? 'open' : ''} onClick={() => setOpen(false)} />
      <div id="sg-panel" className={open ? 'open' : ''} role="dialog" aria-modal="true">
        <div className="sg-head">
          <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Select your height', 'اختاري طولك')}</span>
          <button type="button" className="sg-close" aria-label={L('Close', 'إغلاق')} onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="sg-th"><span>{L('Size', 'المقاس')}</span><span>{L('Fits height', 'مناسب للطول')}</span></div>
        <div className="sg-table">
          {sizes.map((s, i) => {
            const r = sizeRangeCompact(s)!;
            return (
              <button
                type="button" key={s} className={`sg-row ${value === s ? 'on' : ''}`}
                style={open ? { transitionDelay: `${i * 45}ms` } : undefined}
                onClick={() => { onChange(s); setOpen(false); }}
              >
                <span>{s}</span>
                <span>{L(r.en, r.ar)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
