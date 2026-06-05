import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import InviteModal from '../components/InviteModal';

export default function TeamDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
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
    <div style={{ minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, border:'3px solid #2563eb', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );

  if (!team) return (
    <div style={{ minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'DM Sans,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#8b949e', marginBottom:16 }}>Team not found or access denied.</p>
        <Link to="/dashboard" style={{ color:'#58a6ff', textDecoration:'none', fontWeight:600 }}>← Back to Dashboard</Link>
      </div>
    </div>
  );

  const isCreator = team.my_role === 'creator';

  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', fontFamily:'DM Sans,system-ui,sans-serif', color:'#c9d1d9' }}>
      {/* Topbar */}
      <header style={{ background:'#161b22', borderBottom:'1px solid #21262d', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <Link to="/dashboard" style={{ color:'#8b949e', textDecoration:'none', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Dashboard
          </Link>
          <span style={{ color:'#30363d' }}>/</span>
          <span style={{ color:'#c9d1d9', fontSize:13, fontWeight:600 }}>{team.name}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, background:'#2563eb', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="15" height="15" fill="none" stroke="white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <span style={{ fontWeight:700, fontSize:15, color:'#fff' }}>Task <span style={{color:'#58a6ff'}}>Manager</span></span>
        </div>
      </header>

      <div style={{ maxWidth:680, margin:'0 auto', padding:'32px 16px' }}>

        {/* Team header card */}
        <div style={card}>
          {editing ? (
            <form onSubmit={handleEditTeam} style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={labelStyle}>Team Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize:'none' }} />
              </div>
              {editError && <p style={{ color:'#f85149', fontSize:13 }}>{editError}</p>}
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" onClick={() => setEditing(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" disabled={editLoading} style={btnPrimary}>{editLoading ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          ) : (
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <div>
                <h1 style={{ fontSize:22, fontWeight:700, color:'#fff', margin:'0 0 4px' }}>{team.name}</h1>
                {team.description && <p style={{ color:'#8b949e', fontSize:13, margin:'0 0 8px' }}>{team.description}</p>}
                <p style={{ fontSize:12, color:'#484f58', margin:0 }}>Created by {team.creator_name}</p>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <span style={{ fontSize:12, fontWeight:600, padding:'3px 10px', borderRadius:20, background: isCreator ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.06)', color: isCreator ? '#58a6ff' : '#8b949e' }}>
                  {isCreator ? 'Creator' : 'Member'}
                </span>
                {isCreator && <>
                  <button onClick={startEdit} style={{ ...btnSecondary, padding:'5px 12px', fontSize:12 }}>✏️ Edit</button>
                  <button onClick={handleDeleteTeam} disabled={deleteLoading} style={{ ...btnDanger, padding:'5px 12px', fontSize:12 }}>
                    {deleteLoading ? '…' : 'Delete'}
                  </button>
                </>}
              </div>
            </div>
          )}
        </div>

        {/* Members card */}
        <div style={{ ...card, marginTop:16 }}>
          <h2 style={sectionTitle}>Members ({team.members?.length || 0})</h2>

          {isCreator && (
            <>
              <form onSubmit={handleAddMember} style={{ display:'flex', gap:10, marginBottom:10 }}>
                <input value={memberEmail} onChange={e => setMemberEmail(e.target.value)}
                  type="email" placeholder="Add existing member by email" required style={{ ...inputStyle, flex:1 }} />
                <button type="submit" disabled={addLoading} style={btnPrimary}>{addLoading ? '…' : 'Add'}</button>
              </form>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{ ...btnSecondary, fontSize:12, padding:'6px 14px', marginBottom:16, display:'inline-flex', alignItems:'center', gap:6 }}
              >
                ✉️ Invite via Email
              </button>
            </>
          )}
          {addError   && <p style={{ color:'#f85149', fontSize:13, marginBottom:10 }}>{addError}</p>}
          {addSuccess && <p style={{ color:'#3fb950', fontSize:13, marginBottom:10 }}>{addSuccess}</p>}

          <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
            {team.members?.map(m => (
              <div key={m.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid #21262d' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'#2563eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {m.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:'#c9d1d9', margin:0 }}>{m.username}</p>
                    <p style={{ fontSize:12, color:'#484f58', margin:0 }}>{m.email}</p>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:20, background: m.role==='creator' ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.06)', color: m.role==='creator' ? '#58a6ff' : '#8b949e' }}>
                    {m.role}
                  </span>
                  {isCreator && m.id !== user.id && (
                    <button onClick={() => handleRemoveMember(m.id, m.username)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'#f85149', fontSize:12, fontWeight:600, padding:'2px 6px' }}>
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {showInviteModal && (
        <InviteModal
          teamId={id}
          teamName={team.name}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}

const card       = { background:'#161b22', border:'1px solid #30363d', borderRadius:12, padding:'24px' };
const labelStyle = { display:'block', fontSize:13, fontWeight:600, color:'#c9d1d9', marginBottom:6 };
const inputStyle = { width:'100%', background:'#0d1117', border:'1px solid #30363d', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#e6edf3', outline:'none', fontFamily:'inherit', boxSizing:'border-box' };
const btnPrimary   = { background:'#2563eb', color:'#fff', border:'none', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' };
const btnSecondary = { background:'transparent', color:'#c9d1d9', border:'1px solid #30363d', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' };
const btnDanger    = { background:'rgba(248,81,73,0.1)', color:'#f85149', border:'1px solid rgba(248,81,73,0.3)', borderRadius:8, padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' };
const sectionTitle = { fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 16px' };
