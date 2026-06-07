import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="lp-root">

      {/* ── Header ── */}
      <header className="lp-header">
        <span className="lp-logo">TASK MANAGER</span>
        <nav className="lp-nav">
          {['Features', 'Teams', 'Pricing', 'FAQ'].map(l => (
            <a key={l} href="#" className="lp-nav-link">{l}</a>
          ))}
        </nav>
        <div className="lp-header-cta">
          <Link to="/login" className="lp-signin">Sign In</Link>
          <Link to="/register" className="lp-getstarted">Get Started</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="lp-main">

        {/* Row 1 */}
        <div className="lp-row lp-row1">
          <div className="lp-hero-left">
            <h1 className="lp-headline">
              MANAGE /<br />TASKS THAT /<br />GET DONE
            </h1>
            <p className="lp-subtext">
              Assign work, track progress, and collaborate with your team — all from one clean dashboard.
            </p>
            <Link to="/register" className="lp-cta-btn">
              Start for free
              <span className="lp-cta-arrow">
                <svg width="16" height="16" fill="none" stroke="#080808" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </Link>
          </div>

          <div className="lp-hero-right">
            <h2 className="lp-stat-heading">500+<br />TEAMS ACTIVE</h2>
            <p className="lp-stat-sub">
              Teams across the globe use Task Manager to coordinate work, hit deadlines, and move faster together.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="lp-divider" />

        {/* Row 2 */}
        <div className="lp-row lp-row2">
          <div className="lp-mid-left">
            <p className="lp-mid-text">
              Built for real teams. Create tasks, assign members, set priorities and due dates, track status changes from To Do all the way to Done — and get reminded when deadlines are close.
            </p>
            <div className="lp-pills">
              {[
                { label: 'Tasks', icon: '📋' },
                { label: 'Teams', icon: '👥' },
                { label: 'Reminders', icon: '⏰' },
              ].map(f => (
                <span key={f.label} className="lp-pill">{f.icon} {f.label}</span>
              ))}
            </div>
          </div>

          <div className="lp-mid-right">
            <h2 className="lp-mid-heading">5+ STATUS<br />TYPES BUILT IN</h2>
            <p className="lp-mid-sub">
              To Do, In Progress, Done, Need Help, Need More Time — assignees update their own status. Creators stay in control.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="lp-divider" />

        {/* Feature Cards */}
        <div className="lp-features">
          {[
            { icon: '🗂', label: 'Task Boards' },
            { icon: '👥', label: 'Team Spaces' },
            { icon: '📧', label: 'Email Invite' },
            { icon: '🔔', label: 'Reminders' },
            { icon: '🎯', label: 'Priorities' },
            { icon: '📊', label: 'Overview' },
          ].map(f => (
            <div key={f.label} className="lp-feature-card">
              <div className="lp-feature-icon">{f.icon}</div>
              <p className="lp-feature-label">{f.label}</p>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        /* ── Reset / Base ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          background: #F5F3EE;
          font-family: 'Inter', sans-serif;
          color: #080808;
          overflow-x: hidden;
        }

        /* ── Header ── */
        .lp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: clamp(12px, 2vw, 20px) clamp(16px, 5vw, 48px);
          border-bottom: 1px solid rgba(8,8,8,0.08);
          flex-wrap: wrap;
          gap: 12px;
          position: sticky;
          top: 0;
          background: #F5F3EE;
          z-index: 10;
        }

        .lp-logo {
          font-family: 'Anton', sans-serif;
          font-size: clamp(18px, 3vw, 28px);
          letter-spacing: 0.5px;
          color: #080808;
          flex-shrink: 0;
        }

        .lp-nav {
          display: flex;
          align-items: center;
          gap: clamp(16px, 3vw, 40px);
          flex-wrap: wrap;
        }

        .lp-nav-link {
          font-size: clamp(13px, 1.5vw, 16px);
          color: #080808;
          text-decoration: none;
          font-weight: 500;
          opacity: 0.8;
          transition: opacity 0.15s;
          white-space: nowrap;
        }
        .lp-nav-link:hover { opacity: 0.5; }

        .lp-header-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .lp-signin {
          padding: clamp(7px, 1vw, 10px) clamp(14px, 2vw, 24px);
          font-size: clamp(13px, 1.4vw, 15px);
          color: #080808;
          text-decoration: none;
          font-weight: 500;
          white-space: nowrap;
          transition: opacity 0.15s;
        }
        .lp-signin:hover { opacity: 0.6; }

        .lp-getstarted {
          padding: clamp(7px, 1vw, 10px) clamp(14px, 2vw, 24px);
          background: #080808;
          color: #F5F3EE;
          border-radius: 8px;
          font-size: clamp(13px, 1.4vw, 15px);
          font-weight: 600;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s;
        }
        .lp-getstarted:hover { background: #333; }

        /* ── Main ── */
        .lp-main {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: clamp(32px, 6vw, 80px) clamp(16px, 5vw, 48px) clamp(32px, 5vw, 64px);
        }

        /* ── Row layout ── */
        .lp-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: clamp(24px, 5vw, 48px);
          align-items: start;
        }

        .lp-row1 { margin-bottom: clamp(32px, 5vw, 80px); }
        .lp-row2 { margin-bottom: clamp(32px, 5vw, 48px); }

        /* ── Hero Left ── */
        .lp-headline {
          font-family: 'Anton', sans-serif;
          font-size: clamp(36px, 6vw, 88px);
          font-weight: 400;
          line-height: 0.88;
          letter-spacing: -1px;
          margin-bottom: clamp(16px, 2.5vw, 28px);
          color: #080808;
          word-break: break-word;
        }

        .lp-subtext {
          font-size: clamp(14px, 1.6vw, 18px);
          line-height: 1.65;
          color: #080808;
          opacity: 0.7;
          max-width: 420px;
          margin-bottom: clamp(20px, 3vw, 32px);
        }

        .lp-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding-left: clamp(18px, 2.5vw, 28px);
          padding-right: 6px;
          padding-top: 6px;
          padding-bottom: 6px;
          background: #080808;
          color: #F5F3EE;
          border-radius: 100px;
          font-size: clamp(13px, 1.4vw, 15px);
          font-weight: 600;
          text-decoration: none;
          transition: opacity 0.15s;
        }
        .lp-cta-btn:hover { opacity: 0.8; }

        .lp-cta-arrow {
          width: clamp(28px, 3.5vw, 36px);
          height: clamp(28px, 3.5vw, 36px);
          background: #F5F3EE;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* ── Hero Right ── */
        .lp-hero-right { text-align: right; }

        .lp-stat-heading {
          font-family: 'Anton', sans-serif;
          font-size: clamp(28px, 4vw, 56px);
          font-weight: 400;
          line-height: 0.95;
          margin-bottom: clamp(10px, 1.5vw, 16px);
          color: #080808;
        }

        .lp-stat-sub {
          font-size: clamp(13px, 1.3vw, 15px);
          color: #080808;
          opacity: 0.6;
          max-width: 340px;
          margin-left: auto;
          line-height: 1.7;
        }

        /* ── Divider ── */
        .lp-divider {
          border: none;
          border-top: 1px solid rgba(8,8,8,0.1);
          margin-bottom: clamp(24px, 4vw, 48px);
        }

        /* ── Mid Row ── */
        .lp-mid-text {
          font-size: clamp(12px, 1.2vw, 14px);
          color: #080808;
          opacity: 0.5;
          line-height: 1.8;
          max-width: 380px;
          margin-bottom: clamp(14px, 2vw, 24px);
        }

        .lp-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .lp-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: clamp(11px, 1.1vw, 13px);
          font-weight: 600;
          color: #080808;
          background: rgba(8,8,8,0.06);
          border-radius: 100px;
          padding: clamp(4px, 0.6vw, 6px) clamp(10px, 1.5vw, 14px);
          white-space: nowrap;
        }

        .lp-mid-heading {
          font-family: 'Anton', sans-serif;
          font-size: clamp(24px, 3.5vw, 48px);
          font-weight: 400;
          line-height: 1;
          margin-bottom: clamp(8px, 1vw, 12px);
          color: #080808;
        }

        .lp-mid-sub {
          font-size: clamp(12px, 1.2vw, 14px);
          color: #080808;
          opacity: 0.6;
          line-height: 1.75;
        }

        /* ── Feature Cards ── */
        .lp-features {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: clamp(8px, 1vw, 12px);
        }

        .lp-feature-card {
          background: #fff;
          border-radius: clamp(8px, 1vw, 12px);
          padding: clamp(14px, 2vw, 20px) clamp(10px, 1.5vw, 16px);
          text-align: center;
          border: 1px solid rgba(8,8,8,0.08);
          transition: border-color 0.15s, transform 0.15s;
        }
        .lp-feature-card:hover {
          border-color: rgba(8,8,8,0.25);
          transform: translateY(-2px);
        }

        .lp-feature-icon {
          font-size: clamp(18px, 2vw, 24px);
          margin-bottom: clamp(4px, 0.8vw, 8px);
        }

        .lp-feature-label {
          font-size: clamp(10px, 1vw, 12px);
          font-weight: 600;
          color: #080808;
          line-height: 1.3;
        }

        /* ── Responsive Breakpoints ── */

        /* Tablet: 900px and below */
        @media (max-width: 900px) {
          .lp-row {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .lp-hero-right { text-align: left; }
          .lp-stat-sub { margin-left: 0; }
          .lp-features { grid-template-columns: repeat(3, 1fr); }
        }

        /* Mobile: 600px and below */
        @media (max-width: 600px) {
          .lp-header { flex-wrap: wrap; gap: 8px; }
          .lp-nav { display: none; }
          .lp-features { grid-template-columns: repeat(3, 1fr); }
          .lp-headline { line-height: 0.92; }
        }

        /* Very small: 380px and below */
        @media (max-width: 380px) {
          .lp-features { grid-template-columns: repeat(2, 1fr); }
          .lp-header-cta { gap: 4px; }
        }

        /* Large screens: 1400px+ */
        @media (min-width: 1400px) {
          .lp-headline { font-size: 96px; }
          .lp-stat-heading { font-size: 60px; }
        }

        /* Zoom-safe: use em-based media queries too */
        @media (max-width: 56.25em) {  /* ~900px */
          .lp-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
