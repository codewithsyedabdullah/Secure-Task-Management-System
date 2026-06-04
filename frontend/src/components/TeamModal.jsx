import { useState } from 'react';
import api from '../api';

export default function TeamModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { const res = await api.post('/teams', form); onSave(res.data); onClose(); }
    catch (err) { const errs = err.response?.data?.errors; setError(errs ? errs[0].msg : err.response?.data?.error || 'Failed to create team.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] shadow-2xl" style={{ background: '#161b22' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d]">
          <h2 className="text-base font-semibold text-white">Create Team</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#2d1515', border: '1px solid #7f1d1d', color: '#fca5a5' }}>{error}</div>}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Team Name *</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required minLength={2}
              placeholder="e.g. Engineering"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2} placeholder="Optional description"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] font-medium py-2 rounded-lg text-sm transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg text-sm transition-colors">
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
