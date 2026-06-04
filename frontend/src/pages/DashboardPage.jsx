import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import TeamModal from '../components/TeamModal';
import ReminderBanner from '../components/ReminderBanner';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { label: 'Teams', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { label: 'Tasks', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  )},
];

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [dismissedReminders, setDismissedReminders] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [search, setSearch] = useState('');

  const isCreatorOfAnyTeam = teams.some((t) => t.my_role === 'creator');

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
      const memberMap = {};
      await Promise.all(res.data.map(async (team) => {
        try {
          const tr = await api.get('/teams/' + team.id);
          tr.data.members.forEach((m) => { memberMap[m.id] = m; });
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
    api.get('/tasks').then((r) => setAllTasks(r.data)).catch(() => {});
  }, [tasks]);

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete('/tasks/' + id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) { alert(err.response?.data?.error || 'Failed to delete.'); }
  };

  const handleSaveTask = (saved) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const clearFilters = () => { setFilterTeam(''); setFilterStatus(''); setFilterAssignee(''); setSearch(''); };

  // Stats
  const stats = [
    { label: 'Total Teams', value: teams.length, sub: 'Active teams', icon: '👥', color: 'text-blue-600 bg-blue-50' },
    { label: 'Total Tasks', value: allTasks.length, sub: 'Across all teams', icon: '📋', color: 'text-purple-600 bg-purple-50' },
    { label: 'In Progress', value: allTasks.filter(t => t.status === 'in_progress').length, sub: 'Currently active', icon: '▶️', color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Completed', value: allTasks.filter(t => t.status === 'done').length, sub: 'Tasks done', icon: '✅', color: 'text-green-600 bg-green-50' },
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={"fixed md:static inset-y-0 left-0 z-30 w-60 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 " + (sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')}>

        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-slate-100">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="font-semibold text-slate-800">TaskManager</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mb-2">Main</p>
          {NAV_ITEMS.map((item) => (
            <button key={item.label} onClick={() => setActiveNav(item.label)}
              className={"w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors " + (activeNav === item.label ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50')}>
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* Teams list */}
          {teams.length > 0 && (
            <>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider px-3 mt-4 mb-2">Teams</p>
              {teams.map((team) => (
                <div key={team.id} className={"flex items-center rounded-lg transition-colors " + (filterTeam === team.id.toString() ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50')}>
                  <button onClick={() => { setFilterTeam(team.id.toString()); setActiveNav('Tasks'); }}
                    className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left">
                    <span className="w-2 h-2 rounded-full bg-current opacity-60 shrink-0" />
                    <span className="truncate">{team.name}</span>
                    <span className="ml-auto text-xs opacity-50">{team.member_count}</span>
                  </button>
                  <Link to={"/teams/" + team.id} title="Manage" className="pr-2 opacity-30 hover:opacity-70">
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

        {/* User profile at bottom */}
        <div className="border-t border-slate-100 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.username}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button onClick={async () => { await logout(); window.location.href = '/login'; }}
            title="Logout" className="text-slate-400 hover:text-slate-600 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top navbar */}
        <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-slate-500 hover:text-slate-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 flex-1">
            <span>Home</span>
            <span>/</span>
            <span className="text-slate-800 font-medium">{activeNav}</span>
          </div>

          {/* Search */}
          <div className="relative hidden sm:block">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-9 pr-4 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-48 transition-all" />
          </div>

          {/* Actions */}
          <button onClick={() => setShowTeamModal(true)}
            className="flex items-center gap-1.5 text-sm border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium px-3 py-1.5 rounded-lg transition-colors">
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

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">

          {/* Reminders */}
          {!dismissedReminders && (
            <ReminderBanner tasks={allTasks} onDismiss={() => setDismissedReminders(true)} />
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className={"text-xl p-2 rounded-lg " + s.color}>{s.icon}</span>
                </div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm font-medium text-slate-700 mt-0.5">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Filters row */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 mb-6 flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-slate-700 shrink-0">Filter:</p>

            <select value={filterTeam} onChange={(e) => setFilterTeam(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Teams</option>
              {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="need_help">Need Help</option>
              <option value="need_more_time">Need More Time</option>
            </select>

            <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Assignees</option>
              {allMembers.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
            </select>

            {(filterTeam || filterStatus || filterAssignee || search) && (
              <button onClick={clearFilters}
                className="text-sm text-slate-500 hover:text-slate-700 underline ml-auto">
                Clear filters
              </button>
            )}
          </div>

          {/* Tasks section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-800">
              {filterTeam ? teams.find(t => t.id.toString() === filterTeam)?.name + ' Tasks' : 'All Tasks'}
              <span className="ml-2 text-sm font-normal text-slate-400">({tasks.length})</span>
            </h2>
          </div>

          {/* Task grid */}
          {tasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-slate-600 font-medium text-lg">No tasks found</p>
              <p className="text-sm text-slate-400 mt-2">
                {!isCreatorOfAnyTeam
                  ? 'Tasks assigned to you will appear here.'
                  : teams.length === 0
                  ? 'Create a team first, then add tasks.'
                  : 'Create your first task to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task}
                  onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }}
                  onDelete={handleDeleteTask}
                  onStatusUpdate={handleSaveTask} />
              ))}
            </div>
          )}
        </main>
      </div>

      {showTaskModal && (
        <TaskModal task={editingTask} teams={teams.filter(t => t.my_role === 'creator')}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSave={handleSaveTask} />
      )}
      {showTeamModal && (
        <TeamModal onClose={() => setShowTeamModal(false)}
          onSave={(team) => setTeams((prev) => [team, ...prev])} />
      )}
    </div>
  );
}
