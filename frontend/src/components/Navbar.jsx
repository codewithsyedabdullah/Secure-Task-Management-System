import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <nav style={{ background: '#fff', borderBottom: '1px solid rgba(8,8,8,0.08)', position: 'sticky', top: 0, zIndex: 10, fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <Link to="/dashboard" style={{ fontFamily: "'Anton', sans-serif", fontSize: 18, color: '#080808', textDecoration: 'none' }}>TASKMANAGER</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#080808', opacity: 0.5 }}>Hi, <span style={{ fontWeight: 600, opacity: 1 }}>{user?.username}</span></span>
          <button onClick={handleLogout}
            style={{ fontSize: 13, fontWeight: 600, color: '#080808', background: 'none', border: '1.5px solid rgba(8,8,8,0.15)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
