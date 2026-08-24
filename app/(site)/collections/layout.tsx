import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Each collection is its own room. Enter one and the house changes tone.'
};

export default function CollectionsLayout({ children }: { children: ReactNode }) {
  return children;
}
