/**
 * Match simulation engine.
 * Drives each match through 90 minutes, firing stochastic events.
 */

import { createRng } from './generator.js'

let matchSeed = Date.now()

function rngForMatch(matchId) {
  return createRng(matchSeed ^ matchId.split('').reduce((a, c) => a + c.charCodeAt(0), 0))
}

/**
 * Create a fresh match object.
 * offset: how many minutes the match has already played (for staggered starts)
 */
export function createMatch(id, homeTeam, awayTeam, leagueId, offset = 0) {
  const rng = rngForMatch(id)
  return {
    id,
    leagueId,
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
    minute: offset,
    status: offset > 0 ? 'live' : 'upcoming', // 'upcoming' | 'live' | 'halftime' | 'fulltime'
    halftimeTaken: offset >= 45,
    stoppageTime: Math.floor(rng() * 4) + 1, // 1-4 added minutes each half
    stoppageTime2: Math.floor(rng() * 5) + 2, // 2-6 added minutes second half
    events: [], // { minute, type, team, player, detail }
    rng,
  }
}

/**
 * Advance a match by one simulated minute.
 * Returns array of new events that fired this tick.
 */
export function tickMatch(match, teams) {
  if (match.status === 'fulltime' || match.status === 'upcoming') return []

  const newEvents = []
  const home = teams.find(t => t.id === match.homeTeam.id)
  const away = teams.find(t => t.id === match.awayTeam.id)

  const minute = match.minute
  const rng = match.rng

  // Phase modifiers for drama
  let phaseModifier = 1.0
  if (minute >= 85) phaseModifier = 1.8 // Late drama
  else if (minute >= 75) phaseModifier = 1.4
  else if (minute <= 5) phaseModifier = 1.2 // Early pressure
  else if (minute >= 43 && minute <= 47) phaseModifier = 1.3 // End of half pressure

  // Goal probabilities (per minute)
  // Average ~2.7 goals per match = ~0.015 per minute per team
  const homeGoalP = (0.013 + home.rating * 0.002) * phaseModifier * (1 + (home.rating - away.rating) * 0.05)
  const awayGoalP = (0.011 + away.rating * 0.002) * phaseModifier * (1 + (away.rating - home.rating) * 0.05)

  // Yellow card probability
  const yellowP = 0.022

  // Red card probability (higher if already on yellow)
  const homeYellows = match.events.filter(e => e.type === 'yellow' && e.team === 'home').length
  const awayYellows = match.events.filter(e => e.type === 'yellow' && e.team === 'away').length
  const homeRedP = homeYellows >= 1 ? 0.003 : 0.0005
  const awayRedP = awayYellows >= 1 ? 0.003 : 0.0005

  // Check if a team has been red-carded (affects scoring)
  const homeReds = match.events.filter(e => e.type === 'red' && e.team === 'home').length
  const awayReds = match.events.filter(e => e.type === 'red' && e.team === 'away').length

  // Home goal
  const homeGoalModified = homeGoalP * (1 - homeReds * 0.2) * (1 + awayReds * 0.15)
  if (rng() < homeGoalModified) {
    const isOwnGoal = rng() < 0.06
    const isPenalty = rng() < 0.10
    const scorer = isOwnGoal
      ? pickPlayer(away, rng)
      : pickPlayer(home, rng)
    const event = {
      minute,
      type: 'goal',
      team: 'home',
      player: scorer,
      detail: isOwnGoal ? 'og' : isPenalty ? 'pen' : null,
    }
    match.homeScore++
    match.events.push(event)
    newEvents.push(event)
  }

  // Away goal
  const awayGoalModified = awayGoalP * (1 - awayReds * 0.2) * (1 + homeReds * 0.15)
  if (rng() < awayGoalModified) {
    const isOwnGoal = rng() < 0.06
    const isPenalty = rng() < 0.10
    const scorer = isOwnGoal
      ? pickPlayer(home, rng)
      : pickPlayer(away, rng)
    const event = {
      minute,
      type: 'goal',
      team: 'away',
      player: scorer,
      detail: isOwnGoal ? 'og' : isPenalty ? 'pen' : null,
    }
    match.awayScore++
    match.events.push(event)
    newEvents.push(event)
  }

  // Yellow cards
  if (rng() < yellowP) {
    const team = rng() < 0.5 ? 'home' : 'away'
    const player = pickPlayer(team === 'home' ? home : away, rng)
    const event = { minute, type: 'yellow', team, player }
    match.events.push(event)
    newEvents.push(event)
  }

  // Red cards
  if (rng() < homeRedP) {
    const player = pickPlayer(home, rng)
    const event = { minute, type: 'red', team: 'home', player }
    match.events.push(event)
    newEvents.push(event)
  }
  if (rng() < awayRedP) {
    const player = pickPlayer(away, rng)
    const event = { minute, type: 'red', team: 'away', player }
    match.events.push(event)
    newEvents.push(event)
  }

  // Substitutions (second half only, 2-3 per team)
  if (minute >= 55 && rng() < 0.015) {
    const team = rng() < 0.5 ? 'home' : 'away'
    const teamSubs = match.events.filter(e => e.type === 'sub' && e.team === team).length
    if (teamSubs < 3) {
      const teamObj = team === 'home' ? home : away
      const off = pickPlayer(teamObj, rng)
      const on = pickPlayer(teamObj, rng)
      const event = { minute, type: 'sub', team, player: on, playerOff: off }
      match.events.push(event)
      newEvents.push(event)
    }
  }

  // Advance minute
  match.minute++

  // Half-time transition
  if (match.minute >= 45 + match.stoppageTime && !match.halftimeTaken && match.status === 'live') {
    match.status = 'halftime'
    match.halftimeTaken = true
    const event = { minute: 45, type: 'halftime', team: null, player: null }
    match.events.push(event)
    newEvents.push(event)
    // Resume after 8 ticks (simulated ~half-time break)
    match.halftimeResumeTick = 8
    return newEvents
  }

  // Full time
  if (match.minute >= 90 + match.stoppageTime2 && match.status === 'live') {
    match.status = 'fulltime'
    const event = { minute: 90, type: 'fulltime', team: null, player: null }
    match.events.push(event)
    newEvents.push(event)
    return newEvents
  }

  return newEvents
}

