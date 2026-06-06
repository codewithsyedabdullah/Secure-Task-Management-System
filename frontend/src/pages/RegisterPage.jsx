import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { AuthField, AuthBtn } from './LoginPage';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.username || form.username.length < 3) e.username = 'At least 3 characters.';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password || form.password.length < 6) e.password = 'At least 6 characters.';
    setErrors(e); return !Object.keys(e).length;
  };

  const handleSubmit = async ev => {
    ev.preventDefault(); if (!validate()) return;
    setServerError(''); setLoading(true);
    try { await register(form.username, form.email, form.password); navigate('/dashboard'); }
    catch (err) {
      const errs = err.response?.data?.errors;
      setServerError(errs ? errs[0].msg : err.response?.data?.error || 'Registration failed.');
    }
    finally { setLoading(false); }
  };

  const set = (key, val) => { setForm(p => ({...p, [key]: val})); setErrors(p => ({...p, [key]: ''})); };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <header style={{ padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" style={{ fontFamily: "'Anton', sans-serif", fontSize: 22, color: 'var(--text)', textDecoration: 'none' }}>TASK MANAGER</Link>
          <div style={{marginLeft:'auto'}}><ThemeToggle /></div>
        <p style={{ fontSize: 14, color: 'var(--text)', opacity: 0.5, margin: 0 }}>
          Have an account?{' '}
          <Link to="/login" style={{ color: 'var(--text)', fontWeight: 600, opacity: 1 }}>Sign in</Link>
        </p>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 0 }} className="auth-grid">

        {/* Left panel */}
        <div style={{ padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid var(--border)' }} className="auth-left-panel">
          <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(48px, 5vw, 72px)', fontWeight: 400, lineHeight: 0.9, margin: '0 0 28px', color: 'var(--text)' }}>
            BUILD YOUR<br />TEAM /
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text)', opacity: 0.6, maxWidth: 360, lineHeight: 1.7, marginBottom: 40 }}>
            Create an account, set up your first team, and start shipping tasks with your crew today.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { n: 1, text: 'Create your account', active: true },
              { n: 2, text: 'Set up or join a team' },
              { n: 3, text: 'Start managing tasks' },
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
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 36, fontWeight: 400, margin: '0 0 6px', color: 'var(--text)' }}>CREATE ACCOUNT</h2>
            <p style={{ fontSize: 14, color: 'var(--text)', opacity: 0.5, margin: '0 0 32px' }}>Fill in the details below to get started.</p>

            {serverError && (
              <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', borderRadius: 8, padding: '12px 16px', fontSize: 13, marginBottom: 24 }}>{serverError}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <AuthField id="username" label="Username" type="text" placeholder="johndoe"
                value={form.username} onChange={v => set('username', v)} error={errors.username} />
              <AuthField id="email" label="Email" type="email" placeholder="your@email.com"
                value={form.email} onChange={v => set('email', v)} error={errors.email} />
              <AuthField id="password" label="Password" type="password" placeholder="At least 6 characters"
                value={form.password} onChange={v => set('password', v)} error={errors.password} />
              <AuthBtn loading={loading} label="Create account" loadingLabel="Creating…" />
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text)', opacity: 0.5, margin: 0 }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--text)', fontWeight: 700, opacity: 1 }}>Sign in</Link>
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
