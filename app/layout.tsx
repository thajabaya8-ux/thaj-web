import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'THAJ',
  description: 'THAJ — an abaya fashion house in Riyadh.'
};

// Intentionally minimal — the public site's chrome (header/footer/drawer/
// search/curtain) lives in app/(site)/layout.js and the admin shell lives
// in app/admin/layout.js, so neither bleeds into the other. This root
// layout only owns what both need: the design tokens in globals.css and
// the <html>/<body> shell.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>{children}</body>
    </html>
  );
}