/**
 * Handle half-time countdown and resume.
 */
export function tickHalftime(match) {
  if (match.status !== 'halftime') return false
  match.halftimeResumeTick--
  if (match.halftimeResumeTick <= 0) {
    match.status = 'live'
    return true // resumed
  }
  return false
}

function pickPlayer(team, rng) {
  return team.squad[Math.floor(rng() * 11)] // pick from outfield players
}

/**
 * Create a full matchday for a league.
 * Pairs teams into fixtures, staggers kick-off times.
 */
export function createMatchday(league, matchdayNumber) {
  const teams = [...league.teams]
  // Simple round-robin pairing
  const fixtures = []
  const shuffled = [...teams].sort(() => Math.random() - 0.5)

  for (let i = 0; i < shuffled.length - 1; i += 2) {
    const offset = Math.floor(Math.random() * 20) + 1 // 1-20min stagger so matches are already in progress
    fixtures.push(
      createMatch(
        `${league.id}-md${matchdayNumber}-${i}`,
        shuffled[i],
        shuffled[i + 1],
        league.id,
        offset
      )
    )
  }
  return fixtures
}

/**
 * Update a league table based on a completed match.
 */
export function updateTable(table, match) {
  const homeRow = table.find(r => r.teamId === match.homeTeam.id)
  const awayRow = table.find(r => r.teamId === match.awayTeam.id)
  if (!homeRow || !awayRow) return

  homeRow.played++
  awayRow.played++
  homeRow.goalsFor += match.homeScore
  homeRow.goalsAgainst += match.awayScore
  awayRow.goalsFor += match.awayScore
  awayRow.goalsAgainst += match.homeScore

  if (match.homeScore > match.awayScore) {
    homeRow.won++; homeRow.points += 3
    awayRow.lost++
  } else if (match.homeScore < match.awayScore) {
    awayRow.won++; awayRow.points += 3
    homeRow.lost++
  } else {
    homeRow.drawn++; homeRow.points += 1
    awayRow.drawn++; awayRow.points += 1
  }
}

/**
 * Sort a league table by standard football rules.
 */
export function sortTable(table, teams) {
  return [...table].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    const gdA = a.goalsFor - a.goalsAgainst
    const gdB = b.goalsFor - b.goalsAgainst
    if (gdB !== gdA) return gdB - gdA
    return b.goalsFor - a.goalsFor
  })
}
