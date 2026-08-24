import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What THAJ collects when you place an order, and how it is used.'
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
