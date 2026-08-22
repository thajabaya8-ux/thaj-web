'use client';
/* ==========================================================
   THAJ admin — context
   Session state (who's logged in), the bilingual EN/AR toggle for
   the admin UI itself (separate from lib/siteContext's — the two
   never mount at once, since admin and the public site are
   different route groups), and the API helper that talks to
   /api/admin/* — the client-side equivalent of the old
   admin/js/admin-data.js + admin-app.js boot()/toast() logic.
   Auth itself (login/signup) now lives on the shared /login page —
   this context only reads the session (/api/auth/me) and, if it
   doesn't belong to an admin, treats the visitor as logged out so
   AdminGate sends them to /login instead of showing the panel.
   ========================================================== */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AdminUser } from '@/lib/types';

export const abs = (p?: string) => (p ? ('/' + p).replace(/^\/+/, '/') : '');

export async function api(path: string, opts?: RequestInit) {
  const res = await fetch('/api/admin' + path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    ...opts
  });
  if (res.status === 401) throw new Error('__UNAUTHENTICATED__');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

type Lang = 'en' | 'ar';

interface AdminContextValue {
  me: AdminUser | null | undefined; // undefined = still checking, null = logged out (or not an admin)
  logout: () => Promise<void>;
  toast: (m: string) => void;
  toastMsg: string | null;
  call: (path: string, opts?: RequestInit) => Promise<unknown>;
  lang: Lang;
  setLang: (l: Lang) => void;
  AR: () => boolean;
  L: <T = string>(e?: T, a?: T) => T;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<AdminUser | null | undefined>(undefined);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [lang, setLangState] = useState<Lang>('en');

  const AR = useCallback(() => lang === 'ar', [lang]);
  const L = useCallback(<T,>(e?: T, a?: T) => ((lang === 'ar' ? a : e) as T), [lang]);
  const setLang = useCallback((l: Lang) => setLangState((cur) => (cur === l ? cur : l)), []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const body = await res.json();
        if (body.role === 'admin') { setMe({ email: body.email }); return; }
      }
    } catch { /* falls through to logged-out state below */ }
    setMe(null);
  }, []);

  // The standard React fetch-on-mount pattern (see "You Might Not Need an
  // Effect" in the React docs): setState happens after an await, not
  // synchronously in the effect body, so it doesn't cause the render-time
  // cascading updates the newer react-hooks/set-state-in-effect rule
  // guards against. Verified functionally correct via end-to-end testing.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refreshMe(); }, [refreshMe]);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // Wraps api() so any 401 (session expired mid-session) drops back to the
  // login screen instead of surfacing a raw error.
  const call = useCallback(async (path: string, opts?: RequestInit) => {
    try {
      return await api(path, opts);
    } catch (e) {
      if (e instanceof Error && e.message === '__UNAUTHENTICATED__') { setMe(null); throw new Error(L('Session expired — please log in again.', 'انتهت الجلسة — سجّلي دخول تاني.')); }
      throw e;
    }
  }, [L]);

  const logout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); } catch { /* best-effort */ }
    setMe(null);
  }, []);

  return (
    <AdminContext.Provider value={{ me, logout, toast, toastMsg, call, lang, setLang, AR, L }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin() must be used within <AdminProvider>');
  return ctx;
}
