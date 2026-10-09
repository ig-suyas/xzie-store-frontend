import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../auth';

const tokenOf = (r) => (typeof r === 'string' ? r : r.token);

export default function Login() {
  const { user, signIn, toast } = useApp(); const nav = useNavigate(); const loc = useLocation();
  const [mode, setMode] = useState('login'); const [f, setF] = useState({ username: '', email: '', password: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const gbtn = useRef(); const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const from = loc.state?.from || '/';

  useEffect(() => {
    if (!clientId || user) return;
    const init = () => {
      if (!gbtn.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          try { const r = await api('/auth/google', { method: 'POST', auth: false, body: { idToken: credential } }); await signIn(tokenOf(r)); }
          catch (e) { setErr(e.message); }
        },
      });
      window.google.accounts.id.renderButton(gbtn.current, { theme: 'outline', size: 'large', width: 340, text: 'continue_with', shape: 'pill' });
    };
    if (window.google?.accounts) return init();
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = init;
    document.head.appendChild(s);
  }, [clientId, user, signIn]);

  if (user) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      if (mode === 'register') {
        await api('/register', { method: 'POST', auth: false, body: { username: f.username, email: f.email, password: f.password } });
        toast('Account created');
      }
      const r = await api('/login', { method: 'POST', auth: false, body: { username: f.username, password: f.password } });
      await signIn(tokenOf(r)); nav(from, { replace: true });
    } catch (e2) { setErr(mode === 'login' && (e2.status === 401 || e2.status === 403) ? 'Wrong username or password.' : `${e2.message}${e2.status ? ` (${e2.status})` : ''}`); }
    setBusy(false);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="page auth">
      <div className="auth-side">
        <h1>{mode === 'login' ? 'Welcome back.' : 'Join haul.'}</h1>
        <p>{mode === 'login' ? 'Sign in to see your cart and orders.' : 'Create an account to start shopping.'}</p>
      </div>
      <div className="auth-card">
        <div className="tabs"><button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Sign in</button><button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Register</button></div>
        {clientId ? <div ref={gbtn} className="gbtn" /> : <p className="muted small">Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.</p>}
        <div className="or"><span>or use a password</span></div>
        <form onSubmit={submit} className="form">
          <label>Username<input required value={f.username} onChange={set('username')} autoComplete="username" /></label>
          {mode === 'register' && <label>Email<input required type="email" value={f.email} onChange={set('email')} autoComplete="email" /></label>}
          <label>Password<input required type="password" value={f.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
          {err && <div className="form-err" role="alert">{err}</div>}
          <button className="btn lg" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        </form>
      </div>
    </div>
  );
}
