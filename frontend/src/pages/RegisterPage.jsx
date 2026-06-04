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
    if (!form.username || form.username.length < 3) e.username = 'Username must be at least 3 characters.';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Please enter a valid email address.';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setServerError('');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data?.errors;
      setServerError(errs ? errs[0].msg : err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, hsl(210,100%,97%), hsl(0,0%,100%))' }}>

      <div className="flex items-center justify-center px-4 py-10 w-full">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-8 shadow-[0_5px_15px_hsla(220,30%,5%,0.05),0_15px_35px_-5px_hsla(220,25%,10%,0.05)]">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 text-lg">TaskManager</span>
          </div>

          <h1 className="text-3xl font-semibold text-slate-900 mb-6">Sign up</h1>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{serverError}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="username">Username</label>
              <input id="username" type="text" placeholder="johndoe"
                value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                className={"w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent " + (errors.username ? 'border-red-400 bg-red-50' : 'border-slate-300')} />
              {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="your@email.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={"w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent " + (errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Password</label>
              <input id="password" type="password" placeholder="••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={"w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent " + (errors.password ? 'border-red-400 bg-red-50' : 'border-slate-300')} />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors mt-1">
              {loading ? 'Creating account...' : 'Sign up'}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
