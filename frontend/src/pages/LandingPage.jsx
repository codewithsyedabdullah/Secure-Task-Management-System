import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#F5F3EE', fontFamily: "'Inter', sans-serif", color: '#080808' }}>

      {/* ── Header ── */}
      <header style={{ padding: '20px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(8,8,8,0.08)' }}>
        <span style={{ fontFamily: "'Anton', sans-serif", fontSize: 28, letterSpacing: '0.5px', color: '#080808' }}>TASKMANAGER</span>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 40 }} className="hidden md:flex">
          {['Features', 'Teams', 'Pricing', 'FAQ'].map(l => (
            <a key={l} href="#" style={{ fontSize: 16, color: '#080808', textDecoration: 'none', fontWeight: 500 }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.6'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}>{l}</a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/login" style={{ padding: '10px 24px', fontSize: 15, color: '#080808', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
          <Link to="/register" style={{ padding: '10px 24px', background: '#080808', color: '#F5F3EE', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            onMouseOver={e => e.currentTarget.style.background = '#333'}
            onMouseOut={e => e.currentTarget.style.background = '#080808'}>Get Started</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 48px 64px' }}>

        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start', marginBottom: 80 }} className="hero-grid">
          {/* Left */}
          <div>
            <h1 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(52px, 6vw, 88px)', fontWeight: 400, lineHeight: 0.88, letterSpacing: '-1px', margin: '0 0 28px', color: '#080808' }}>
              MANAGE /<br />TASKS THAT /<br />GET DONE
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: '#080808', opacity: 0.7, maxWidth: 420, margin: '0 0 32px' }}>
              Assign work, track progress, and collaborate with your team — all from one clean dashboard.
            </p>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, paddingLeft: 28, paddingRight: 6, paddingTop: 6, paddingBottom: 6, background: '#080808', color: '#F5F3EE', borderRadius: 100, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              Start for free
              <span style={{ width: 36, height: 36, background: '#F5F3EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" fill="none" stroke="#080808" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>

          {/* Right */}
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 400, lineHeight: 0.95, margin: '0 0 16px', color: '#080808' }}>
              500+<br />TEAMS ACTIVE
            </h2>
            <p style={{ fontSize: 15, color: '#080808', opacity: 0.6, maxWidth: 340, marginLeft: 'auto', lineHeight: 1.7 }}>
              Teams across the globe use Task Manager to coordinate work, hit deadlines, and move faster together.
            </p>
          </div>
        </div>

        {/* Middle grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start', marginBottom: 80, paddingTop: 48, borderTop: '1px solid rgba(8,8,8,0.1)' }} className="hero-grid">
          {/* Left — bio / features */}
          <div>
            <p style={{ fontSize: 14, color: '#080808', opacity: 0.5, lineHeight: 1.8, maxWidth: 380, marginBottom: 24 }}>
              Built for real teams. Create tasks, assign members, set priorities and due dates, track status changes from To Do all the way to Done — and get reminded when deadlines are close.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Tasks', icon: '📋' },
                { label: 'Teams', icon: '👥' },
                { label: 'Reminders', icon: '⏰' },
              ].map(f => (
                <span key={f.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#080808', background: 'rgba(8,8,8,0.06)', borderRadius: 100, padding: '6px 14px' }}>
                  {f.icon} {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Right */}
          <div>
            <h2 style={{ fontFamily: "'Anton', sans-serif", fontSize: 'clamp(32px, 3.5vw, 48px)', fontWeight: 400, lineHeight: 1, margin: '0 0 12px', color: '#080808' }}>
              5+ STATUS<br />TYPES BUILT IN
            </h2>
            <p style={{ fontSize: 14, color: '#080808', opacity: 0.6, lineHeight: 1.75 }}>
              To Do, In Progress, Done, Need Help, Need More Time — assignees update their own status. Creators stay in control.
            </p>
          </div>
        </div>

        {/* Bottom — feature cards */}
        <div style={{ paddingTop: 48, borderTop: '1px solid rgba(8,8,8,0.1)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }} className="feature-grid">
            {[
              { icon: '🗂', label: 'Task Boards' },
              { icon: '👥', label: 'Team Spaces' },
              { icon: '📧', label: 'Email Invite' },
              { icon: '🔔', label: 'Reminders' },
              { icon: '🎯', label: 'Priorities' },
              { icon: '📊', label: 'Overview' },
            ].map(f => (
              <div key={f.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 16px', textAlign: 'center', border: '1px solid rgba(8,8,8,0.08)' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#080808', margin: 0, lineHeight: 1.3 }}>{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .feature-grid { grid-template-columns: repeat(3, 1fr) !important; }
          header { padding: 16px 20px !important; }
          main { padding: 48px 20px 40px !important; }
        }
      `}</style>
    </div>
  );
}
