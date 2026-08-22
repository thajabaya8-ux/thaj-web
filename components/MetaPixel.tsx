'use client';
/* ==========================================================
   THAJ — Meta Pixel loader
   Mounted once in the root layout, for the whole app's lifetime.
   `pixelBooted` is a MODULE-level flag (not React state) — it
   guarantees the base script and the very first PageView fire
   exactly once per browser session, no matter how many times this
   component re-renders on navigation. Every later pathname change
   fires one more PageView, and /admin/* is never tracked at all
   (no admin session activity is ever sent to Meta).
   ========================================================== */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { PIXEL_ID } from '@/lib/pixel';

let pixelBooted = false;

function bootPixel() {
  if (pixelBooted || !PIXEL_ID) return;
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

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
}

export default function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    const wasAlreadyBooted = pixelBooted;
    bootPixel(); // no-ops if already booted, or if PIXEL_ID isn't set yet
    if (wasAlreadyBooted) window.fbq?.('track', 'PageView'); // first-ever PageView is covered by bootPixel() itself
  }, [pathname]);

  return null;
}
