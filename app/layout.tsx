import './globals.css';
import { Cairo } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import MetaPixel from '@/components/MetaPixel';
import PwaInstall from '@/components/PwaInstall';
import Analytics from '@/components/Analytics';

// Self-hosted Arabic web font (see --ar in globals.css) — without this,
// [dir="rtl"] text fell back to whatever Arabic serif the visitor's OS
// happened to have (often none on Windows), rendering thin, undersized,
// and inconsistent between machines.
const cairoAr = Cairo({ subsets: ['arabic'], variable: '--font-cairo', display: 'swap' });

const TITLE = 'THAJ — Maison';
const DESCRIPTION = 'THAJ — an abaya fashion house in Riyadh. Pieces catalogued and editioned, cut in Riyadh and finished by hand.';

// metadataBase turns every relative URL below (the OG/Twitter images,
// canonical/alternate links elsewhere in the app) into an absolute one —
// without it, a crawler that fetches only the HTML (not this same
// origin) resolves "/assets/..." against nothing and drops the image
// silently. This is also why a search/social preview showed no image at
// all before this file had an openGraph block: there wasn't one to read.
export const metadata: Metadata = {
  metadataBase: new URL('https://thajabaya.com'),
  // Plain defaults, not a title.template — app/(site)/layout.tsx already
  // owns its own template for every public page, and /admin and /login
  // each set their own full title; this is only ever seen by a route
  // that sets neither (there isn't one today, but a future one gets a
  // sane fallback instead of nothing).
  title: TITLE,
  description: DESCRIPTION,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/assets/logo/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/assets/logo/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: '/assets/logo/apple-touch-icon.png'
  },
  appleWebApp: { title: 'THAJ', statusBarStyle: 'black-translucent' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/',
    siteName: 'THAJ',
    images: [{ url: '/assets/logo/og-image.png', width: 1200, height: 630, alt: 'THAJ — Maison' }],
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/assets/logo/og-image.png']
  }
};

// Intentionally minimal — the public site's chrome (header/footer/drawer/
// search/curtain) lives in app/(site)/layout.js and the admin shell lives
// in app/admin/layout.js, so neither bleeds into the other. This root
// layout only owns what both need: the design tokens in globals.css, the
// Arabic font variable above, and the <html>/<body> shell.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={cairoAr.variable}>
      <body>
        <MetaPixel />
        <Analytics />
        {children}
        <PwaInstall />
      </body>
    </html>
  );
}
