'use client';
/* ==========================================================
   THAJ — auth form
   One login/sign-up screen for every account — customer or
   admin. The server decides the role (from users.role) and this
   just follows wherever /api/auth/login or /api/auth/signup says
   to go: admins land on /admin, everyone else on /account.
   ========================================================== */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Mode = 'login' | 'signup';

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Already signed in? Skip straight to the right dashboard.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' }).then(async (r) => {
      if (cancelled || !r.ok) return;
      const body = await r.json();
      router.replace(body.role === 'admin' ? '/admin' : '/account');
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [router]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'login' ? { email, password } : { name, email, password })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Something went wrong');
      router.replace(body.role === 'admin' ? '/admin' : '/account');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div id="login-screen">
      <form className="adm-login" onSubmit={onSubmit}>
        <img className="adm-login-mark" src="/assets/logo/logo-beige.png" alt="THAJ" />
        <div className="lbl" style={{ color: 'var(--champagne)', textAlign: 'center', marginBottom: 34 }}>
          {mode === 'login' ? 'Sign in to THAJ' : 'Create your THAJ account'}
        </div>
        {mode === 'signup' && (
          <div className="field"><label>Name</label><input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        )}
        <div className="field"><label>Email</label><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Password</label><input type="password" required minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="adm-error">{error}</div>
        <button className="btn wide" type="submit" disabled={busy} style={{ borderColor: 'var(--champagne)', color: 'var(--on-dark)', marginTop: 8 }}>
          {mode === 'login' ? 'Enter' : 'Create account'}
        </button>
        <button type="button" className="adm-switch" onClick={() => { setError(''); setMode(mode === 'login' ? 'signup' : 'login'); }}>
          {mode === 'login' ? "New here? Create an account" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
