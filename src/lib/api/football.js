const cache = new Map();
const TTL = { long: 300_000, short: 60_000 };

export const COMPETITIONS = [
  { code: 'PL', name: 'Premier League', country: 'England', tab: 'PREM' },
  { code: 'ELC', name: 'Championship', country: 'England', tab: 'CHAMP' },
  { code: 'CL', name: 'Champions League', country: 'Europe', tab: 'UCL' },
];

async function get(path, ttl) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.t < ttl) return hit.d;

  const res = await fetch(`/api/football?path=${encodeURIComponent(path)}`);

  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error(`API_${res.status}`);

  const data = await res.json();
  cache.set(path, { d: data, t: Date.now() });
  return data;
}

export const api = {
  standings: (code) => get(`/competitions/${code}/standings`, TTL.long),
  matches: (code, matchday) => get(`/competitions/${code}/matches${matchday != null ? `?matchday=${matchday}` : ''}`, TTL.short),
  matchDetail: (id) => get(`/matches/${id}`, TTL.short),
};
