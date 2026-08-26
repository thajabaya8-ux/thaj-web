import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'THAJ — Maison',
    short_name: 'THAJ',
    description: 'THAJ — an abaya fashion house in Riyadh.',
    start_url: '/',
    display: 'standalone',
    background_color: '#E7EDC7',
    theme_color: '#042D29',
    icons: [
      { src: '/assets/logo/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/logo/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  };
}
