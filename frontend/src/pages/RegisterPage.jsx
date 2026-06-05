import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo, StepItem, Field, ErrorBox, SubmitBtn, Styles, S } from './LoginPage';

const STEPS = [
  { n: 1, text: 'Create your account', active: true },
  { n: 2, text: 'Set up or join a team' },
  { n: 3, text: 'Start managing tasks' },
];

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
    <div style={S.page}>
      {/* Left panel */}
      <div style={S.left} className="auth-left">
        <div style={S.leftInner}>
          <Logo />
          <div style={{ marginTop: 48 }}>
            <h2 style={S.heroTitle}>Build your team,<br />ship faster.</h2>
            <p style={S.heroSub}>Create an account to start managing tasks and collaborating with your team today.</p>
          </div>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STEPS.map(s => <StepItem key={s.n} {...s} />)}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={S.right}>
        <div style={S.card}>
          <div style={{ marginBottom: 20 }} className="auth-mobile-logo"><Logo /></div>
          <h1 style={S.cardTitle}>Create account</h1>
          <p style={S.cardSub}>Fill in the details below to get started.</p>

          {serverError && <ErrorBox msg={serverError} />}

          <form onSubmit={handleSubmit} style={S.form}>
            <Field id="username" label="Username" type="text" placeholder="johndoe"
              value={form.username} onChange={v => set('username', v)} error={errors.username} />
            <Field id="email" label="Email" type="email" placeholder="your@email.com"
              value={form.email} onChange={v => set('email', v)} error={errors.email} />
            <Field id="password" label="Password" type="password" placeholder="At least 6 characters"
              value={form.password} onChange={v => set('password', v)} error={errors.password} />
            <SubmitBtn loading={loading} label="Create account" loadingLabel="Creating…" />
            <p style={S.switchText}>Already have an account?{' '}<Link to="/login" style={S.link}>Sign in</Link></p>
          </form>
        </div>
      </div>
      <Styles />
    </div>
  );
}
