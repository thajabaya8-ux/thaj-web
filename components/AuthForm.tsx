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
