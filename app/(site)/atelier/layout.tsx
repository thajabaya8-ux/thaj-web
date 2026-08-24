import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'The Atelier',
  description: 'From the roll arriving to the piece being named, numbered and photographed in movement.'
};

export default function AtelierLayout({ children }: { children: ReactNode }) {
  return children;
}
