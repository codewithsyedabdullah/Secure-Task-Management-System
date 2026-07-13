const { sb } = require('./supabase');

class SupabaseSessionStore {
  async get(sid) {
    try {
      const row = await sb('session').get('sess,expire', { sid });
      if (!row) return null;
      if (row.expire && new Date(row.expire) < new Date()) {
        await sb('session').delete({ sid }).catch(() => {});
        return null;
      }
      return typeof row.sess === 'string' ? JSON.parse(row.sess) : row.sess;
    } catch { return null; }
  }

  async set(sid, session) {
    const expire = session.cookie && session.cookie.expires
      ? new Date(session.cookie.expires).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const existing = await sb('session').get('sid', { sid });
      if (existing) {
        await sb('session').update({ sess: session, expire }, { sid });
      } else {
        await sb('session').insert({ sid, sess: session, expire });
      }
    } catch (e) { console.error('Session set error:', e); }
  }

  async destroy(sid) {
    try { await sb('session').delete({ sid }); } catch {}
  }

  async touch(sid, session) {
    const expire = session.cookie && session.cookie.expires
      ? new Date(session.cookie.expires).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    try { await sb('session').update({ expire }, { sid }); } catch {}
  }
}

module.exports = SupabaseSessionStore;
