import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const STEPS = [
  { n: 1, text: 'Sign in to your account', active: true },
  { n: 2, text: 'Access your teams & tasks' },
  { n: 3, text: 'Collaborate with your team' },
];

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
    <div style={S.page}>
      {/* ── Left panel ── */}
      <div style={S.left} className="auth-left">
        <div style={S.leftInner}>
          <Logo />
          <div style={{ marginTop: 48 }}>
            <h2 style={S.heroTitle}>Manage your team,<br />effortlessly.</h2>
            <p style={S.heroSub}>Assign tasks, track progress, and collaborate — all in one place.</p>
          </div>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {STEPS.map(s => <StepItem key={s.n} {...s} />)}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={S.right}>
        <div style={S.card}>
          <div style={{ marginBottom: 4 }} className="auth-mobile-logo"><Logo /></div>
          <h1 style={S.cardTitle}>Sign in</h1>
          <p style={S.cardSub}>Welcome back. Enter your credentials below.</p>

          {serverError && <ErrorBox msg={serverError} />}

          <form onSubmit={handleSubmit} style={S.form}>
            <Field id="email" label="Email" type="email" placeholder="your@email.com"
              value={form.email} onChange={v => { setForm(p => ({...p, email: v})); setErrors(p => ({...p, email:''})); }} error={errors.email} />
            <Field id="password" label="Password" type="password" placeholder="••••••••"
              value={form.password} onChange={v => { setForm(p => ({...p, password: v})); setErrors(p => ({...p, password:''})); }} error={errors.password} />
            <SubmitBtn loading={loading} label="Sign in" loadingLabel="Signing in…" />
            <p style={S.switchText}>Don't have an account?{' '}<Link to="/register" style={S.link}>Sign up</Link></p>
          </form>
        </div>
      </div>
      <Styles />
    </div>
  );
}

// ── Register Page ─────────────────────────────────────────────────────────────
export function RegisterPageInner() { return null; }

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  page:      { minHeight:'100vh', background:'#0d1117', display:'flex', fontFamily:"'DM Sans',system-ui,sans-serif" },
  left:      { flex:'0 0 52%', background:'#0d1117', borderRight:'1px solid #21262d', flexDirection:'column', justifyContent:'center', padding:'64px 56px' },
  leftInner: { maxWidth: 400 },
  right:     { flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 16px', overflowY:'auto' },
  card:      { width:'100%', maxWidth:400, background:'#161b22', border:'1px solid #30363d', borderRadius:16, padding:'36px 32px', boxShadow:'0 8px 40px rgba(0,0,0,0.5)' },
  heroTitle: { fontSize:34, fontWeight:700, color:'#ffffff', margin:'0 0 12px', letterSpacing:'-1px', lineHeight:1.2 },
  heroSub:   { color:'#8b949e', fontSize:14, lineHeight:1.7, margin:0 },
  cardTitle: { fontSize:26, fontWeight:700, color:'#ffffff', margin:'0 0 4px', letterSpacing:'-0.5px' },
  cardSub:   { color:'#8b949e', fontSize:13, margin:'0 0 24px' },
  form:      { display:'flex', flexDirection:'column', gap:16 },
  switchText:{ textAlign:'center', fontSize:13, color:'#8b949e', margin:0 },
  link:      { color:'#58a6ff', fontWeight:600, textDecoration:'none' },
};

function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:32, height:32, background:'#2563eb', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <svg width="17" height="17" fill="none" stroke="white" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      </div>
      <span style={{ fontWeight:700, color:'#ffffff', fontSize:16, letterSpacing:'-0.3px' }}>Task <span style={{color:'#58a6ff'}}>Manager</span></span>
    </div>
  );
}

function StepItem({ n, text, active }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, background: active ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.03)', border: active ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent' }}>
      <div style={{ width:26, height:26, borderRadius:'50%', background: active ? '#2563eb' : 'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontSize:12, fontWeight:700, color: active ? '#fff' : 'rgba(255,255,255,0.4)' }}>{n}</span>
      </div>
      <span style={{ fontSize:13, color: active ? '#c9d1d9' : '#6e7681', fontWeight: active ? 500 : 400 }}>{text}</span>
    </div>
  );
}

function Field({ id, label, type, placeholder, value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  const border = error ? '#f85149' : focused ? '#388bfd' : '#30363d';
  const shadow = focused ? `0 0 0 3px ${error ? 'rgba(248,81,73,0.1)' : 'rgba(56,139,253,0.1)'}` : 'none';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label htmlFor={id} style={{ fontSize:13, fontWeight:600, color:'#c9d1d9' }}>{label}</label>
      <input id={id} type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ background:'#0d1117', border:`1px solid ${border}`, boxShadow:shadow, borderRadius:9, padding:'10px 12px', fontSize:13, color:'#e6edf3', outline:'none', fontFamily:'inherit', width:'100%', boxSizing:'border-box', transition:'border-color .15s, box-shadow .15s', placeholderColor:'#484f58' }}
      />
      {error && <span style={{ fontSize:12, color:'#f85149' }}>{error}</span>}
    </div>
  );
}

function ErrorBox({ msg }) {
  return <div style={{ background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.3)', color:'#f85149', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{msg}</div>;
}

function SubmitBtn({ loading, label, loadingLabel }) {
  return (
    <button type="submit" disabled={loading}
      style={{ width:'100%', background:'#2563eb', color:'#fff', border:'none', borderRadius:10, padding:'12px', fontSize:14, fontWeight:600, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, fontFamily:'inherit', marginTop:4, transition:'background .15s' }}
      onMouseOver={e => !loading && (e.currentTarget.style.background='#1d4ed8')}
      onMouseOut={e => (e.currentTarget.style.background='#2563eb')}>
      {loading ? loadingLabel : label}
    </button>
  );
}

function Styles() {
  return (
    <style>{`
      .auth-left { display: none !important; }
      .auth-mobile-logo { margin-bottom: 20px; }
      @media (min-width: 1024px) {
        .auth-left { display: flex !important; }
        .auth-mobile-logo { display: none !important; }
      }
      input::placeholder { color: #484f58; }
    `}</style>
  );
}

export { Logo, StepItem, Field, ErrorBox, SubmitBtn, Styles, S };
