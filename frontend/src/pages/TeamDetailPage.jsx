import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function TeamDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberEmail, setMemberEmail] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState('');

  useEffect(() => {
    api.get(`/teams/${id}`)
      .then((res) => setTeam(res.data))
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError(''); setAddSuccess('');
    setAddLoading(true);
    try {
      const res = await api.post(`/teams/${id}/members`, { email: memberEmail });
      setTeam((prev) => ({ ...prev, members: [...prev.members, res.data.user] }));
      setAddSuccess(res.data.message);
      setMemberEmail('');
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add member.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveMember = async (userId, username) => {
    if (!confirm(`Remove ${username} from the team?`)) return;
    try {
      await api.delete(`/teams/${id}/members/${userId}`);
      setTeam((prev) => ({ ...prev, members: prev.members.filter((m) => m.id !== userId) }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!team) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500">Team not found or access denied.</p>
        <Link to="/dashboard" className="btn-primary inline-block mt-4">← Back to Dashboard</Link>
      </div>
    </div>
  );

  const isCreator = team.my_role === 'creator';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-4">
          <Link to="/dashboard" className="text-sm text-slate-500 hover:text-brand-600">← Dashboard</Link>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
              {team.description && <p className="text-slate-500 mt-1">{team.description}</p>}
              <p className="text-xs text-slate-400 mt-2">Created by {team.creator_name}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${isCreator ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
              {isCreator ? 'Creator' : 'Member'}
            </span>
          </div>
        </div>

        {/* Members */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Members ({team.members?.length || 0})</h2>

          {isCreator && (
            <form onSubmit={handleAddMember} className="mb-4 flex gap-2">
              <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)}
                className="input flex-1" type="email" placeholder="Add member by email" required />
              <button type="submit" disabled={addLoading} className="btn-primary whitespace-nowrap">
                {addLoading ? '...' : 'Add'}
              </button>
            </form>
          )}

          {addError && <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{addError}</div>}
          {addSuccess && <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 rounded text-sm">{addSuccess}</div>}

          <ul className="divide-y divide-slate-100">
            {team.members?.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-800">{m.username}</p>
                  <p className="text-xs text-slate-400">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.role === 'creator' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'}`}>
                    {m.role}
                  </span>
                  {isCreator && m.id !== user.id && (
                    <button onClick={() => handleRemoveMember(m.id, m.username)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
