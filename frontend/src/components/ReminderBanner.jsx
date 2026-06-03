export default function ReminderBanner({ tasks, onDismiss }) {
  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);

  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    return parseLocalDate(t.due_date) < todayLocal;
  });

  const dueSoon = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    const due = parseLocalDate(t.due_date);
    const diff = (due - todayLocal) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 2;
  });

  if (overdue.length === 0 && dueSoon.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {overdue.length > 0 && (
        <div className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-red-700">
                {overdue.length} overdue task{overdue.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-600 mt-0.5">{overdue.map((t) => t.title).join(', ')}</p>
            </div>
          </div>
          <button onClick={onDismiss} className="text-red-400 hover:text-red-600 text-xl leading-none">×</button>
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="flex items-start justify-between gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">📅</span>
            <div>
              <p className="text-sm font-semibold text-yellow-700">
                {dueSoon.length} task{dueSoon.length > 1 ? 's' : ''} due within 2 days
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">{dueSoon.map((t) => t.title).join(', ')}</p>
            </div>
          </div>
          <button onClick={onDismiss} className="text-yellow-400 hover:text-yellow-600 text-xl leading-none">×</button>
        </div>
      )}
    </div>
  );
}
