import { useState, useEffect } from 'react';
import api from '../api';

export default function ReminderBanner() {
  const [reminders, setReminders] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get('/tasks/reminders')
      .then((res) => setReminders(res.data))
      .catch(() => {});
  }, []);

  if (dismissed || reminders.length === 0) return null;

  const overdue = reminders.filter((t) => new Date(t.due_date) < new Date(new Date().toDateString()));
  const dueToday = reminders.filter((t) => {
    const d = new Date(t.due_date).toDateString();
    return d === new Date().toDateString();
  });

  return (
    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="text-xl">🔔</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">
              {overdue.length > 0 && dueToday.length > 0
                ? `${overdue.length} overdue + ${dueToday.length} due today`
                : overdue.length > 0
                ? `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`
                : `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today`}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {reminders.slice(0, 5).map((t) => {
                const isOverdue = new Date(t.due_date) < new Date(new Date().toDateString());
                return (
                  <li key={t.id} className="text-xs text-amber-700 flex items-center gap-1.5">
                    <span>{isOverdue ? '⚠️' : '📅'}</span>
                    <span className="font-medium">{t.title}</span>
                    <span className="text-amber-500">— {t.team_name}</span>
                    <span className={`ml-auto font-medium ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>
                      {isOverdue ? 'Overdue' : 'Today'}
                    </span>
                  </li>
                );
              })}
              {reminders.length > 5 && (
                <li className="text-xs text-amber-500">+{reminders.length - 5} more...</li>
              )}
            </ul>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 shrink-0 mt-0.5"
          title="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
