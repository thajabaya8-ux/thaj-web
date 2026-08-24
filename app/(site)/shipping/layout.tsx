import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Shipping & Returns',
  description: 'How an order is confirmed, shipped across Egypt, and how returns and exchanges work.'
};

export default function ShippingLayout({ children }: { children: ReactNode }) {
  return children;
}
