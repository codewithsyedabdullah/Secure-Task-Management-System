import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password || form.password.length < 6) e.password = 'At least 6 characters.';
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async ev => {
    ev.preventDefault(); if (!validate()) return;
    setServerError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/dashboard'); }
    catch (err) { setServerError(err.response?.data?.error || 'Invalid email or password.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, color: 'var(--text)', textDecoration: 'none' }}>TASK MANAGER</Link>
          <div style={{marginLeft:'auto'}}><ThemeToggle /></div>
        <p style={{ fontSize: 14, color: 'var(--text)', opacity: 0.5, margin: 0 }}>
          No account?{' '}
          <Link to="/register" style={{ color: 'var(--text)', fontWeight: 600, opacity: 1 }}>Sign up free</Link>
        </p>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }} className="auth-grid">

        {/* Left panel */}
        <div style={{ padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border)' }} className="auth-left-panel">
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(48px, 5vw, 72px)', fontWeight: 400, lineHeight: 0.9, margin: '0 0 28px', color: 'var(--text)' }}>
            WELCOME<br />BACK /
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text)', opacity: 0.6, maxWidth: 360, lineHeight: 1.7, marginBottom: 40 }}>
            Sign in to access your teams, tasks, and everything you left behind.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 1, text: 'Sign in to your account', active: true },
              { n: 2, text: 'Access your teams & tasks' },
              { n: 3, text: 'Collaborate with your team' },
            ].map(s => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: s.active ? 'rgba(8,8,8,0.06)' : 'transparent', border: s.active ? '1px solid rgba(8,8,8,0.12)' : '1px solid transparent' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: s.active ? '#080808' : 'rgba(8,8,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.active ? '#F5F3EE' : 'rgba(8,8,8,0.4)' }}>{s.n}</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text)', opacity: s.active ? 1 : 0.4, fontWeight: s.active ? 600 : 400 }}>{s.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 36, fontWeight: 400, margin: '0 0 6px', color: 'var(--text)' }}>SIGN IN</h2>
            <p style={{ fontSize: 14, color: 'var(--text)', opacity: 0.5, margin: '0 0 32px' }}>Enter your credentials to continue.</p>

            {serverError && (
              <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 24 }}>{serverError}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <AuthField id="email" label="Email" type="email" placeholder="your@email.com"
                value={form.email} onChange={v => { setForm(p => ({...p, email: v})); setErrors(p => ({...p, email: ''})); }} error={errors.email} />
              <AuthField id="password" label="Password" type="password" placeholder="••••••••"
                value={form.password} onChange={v => { setForm(p => ({...p, password: v})); setErrors(p => ({...p, password: ''})); }} error={errors.password} />
              <AuthBtn loading={loading} label="Sign in" loadingLabel="Signing in…" />
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text)', opacity: 0.5, margin: 0 }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: 'var(--text)', fontWeight: 700, opacity: 1 }}>Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .auth-grid { grid-template-columns: 1fr !important; }
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export function AuthField({ id, label, type, placeholder, value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label htmlFor={id} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</label>
      <input id={id} type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background: 'var(--card-bg)', border: `1.5px solid ${error ? '#dc2626' : focused ? '#080808' : 'rgba(8,8,8,0.15)'}`, borderRadius: 8, padding: '11px 14px', fontSize: 14, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }}
      />
      {error && <span style={{ fontSize: 12, color: '#dc2626' }}>{error}</span>}
    </div>
  );
}

export function AuthBtn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading}
      style={{ width: '100%', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, padding: '13px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontFamily: 'inherit', marginTop: 4, transition: 'opacity .15s' }}>
      {loading ? loadingLabel : label}
    </button>
  );
}
