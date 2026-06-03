import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  need_help: 'Need Help',
  need_more_time: 'Need More Time',
};

const STATUS_BADGE = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  need_help: 'bg-red-100 text-red-700',
  need_more_time: 'bg-orange-100 text-orange-700',
};

const PRIORITY_BADGE = {
  low: 'bg-slate-100 text-slate-500',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

export default function TaskCard({ task, onEdit, onDelete, onStatusUpdate }) {
  const { user } = useAuth();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isTeamCreator = task.my_team_role === 'creator';
  const isAssignee = user && task.assigned_to == user.id;

  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);
  const isOverdue = task.due_date && parseLocalDate(task.due_date) < todayLocal && task.status !== 'done';

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await api.put('/tasks/' + task.id + '/status', { status: newStatus });
      onStatusUpdate(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-slate-800 leading-snug flex-1">{task.title}</h3>
        {isTeamCreator && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-brand-600 p-1 rounded" title="Edit">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(task.id)} className="text-slate-400 hover:text-red-600 p-1 rounded" title="Delete">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + (STATUS_BADGE[task.status] || STATUS_BADGE.todo)}>
          {STATUS_LABELS[task.status] || task.status}
        </span>
        <span className={"text-xs font-medium px-2 py-0.5 rounded-full " + (PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.medium)}>
          {task.priority}
        </span>
        {task.team_name && (
          <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
            {task.team_name}
          </span>
        )}
      </div>

      {/* Assignee & Due date */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <span>{task.assignee_name ? '👤 ' + task.assignee_name : 'Unassigned'}</span>
        {task.due_date && (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            {isOverdue ? '⚠ ' : '📅 '}
            {parseLocalDate(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Assignee status actions */}
      {isAssignee && !isTeamCreator && (
        <div className="border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-400 mb-2 font-medium">Update your status:</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: 'in_progress', label: '▶ In Progress', cls: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { value: 'done',        label: '✓ Done',        cls: 'bg-green-50 text-green-700 hover:bg-green-100' },
              { value: 'need_help',   label: '🙋 Need Help',  cls: 'bg-red-50 text-red-700 hover:bg-red-100' },
              { value: 'need_more_time', label: '⏳ More Time', cls: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
            ].map((opt) => (
              <button
                key={opt.value}
                disabled={updatingStatus || task.status === opt.value}
                onClick={() => handleStatusChange(opt.value)}
                className={"text-xs font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed " + opt.cls}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Team creator sees status pill for need_help/need_more_time as alert */}
      {isTeamCreator && (task.status === 'need_help' || task.status === 'need_more_time') && (
        <div className={"border-t pt-2 mt-1 text-xs font-medium " + (task.status === 'need_help' ? 'text-red-600 border-red-100' : 'text-orange-600 border-orange-100')}>
          {task.status === 'need_help' ? '🙋 Assignee needs help' : '⏳ Assignee needs more time'}
        </div>
      )}
    </div>
  );
}
