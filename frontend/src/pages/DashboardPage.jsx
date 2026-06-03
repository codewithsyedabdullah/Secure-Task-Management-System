import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import TeamModal from '../components/TeamModal';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [dismissedReminders, setDismissedReminders] = useState(false);

  const [filterTeam, setFilterTeam] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [search, setSearch] = useState('');

  const fetchTeams = async () => {
    try {
      const res = await api.get('/teams');
      setTeams(res.data);
      const memberMap = {};
      await Promise.all(
        res.data.map(async (team) => {
          try {
            const tr = await api.get('/teams/' + team.id);
            tr.data.members.forEach((m) => { memberMap[m.id] = m; });
          } catch {}
        })
      );
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

  useEffect(() => {
    fetchTeams().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete('/tasks/' + id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete task.');
    }
  };

  const handleSaveTask = (savedTask) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === savedTask.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = savedTask; return next; }
      return [savedTask, ...prev];
    });
  };

  const handleSaveTeam = (team) => {
    setTeams((prev) => [team, ...prev]);
  };

  const clearFilters = () => {
    setFilterTeam(''); setFilterStatus(''); setFilterAssignee(''); setSearch('');
  };

  // Parse YYYY-MM-DD as local date (not UTC) to avoid timezone shift
  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    return parseLocalDate(t.due_date) < todayLocal;
  });

  const dueSoonTasks = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    const due = parseLocalDate(t.due_date);
    const diff = (due - todayLocal) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 2;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Due Date Reminders */}
        {!dismissedReminders && (overdueTasks.length > 0 || dueSoonTasks.length > 0) && (
          <div className="mb-6 space-y-2">
            {overdueTasks.length > 0 && (
              <div className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-red-700">
                      {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">
                      {overdueTasks.map((t) => t.title).join(', ')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setDismissedReminders(true)} className="text-red-400 hover:text-red-600 text-xl leading-none">×</button>
              </div>
            )}
            {dueSoonTasks.length > 0 && (
              <div className="flex items-start justify-between gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">📅</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-700">
                      {dueSoonTasks.length} task{dueSoonTasks.length > 1 ? 's' : ''} due within 2 days
                    </p>
                    <p className="text-xs text-yellow-600 mt-0.5">
                      {dueSoonTasks.map((t) => t.title).join(', ')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setDismissedReminders(true)} className="text-yellow-400 hover:text-yellow-600 text-xl leading-none">×</button>
              </div>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Teams', value: teams.length, color: 'bg-purple-50 text-purple-700' },
            { label: 'Total Tasks', value: tasks.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Done', value: tasks.filter(t => t.status === 'done').length, color: 'bg-green-50 text-green-700' },
          ].map((s) => (
            <div key={s.label} className={"card p-4 " + s.color}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm font-medium opacity-80">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-800">Teams</h2>
                <button onClick={() => setShowTeamModal(true)}
                  className="text-brand-600 hover:text-brand-700 text-sm font-medium">+ New</button>
              </div>
              {teams.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No teams yet</p>
              ) : (
                <ul className="space-y-1">
                  <li>
                    <button onClick={() => setFilterTeam('')}
                      className={"w-full text-left px-3 py-2 rounded-lg text-sm transition-colors " + (!filterTeam ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-slate-50 text-slate-600')}>
                      All Teams
                    </button>
                  </li>
                  {teams.map((team) => (
                    <li key={team.id}>
                      <div className={"flex items-center rounded-lg text-sm transition-colors " + (filterTeam === team.id.toString() ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-slate-50 text-slate-600')}>
                        <button onClick={() => setFilterTeam(team.id.toString())} className="flex-1 text-left px-3 py-2">
                          <span className="flex items-center justify-between">
                            <span className="truncate">{team.name}</span>
                            <span className="text-xs text-slate-400 ml-1">{team.member_count}</span>
                          </span>
                        </button>
                        <Link to={"/teams/" + team.id} title="Manage team"
                          className="pr-2 text-slate-300 hover:text-brand-500">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Main Tasks */}
          <main className="flex-1 min-w-0">
            <div className="card p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  className="input flex-1" placeholder="🔍 Search tasks..." />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input sm:w-36">
                  <option value="">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="input sm:w-40">
                  <option value="">All Assignees</option>
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.username}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  {(filterTeam || filterStatus || filterAssignee || search) && (
                    <button onClick={clearFilters} className="btn-secondary text-sm whitespace-nowrap">Clear</button>
                  )}
                  <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }}
                    disabled={teams.length === 0}
                    title={teams.length === 0 ? 'Create a team first' : ''}
                    className="btn-primary text-sm whitespace-nowrap">
                    + New Task
                  </button>
                </div>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="card p-12 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-slate-500 font-medium">No tasks found</p>
                <p className="text-sm text-slate-400 mt-1">
                  {teams.length === 0 ? 'Create a team first, then add tasks.' : 'Create your first task to get started.'}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task}
                    onEdit={(t) => { setEditingTask(t); setShowTaskModal(true); }}
                    onDelete={handleDeleteTask} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          teams={teams}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); }}
          onSave={handleSaveTask} />
      )}
      {showTeamModal && (
        <TeamModal onClose={() => setShowTeamModal(false)} onSave={handleSaveTeam} />
      )}
    </div>
  );
}
