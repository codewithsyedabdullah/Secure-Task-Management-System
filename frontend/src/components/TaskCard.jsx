import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_LABELS = {
  todo: 'To Do', in_progress: 'In Progress', done: 'Done',
  need_help: 'Need Help', need_more_time: 'Need More Time',
};
const STATUS_BADGE = {
  todo: 'bg-[#21262d] text-[#8b949e]',
  in_progress: 'bg-blue-900/50 text-blue-300',
  done: 'bg-green-900/50 text-green-300',
  need_help: 'bg-red-900/50 text-red-300',
  need_more_time: 'bg-orange-900/50 text-orange-300',
};
const PRIORITY_BADGE = {
  low: 'bg-[#21262d] text-[#8b949e]',
  medium: 'bg-yellow-900/50 text-yellow-300',
  high: 'bg-red-900/50 text-red-300',
};

export default function TaskCard({ task, onEdit, onDelete, onStatusUpdate }) {
  const { user } = useAuth();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isTeamCreator = task.my_team_role === 'creator';
  const isAssignee = user && (task.assignees || []).some(a => a.id === user.id);

  const parseLocalDate = dateStr => {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const todayLocal = new Date(); todayLocal.setHours(0, 0, 0, 0);
  const isOverdue = task.due_date && parseLocalDate(task.due_date) < todayLocal && task.status !== 'done';
  const isDueToday = task.due_date && parseLocalDate(task.due_date).getTime() === todayLocal.getTime() && task.status !== 'done';

  const handleStatusChange = async newStatus => {
    setUpdatingStatus(true);
    try {
      const res = await api.put(`/tasks/${task.id}/status`, { status: newStatus });
      onStatusUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    } finally { setUpdatingStatus(false); }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 hover:border-[#484f58] transition-all hover:shadow-lg hover:shadow-black/20">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-white leading-snug flex-1 text-sm">{task.title}</h3>
        {isTeamCreator && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onEdit(task)} title="Edit"
              className="text-[#484f58] hover:text-blue-400 p-1 rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(task.id)} title="Delete"
              className="text-[#484f58] hover:text-red-400 p-1 rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-xs text-[#8b949e] mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[task.status] || STATUS_BADGE.todo}`}>
          {STATUS_LABELS[task.status] || task.status}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium}`}>
          {task.priority}
        </span>
        {task.team_name && (
          <span className="bg-purple-900/50 text-purple-300 text-xs font-medium px-2 py-0.5 rounded-full">
            {task.team_name}
          </span>
        )}
      </div>

      {/* Assignees row */}
      <div className="flex items-center justify-between text-xs text-[#8b949e] mb-3">
        <div className="flex items-center gap-1.5">
          {task.assignees && task.assignees.length > 0 ? (
            <>
              <div className="flex -space-x-1.5">
                {task.assignees.slice(0, 3).map(a => (
                  <div key={a.id} title={a.username}
                    className="w-5 h-5 rounded-full bg-blue-600 border border-[#161b22] flex items-center justify-center text-white font-semibold"
                    style={{ fontSize: '9px' }}>
                    {a.username[0].toUpperCase()}
                  </div>
                ))}
                {task.assignees.length > 3 && (
                  <div className="w-5 h-5 rounded-full bg-[#21262d] border border-[#161b22] flex items-center justify-center text-[#8b949e]"
                    style={{ fontSize: '9px' }}>
                    +{task.assignees.length - 3}
                  </div>
                )}
              </div>
              <span>{task.assignees.length === 1 ? task.assignees[0].username : `${task.assignees.length} assignees`}</span>
            </>
          ) : (
            <span className="text-[#484f58]">Unassigned</span>
          )}
        </div>
        {task.due_date && (
          <span className={isOverdue ? 'text-red-400 font-medium' : isDueToday ? 'text-orange-400 font-medium' : 'text-[#8b949e]'}>
            {isOverdue ? '⚠ Overdue' : isDueToday ? '⏰ Today' : '📅 ' + parseLocalDate(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Assignee status actions */}
      {isAssignee && !isTeamCreator && (
        <div className="border-t border-[#21262d] pt-3">
          <p className="text-xs text-[#484f58] mb-2 font-medium">Update status:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: 'in_progress', label: '▶ In Progress', cls: 'bg-blue-900/40 text-blue-300 hover:bg-blue-900/60' },
              { value: 'done',        label: '✓ Done',        cls: 'bg-green-900/40 text-green-300 hover:bg-green-900/60' },
              { value: 'need_help',   label: '🙋 Need Help',  cls: 'bg-red-900/40 text-red-300 hover:bg-red-900/60' },
              { value: 'need_more_time', label: '⏳ More Time', cls: 'bg-orange-900/40 text-orange-300 hover:bg-orange-900/60' },
            ].map(opt => (
              <button key={opt.value}
                disabled={updatingStatus || task.status === opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${opt.cls}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isTeamCreator && (task.status === 'need_help' || task.status === 'need_more_time') && (
        <div className={`border-t pt-2 mt-1 text-xs font-medium ${task.status === 'need_help' ? 'text-red-400 border-red-900/40' : 'text-orange-400 border-orange-900/40'}`}>
          {task.status === 'need_help' ? '🙋 Assignee needs help' : '⏳ Assignee needs more time'}
        </div>
      )}
    </div>
  );
}
