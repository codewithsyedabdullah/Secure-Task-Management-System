import { useState } from 'react';
import api from '../api';

export default function TeamModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [memberEmail, setMemberEmail] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [memberMsg, setMemberMsg] = useState({ type: '', text: '' });
  const [inviteMsg, setInviteMsg] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTeam, setCreatedTeam] = useState(null);

  const s = {
    overlay:  { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
    box:      { width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto', background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:16, boxShadow:'0 25px 50px rgba(0,0,0,0.3)' },
    header:   { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 20px 16px', borderBottom:'1px solid var(--border)' },
    title:    { fontSize:16, fontWeight:700, color:'var(--text)', margin:0 },
    body:     { padding:20 },
    label:    { display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 },
    input:    { width:'100%', background:'var(--input-bg)', border:'1.5px solid var(--border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .15s' },
    divider:  { borderTop:'1px solid var(--border)', margin:'20px 0' },
    secTitle: { fontSize:13, fontWeight:700, color:'var(--text)', margin:'0 0 4px' },
    secDesc:  { fontSize:12, color:'var(--text2)', margin:'0 0 10px' },
    row:      { display:'flex', gap:8 },
    btnPri:   { background:'var(--accent)', color:'var(--accent-fg)', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', transition:'opacity .15s' },
    btnSec:   { background:'transparent', color:'var(--text)', border:'1.5px solid var(--border)', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' },
    msgOk:    { fontSize:12, color:'#22c55e', marginTop:6 },
    msgErr:   { fontSize:12, color:'#ef4444', marginTop:6 },
    msgInfo:  { fontSize:12, color:'#3b82f6', marginTop:6 },
  };

  const inp = e => { e.target.style.borderColor = 'var(--text)'; };
  const inpB = e => { e.target.style.borderColor = 'var(--border)'; };

  const handleCreate = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/teams', form);
      setCreatedTeam(res.data);
      onSave(res.data);
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs[0].msg : err.response?.data?.error || 'Failed to create team.');
    } finally { setLoading(false); }
  };

  const handleAddMember = async e => {
    e.preventDefault(); setMemberMsg({ type:'', text:'' }); setMemberLoading(true);
    try {
      await api.post('/teams/' + createdTeam.id + '/members', { email: memberEmail });
      setMemberMsg({ type:'ok', text:'Member added successfully.' });
      setMemberEmail('');
    } catch (err) {
      setMemberMsg({ type:'err', text: err.response?.data?.error || 'Failed to add member.' });
    } finally { setMemberLoading(false); }
  };

  const handleInvite = async e => {
    e.preventDefault(); setInviteMsg(''); setInviteLoading(true);
    await new Promise(r => setTimeout(r, 700));
    console.log('[INVITE STUB] Invite sent to:', inviteEmail, 'for team:', createdTeam?.name || form.name);
    setInviteMsg('Invite sent to ' + inviteEmail + ' (stubbed — no SMTP configured)');
    setInviteEmail('');
    setInviteLoading(false);
  };

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.box}>

        {/* Header */}
        <div style={s.header}>
          <p style={s.title}>{createdTeam ? 'Team Created — Add Members' : 'Create Team'}</p>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)', fontSize:22, lineHeight:1, padding:0 }}>×</button>
        </div>

        <div style={s.body}>

          {/* ── STEP 1: Create team form (hidden after creation) ── */}
          {!createdTeam && (
            <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {error && <p style={s.msgErr}>{error}</p>}
              <div>
                <label style={s.label}>Team Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  required minLength={2} placeholder="e.g. Engineering"
                  style={s.input} onFocus={inp} onBlur={inpB} />
              </div>
              <div>
                <label style={s.label}>Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} placeholder="Optional"
                  style={{ ...s.input, resize:'none' }} onFocus={inp} onBlur={inpB} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="button" onClick={onClose} style={s.btnSec}>Cancel</button>
                <button type="submit" disabled={loading} style={{ ...s.btnPri, flex:1, opacity:loading ? 0.6 : 1 }}>
                  {loading ? 'Creating…' : 'Create & Add Members →'}
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 2: Member sections (shown after creation) ── */}
          {createdTeam && (
            <>
              {/* Success notice */}
              <div style={{ padding:'10px 14px', background:'var(--hover)', borderRadius:8, marginBottom:20, fontSize:13, color:'var(--text)' }}>
                ✅ <strong>{createdTeam.name}</strong> created. Add members below then close.
              </div>

              {/* Add existing registered member */}
              <div>
                <p style={s.secTitle}>Add Existing Member</p>
                <p style={s.secDesc}>Enter the email of a user already registered on the platform.</p>
                <form onSubmit={handleAddMember}>
                  <div style={s.row}>
                    <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)}
                      type="email" placeholder="member@email.com" required
                      style={{ ...s.input, flex:1 }} onFocus={inp} onBlur={inpB} />
                    <button type="submit" disabled={memberLoading}
                      style={{ ...s.btnPri, opacity:memberLoading ? 0.6 : 1 }}>
                      {memberLoading ? '…' : 'Add'}
                    </button>
                  </div>
                  {memberMsg.text && (
                    <p style={memberMsg.type === 'ok' ? s.msgOk : s.msgErr}>{memberMsg.text}</p>
                  )}
                </form>
              </div>

              <div style={s.divider} />

              {/* Invite unregistered user */}
              <div>
                <p style={s.secTitle}>✉️ Invite Unregistered User by Email</p>
                <p style={s.secDesc}>Send an invite to someone who hasn't signed up yet. (Stubbed — no SMTP configured.)</p>
                <form onSubmit={handleInvite}>
                  <div style={s.row}>
                    <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      type="email" placeholder="invite@email.com" required
                      style={{ ...s.input, flex:1 }} onFocus={inp} onBlur={inpB} />
                    <button type="submit" disabled={inviteLoading}
                      style={{ ...s.btnSec, opacity:inviteLoading ? 0.6 : 1 }}>
                      {inviteLoading ? 'Sending…' : '✉️ Invite'}
                    </button>
                  </div>
                  {inviteMsg && <p style={s.msgInfo}>✉️ {inviteMsg}</p>}
                </form>
              </div>

              <div style={{ marginTop:24 }}>
                <button onClick={onClose} style={{ ...s.btnPri, width:'100%', padding:'11px' }}>Done</button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
