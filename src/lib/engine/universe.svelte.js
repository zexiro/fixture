/**
 * Central universe state — Svelte 5 runes.
 * Uses a reactive class to avoid module export restrictions on $state/$derived.
 */

import { generateUniverse } from './generator.js'
import { createMatchday, tickMatch, tickHalftime, updateTable, sortTable } from './simulation.js'
import { stadiumAudio } from '../audio/stadium.js'

class Universe {
  leagues = $state(generateUniverse(Date.now() % 99999))
  matches = $state([])
  recentEvents = $state([])
  selectedMatchId = $state(null)
  matchdayNumber = $state(1)
  matchdayBreak = $state(false)

  #activeLeagueId = $state(null)
  #tickInterval = null

  constructor() {
    this.#activeLeagueId = this.leagues[0]?.id ?? null
  }

  get activeLeagueId() { return this.#activeLeagueId }

  get activeLeague() {
    return this.leagues.find(l => l.id === this.#activeLeagueId) ?? this.leagues[0]
  }

  get activeMatches() {
    return this.matches.filter(m => m.leagueId === this.#activeLeagueId)
  }

  get selectedMatch() {
    return this.matches.find(m => m.id === this.selectedMatchId) ?? null
  }

  get activeTable() {
    if (!this.activeLeague) return []
    return sortTable(this.activeLeague.table, this.activeLeague.teams)
  }

  getTeam(leagueId, teamId) {
    const league = this.leagues.find(l => l.id === leagueId)
    return league?.teams.find(t => t.id === teamId) ?? null
  }

  init() {
    this.#startMatchday()
    this.#tickInterval = setInterval(() => this.#tick(), 800)
  }

  destroy() {
    if (this.#tickInterval) clearInterval(this.#tickInterval)
  }

  selectMatch(id) {
    this.selectedMatchId = id
  }

  setActiveLeague(id) {
    this.#activeLeagueId = id
    this.selectedMatchId = null
  }

  #startMatchday() {
    this.matchdayBreak = false
    const allMatches = []
    for (const league of this.leagues) {
      const fixtures = createMatchday(league, this.matchdayNumber)
      allMatches.push(...fixtures)
    }
    this.matches.splice(0, this.matches.length, ...allMatches)
    this.recentEvents.splice(0)
  }

  #tick() {
    const allTeams = this.leagues.flatMap(l => l.teams)
    let anyLive = false

    for (const match of this.matches) {
      if (match.status === 'fulltime') continue
      if (match.status === 'upcoming') {
        match.status = 'live'
        continue
      }

      anyLive = true

      if (match.status === 'halftime') {
        tickHalftime(match)
        continue
      }

      const newEvents = tickMatch(match, allTeams)

      if (match.status === 'fulltime') {
        const league = this.leagues.find(l => l.id === match.leagueId)
        if (league) updateTable(league.table, match)
      }

      for (const ev of newEvents) {
        if (ev.type === 'goal' || ev.type === 'red') {
          this.recentEvents.unshift({ matchId: match.id, event: ev, leagueId: match.leagueId })
          if (this.recentEvents.length > 30) this.recentEvents.pop()
          if (ev.type === 'goal') stadiumAudio.goalRoar()
        }
      }
    }

    if (!anyLive && !this.matchdayBreak) {
      this.matchdayBreak = true
      this.matchdayNumber++
      setTimeout(() => this.#startMatchday(), 12000)
    }
  }
}

export const universe = new Universe()
