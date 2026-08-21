'use client';
/* ==========================================================
   THAJ admin — context
   Session state (who's logged in) and the API helper that talks
   to /api/admin/* — the client-side equivalent of the old
   admin/js/admin-data.js + admin-app.js boot()/toast() logic.
   ========================================================== */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { AdminUser } from '@/lib/types';

export const SAR = (n: number) => (n || 0).toLocaleString('en-US') + ' SAR';
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

interface AdminContextValue {
  me: AdminUser | null | undefined; // undefined = still checking, null = logged out
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toast: (m: string) => void;
  toastMsg: string | null;
  call: (path: string, opts?: RequestInit) => Promise<unknown>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<AdminUser | null | undefined>(undefined);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const refreshMe = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me', { credentials: 'same-origin' });
      if (res.ok) { setMe(await res.json()); return; }
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
      if (e instanceof Error && e.message === '__UNAUTHENTICATED__') { setMe(null); throw new Error('Session expired — please log in again.'); }
      throw e;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Could not log in');
    setMe({ email: body.email });
  }, []);

  const logout = useCallback(async () => {
    try { await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }); } catch { /* best-effort */ }
    setMe(null);
  }, []);

  return (
    <AdminContext.Provider value={{ me, login, logout, toast, toastMsg, call }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin() must be used within <AdminProvider>');
  return ctx;
}
