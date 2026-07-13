const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

function sb(table) {
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Prefer': 'return=representation',
  };
  const base = `${SUPABASE_URL}/rest/v1/${table}`;
  return {
    select: async (cols = '*', filters = {}) => {
      let url = `${base}?select=${encodeURIComponent(cols)}`;
      for (const [k, v] of Object.entries(filters)) url += `&${k}=eq.${encodeURIComponent(String(v))}`;
      const res = await fetch(url, { headers: { ...headers, Accept: 'application/json' } });
      if (!res.ok) { const t = await res.text(); throw new Error(`supabase select ${table}: ${res.status} ${t}`); }
      return res.json();
    },
    get: async (cols = '*', filters = {}) => {
      let url = `${base}?select=${encodeURIComponent(cols)}`;
      for (const [k, v] of Object.entries(filters)) url += `&${k}=eq.${encodeURIComponent(String(v))}`;
      url += '&limit=1';
      const res = await fetch(url, { headers: { ...headers, Accept: 'application/json' } });
      if (!res.ok) { const t = await res.text(); throw new Error(`supabase get ${table}: ${res.status} ${t}`); }
      const arr = await res.json();
      return arr[0] || undefined;
    },
    insert: async (data) => {
      const res = await fetch(base, { method: 'POST', headers, body: JSON.stringify(data) });
      if (!res.ok) { const t = await res.text(); return { error: `supabase insert ${table}: ${res.status} ${t}`, status: res.status }; }
      const json = await res.json();
      return Array.isArray(json) ? json[0] : json;
    },
    update: async (data, filters = {}) => {
      let url = base;
      for (const [k, v] of Object.entries(filters)) url += `?${k}=eq.${encodeURIComponent(String(v))}`;
      const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(data) });
      if (!res.ok) { const t = await res.text(); throw new Error(`supabase update ${table}: ${res.status} ${t}`); }
      return res.json();
    },
    delete: async (filters = {}) => {
      let url = base;
      for (const [k, v] of Object.entries(filters)) url += `?${k}=eq.${encodeURIComponent(String(v))}`;
      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok && res.status !== 204) { const t = await res.text(); throw new Error(`supabase delete ${table}: ${res.status} ${t}`); }
      return res.status === 204 ? null : res.json();
    },
    in: async (cols = '*', filterCol, filterVals) => {
      const vals = filterVals.map(v => `"${v}"`).join(',');
      let url = `${base}?select=${encodeURIComponent(cols)}&${filterCol}=in.(${vals})`;
      const res = await fetch(url, { headers: { ...headers, Accept: 'application/json' } });
      if (!res.ok) { const t = await res.text(); throw new Error(`supabase in ${table}: ${res.status} ${t}`); }
      return res.json();
    },
  };
}

module.exports = { sb };
