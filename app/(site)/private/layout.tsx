import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'The Private Room',
  description: 'Collection previews before release, bespoke commissions, and personal styling — in Riyadh or by video.'
};

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return children;
}
