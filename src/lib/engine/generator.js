/**
 * Procedural name generator for teams, leagues, players, and countries.
 * Uses seeded phoneme-combination to produce consistent fictional names.
 */

// Simple seeded PRNG (mulberry32)
export function createRng(seed) {
  let s = seed >>> 0
  return function () {
    s |= 0
    s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)]
}

// Phoneme pools for different "feels"
const CONSONANTS_HARD = ['K', 'R', 'V', 'Z', 'ST', 'BR', 'KR', 'GR', 'DR', 'TR', 'PR']
const CONSONANTS_SOFT = ['L', 'M', 'N', 'S', 'SH', 'TH', 'FL', 'SL', 'GL', 'BL', 'PL']
const VOWELS_OPEN = ['a', 'o', 'e', 'u', 'i', 'ia', 'ao', 'ua']
const VOWELS_CLOSE = ['en', 'an', 'on', 'in', 'ar', 'or', 'er', 'al', 'el']
const ENDINGS = ['ia', 'nia', 'via', 'ska', 'ova', 'ara', 'ica', 'esta', 'ona', 'ika', 'ania', 'avia', 'osia']
const CITY_ENDINGS = ['ville', 'berg', 'burg', 'port', 'ford', 'ton', 'field', 'heim', 'grad', 'stad', 'ova', 'pol', 'burg']
const TEAM_SUFFIXES = ['City', 'United', 'Athletic', 'Rovers', 'Wanderers', 'FC', 'Town', 'Olympic', 'Sporting', 'Racing', 'Dynamo', 'Victoria']
const LEAGUE_NAMES = ['Premier League', 'First Division', 'Superliga', 'Liga Nacional', 'Championship', 'Division One', 'Premier Division']
const DIVISION_TIERS = ['Premier League', 'Championship', 'First Division', 'Second Division', 'Third Division']

function generateCountryName(rng) {
  const patterns = [
    () => pick(rng, CONSONANTS_HARD) + pick(rng, VOWELS_OPEN) + pick(rng, ENDINGS),
    () => pick(rng, CONSONANTS_SOFT) + pick(rng, VOWELS_OPEN) + pick(rng, CONSONANTS_HARD) + pick(rng, ENDINGS),
    () => pick(rng, VOWELS_OPEN).toUpperCase().charAt(0) + pick(rng, VOWELS_OPEN).slice(1) + pick(rng, CONSONANTS_SOFT) + pick(rng, ENDINGS),
  ]
  const raw = pick(rng, patterns)()
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function generateCityName(rng) {
  const syllable = pick(rng, CONSONANTS_HARD) + pick(rng, VOWELS_OPEN) + pick(rng, CONSONANTS_SOFT)
  const ending = pick(rng, CITY_ENDINGS)
  const name = syllable + ending
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function generatePlayerName(rng) {
  const firstSyllables = ['Al', 'Da', 'Ko', 'Mi', 'Ra', 'To', 'Ve', 'Lu', 'Fa', 'Ro', 'Se', 'Ma', 'Ka', 'Bo', 'De']
  const firstEndings = ['vis', 'rak', 'mir', 'jan', 'lek', 'bor', 'van', 'sto', 'rid', 'man', 'ton', 'vic', 'nis']
  const lastSyllables = ['Krav', 'Vor', 'Sten', 'Bel', 'Dra', 'Mor', 'Kos', 'Pav', 'Rod', 'Sal', 'Zan', 'Bur', 'Lev']
  const lastEndings = ['ic', 'ov', 'ski', 'ek', 'an', 'ev', 'oz', 'ar', 'in', 'uk', 'ko', 'as']
  const first = pick(rng, firstSyllables) + pick(rng, firstEndings)
  const last = pick(rng, lastSyllables) + pick(rng, lastEndings)
  return `${first} ${last}`
}

const TEAM_COLORS = [
  { primary: '#FF0000', secondary: '#FFFFFF' }, // Red/White
  { primary: '#0000CC', secondary: '#FFFFFF' }, // Blue/White
  { primary: '#006600', secondary: '#FFFFFF' }, // Green/White
  { primary: '#FF6600', secondary: '#000000' }, // Orange/Black
  { primary: '#660066', secondary: '#FFFFFF' }, // Purple/White
  { primary: '#000000', secondary: '#FFFF00' }, // Black/Yellow
  { primary: '#CC0000', secondary: '#0000CC' }, // Red/Blue
  { primary: '#FFFFFF', secondary: '#000000' }, // White/Black
  { primary: '#006600', secondary: '#FFFF00' }, // Green/Yellow
  { primary: '#000066', secondary: '#FFFF00' }, // Navy/Yellow
  { primary: '#660000', secondary: '#FFFFFF' }, // Maroon/White
  { primary: '#006666', secondary: '#FFFFFF' }, // Teal/White
]

export function generateUniverse(seed = 42) {
  const rng = createRng(seed)

  const leagues = []
  const leagueCount = 5

  for (let l = 0; l < leagueCount; l++) {
    const country = generateCountryName(rng)
    const leagueName = pick(rng, LEAGUE_NAMES)
    const teamCount = 12 + Math.floor(rng() * 5) // 12-16 teams
    const teams = []

    // Shuffle colors so teams in same league have different colors
    const colorPool = [...TEAM_COLORS].sort(() => rng() - 0.5)

    for (let t = 0; t < teamCount; t++) {
      const city = generateCityName(rng)
      const suffix = pick(rng, TEAM_SUFFIXES)
      const rating = 1 + Math.floor(rng() * 5) // 1-5 stars
      const colors = colorPool[t % colorPool.length]

      // Generate 18-man squad
      const squad = []
      for (let p = 0; p < 18; p++) {
        squad.push(generatePlayerName(rng))
      }

      teams.push({
        id: `${l}-${t}`,
        name: `${city} ${suffix}`,
        shortName: city.slice(0, 3).toUpperCase(),
        rating,
        colors,
        squad,
      })
    }

    leagues.push({
      id: `league-${l}`,
      name: `${country} ${leagueName}`,
      country,
      teams,
      table: teams.map(team => ({
        teamId: team.id,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      })),
    })
  }

  return leagues
}
