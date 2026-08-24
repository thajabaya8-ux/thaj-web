/* ==========================================================
   THAJ — proxy
   Two unrelated checks, combined because a project only gets one
   proxy file:

   1. Defense-in-depth CSRF check: SameSite=Lax cookies already stop
      cross-site state-changing requests in modern browsers, but this
      rejects any mutating admin/auth request whose Origin/Referer
      isn't this app's own origin, for browsers/proxies that don't
      honour SameSite. Ported from thaj-site/server/index.js's
      TRUSTED_ORIGINS check — simplified because frontend and API are
      now the same origin (no separate Express server to allow-list).

   2. Page-level auth gate for /account, /wishlist, /room and /admin.
      Their own page components are client components with no way to
      block rendering server-side by themselves — AdminGate's redirect
      for /admin, for instance, is a useEffect, which still ships the
      page's JS to an anonymous visitor first. Verifying the signed
      session cookie here, before any of that ever reaches the
      browser, is what makes this an actual server-side gate rather
      than a client-side one — the API routes underneath were already
      independently checking requireAdmin()/session, so this closes
      the page-shell gap, not a data one.
   ========================================================== */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/session';

const ADMIN_ONLY_PREFIXES = ['/room', '/admin'];
const AUTH_ONLY_PREFIXES = ['/account', '/wishlist'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin') || request.headers.get('referer');
    if (origin) {
      let originValue: string | null;
      try { originValue = new URL(origin).origin; } catch { originValue = null; }
      if (!originValue || originValue !== request.nextUrl.origin) {
        return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
      }
    }
    return NextResponse.next();
  }

  const needsAdmin = ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const needsAuth = needsAdmin || AUTH_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (needsAuth) {
    const session = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
    if (!session || (needsAdmin && session.role !== 'admin')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*', '/api/auth/:path*',
    '/account/:path*', '/wishlist/:path*', '/room/:path*', '/admin/:path*'
  ]
};
