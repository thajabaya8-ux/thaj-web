'use client';
/* ==========================================================
   THAJ — floating social bubble
   Self-contained: fetches its own active links from the public
   /api/social endpoint (admin-managed at /admin/social) rather than
   going through SiteContext, so it needs no wiring anywhere else.
   Collapsed by default; tapping the toggle expands the active
   platforms stacked above it, in admin-set order.
   ========================================================== */
import { useEffect, useRef, useState } from 'react';
import { SOCIAL_ICONS as ICONS } from './socialIcons';
import type { SocialLink } from '@/lib/types';

export default function SocialFab() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/social').then((r) => (r.ok ? r.json() : [])).then((s: SocialLink[]) => { if (!cancelled) setLinks(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Closes on any tap/click outside the bubble — picking a platform or
  // reopening it later is still just a tap on the toggle.
  useEffect(() => {
    if (!open) return;
    const onOutside = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', onOutside);
    return () => document.removeEventListener('pointerdown', onOutside);
  }, [open]);

  if (!links.length) return null;

  return (
    <div className="social-fab" ref={ref}>
      {links.map((s, i) => (
        <a
          key={s.platform} href={s.url} target="_blank" rel="noopener noreferrer"
          className={`social-fab-item ${open ? 'open' : ''}`}
          style={{ transitionDelay: open ? `${i * 40}ms` : '0ms' }}
          aria-label={s.platform}
        >
          {ICONS[s.platform]}
        </a>
      ))}
      <button type="button" className={`social-fab-toggle ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="Social">
        <svg className="icon-social" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="6" cy="12" r="2.4" /><circle cx="17.5" cy="5.5" r="2.4" /><circle cx="17.5" cy="18.5" r="2.4" />
          <path d="M8.1 10.8 15.4 6.9M8.1 13.2l7.3 3.9" />
        </svg>
        <svg className="icon-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
  );
}
