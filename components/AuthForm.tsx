'use client';
/* ==========================================================
   THAJ — auth form
   One login/sign-up screen for every account — customer or
   admin. The server decides the role (from users.role) and this
   just follows wherever /api/auth/login or /api/auth/signup says
   to go: admins land on /admin, everyone else on /account.
   Bilingual on its own (local state, not a shared context) since
   this page sits outside both SiteProvider and AdminProvider.
   ========================================================== */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackPixel } from '@/lib/pixel';

type Mode = 'login' | 'signup';
type Lang = 'en' | 'ar';

export default function AuthForm() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('en');
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const AR = lang === 'ar';
  const L = <T,>(e: T, a: T) => (AR ? a : e);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = AR ? 'rtl' : 'ltr';
  }, [lang, AR]);

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

  // Google sign-in is a full-page redirect out and back, not a fetch — any
  // failure comes back as a query param on this same page rather than a
  // response this component could read directly.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'google') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(L('Could not sign in with Google — try again.', 'معرفناش نسجّل الدخول بجوجل — جرّبي تاني.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (!res.ok) {
        if (body.error === 'This account has been suspended') throw new Error(L('This account has been suspended', 'الحساب ده متوقف'));
        throw new Error(body.error || L('Something went wrong', 'حصل خطأ'));
      }
      if (mode === 'signup' && body.role !== 'admin') trackPixel('CompleteRegistration', { content_name: 'THAJ account' });
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
        <div className="lang" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <button type="button" className={!AR ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          <i>/</i>
          <button type="button" className={AR ? 'on' : ''} onClick={() => setLang('ar')}>ع</button>
        </div>
        <img className="adm-login-mark" src="/assets/logo/logo-beige.png" alt="THAJ" />
        <div className="lbl" style={{ color: 'var(--champagne)', textAlign: 'center', marginBottom: 34 }}>
          {mode === 'login' ? L('Sign in to THAJ', 'تسجيل الدخول لثاج') : L('Create your THAJ account', 'إنشاء حساب في ثاج')}
        </div>
        <a href="/api/auth/google" className="btn wide auth-google">
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18Z" />
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33Z" />
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
          </svg>
          {L('Continue with Google', 'الدخول بحساب جوجل')}
        </a>
        <div className="auth-divider">{L('or', 'أو')}</div>
        {mode === 'signup' && (
          <div className="field"><label>{L('Name', 'الاسم')}</label><input required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        )}
        <div className="field"><label>{L('Email', 'الإيميل')}</label><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>{L('Password', 'كلمة السر')}</label><input type="password" required minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="adm-error">{error}</div>
        <button className="btn wide" type="submit" disabled={busy} style={{ borderColor: 'var(--champagne)', color: 'var(--on-dark)', marginTop: 8 }}>
          {mode === 'login' ? L('Enter', 'دخول') : L('Create account', 'إنشاء الحساب')}
        </button>
        <button type="button" className="adm-switch" onClick={() => { setError(''); setMode(mode === 'login' ? 'signup' : 'login'); }}>
          {mode === 'login' ? L('New here? Create an account', 'أول مرة هنا؟ اعملي حساب') : L('Already have an account? Sign in', 'عندك حساب بالفعل؟ سجّلي دخول')}
        </button>
      </form>
    </div>
  );
}
