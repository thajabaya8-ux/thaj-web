'use client';
import { useEffect, useRef, useState } from 'react';

// One field that opens a grid of every exact height (cm) this piece
// offers, instead of a bare row of number buttons a customer has to
// guess between.
export default function SizeGuide({ sizes, value, onChange, L }: {
  sizes: string[];
  value: string | null;
  onChange: (s: string) => void;
  L: <T = string>(e?: T, a?: T) => T;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        <span>{value ? `${value} ${L('cm', 'سم')}` : L('Select your height', 'اختاري طولك')}</span>
        <i className="gov-chev" />
      </button>

      <div id="sg-scrim" className={open ? 'open' : ''} onClick={() => setOpen(false)} />
      <div id="sg-panel" className={open ? 'open' : ''} role="dialog" aria-modal="true">
        <div className="sg-head">
          <span className="lbl" style={{ color: 'var(--ink-faint)' }}>{L('Select your height (cm)', 'اختاري طولك (سم)')}</span>
          <button type="button" className="sg-close" aria-label={L('Close', 'إغلاق')} onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="sg-grid">
          {sizes.map((s, i) => (
            <button
              type="button" key={s} className={`sg-tile ${value === s ? 'on' : ''}`}
              style={open ? { transitionDelay: `${Math.min(i * 12, 300)}ms` } : undefined}
              onClick={() => { onChange(s); setOpen(false); }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
