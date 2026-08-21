import type { NextConfig } from 'next';

const IS_PROD = process.env.NODE_ENV === 'production';

// Applies to every response this app sends, including the app/api/* and
// app/assets/uploads/* route handlers — there's no separate backend process
// with its own header config anymore, everything is this one Next.js app.
// 'unsafe-inline' on script-src is required for Next's own hydration data
// scripts (self.__next_f.push(...)); unlike the old vanilla-JS site, this
// app has no onclick="" attributes (React uses event delegation), so no
// script-src-attr override is needed. Inline style="" attributes from
// React's style={{}} props need the equivalent allowance on style-src.
// 'unsafe-eval' is added in development only — React's dev build uses eval()
// for debugging features (e.g. reconstructing stack traces); it never does
// in production, so the production CSP stays free of it.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${IS_PROD ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise "X-Powered-By: Next.js" to every visitor
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: CSP },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ...(IS_PROD ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : [])
      ]
    }];
  }
};

export default nextConfig;
