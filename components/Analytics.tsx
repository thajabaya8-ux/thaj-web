'use client';
/* ==========================================================
   THAJ — page-view tracker
   Separate from MetaPixel.tsx on purpose: that component only fires
   anything once a Meta Pixel ID is configured in Settings →
   Marketing, but /admin/analytics has to work whether or not that's
   ever set up. Logs one pageview per route change; /admin/* is never
   tracked, same as MetaPixel.
   ========================================================== */
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { logAnalyticsEvent } from '@/lib/analytics';
import { captureAttribution } from '@/lib/attribution';

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    logAnalyticsEvent('pageview', pathname);
    // Reads window.location.search directly rather than useSearchParams()
    // — that hook requires a <Suspense> boundary in the App Router, which
    // this component (mounted straight in the root layout) doesn't have,
    // and by the time this effect runs the query string is already
    // whatever it should be for this render.
    captureAttribution(window.location.search);
  }, [pathname]);

  return null;
}
