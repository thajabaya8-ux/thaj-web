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
   ========================================================== */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { Settings } from '@/lib/types';
import { markPixelReady } from '@/lib/pixel';

let pixelBooted = false;
let cachedPixelId: string | null = null; // null = not fetched yet, '' = fetched but unset

function bootPixel(pixelId: string) {
  if (pixelBooted || !pixelId) return;
  pixelBooted = true;

  if (!window.fbq) {
    const queue: unknown[][] = [];
    const stub = ((...args: unknown[]) => { queue.push(args); }) as NonNullable<Window['fbq']>;
    stub.queue = queue;
    window.fbq = stub;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  // Unblocks any trackPixel() call (AddToCart, etc.) that fired while this
  // was still resolving — see the comment in lib/pixel.ts.
  markPixelReady();
}

export default function MetaPixel() {
  const pathname = usePathname();
  const [pixelId, setPixelId] = useState(cachedPixelId);

  useEffect(() => {
    if (cachedPixelId !== null) return; // already resolved earlier this session
    fetch('/api/settings').then((r) => (r.ok ? r.json() : {})).then((s: Settings) => {
      cachedPixelId = s.meta_pixel_id || '';
      setPixelId(cachedPixelId);
      // No pixel configured — bootPixel() (and its own markPixelReady()
      // call) will never run, so release any queued trackPixel() calls
      // here instead; they no-op since window.fbq never gets created.
      if (!cachedPixelId) markPixelReady();
    }).catch(() => { cachedPixelId = ''; setPixelId(''); markPixelReady(); });
  }, []);

  useEffect(() => {
    if (!pixelId || pathname.startsWith('/admin')) return;

    const wasAlreadyBooted = pixelBooted;
    bootPixel(pixelId); // no-ops if already booted (and already marked ready)
    if (wasAlreadyBooted) window.fbq?.('track', 'PageView'); // first-ever PageView is covered by bootPixel() itself
  }, [pathname, pixelId]);

  return null;
}
