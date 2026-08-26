import type { MetadataRoute } from 'next';
import { getPieces, getCollections } from '@/lib/api';

const BASE = 'https://thajabaya.com';

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1, changeFrequency: 'daily' },
  { path: '/shop', priority: 0.9, changeFrequency: 'daily' },
  { path: '/collections', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/maison', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/atelier', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/archive', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/private', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/shipping', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/care', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pieces, collections] = await Promise.all([getPieces(), getCollections()]);

  return [
    ...STATIC_ROUTES.map((r) => ({ url: `${BASE}${r.path}`, lastModified: new Date(), changeFrequency: r.changeFrequency, priority: r.priority })),
    ...collections.map((c) => ({ url: `${BASE}/collections/${c.key}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 })),
    ...pieces.map((p) => ({ url: `${BASE}/product/${p.id}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.7 }))
  ];
}
