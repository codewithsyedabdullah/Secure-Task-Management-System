import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const s = {
  label:   { display:'block', fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:6 },
  input:   { width:'100%', background:'var(--input-bg)', border:'1.5px solid var(--border)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'var(--text)', outline:'none', fontFamily:'inherit', boxSizing:'border-box', transition:'border-color .15s' },
  btnPri:  { background:'var(--accent)', color:'var(--accent-fg)', border:'none', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap', transition:'opacity .15s' },
  btnSec:  { background:'transparent', color:'var(--text)', border:'1.5px solid var(--border)', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' },
  btnDng:  { background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:'9px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' },
};

export default function TeamDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    api.get('/teams/' + id).then(r => setTeam(r.data)).catch(() => setTeam(null)).finally(() => setLoading(false));
  }, [id]);

  const handleAddMember = async e => {
    e.preventDefault(); setAddError(''); setAddSuccess(''); setAddLoading(true);
    try {
      const res = await api.post('/teams/' + id + '/members', { email: memberEmail });
      setTeam(p => ({ ...p, members: [...p.members, res.data.user] }));
      setAddSuccess(res.data.message); setMemberEmail('');
    } catch (err) { setAddError(err.response?.data?.error || 'Failed to add member.'); }
    finally { setAddLoading(false); }
  };

  const handleInvite = async e => {
    e.preventDefault(); setInviteMsg(''); setInviteLoading(true);
    await new Promise(r => setTimeout(r, 700));
    console.log('[INVITE STUB] Invite sent to:', inviteEmail, 'for team:', team?.name);
    setInviteMsg('Invite sent to ' + inviteEmail + ' (stubbed — no SMTP configured)');
    setInviteEmail('');
    setInviteLoading(false);
  };

  const handleRemoveMember = async (uid, username) => {
    if (!confirm('Remove ' + username + ' from the team?')) return;
    try {
      await api.delete('/teams/' + id + '/members/' + uid);
      setTeam(p => ({ ...p, members: p.members.filter(m => m.id !== uid) }));
    } catch (err) { alert(err.response?.data?.error || 'Failed to remove.'); }
  };

  const handleDeleteTeam = async () => {
    if (!confirm('Delete this team and all its tasks? This cannot be undone.')) return;
    setDeleteLoading(true);
    try { await api.delete('/teams/' + id); navigate('/dashboard'); }
    catch (err) { alert(err.response?.data?.error || 'Failed to delete.'); setDeleteLoading(false); }
  };

  const startEdit = () => { setEditName(team.name); setEditDesc(team.description || ''); setEditError(''); setEditing(true); };
  const handleEditTeam = async e => {
    e.preventDefault(); setEditError(''); setEditLoading(true);
    try {
      const res = await api.put('/teams/' + id, { name: editName, description: editDesc });
      setTeam(p => ({ ...p, name: res.data.name, description: res.data.description }));
      setEditing(false);
    } catch (err) { setEditError(err.response?.data?.error || 'Failed to update.'); }
    finally { setEditLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid var(--text)', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (!team) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter',sans-serif" }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'var(--text)', marginBottom:16 }}>Team not found or access denied.</p>
        <Link to="/dashboard" style={{ color:'var(--text)', fontWeight:600 }}>← Back to Dashboard</Link>
      </div>
    </div>
  );

  const isCreator = team.my_role === 'creator';
  const teamColor = team.color || '#6366f1';

  const cardBase = { background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:12, padding:24 };

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', fontFamily:"'Inter',sans-serif", color:'var(--text)' }}>
      <header style={{ background:'var(--topbar)', borderBottom:'1px solid var(--border)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Link to="/dashboard" style={{ color:'var(--text)', textDecoration:'none', fontSize:13, display:'flex', alignItems:'center', gap:6, opacity:0.6 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Dashboard
          </Link>
          <span style={{ color:'var(--text2)' }}>/</span>
          {/* Color dot + team name in breadcrumb */}
          <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600, color:'var(--text)' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:teamColor, display:'inline-block' }} />
            {team.name}
          </span>
        </div>
        <span style={{ fontFamily:"'Anton',sans-serif", fontSize:18, color:'var(--text)', letterSpacing:'0.5px' }}>TASK MANAGER</span>
      </header>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'clamp(16px,4vw,32px) clamp(12px,4vw,24px)', boxSizing:'border-box' }}>

        {/* Team header card */}
        <div style={{ ...cardBase, marginBottom:16, borderTop:`4px solid ${teamColor}`, position:'relative', overflow:'hidden' }}>
          {editing ? (
            <form onSubmit={handleEditTeam} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={s.label}>Team Name</label>
                <input value={editName} onChange={e=>setEditName(e.target.value)} required style={s.input}
                  onFocus={e=>e.target.style.borderColor='var(--text)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
              </div>
              <div>
                <label style={s.label}>Description</label>
                <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} rows={2} style={{...s.input,resize:'none'}}
                  onFocus={e=>e.target.style.borderColor='var(--text)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
              </div>
              {editError && <p style={{ color:'#ef4444', fontSize:13 }}>{editError}</p>}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button type="button" onClick={()=>setEditing(false)} style={s.btnSec}>Cancel</button>
                <button type="submit" disabled={editLoading} style={s.btnPri}>{editLoading?'Saving…':'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
              <div style={{ flex:'1 1 180px', minWidth:0 }}>
                {/* Color avatar + name row */}
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:teamColor, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16, fontWeight:700, flexShrink:0 }}>
                    {team.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h1 style={{ fontSize:'clamp(18px,4vw,22px)', fontWeight:700, color:'var(--text)', margin:0, wordBreak:'break-word', lineHeight:1.2 }}>{team.name}</h1>
                    <p style={{ fontSize:12, color:'var(--text)', opacity:0.45, margin:0 }}>Created by <strong style={{ opacity:0.8 }}>{team.creator_name}</strong></p>
                  </div>
                </div>
                {team.description && <p style={{ color:'var(--text)', opacity:0.65, fontSize:14, margin:'8px 0 0' }}>{team.description}</p>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background: isCreator ? teamColor + '22' : 'var(--hover)', color: isCreator ? teamColor : 'var(--text)', border:`1px solid ${isCreator ? teamColor + '44' : 'var(--border)'}` }}>
                  {isCreator ? 'Creator' : 'Member'}
                </span>
                {isCreator && <>
                  <button onClick={startEdit} style={{...s.btnSec, padding:'6px 14px', fontSize:13}}>✏️ Edit</button>
                  <button onClick={handleDeleteTeam} disabled={deleteLoading} style={{...s.btnDng, padding:'6px 14px', fontSize:13}}>
                    {deleteLoading ? '…' : 'Delete'}
                  </button>
                </>}
              </div>
            </div>
          )}
        </div>

        {/* Members */}
        <div style={{ ...cardBase, marginBottom:16 }}>
          <h2 style={{ fontSize:17, fontWeight:700, color:'var(--text)', margin:'0 0 16px' }}>Members ({team.members?.length || 0})</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {team.members?.map(m => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, background:'var(--hover)', border:'1px solid var(--border)', flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background: m.role === 'creator' ? teamColor : 'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {m.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:'var(--text)', margin:0 }}>{m.username}</p>
                    <p style={{ fontSize:13, color:'var(--text)', opacity:0.5, margin:0 }}>{m.email}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:20, background: m.role==='creator' ? teamColor + '22' : 'var(--hover)', color: m.role==='creator' ? teamColor : 'var(--text)', border:`1px solid ${m.role==='creator' ? teamColor + '44' : 'var(--border)'}` }}>
                    {m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                  </span>
                  {isCreator && m.id !== user.id && (
                    <button onClick={() => handleRemoveMember(m.id, m.username)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:13, fontWeight:600, padding:'2px 6px' }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add existing member */}
        {isCreator && (
          <div style={{ ...cardBase, marginBottom:16 }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>Add Existing Member</h2>
            <p style={{ fontSize:13, color:'var(--text)', opacity:0.55, margin:'0 0 14px' }}>Enter the email address of a registered user.</p>
            <form onSubmit={handleAddMember} style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <input value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} type="email"
                placeholder="member@email.com" required style={{...s.input, flex:'1 1 160px', minWidth:0}}
                onFocus={e=>e.target.style.borderColor='var(--text)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
              <button type="submit" disabled={addLoading} style={{...s.btnPri, opacity:addLoading?0.6:1}}>
                {addLoading ? '…' : 'Add Member'}
              </button>
            </form>
            {addError   && <p style={{ color:'#ef4444', fontSize:13, marginTop:8 }}>{addError}</p>}
            {addSuccess && <p style={{ color:'#22c55e', fontSize:13, marginTop:8 }}>{addSuccess}</p>}
          </div>
        )}

        {/* Invite unregistered user */}
        {isCreator && (
          <div style={{ ...cardBase, border:'2px dashed var(--border)' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'var(--text)', margin:'0 0 4px' }}>✉️ Invite Unregistered User by Email</h2>
            <p style={{ fontSize:13, color:'var(--text)', opacity:0.55, margin:'0 0 16px' }}>
              Send an invitation to someone who hasn't signed up yet. (Stubbed — no SMTP configured.)
            </p>
            <form onSubmit={handleInvite} style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} type="email"
                placeholder="invite@email.com" required style={{...s.input, flex:'1 1 160px', minWidth:0}}
                onFocus={e=>e.target.style.borderColor='var(--text)'} onBlur={e=>e.target.style.borderColor='var(--border)'} />
              <button type="submit" disabled={inviteLoading} style={{...s.btnPri, opacity:inviteLoading?0.6:1}}>
                {inviteLoading ? 'Sending…' : '✉️ Send Invite'}
              </button>
            </form>
            {inviteMsg && <p style={{ color:'#3b82f6', fontSize:13, marginTop:8 }}>✉️ {inviteMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
