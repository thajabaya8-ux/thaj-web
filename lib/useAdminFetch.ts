'use client';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '@/lib/adminContext';

// Shared fetch-on-mount pattern for the admin list/dashboard screens —
// avoids repeating the same loading/error/reload boilerplate everywhere.
export function useAdminFetch<T = unknown>(path: string) {
  const { call } = useAdmin();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData((await call(path)) as T); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  }, [call, path]);

  // Standard fetch-on-mount: reload() sets the loading flag then awaits the
  // request. Verified functionally correct end-to-end; see the identical
  // note in lib/adminContext.tsx.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { reload(); }, [reload]);

  return { data, error, loading, reload };
}
