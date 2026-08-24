import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Maison',
  description: 'A house built on proportion, not ornament. THAJ makes abayas in Riyadh, catalogued and numbered.'
};

export default function MaisonLayout({ children }: { children: ReactNode }) {
  return children;
}
