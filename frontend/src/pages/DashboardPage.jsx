import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import TeamModal from '../components/TeamModal';
import ReminderBanner from '../components/ReminderBanner';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [search, setSearch] = useState('');

  const overviewRef = useRef(null);
  const teamsRef = useRef(null);
  const tasksRef = useRef(null);

  const isCreatorOfAnyTeam = teams.some(t => t.my_role === 'creator');

  const scrollTo = (ref, section) => {
    setSidebarOpen(false);
    setActiveSection(section);
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
      const memberMap = {};
      await Promise.all(res.data.map(async team => {
        try {
          const tr = await api.get('/teams/' + team.id);
          tr.data.members.forEach(m => { memberMap[m.id] = m; });
        } catch {}
      }));
      setAllMembers(Object.values(memberMap));
    } catch {}
  };

  const fetchTasks = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterTeam) params.set('team_id', filterTeam);
    if (filterStatus) params.set('status', filterStatus);
    if (filterAssignee) params.set('assigned_to', filterAssignee);
    if (search) params.set('search', search);
    try {
      const res = await api.get('/tasks?' + params.toString());
      setTasks(res.data);
    } catch {}
  }, [filterTeam, filterStatus, filterAssignee, search]);

  useEffect(() => { fetchTeams().finally(() => setLoading(false)); }, []);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => {
    api.get('/tasks').then(r => {
      setAllTasks(r.data);
      setMyTasks(r.data.filter(t =>
        t.created_by == user?.id ||
        (t.assignees || []).some(a => a.id == user?.id)
      ));
    }).catch(() => {});
  }, [tasks, user]);

  const handleDeleteTask = async id => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete('/tasks/' + id);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete.'); }
  };

  const handleSaveTask = saved => {
    setTasks(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const clearFilters = () => { setFilterTeam(''); setFilterStatus(''); setFilterAssignee(''); setSearch(''); };

  const stats = [
    { label: 'Total Teams',  value: teams.length,                                        sub: 'Active teams',     icon: '👥' },
    { label: 'Total Tasks',  value: allTasks.length,                                     sub: 'Across all teams', icon: '📋' },
    { label: 'In Progress',  value: allTasks.filter(t => t.status==='in_progress').length, sub: 'Currently active', icon: '▶' },
    { label: 'Completed',    value: allTasks.filter(t => t.status==='done').length,       sub: 'Tasks done',       icon: '✓' },
  ];

  const NAV = [
    { id: 'overview', label: 'Overview', ref: overviewRef },
    { id: 'teams',    label: 'Teams',    ref: teamsRef },
    { id: 'tasks',    label: 'Tasks',    ref: tasksRef },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #080808', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#080808', opacity: 0.4, fontSize: 14 }}>Loading…</p>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', fontFamily: "'Inter', sans-serif", color: '#080808' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(8,8,8,0.4)', zIndex: 20 }}
          className="md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'var(--sidebar)', borderRight: '1px solid var(--border)',
        position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 30,
        transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.2s',
      }} className={`dash-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>

        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(8,8,8,0.08)' }}>
          <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, color: 'var(--text)', letterSpacing: '0.5px' }}>TASK MANAGER</span>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: '#080808', opacity: 0.35, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 8 }}>Main</p>
          {NAV.map(item => (
            <button key={item.id} onClick={() => scrollTo(item.ref, item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: activeSection === item.id ? 600 : 400, background: activeSection === item.id ? 'rgba(8,8,8,0.07)' : 'transparent', color: '#080808', opacity: activeSection === item.id ? 1 : 0.55, textAlign: 'left', transition: 'all 0.15s', marginBottom: 2 }}>
              {item.label}
            </button>
          ))}

          {/* Teams list */}
          {teams.length > 0 && (
            <>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#080808', opacity: 0.35, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', margin: '20px 0 8px' }}>Your Teams</p>
              {teams.map(team => (
                <div key={team.id} style={{ display: 'flex', alignItems: 'center', borderRadius: 8, marginBottom: 2, background: filterTeam === team.id.toString() ? 'rgba(8,8,8,0.07)' : 'transparent' }}>
                  <button onClick={() => { setFilterTeam(team.id.toString()); scrollTo(tasksRef, 'tasks'); }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, color: '#080808', opacity: filterTeam === team.id.toString() ? 1 : 0.55, textAlign: 'left' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#080808', opacity: 0.5, flexShrink: 0 }} />
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</span>
                    <span style={{ fontSize: 11, opacity: 0.4 }}>{team.member_count}</span>
                  </button>
                  <Link to={`/teams/${team.id}`} title="Manage"
                    style={{ padding: '8px 10px', color: '#080808', opacity: 0.25, display: 'flex' }}
                    onMouseOver={e => e.currentTarget.style.opacity = '0.7'}
                    onMouseOut={e => e.currentTarget.style.opacity = '0.25'}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                </div>
              ))}
            </>
          )}
        </nav>

        {/* User */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
            <p style={{ fontSize: 11, opacity: 0.4, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
          </div>
          <button onClick={async () => { await logout(); window.location.href = '/login'; }}
            title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)', opacity: 0.5, flexShrink: 0 }}
            onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={e => e.currentTarget.style.opacity = '0.35'}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: 240 }} className="dash-main">

        {/* Topbar */}
        <header style={{ background: 'var(--topbar)', borderBottom: '1px solid var(--border)', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Mobile hamburger */}
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#080808', display: 'none' }} className="dash-hamburger">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, opacity: 0.4 }}>
            <span>Dashboard</span>
            <span>/</span>
            <span style={{ opacity: 1, fontWeight: 600, textTransform: 'capitalize', color: '#080808' }}>{activeSection}</span>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }} className="dash-search">
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…"
              style={{ paddingLeft: 34, paddingRight: 14, paddingTop: 8, paddingBottom: 8, fontSize: 13, border: '1.5px solid rgba(8,8,8,0.12)', borderRadius: 8, background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', width: 180, transition: 'border-color .15s' }}
              onFocus={e => e.target.style.borderColor = '#080808'}
              onBlur={e => e.target.style.borderColor = 'rgba(8,8,8,0.12)'} />
          </div>

          <button onClick={() => setShowTeamModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', border: '1.5px solid rgba(8,8,8,0.15)', borderRadius: 8, background: 'transparent', color: '#080808', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="dash-btn-text">New Team</span>
          </button>

          {isCreatorOfAnyTeam && (
            <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--accent)', color: 'var(--accent-fg)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="dash-btn-text">New Task</span>
            </button>
          )}
        </header>

        {/* Body */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 28px' }}>
          <ReminderBanner tasks={myTasks} />

          {/* Overview */}
          <section ref={overviewRef} style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.35, marginBottom: 16 }}>Overview</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }} className="stats-grid">
              {stats.map(s => (
                <div key={s.label} style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 20px 16px' }}>
                  <p style={{ fontSize: 22, margin: '0 0 8px', opacity: 0.7 }}>{s.icon}</p>
                  <p style={{ fontFamily: "'Anton', sans-serif", fontSize: 36, fontWeight: 400, margin: '0 0 4px', color: '#080808', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', color: '#080808' }}>{s.label}</p>
                  <p style={{ fontSize: 11, opacity: 0.4, margin: 0 }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Teams */}
          <section ref={teamsRef} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.35, margin: 0 }}>Teams</p>
              <button onClick={() => setShowTeamModal(true)}
                style={{ fontSize: 12, fontWeight: 600, color: '#080808', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontFamily: 'inherit' }}
                onMouseOver={e => e.currentTarget.style.opacity = '1'}
                onMouseOut={e => e.currentTarget.style.opacity = '0.5'}>+ New Team</button>
            </div>
            {teams.length === 0 ? (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, margin: '0 0 12px' }}>👥</p>
                <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No teams yet</p>
                <p style={{ fontSize: 12, opacity: 0.4, margin: 0 }}>Create a team to start collaborating</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="teams-grid">
                {teams.map(team => (
                  <Link key={team.id} to={`/teams/${team.id}`}
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px', textDecoration: 'none', color: 'var(--text)', display: 'block', transition: 'border-color .15s' }}
                    onMouseOver={e => e.currentTarget.style.borderColor = 'var(--text)'}
                    onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-fg)', fontSize: 13, fontWeight: 700 }}>
                        {team.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: team.my_role === 'creator' ? 'rgba(8,8,8,0.07)' : 'rgba(8,8,8,0.04)', color: '#080808', opacity: team.my_role === 'creator' ? 1 : 0.5 }}>
                        {team.my_role === 'creator' ? 'Creator' : 'Member'}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 4px' }}>{team.name}</p>
                    {team.description && <p style={{ fontSize: 12, opacity: 0.4, margin: '0 0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.description}</p>}
                    <p style={{ fontSize: 12, opacity: 0.35, margin: 0 }}>{team.member_count || 0} member{team.member_count !== 1 ? 's' : ''}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Tasks */}
          <section ref={tasksRef}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.35, margin: 0 }}>
                Tasks <span style={{ fontFamily: 'inherit', fontWeight: 400, opacity: 0.5 }}>({tasks.length})</span>
              </p>
            </div>

            {/* Filters */}
            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.4, margin: 0, flexShrink: 0 }}>Filter:</p>
              {[
                { value: filterTeam,     onChange: v => setFilterTeam(v),     options: [['', 'All Teams'],     ...teams.map(t => [t.id, t.name])] },
                { value: filterStatus,   onChange: v => setFilterStatus(v),   options: [['', 'All Status'],    ['todo','To Do'],['in_progress','In Progress'],['done','Done'],['need_help','Need Help'],['need_more_time','Need More Time']] },
                { value: filterAssignee, onChange: v => setFilterAssignee(v), options: [['', 'All Assignees'], ...allMembers.map(m => [m.id, m.username])] },
              ].map((sel, i) => (
                <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
                  style={{ fontSize: 13, border: '1.5px solid rgba(8,8,8,0.12)', borderRadius: 8, padding: '7px 12px', background: 'var(--bg)', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              {(filterTeam || filterStatus || filterAssignee || search) && (
                <button onClick={clearFilters}
                  style={{ fontSize: 12, color: '#080808', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontFamily: 'inherit', textDecoration: 'underline', marginLeft: 'auto' }}>Clear</button>
              )}
            </div>

            {tasks.length === 0 ? (
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '64px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 32, margin: '0 0 12px' }}>📋</p>
                <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No tasks found</p>
                <p style={{ fontSize: 12, opacity: 0.4, margin: 0 }}>
                  {!isCreatorOfAnyTeam ? 'Tasks assigned to you will appear here.' : teams.length === 0 ? 'Create a team first, then add tasks.' : 'Create your first task to get started.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="tasks-grid">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task}
                    onEdit={t => { setEditingTask(t); setShowTaskModal(true); }}
                    onDelete={handleDeleteTask}
                    onStatusUpdate={handleSaveTask} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {showTaskModal && (
        <TaskModal task={editingTask} teams={teams.filter(t => t.my_role === 'creator')}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSave={handleSaveTask} />
      )}
      {showTeamModal && (
        <TeamModal onClose={() => setShowTeamModal(false)}
          onSave={team => setTeams(prev => [team, ...prev])} />
      )}

      <style>{`
        @media (max-width: 900px) {
          .dash-sidebar { transform: translateX(-100%); }
          .dash-sidebar.sidebar-open { transform: translateX(0) !important; }
          .dash-main { margin-left: 0 !important; }
          .dash-hamburger { display: flex !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .teams-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tasks-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .teams-grid { grid-template-columns: 1fr !important; }
          .tasks-grid { grid-template-columns: 1fr !important; }
          .dash-search { display: none !important; }
          .dash-btn-text { display: none !important; }
        }
      `}</style>
    </div>
  );
}
