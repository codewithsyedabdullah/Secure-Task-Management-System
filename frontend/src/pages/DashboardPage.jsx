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
  const [myTasks, setMyTasks] = useState([]); // tasks where I'm assignee or creator — for reminders
  const [allTasks, setAllTasks] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'teams' | 'tasks'

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
  // All tasks (no filters) for stats
  useEffect(() => {
    api.get('/tasks').then(r => {
      setAllTasks(r.data);
      // Only tasks where current user is an assignee or creator
      setMyTasks(r.data.filter(t =>
        t.created_by === user?.id ||
        (t.assignees || []).some(a => a.id === user?.id)
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
    { label: 'Total Teams',  value: teams.length,                                   sub: 'Active teams',     icon: '👥', color: 'text-blue-400' },
    { label: 'Total Tasks',  value: allTasks.length,                                sub: 'Across all teams', icon: '📋', color: 'text-purple-400' },
    { label: 'In Progress',  value: allTasks.filter(t => t.status==='in_progress').length, sub: 'Currently active', icon: '▶️', color: 'text-yellow-400' },
    { label: 'Completed',    value: allTasks.filter(t => t.status==='done').length, sub: 'Tasks done',        icon: '✅', color: 'text-green-400' },
  ];

  const NAV = [
    { id: 'overview', label: 'Overview', ref: overviewRef, icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>)},
    { id: 'teams', label: 'Teams', ref: teamsRef, icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>)},
    { id: 'tasks', label: 'Tasks', ref: tasksRef, icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>)},
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0d1117' }}>
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0d1117', color: '#c9d1d9' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed md:static inset-y-0 left-0 z-30 w-56 flex flex-col transition-transform duration-200 border-r border-[#21262d] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: '#161b22' }}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[#21262d]">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-semibold text-white text-sm">Task <span className="text-blue-400">Manager</span></span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-wider px-2 mb-2">Main</p>
          {NAV.map(item => (
            <button key={item.id} onClick={() => scrollTo(item.ref, item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === item.id ? 'bg-blue-600/20 text-blue-400 font-medium' : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#c9d1d9]'}`}>
              {item.icon}{item.label}
            </button>
          ))}

          {/* Teams in sidebar */}
          {teams.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-[#484f58] uppercase tracking-wider px-2 mt-4 mb-2">Teams</p>
              {teams.map(team => (
                <div key={team.id} className={`flex items-center rounded-lg transition-colors ${filterTeam === team.id.toString() ? 'bg-blue-600/20 text-blue-400' : 'text-[#8b949e] hover:bg-[#21262d]'}`}>
                  <button onClick={() => { setFilterTeam(team.id.toString()); scrollTo(tasksRef, 'tasks'); }}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left">
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" />
                    <span className="truncate">{team.name}</span>
                    <span className="ml-auto text-xs opacity-40">{team.member_count}</span>
                  </button>
                  <Link to={`/teams/${team.id}`} title="Manage" className="pr-2 opacity-30 hover:opacity-70 transition-opacity">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                </div>
              ))}
            </>
          )}
        </nav>

        {/* User at bottom */}
        <div className="border-t border-[#21262d] px-3 py-3 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-[#c9d1d9] truncate">{user?.username}</p>
            <p className="text-[10px] text-[#484f58] truncate">{user?.email}</p>
          </div>
          <button onClick={async () => { await logout(); window.location.href = '/login'; }}
            title="Logout" className="text-[#484f58] hover:text-[#c9d1d9] shrink-0 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="border-b border-[#21262d] px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: '#161b22' }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-[#8b949e] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5 text-sm text-[#484f58] flex-1 min-w-0">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-[#c9d1d9] font-medium capitalize">{activeSection}</span>
          </div>

          {/* Search */}
          <div className="relative hidden sm:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#484f58]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
              className="pl-8 pr-4 py-1.5 text-sm border border-[#30363d] rounded-lg bg-[#0d1117] text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-44 transition-all" />
          </div>

          <button onClick={() => setShowTeamModal(true)}
            className="flex items-center gap-1.5 text-sm border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] font-medium px-3 py-1.5 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Team</span>
          </button>

          {isCreatorOfAnyTeam && (
            <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
              className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Task</span>
            </button>
          )}
        </header>

        {/* Body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-8">

          {/* Reminders — only tasks where I'm assignee or creator */}
          <ReminderBanner tasks={myTasks} />

          {/* ── Overview section ── */}
          <section ref={overviewRef}>
            <h2 className="text-xs font-semibold text-[#484f58] uppercase tracking-wider mb-4">Overview</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className="rounded-xl border border-[#21262d] p-4 hover:border-[#30363d] transition-all" style={{ background: '#161b22' }}>
                  <p className={`text-2xl mb-1 ${s.color}`}>{s.icon}</p>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-sm font-medium text-[#c9d1d9] mt-0.5">{s.label}</p>
                  <p className="text-xs text-[#484f58] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Teams section ── */}
          <section ref={teamsRef}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-[#484f58] uppercase tracking-wider">Teams</h2>
              <button onClick={() => setShowTeamModal(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">+ New Team</button>
            </div>
            {teams.length === 0 ? (
              <div className="rounded-xl border border-[#21262d] p-8 text-center" style={{ background: '#161b22' }}>
                <p className="text-4xl mb-3">👥</p>
                <p className="text-[#8b949e] font-medium">No teams yet</p>
                <p className="text-xs text-[#484f58] mt-1">Create a team to start collaborating</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teams.map(team => (
                  <Link key={team.id} to={`/teams/${team.id}`}
                    className="rounded-xl border border-[#21262d] p-4 hover:border-[#30363d] transition-all group" style={{ background: '#161b22' }}>
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 font-semibold text-sm mb-3">
                        {team.name[0].toUpperCase()}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${team.my_role === 'creator' ? 'bg-purple-900/40 text-purple-300' : 'bg-[#21262d] text-[#8b949e]'}`}>
                        {team.my_role === 'creator' ? 'Creator' : 'Member'}
                      </span>
                    </div>
                    <p className="font-medium text-[#c9d1d9] text-sm group-hover:text-white transition-colors">{team.name}</p>
                    {team.description && <p className="text-xs text-[#484f58] mt-1 line-clamp-1">{team.description}</p>}
                    <p className="text-xs text-[#484f58] mt-2">{team.member_count || 0} member{team.member_count !== 1 ? 's' : ''}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* ── Tasks section ── */}
          <section ref={tasksRef}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-[#484f58] uppercase tracking-wider">
                Tasks
                <span className="ml-2 normal-case font-normal text-[#484f58]">({tasks.length})</span>
              </h2>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-[#21262d] px-4 py-3 mb-4 flex flex-wrap items-center gap-3" style={{ background: '#161b22' }}>
              <p className="text-xs font-medium text-[#484f58] shrink-0">Filter:</p>

              {/* Mobile search */}
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
                className="sm:hidden flex-1 min-w-0 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm text-[#c9d1d9] placeholder-[#484f58] focus:outline-none focus:border-blue-500" />

              {[
                { value: filterTeam, onChange: v => setFilterTeam(v), options: [['', 'All Teams'], ...teams.map(t => [t.id, t.name])] },
                { value: filterStatus, onChange: v => setFilterStatus(v), options: [['', 'All Status'],['todo','To Do'],['in_progress','In Progress'],['done','Done'],['need_help','Need Help'],['need_more_time','Need More Time']] },
                { value: filterAssignee, onChange: v => setFilterAssignee(v), options: [['', 'All Assignees'], ...allMembers.map(m => [m.id, m.username])] },
              ].map((sel, i) => (
                <select key={i} value={sel.value} onChange={e => sel.onChange(e.target.value)}
                  className="text-sm border border-[#30363d] rounded-lg px-3 py-1.5 bg-[#0d1117] text-[#c9d1d9] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                  {sel.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ))}

              {(filterTeam || filterStatus || filterAssignee || search) && (
                <button onClick={clearFilters} className="text-xs text-[#484f58] hover:text-[#8b949e] underline ml-auto transition-colors">
                  Clear
                </button>
              )}
            </div>

            {/* Grid */}
            {tasks.length === 0 ? (
              <div className="rounded-xl border border-[#21262d] p-12 text-center" style={{ background: '#161b22' }}>
                <p className="text-4xl mb-3">📋</p>
                <p className="text-[#8b949e] font-medium">No tasks found</p>
                <p className="text-xs text-[#484f58] mt-1">
                  {!isCreatorOfAnyTeam ? 'Tasks assigned to you will appear here.' : teams.length === 0 ? 'Create a team first, then add tasks.' : 'Create your first task to get started.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
    </div>
  );
}
