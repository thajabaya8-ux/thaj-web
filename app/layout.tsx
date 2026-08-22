import './globals.css';
import { Cairo } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import MetaPixel from '@/components/MetaPixel';

// Self-hosted Arabic web font (see --ar in globals.css) — without this,
// [dir="rtl"] text fell back to whatever Arabic serif the visitor's OS
// happened to have (often none on Windows), rendering thin, undersized,
// and inconsistent between machines.
const cairoAr = Cairo({ subsets: ['arabic'], variable: '--font-cairo', display: 'swap' });

export const metadata: Metadata = {
  title: 'THAJ',
  description: 'THAJ — an abaya fashion house in Riyadh.'
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
        {children}
      </body>
    </html>
  );
}
