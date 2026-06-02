import { useState } from 'react';
import api from '../api';

export default function InviteModal({ teamId, teamName, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await api.post(`/teams/${teamId}/invite`, { email });
      setSuccess(res.data.message);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invite.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-semibold">Invite to Team</h2>
            <p className="text-sm text-slate-500 mt-0.5">{teamName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex gap-2">
            <span>ℹ️</span>
            <span>Invites are stubbed — no real email is sent. The invited user must already have an account to be added directly via the Members tab.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="colleague@example.com"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                ✅ {success}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">Close</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Sending...' : '✉️ Send Invite'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
