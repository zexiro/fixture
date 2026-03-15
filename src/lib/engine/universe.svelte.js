/**
 * Central universe state — Svelte 5 runes.
 * Owns all leagues, matches, and the simulation tick loop.
 */

import { generateUniverse } from './generator.js'
import { createMatchday, tickMatch, tickHalftime, updateTable, sortTable } from './simulation.js'
import { stadiumAudio } from '../audio/stadium.js'

// ── State ────────────────────────────────────────────────────────────────────

export const leagues = $state(generateUniverse(Date.now() % 99999))
export let matches = $state([])
export let selectedMatchId = $state(null)
export let activeLeagueId = $state(leagues[0]?.id ?? null)
export let recentEvents = $state([]) // { matchId, event, leagueId } — for ticker flashes
export let matchdayNumber = $state(1)
export let matchdayBreak = $state(false) // true when between matchdays

let tickInterval = null

// ── Derived ──────────────────────────────────────────────────────────────────

export const activeLeague = $derived(
  leagues.find(l => l.id === activeLeagueId) ?? leagues[0]
)

export const activeMatches = $derived(
  matches.filter(m => m.leagueId === activeLeagueId)
)

export const selectedMatch = $derived(
  matches.find(m => m.id === selectedMatchId) ?? null
)

export const activeTable = $derived(() => {
  if (!activeLeague) return []
  return sortTable(activeLeague.table, activeLeague.teams)
})

export function getTeam(leagueId, teamId) {
  const league = leagues.find(l => l.id === leagueId)
  return league?.teams.find(t => t.id === teamId) ?? null
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function init() {
  startMatchday()
  tickInterval = setInterval(tick, 800) // 800ms ≈ 1 sim minute
}

export function destroy() {
  if (tickInterval) clearInterval(tickInterval)
}

function startMatchday() {
  matchdayBreak = false
  const allMatches = []
  for (const league of leagues) {
    const fixtures = createMatchday(league, matchdayNumber)
    allMatches.push(...fixtures)
  }
  matches.splice(0, matches.length, ...allMatches)
  recentEvents.splice(0)
}

function tick() {
  const allTeams = leagues.flatMap(l => l.teams)

  let anyLive = false

  for (const match of matches) {
    if (match.status === 'fulltime') continue
    if (match.status === 'upcoming') {
      // Start the match after a short delay
      match.status = 'live'
      continue
    }

    anyLive = true

    if (match.status === 'halftime') {
      tickHalftime(match)
      continue
    }

    const newEvents = tickMatch(match, allTeams)

    // Handle fulltime table update
    if (match.status === 'fulltime') {
      const league = leagues.find(l => l.id === match.leagueId)
      if (league) {
        updateTable(league.table, match)
      }
    }

    // Queue recent events for UI flash
    for (const ev of newEvents) {
      if (ev.type === 'goal' || ev.type === 'red') {
        recentEvents.unshift({ matchId: match.id, event: ev, leagueId: match.leagueId })
        if (recentEvents.length > 30) recentEvents.pop()

        if (ev.type === 'goal') {
          stadiumAudio.goalRoar()
        }
      }
    }
  }

  // All fulltime → start break then new matchday
  if (!anyLive && !matchdayBreak) {
    matchdayBreak = true
    matchdayNumber++
    setTimeout(() => {
      startMatchday()
    }, 12000) // 12 second break between matchdays
  }
}

export function selectMatch(id) {
  selectedMatchId = id
}

export function setActiveLeague(id) {
  activeLeagueId = id
  selectedMatchId = null
}
