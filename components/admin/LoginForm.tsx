'use client';
import { useState } from 'react';
import { useAdmin } from '@/lib/adminContext';

export default function LoginForm() {
  const { login } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await login(email, password); }
    catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  };

  return (
    <div id="login-screen">
      <form className="adm-login" onSubmit={onSubmit}>
        <img className="adm-login-mark" src="/assets/logo/logo-beige.png" alt="THAJ" />
        <div className="lbl" style={{ color: 'var(--champagne)', textAlign: 'center', marginBottom: 34 }}>Private · Maison Control Room</div>
        <div className="field"><label>Email</label><input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label>Password</label><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div className="adm-error">{error}</div>
        <button className="btn wide" type="submit" disabled={busy} style={{ borderColor: 'var(--champagne)', color: 'var(--on-dark)', marginTop: 8 }}>Enter</button>
      </form>
    </div>
  );
}
