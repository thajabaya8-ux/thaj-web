'use client';
/* ==========================================================
   THAJ — Meta Pixel loader
   Mounted once in the root layout, for the whole app's lifetime.
   The Pixel ID is admin-editable (Settings → Marketing), not an
   env var — fetched once from the public /api/settings endpoint
   and cached at module scope so remounts never refetch it.
   `pixelBooted` is likewise a MODULE-level flag (not React state):
   it guarantees the base script and the very first PageView fire
   exactly once per browser session, no matter how many times this
   component re-renders on navigation. Every later pathname change
   fires one more PageView, and /admin/* is never tracked at all
   (no admin session activity is ever sent to Meta).

   The stub below deliberately mirrors Meta's own official base-code
   snippet, callMethod check included — that check is not boilerplate
   to trim. Once fbevents.js finishes loading, it patches a
   `callMethod` property directly onto this exact function object
   (never replaces window.fbq with a new one), and expects every
   future call to route through it. A stub that only ever pushes to
   its queue array — the bug this file had — keeps "working" for the
   very first call (drained once, when the script finishes loading)
   and then silently swallows every call after that forever: no
   error, no network request, nothing. That's exactly why PageView
   (always the first call on a fresh page load) reached Meta while
   AddToCart (always a later call on the same page) never did.
   ========================================================== */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Settings } from '@/lib/types';

let pixelBooted = false;
let cachedPixelId: string | null = null; // null = not fetched yet, '' = fetched but unset

function bootPixel(pixelId: string) {
  if (pixelBooted || !pixelId) return;
  pixelBooted = true;

  if (!window.fbq) {
    const stub = function (...args: unknown[]) {
      if (stub.callMethod) stub.callMethod.call(stub, ...args);
      else stub.queue!.push(args);
    } as NonNullable<Window['fbq']>;
    stub.queue = [];
    window.fbq = stub;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
}

export default function MetaPixel() {
  const pathname = usePathname();
  const [pixelId, setPixelId] = useState(cachedPixelId);

  useEffect(() => {
    if (cachedPixelId !== null) return; // already resolved earlier this session
    fetch('/api/settings').then((r) => (r.ok ? r.json() : {})).then((s: Settings) => {
      cachedPixelId = s.meta_pixel_id || '';
      setPixelId(cachedPixelId);
    }).catch(() => { cachedPixelId = ''; setPixelId(''); });
  }, []);

  useEffect(() => {
    if (!pixelId || pathname.startsWith('/admin')) return;

    const wasAlreadyBooted = pixelBooted;
    bootPixel(pixelId); // no-ops if already booted
    if (wasAlreadyBooted) window.fbq?.('track', 'PageView'); // first-ever PageView is covered by bootPixel() itself
  }, [pathname, pixelId]);

  return null;
}
