import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'The Archive',
  description: 'A museum catalogue rather than a shop. Pieces held here include those no longer for sale.'
};

export default function ArchiveLayout({ children }: { children: ReactNode }) {
  return children;
}
