import { useState } from 'react';
import api from '../api';

export default function TeamModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [memberEmails, setMemberEmails] = useState([]);
  const [inviteEmails, setInviteEmails] = useState([]);
  const [memberInput, setMemberInput] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addToList = (list, setList, input, setInput) => {
    if (!input.trim() || !input.includes('@')) return;
    if (!list.includes(input.trim())) setList([...list, input.trim()]);
    setInput('');
  };

  const removeFromList = (list, setList, email) => setList(list.filter(e => e !== email));

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post('/teams', form);
      const teamId = res.data.id;
      await Promise.allSettled(memberEmails.map(email => api.post(`/teams/${teamId}/members`, { email })));
      await Promise.allSettled(inviteEmails.map(email => api.post(`/teams/${teamId}/invite`, { email })));
      onSave(res.data);
      onClose();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs[0].msg : err.response?.data?.error || 'Failed to create team.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] shadow-2xl overflow-y-auto max-h-[90vh]" style={{ background: '#161b22' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#30363d] sticky top-0 z-10" style={{ background: '#161b22' }}>
          <h2 className="text-base font-semibold text-white">Create Team</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: '#2d1515', border: '1px solid #7f1d1d', color: '#fca5a5' }}>
              {error}
            </div>
          )}

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Team Name *</label>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required minLength={2}
              placeholder="e.g. Engineering"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              placeholder="Optional description"
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[#21262d] pt-1">
            <p className="text-xs text-[#484f58] mb-3">Optional — you can also add members after creating the team.</p>
          </div>

          {/* Add Existing Members */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Add Existing Members by Email</label>
            <div className="flex gap-2">
              <input
                value={memberInput}
                onChange={e => setMemberInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList(memberEmails, setMemberEmails, memberInput, setMemberInput))}
                type="email"
                placeholder="colleague@example.com"
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => addToList(memberEmails, setMemberEmails, memberInput, setMemberInput)}
                className="px-3 py-2 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] rounded-lg text-sm hover:bg-[#30363d] transition-colors"
              >
                Add
              </button>
            </div>
            {memberEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {memberEmails.map(email => (
                  <span key={email} className="flex items-center gap-1 bg-blue-900/30 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-800/40">
                    {email}
                    <button type="button" onClick={() => removeFromList(memberEmails, setMemberEmails, email)} className="hover:text-white ml-0.5 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Invite Unregistered Users */}
          <div>
            <label className="block text-sm font-medium text-[#c9d1d9] mb-1.5">Invite Unregistered Users by Email</label>
            <div className="flex gap-2">
              <input
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addToList(inviteEmails, setInviteEmails, inviteInput, setInviteInput))}
                type="email"
                placeholder="newuser@example.com"
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-white placeholder-[#484f58] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => addToList(inviteEmails, setInviteEmails, inviteInput, setInviteInput)}
                className="px-3 py-2 bg-[#21262d] border border-[#30363d] text-[#c9d1d9] rounded-lg text-sm hover:bg-[#30363d] transition-colors"
              >
                Add
              </button>
            </div>
            {inviteEmails.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {inviteEmails.map(email => (
                  <span key={email} className="flex items-center gap-1 bg-purple-900/30 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-800/40">
                    {email}
                    <button type="button" onClick={() => removeFromList(inviteEmails, setInviteEmails, email)} className="hover:text-white ml-0.5 leading-none">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}