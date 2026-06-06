import { useState } from 'react';

export default function ReminderBanner({ tasks }) {
  const [dismissed, setDismissed] = useState({ overdue: false, today: false, soon: false });

  const parse = d => { const [y,m,dd]=d.split('T')[0].split('-').map(Number); return new Date(y,m-1,dd); };
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
  const in2 = new Date(today); in2.setDate(today.getDate()+2);

  const overdue  = tasks.filter(t => t.due_date && t.status!=='done' && parse(t.due_date)<today);
  const dueToday = tasks.filter(t => t.due_date && t.status!=='done' && parse(t.due_date).getTime()===today.getTime());
  const dueSoon  = tasks.filter(t => {
    if (!t.due_date || t.status==='done') return false;
    const d = parse(t.due_date).getTime();
    return d===tomorrow.getTime() || d===in2.getTime();
  });

  if (!overdue.length && !dueToday.length && !dueSoon.length) return null;

  const bands = [
    { key:'overdue', emoji:'🚨', label:'overdue task',      items:overdue,   light:'#fef2f2', dark:'rgba(127,29,29,0.3)', borderLight:'#fca5a5', borderDark:'rgba(248,113,113,0.3)', textLight:'#991b1b', textDark:'#fca5a5' },
    { key:'today',   emoji:'⏰', label:'task due today',    items:dueToday,  light:'#fff7ed', dark:'rgba(120,53,15,0.3)',  borderLight:'#fdba74', borderDark:'rgba(251,146,60,0.3)',  textLight:'#9a3412', textDark:'#fdba74' },
    { key:'soon',    emoji:'📅', label:'task due in 2 days',items:dueSoon,   light:'#fefce8', dark:'rgba(113,63,18,0.25)', borderLight:'#fde047', borderDark:'rgba(234,179,8,0.3)',   textLight:'#854d0e', textDark:'#fde047' },
  ];

  return (
    <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {bands.map(b => {
        if (!b.items.length || dismissed[b.key]) return null;
        return (
          <div key={b.key} style={{
            display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12,
            borderRadius:12, padding:'12px 16px',
            background:'var(--reminder-bg-'+b.key+')',
            border:'1px solid var(--reminder-border-'+b.key+')',
          }}>
            <style>{`
              [data-theme="light"] { --reminder-bg-${b.key}: ${b.light}; --reminder-border-${b.key}: ${b.borderLight}; --reminder-text-${b.key}: ${b.textLight}; }
              [data-theme="dark"]  { --reminder-bg-${b.key}: ${b.dark};  --reminder-border-${b.key}: ${b.borderDark};  --reminder-text-${b.key}: ${b.textDark}; }
            `}</style>
            <div style={{ display:'flex', alignItems:'flex-start', gap:10, minWidth:0 }}>
              <span style={{ flexShrink:0, marginTop:1 }}>{b.emoji}</span>
              <div style={{ minWidth:0 }}>
                <p style={{ margin:0, fontWeight:600, fontSize:14, color:'var(--reminder-text-'+b.key+')' }}>
                  {b.items.length} {b.label}{b.items.length>1?'s':''}
                </p>
                <p style={{ margin:'2px 0 0', fontSize:12, color:'var(--reminder-text-'+b.key+')', opacity:0.75, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {b.items.map(t=>t.title).join(', ')}
                </p>
              </div>
            </div>
            <button onClick={() => setDismissed(p=>({...p,[b.key]:true}))}
              style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, lineHeight:1, flexShrink:0, color:'var(--reminder-text-'+b.key+')', opacity:0.6, padding:0 }}>×</button>
          </div>
        );
      })}
    </div>
  );
}
