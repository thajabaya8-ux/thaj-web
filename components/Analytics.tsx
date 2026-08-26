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

export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    logAnalyticsEvent('pageview', pathname);
  }, [pathname]);

  return null;
}
