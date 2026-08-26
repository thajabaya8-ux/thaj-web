import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/room', '/account', '/wishlist', '/checkout', '/api/']
    },
    sitemap: 'https://thajabaya.com/sitemap.xml'
  };
}
