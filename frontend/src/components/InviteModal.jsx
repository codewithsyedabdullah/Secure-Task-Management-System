import { useState } from 'react';
import api from '../api';

export default function InviteModal({ teamId, teamName, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await api.post(`/teams/${teamId}/invite`, { email });
      setSuccess(res.data.message);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#161b22', border:'1px solid #30363d', borderRadius:12, width:'100%', maxWidth:440, fontFamily:'DM Sans,system-ui,sans-serif', color:'#c9d1d9' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid #21262d' }}>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:'#fff', margin:0 }}>Invite via Email</h2>
            <p style={{ fontSize:12, color:'#8b949e', margin:'2px 0 0' }}>{teamName}</p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#8b949e', padding:4, display:'flex' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'rgba(37,99,235,0.1)', border:'1px solid rgba(37,99,235,0.3)', borderRadius:8, padding:'10px 14px', fontSize:12, color:'#58a6ff', display:'flex', gap:8 }}>
            <span>ℹ️</span>
            <span>Invite emails are stubbed — no real email is sent. If the person already has an account, use the <strong>Add member</strong> field above instead.</span>
          </div>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#c9d1d9', marginBottom:6 }}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@example.com"
                required
                style={{ width:'100%', background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#e6edf3', outline:'none', fontFamily:'inherit', boxSizing:'border-box' }}
              />
            </div>

            {error && (
              <div style={{ background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#f85149' }}>{error}</div>
            )}
            {success && (
              <div style={{ background:'rgba(63,185,80,0.1)', border:'1px solid rgba(63,185,80,0.3)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#3fb950' }}>✅ {success}</div>
            )}

            <div style={{ display:'flex', gap:10, paddingTop:4 }}>
              <button type="button" onClick={onClose}
                style={{ flex:1, background:'transparent', color:'#c9d1d9', border:'1px solid #30363d', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                style={{ flex:1, background:'#2563eb', color:'#fff', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sending…' : '✉️ Send Invite'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
