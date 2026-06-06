import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', done:'Done', need_help:'Need Help', need_more_time:'Need More Time' };
const STATUS_STYLE  = {
  todo:          { background: 'rgba(8,8,8,0.06)',  color: '#080808' },
  in_progress:   { background: 'rgba(37,99,235,0.1)', color: '#1d4ed8' },
  done:          { background: 'rgba(22,163,74,0.1)', color: '#15803d' },
  need_help:     { background: 'rgba(220,38,38,0.1)', color: '#dc2626' },
  need_more_time:{ background: 'rgba(234,88,12,0.1)', color: '#c2410c' },
};
const PRIORITY_STYLE = {
  low:    { background: 'rgba(8,8,8,0.05)',  color: '#080808' },
  medium: { background: 'rgba(234,179,8,0.1)', color: '#a16207' },
  high:   { background: 'rgba(220,38,38,0.1)', color: '#dc2626' },
};

const STATUS_OPTS = [
  { value:'in_progress',    label:'In Progress' },
  { value:'done',           label:'Done' },
  { value:'need_help',      label:'Need Help' },
  { value:'need_more_time', label:'More Time' },
  { value:'todo',           label:'To Do' },
];

export default function TaskCard({ task, onEdit, onDelete, onStatusUpdate }) {
  const { user } = useAuth();
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const isAssignee = user && (task.assignees || []).some(a => a.id == user.id);
  const canUpdateStatus = isAssignee;
  const isTeamCreator = task.my_team_role === 'creator';

  const parseLocalDate = d => { const [y,m,dd]=d.split('T')[0].split('-').map(Number); return new Date(y,m-1,dd); };
  const todayLocal = new Date(); todayLocal.setHours(0,0,0,0);
  const isOverdue  = task.due_date && parseLocalDate(task.due_date) < todayLocal && task.status !== 'done';
  const isDueToday = task.due_date && parseLocalDate(task.due_date).getTime() === todayLocal.getTime() && task.status !== 'done';

  const handleStatusChange = async newStatus => {
    setUpdatingStatus(true);
    try { const r = await api.put(`/tasks/${task.id}/status`, { status: newStatus }); onStatusUpdate(r.data); }
    catch(e){ alert(e.response?.data?.error || 'Failed to update status.'); }
    finally { setUpdatingStatus(false); }
  };

  const sBadge = STATUS_STYLE[task.status] || STATUS_STYLE.todo;
  const pBadge = PRIORITY_STYLE[task.priority] || PRIORITY_STYLE.medium;

  return (
    <div style={{ background: '#fff', border: '1px solid rgba(8,8,8,0.08)', borderRadius: 12, padding: '18px', fontFamily: "'Inter', sans-serif", transition: 'border-color .15s' }}
      onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(8,8,8,0.2)'}
      onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(8,8,8,0.08)'}>

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#080808', margin: 0, lineHeight: 1.35, flex: 1 }}>{task.title}</h3>
        {isTeamCreator && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => onEdit(task)} title="Edit"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#080808', opacity: 0.25, display: 'flex', borderRadius: 6 }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={e => e.currentTarget.style.opacity = '0.25'}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button onClick={() => onDelete(task.id)} title="Delete"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#dc2626', opacity: 0.25, display: 'flex', borderRadius: 6 }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={e => e.currentTarget.style.opacity = '0.25'}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p style={{ fontSize: 12, color: '#080808', opacity: 0.5, margin: '0 0 12px', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{task.description}</p>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        <span style={{ ...sBadge, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>{STATUS_LABELS[task.status] || task.status}</span>
        <span style={{ ...pBadge, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>{task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}</span>
        {task.team_name && <span style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>{task.team_name}</span>}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: canUpdateStatus ? 14 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.assignees?.length > 0 ? (
            <>
              <div style={{ display: 'flex' }}>
                {task.assignees.slice(0,3).map(a => (
                  <div key={a.id} title={a.username} style={{ width: 20, height: 20, borderRadius: '50%', background: '#080808', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5F3EE', fontSize: 9, fontWeight: 700, marginLeft: -4 }}
                    className="first:ml-0">{a.username[0].toUpperCase()}</div>
                ))}
              </div>
              <span style={{ color: '#080808', opacity: 0.5 }}>{task.assignees.length === 1 ? task.assignees[0].username : `${task.assignees.length} assignees`}</span>
            </>
          ) : <span style={{ color: '#080808', opacity: 0.3 }}>Unassigned</span>}
        </div>
        {task.due_date && (
          <span style={{ color: isOverdue ? '#dc2626' : isDueToday ? '#c2410c' : '#080808', opacity: isOverdue || isDueToday ? 1 : 0.4, fontWeight: isOverdue || isDueToday ? 600 : 400 }}>
            {isOverdue ? '⚠ Overdue' : isDueToday ? '⏰ Today' : parseLocalDate(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Status buttons */}
      {canUpdateStatus && (
        <div style={{ borderTop: '1px solid rgba(8,8,8,0.07)', paddingTop: 12 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#080808', opacity: 0.35, margin: '0 0 8px' }}>Update status</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {STATUS_OPTS.map(opt => (
              <button key={opt.value}
                disabled={updatingStatus || task.status === opt.value}
                onClick={() => handleStatusChange(opt.value)}
                style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 100, border: `1.5px solid ${task.status === opt.value ? 'rgba(8,8,8,0.3)' : 'rgba(8,8,8,0.12)'}`, background: task.status === opt.value ? 'rgba(8,8,8,0.07)' : 'transparent', color: '#080808', cursor: task.status === opt.value ? 'default' : 'pointer', opacity: task.status === opt.value || updatingStatus ? 0.5 : 1, fontFamily: 'inherit', transition: 'all .15s' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
