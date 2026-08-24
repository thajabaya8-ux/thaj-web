import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Filter by chapter, silhouette, fabric, colour or occasion. Every piece is editioned and numbered.'
};

export default function ShopLayout({ children }: { children: ReactNode }) {
  return children;
}
