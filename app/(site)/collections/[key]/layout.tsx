import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getCollection } from '@/lib/api';

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const collection = await getCollection(key);
  if (!collection) return { title: 'Collection' };
  return {
    title: collection.name,
    description: collection.mood || `${collection.name} — a chapter from THAJ, an abaya fashion house in Riyadh.`
  };
}

export default function CollectionLayout({ children }: { children: ReactNode }) {
  return children;
}
