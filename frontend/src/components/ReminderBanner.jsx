export default function ReminderBanner({ tasks, onDismiss }) {
  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const todayLocal = new Date();
  todayLocal.setHours(0, 0, 0, 0);

  const tomorrowLocal = new Date(todayLocal);
  tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);

  const in2DaysLocal = new Date(todayLocal);
  in2DaysLocal.setDate(in2DaysLocal.getDate() + 2);

  // Overdue = due date strictly before today
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    return parseLocalDate(t.due_date) < todayLocal;
  });

  // Due today = due date exactly equals today
  const dueToday = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    return parseLocalDate(t.due_date).getTime() === todayLocal.getTime();
  });

  // Due soon = due tomorrow or day after (NOT today, NOT overdue)
  const dueSoon = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    const due = parseLocalDate(t.due_date).getTime();
    return due === tomorrowLocal.getTime() || due === in2DaysLocal.getTime();
  });

  if (overdue.length === 0 && dueToday.length === 0 && dueSoon.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {overdue.length > 0 && (
        <div className="flex items-start justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">🚨</span>
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
      {dueToday.length > 0 && (
        <div className="flex items-start justify-between gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">⏰</span>
            <div>
              <p className="text-sm font-semibold text-orange-700">
                {dueToday.length} task{dueToday.length > 1 ? 's' : ''} due today
              </p>
              <p className="text-xs text-orange-600 mt-0.5">{dueToday.map((t) => t.title).join(', ')}</p>
            </div>
          </div>
          <button onClick={onDismiss} className="text-orange-400 hover:text-orange-600 text-xl leading-none">×</button>
        </div>
      )}
      {dueSoon.length > 0 && (
        <div className="flex items-start justify-between gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5">📅</span>
            <div>
              <p className="text-sm font-semibold text-yellow-700">
                {dueSoon.length} task{dueSoon.length > 1 ? 's' : ''} due in the next 2 days
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
