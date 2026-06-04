import { useState, useEffect } from 'react';
import api from '../api';

export default function TaskModal({ task, teams, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    team_id: task?.team_id || (teams[0]?.id || ''),
    assignees: task?.assignees?.map(a => a.id) || [],
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date ? task.due_date.split('T')[0] : '',
  });
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (form.team_id) {
      api.get(`/teams/${form.team_id}`)
        .then(res => setMembers(res.data.members || []))
        .catch(() => setMembers([]));
    }
  }, [form.team_id]);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleAssignee = id => {
    setForm(prev => ({
      ...prev,
      assignees: prev.assignees.includes(id)
        ? prev.assignees.filter(a => a !== id)
        : [...prev.assignees, id],
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form, assignees: form.assignees.map(Number), due_date: form.due_date || null };
      const res = isEdit ? await api.put(`/tasks/${task.id}`, payload) : await api.post('/tasks', payload);
      onSave(res.data);
      onClose();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs[0].msg : err.response?.data?.error || 'Failed to save task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#30363d] bg-[#161b22] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-900/40 border border-red-700 text-red-300 rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required
              placeholder="Task title"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={3} placeholder="Optional description"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Team *</label>
              <select name="team_id" value={form.team_id} onChange={handleChange} required disabled={isEdit}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all">
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Multi-assignee */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">
              Assignees
              <span className="ml-1.5 text-xs text-[#484f58] font-normal">select one or more</span>
            </label>
            {members.length === 0 ? (
              <p className="text-sm text-[#484f58] italic py-2">No members in this team yet.</p>
            ) : (
              <div className="border border-[#30363d] rounded-lg divide-y divide-[#21262d] max-h-36 overflow-y-auto bg-[#0d1117]">
                {members.map(m => (
                  <label key={m.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[#161b22] cursor-pointer transition-colors">
                    <input type="checkbox" checked={form.assignees.includes(m.id)} onChange={() => toggleAssignee(m.id)}
                      className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] text-blue-500 focus:ring-blue-500 focus:ring-offset-0" />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {m.username[0].toUpperCase()}
                      </div>
                      <span className="text-sm text-[#c9d1d9]">{m.username}</span>
                    </div>
                    {form.assignees.includes(m.id) && (
                      <span className="text-xs text-blue-400 font-medium">✓</span>
                    )}
                  </label>
                ))}
              </div>
            )}
            {form.assignees.length > 0 && (
              <p className="text-xs text-[#8b949e] mt-1.5">{form.assignees.length} member{form.assignees.length > 1 ? 's' : ''} selected</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Due Date</label>
            <input name="due_date" type="date" value={form.due_date} onChange={handleChange}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all [color-scheme:dark]" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] font-medium py-2 rounded-lg text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
              {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
