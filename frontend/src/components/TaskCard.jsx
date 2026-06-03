import { useAuth } from '../context/AuthContext';

export default function TaskCard({ task, onEdit, onDelete }) {
  const { user } = useAuth();

  // Only task creator or team creator can edit/delete
  const canModify = user && (task.created_by === user.id || task.my_team_role === 'creator');

  // Parse date as local to avoid UTC timezone shift
  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);
  const isOverdue = task.due_date && parseLocalDate(task.due_date) < todayLocal && task.status !== 'done';

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-slate-800 leading-snug flex-1">{task.title}</h3>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-brand-600 p-1 rounded" title="Edit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          {canModify && (
            <button onClick={() => onDelete(task.id)} className="text-slate-400 hover:text-red-600 p-1 rounded" title="Delete">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={"badge-" + task.status}>
          {task.status === 'todo' ? 'To Do' : task.status === 'in_progress' ? 'In Progress' : 'Done'}
        </span>
        <span className={"badge-" + task.priority}>{task.priority}</span>
        {task.team_name && (
          <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">{task.team_name}</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{task.assignee_name ? '👤 ' + task.assignee_name : 'Unassigned'}</span>
        {task.due_date && (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            {isOverdue ? '⚠ ' : '📅 '}
            {parseLocalDate(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
