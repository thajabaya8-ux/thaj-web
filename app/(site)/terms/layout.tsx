import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms of placing, paying for, and receiving a THAJ order.'
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
