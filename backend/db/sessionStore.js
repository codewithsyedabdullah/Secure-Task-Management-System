const session = require('express-session');
const { sb } = require('./supabase');

class SupabaseSessionStore extends session.Store {
  async get(sid, cb) {
    try {
      const row = await sb('session').get('sess,expire', { sid });
      if (!row) return cb(null, null);
      if (row.expire && new Date(row.expire) < new Date()) {
        await sb('session').delete({ sid }).catch(() => {});
        return cb(null, null);
      }
      cb(null, typeof row.sess === 'string' ? JSON.parse(row.sess) : row.sess);
    } catch (e) { cb(e); }
  }

  async set(sid, session, cb) {
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
      cb && cb(null);
    } catch (e) { cb && cb(e); }
  }

  async destroy(sid, cb) {
    try { await sb('session').delete({ sid }); cb && cb(null); }
    catch (e) { cb && cb(e); }
  }

  async touch(sid, session, cb) {
    const expire = session.cookie && session.cookie.expires
      ? new Date(session.cookie.expires).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    try { await sb('session').update({ expire }, { sid }); cb && cb(null); }
    catch (e) { cb && cb(e); }
  }
}

module.exports = SupabaseSessionStore;
