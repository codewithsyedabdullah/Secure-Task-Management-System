import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    if (!validate()) return;
    setServerError(''); setLoading(true);
    try { await register(form.username, form.email, form.password); navigate('/dashboard'); }
    catch (err) {
      const errs = err.response?.data?.errors;
      setServerError(errs ? errs[0].msg : err.response?.data?.error || 'Registration failed.');
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', fontFamily: 'DM Sans, system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#161b22', border: '1px solid #30363d', borderRadius: '16px', padding: '32px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <div style={{ width: '30px', height: '30px', background: '#2563eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" fill="none" stroke="white" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, color: '#c9d1d9', fontSize: '15px' }}>TaskManager</span>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#ffffff', margin: '0 0 24px', letterSpacing: '-0.5px' }}>Sign up</h1>

        {serverError && (
          <div style={{ background: '#2d1515', border: '1px solid #7f1d1d', color: '#fca5a5', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field id="username" label="Username" type="text" placeholder="johndoe"
            value={form.username} onChange={v => setForm({ ...form, username: v })} error={errors.username} />
          <Field id="email" label="Email" type="email" placeholder="your@email.com"
            value={form.email} onChange={v => setForm({ ...form, email: v })} error={errors.email} />
          <Field id="password" label="Password" type="password" placeholder="At least 6 characters"
            value={form.password} onChange={v => setForm({ ...form, password: v })} error={errors.password} />

          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#1d4ed8' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit', marginTop: '4px', transition: 'background .15s' }}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#8b949e', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#58a6ff', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, type, placeholder, value, onChange, error }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label htmlFor={id} style={{ fontSize: '13px', fontWeight: 600, color: '#c9d1d9' }}>{label}</label>
      <input id={id} type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
        style={{ background: '#0d1117', border: `1px solid ${error ? '#f87171' : '#30363d'}`, borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#c9d1d9', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', transition: 'border-color .15s' }}
        onFocus={e => e.target.style.borderColor = '#58a6ff'}
        onBlur={e => e.target.style.borderColor = error ? '#f87171' : '#30363d'}
      />
      {error && <span style={{ fontSize: '12px', color: '#f87171' }}>{error}</span>}
    </div>
  );
}
