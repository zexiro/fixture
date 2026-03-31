const BASE = 'https://api.football-data.org/v4';

export const COMPETITIONS = [
  { code: 'PL', name: 'Premier League', country: 'England', tab: 'PREM' },
  { code: 'ELC', name: 'Championship', country: 'England', tab: 'CHAMP' },
  { code: 'CL', name: 'Champions League', country: 'Europe', tab: 'UCL' },
];

const cache = new Map();
const TTL = { long: 300_000, short: 60_000 };

export function getApiKey() {
  return import.meta.env.VITE_FOOTBALL_DATA_KEY || localStorage.getItem('football_api_key') || null;
}

export function setApiKey(key) {
  localStorage.setItem('football_api_key', key);
}

async function get(path, ttl) {
  const key = getApiKey();
  if (!key) throw new Error('NO_KEY');

  const hit = cache.get(path);
  if (hit && Date.now() - hit.t < ttl) return hit.d;

  const res = await fetch(`${BASE}${path}`, { headers: { 'X-Auth-Token': key } });

  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (res.status === 403) throw new Error('BAD_KEY');
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
