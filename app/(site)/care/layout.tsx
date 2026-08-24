import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Care & Repair',
  description: 'How to clean, iron and store a THAJ piece so it holds its shape and colour.'
};

export default function CareLayout({ children }: { children: ReactNode }) {
  return children;
}
