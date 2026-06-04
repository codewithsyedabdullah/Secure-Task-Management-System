export default function ReminderBanner({ tasks, onDismiss }) {
  const parseLocalDate = dateStr => {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const todayLocal = new Date(); todayLocal.setHours(0, 0, 0, 0);
  const tomorrowLocal = new Date(todayLocal); tomorrowLocal.setDate(tomorrowLocal.getDate() + 1);
  const in2Days = new Date(todayLocal); in2Days.setDate(in2Days.getDate() + 2);

  const overdue  = tasks.filter(t => t.due_date && t.status !== 'done' && parseLocalDate(t.due_date) < todayLocal);
  const dueToday = tasks.filter(t => t.due_date && t.status !== 'done' && parseLocalDate(t.due_date).getTime() === todayLocal.getTime());
  const dueSoon  = tasks.filter(t => {
    if (!t.due_date || t.status === 'done') return false;
    const d = parseLocalDate(t.due_date).getTime();
    return d === tomorrowLocal.getTime() || d === in2Days.getTime();
  });

  if (!overdue.length && !dueToday.length && !dueSoon.length) return null;

  const Band = ({ emoji, label, items, colorCls, btnCls }) => (
    <div className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 border ${colorCls}`}>
      <div className="flex items-start gap-2 min-w-0">
        <span className="mt-0.5 shrink-0">{emoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{items.length} {label}{items.length > 1 ? 's' : ''}</p>
          <p className="text-xs mt-0.5 truncate opacity-80">{items.map(t => t.title).join(', ')}</p>
        </div>
      </div>
      <button onClick={onDismiss} className={`text-xl leading-none shrink-0 ${btnCls}`}>×</button>
    </div>
  );

  return (
    <div className="mb-6 space-y-2">
      {overdue.length > 0  && <Band emoji="🚨" label="overdue task"         items={overdue}   colorCls="bg-red-900/30 border-red-700/50 text-red-300"    btnCls="text-red-500 hover:text-red-300" />}
      {dueToday.length > 0 && <Band emoji="⏰" label="task due today"       items={dueToday}  colorCls="bg-orange-900/30 border-orange-700/50 text-orange-300" btnCls="text-orange-500 hover:text-orange-300" />}
      {dueSoon.length > 0  && <Band emoji="📅" label="task due in 2 days"   items={dueSoon}   colorCls="bg-yellow-900/20 border-yellow-700/40 text-yellow-300" btnCls="text-yellow-600 hover:text-yellow-300" />}
    </div>
  );
}
