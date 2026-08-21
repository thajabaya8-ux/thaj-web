/* ==========================================================
   THAJ — proxy
   Defense-in-depth CSRF check: SameSite=Lax cookies already stop
   cross-site state-changing requests in modern browsers, but this
   rejects any mutating admin request whose Origin/Referer isn't
   this app's own origin, for browsers/proxies that don't honour
   SameSite. Ported from thaj-site/server/index.js's TRUSTED_ORIGINS
   check — simplified because frontend and API are now the same
   origin (no separate Express server to allow-list).
   ========================================================== */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin') || request.headers.get('referer');
    if (origin) {
      let originValue: string | null;
      try { originValue = new URL(origin).origin; } catch { originValue = null; }
      if (!originValue || originValue !== request.nextUrl.origin) {
        return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/admin/:path*'
};
