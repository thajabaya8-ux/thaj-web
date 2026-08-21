import './globals.css';
import { Amiri, Cairo } from 'next/font/google';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Self-hosted Arabic web fonts (see --ar / --ar-display in globals.css) —
// without these, [dir="rtl"] text fell back to whatever Arabic serif the
// visitor's OS happened to have (often none on Windows), rendering thin,
// undersized, and inconsistent between machines.
const cairoAr = Cairo({ subsets: ['arabic'], variable: '--font-cairo', display: 'swap' });
const amiriAr = Amiri({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-amiri', display: 'swap' });

export const metadata: Metadata = {
  title: 'THAJ',
  description: 'THAJ — an abaya fashion house in Riyadh.'
};

// Intentionally minimal — the public site's chrome (header/footer/drawer/
// search/curtain) lives in app/(site)/layout.js and the admin shell lives
// in app/admin/layout.js, so neither bleeds into the other. This root
// layout only owns what both need: the design tokens in globals.css, the
// Arabic font variables above, and the <html>/<body> shell.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${cairoAr.variable} ${amiriAr.variable}`}>
      <body>{children}</body>
    </html>
  );
}
