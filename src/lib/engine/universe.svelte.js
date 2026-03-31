import { api, COMPETITIONS } from '../api/football.js';

function mapStatus(s) {
  return {
    SCHEDULED: 'upcoming', TIMED: 'upcoming',
    IN_PLAY: 'live', PAUSED: 'halftime',
    FINISHED: 'fulltime',
    POSTPONED: 'postponed', CANCELLED: 'cancelled', SUSPENDED: 'cancelled',
  }[s] || 'upcoming';
}

function mapMatch(m, leagueId) {
  return {
    id: m.id, leagueId,
    homeTeam: {
      id: m.homeTeam.id, name: m.homeTeam.name,
      shortName: m.homeTeam.tla || '???',
      displayName: m.homeTeam.shortName || m.homeTeam.name,
    },
    awayTeam: {
      id: m.awayTeam.id, name: m.awayTeam.name,
      shortName: m.awayTeam.tla || '???',
      displayName: m.awayTeam.shortName || m.awayTeam.name,
    },
    homeScore: m.score?.fullTime?.home ?? m.score?.halfTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? m.score?.halfTime?.away ?? null,
    minute: m.minute ?? null,
    status: mapStatus(m.status),
    utcDate: m.utcDate,
    events: [],
    eventsLoaded: false,
  };
}

function mapStandings(data) {
  const group = data.standings?.find(s => s.type === 'TOTAL') ?? data.standings?.[0];
  if (!group?.table) return { table: [], teams: [] };
  return {
    table: group.table.map(r => ({
      teamId: r.team.id, position: r.position, played: r.playedGames,
      won: r.won, drawn: r.draw, lost: r.lost,
      goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst, points: r.points,
    })),
    teams: group.table.map(r => ({
      id: r.team.id, name: r.team.name,
      shortName: r.team.tla || '???',
      displayName: r.team.shortName || r.team.name,
    })),
  };
}

class Universe {
  leagues = $state(COMPETITIONS.map(c => ({
    id: c.code, name: c.name, country: c.country, tab: c.tab,
    table: [], teams: [], loaded: false,
  })));
  matches = $state([]);
  selectedMatchId = $state(null);
  matchdayNumber = $state(null);
  loading = $state(true);
  error = $state(null);

  #activeLeagueId = $state(COMPETITIONS[0].code);
  #matchdays = {};
  #pollInterval = null;

  get activeLeagueId() { return this.#activeLeagueId; }

  get activeLeague() {
    return this.leagues.find(l => l.id === this.#activeLeagueId) ?? this.leagues[0];
  }

  get activeMatches() {
    return this.matches
      .filter(m => m.leagueId === this.#activeLeagueId)
      .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  }

  get selectedMatch() {
    return this.matches.find(m => m.id === this.selectedMatchId) ?? null;
  }

  get activeTable() {
    const league = this.activeLeague;
    if (!league?.table?.length) return [];
    return league.table.slice().sort((a, b) => a.position - b.position);
  }

  async init() {
    this.loading = true;
    this.error = null;
    try {
      await this.#loadLeague(this.#activeLeagueId);
      this.#pollInterval = setInterval(() => this.#poll(), 60_000);
    } catch (e) {
      this.error = e.message;
      this.loading = false;
    }
  }

  destroy() {
    if (this.#pollInterval) clearInterval(this.#pollInterval);
  }

  selectMatch(id) {
    this.selectedMatchId = id;
    const m = this.matches.find(x => x.id === id);
    if (m && !m.eventsLoaded) this.#loadDetail(id);
  }

  async setActiveLeague(id) {
    this.#activeLeagueId = id;
    this.selectedMatchId = null;
    const league = this.leagues.find(l => l.id === id);
    if (!league.loaded) await this.#loadLeague(id);
    this.matchdayNumber = this.#matchdays[id] ?? null;
  }

  async changeMatchday(delta) {
    const lid = this.#activeLeagueId;
    const cur = this.#matchdays[lid] ?? 1;
    const next = cur + delta;
    if (next < 1) return;
    this.loading = true;
    try {
      const data = await api.matches(lid, next);
      this.#matchdays[lid] = next;
      this.matchdayNumber = next;
      this.selectedMatchId = null;
      this.matches = [
        ...this.matches.filter(m => m.leagueId !== lid),
        ...(data.matches ?? []).map(m => mapMatch(m, lid)),
      ];
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }

  async #loadLeague(code) {
    this.loading = true;
    this.error = null;
    try {
      const sData = await api.standings(code);
      const md = sData.season?.currentMatchday ?? 1;
      const mData = await api.matches(code, md);

      const { table, teams } = mapStandings(sData);
      const league = this.leagues.find(l => l.id === code);
      if (league) {
        league.table = table;
        league.teams = teams;
        league.loaded = true;
        league.name = sData.competition?.name ?? league.name;
      }

      this.matches = [
        ...this.matches.filter(m => m.leagueId !== code),
        ...(mData.matches ?? []).map(m => mapMatch(m, code)),
      ];
      this.#matchdays[code] = md;
      if (this.#activeLeagueId === code) this.matchdayNumber = md;
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }

  async #loadDetail(matchId) {
    try {
      const d = await api.matchDetail(matchId);
      const match = this.matches.find(m => m.id === matchId);
      if (!match) return;

      const events = [];

      for (const g of d.goals ?? []) {
        events.push({
          minute: g.minute, type: 'goal',
          team: g.team?.id === match.homeTeam.id ? 'home' : 'away',
          player: g.scorer?.name ?? 'Unknown',
          detail: g.type === 'OWN' ? 'og' : g.type === 'PENALTY' ? 'pen' : null,
        });
      }

      for (const b of d.bookings ?? []) {
        events.push({
          minute: b.minute,
          type: b.card === 'RED_CARD' || b.card === 'YELLOW_RED_CARD' ? 'red' : 'yellow',
          team: b.team?.id === match.homeTeam.id ? 'home' : 'away',
          player: b.player?.name ?? 'Unknown',
          detail: null,
        });
      }

      for (const s of d.substitutions ?? []) {
        events.push({
          minute: s.minute, type: 'sub',
          team: s.team?.id === match.homeTeam.id ? 'home' : 'away',
          player: `${s.playerIn?.name ?? '?'} \u2190 ${s.playerOut?.name ?? '?'}`,
          detail: null,
        });
      }

      events.sort((a, b) => a.minute - b.minute);
      match.events = events;
      match.eventsLoaded = true;
    } catch (e) {
      console.error('Detail load failed:', e);
    }
  }

  async #poll() {
    const lid = this.#activeLeagueId;
    if (!lid) return;
    try {
      const md = this.#matchdays[lid];
      const data = await api.matches(lid, md);
      const updated = (data.matches ?? []).map(m => mapMatch(m, lid));

      for (const u of updated) {
        const old = this.matches.find(m => m.id === u.id);
        if (old?.eventsLoaded) {
          const changed = (old.homeScore ?? 0) + (old.awayScore ?? 0) !== (u.homeScore ?? 0) + (u.awayScore ?? 0);
          if (!changed) { u.events = old.events; u.eventsLoaded = true; }
        }
      }

      this.matches = [...this.matches.filter(m => m.leagueId !== lid), ...updated];

      if (this.selectedMatchId) {
        const sel = this.matches.find(m => m.id === this.selectedMatchId);
        if (sel && !sel.eventsLoaded) this.#loadDetail(sel.id);
      }
    } catch (e) {
      console.error('Poll error:', e);
    }
  }
}

export const universe = new Universe();
