# Fixture — Plan

## Overview

**Fixture** is a procedurally generated live football results service rendered in the aesthetic of old Ceefax/teletext pages. Multiple fictional leagues run simultaneously, with matches ticking through 90 simulated minutes in real time. Goals, cards, and substitutions fire probabilistically. League tables update live.

The experience is somewhere between a data visualisation and a hypnotic toy — the kind of thing you open in the corner of your screen and glance at every few minutes to see what's happening in the fictional Fourth Division of Ostravica.

**Who it's for:** Anyone who grew up checking Ceefax page 302 on a Saturday afternoon, or who finds the rhythm of live scores oddly soothing.

**Why it's interesting:** It asks "what if there were infinite football leagues playing right now, in countries that don't exist?" and then answers it seriously, in the exact visual language of the BBC's teletext service from 1974.

---

## Features & Interactions

### Core Experience
- **Score ticker** — horizontal scrolling or static band at the top showing all live match scores from all leagues, updating in real time
- **League selector** — sidebar or tab navigation to switch between 5 fictional leagues
- **Fixtures/Results view** — current matchday showing all fixtures with live scores and match minute
- **League table** — automatically updating as results come in
- **Match detail** — click any live match to see a real-time commentary feed (goal scorers, cards, match minute)
- **Completed matches** — once a match ends, score is shown as full time; table is finalized

### Match Simulation
- 90 simulated minutes per match, compressed to ~12 real-world minutes
- Tick rate: 1 simulated minute ≈ ~8 real seconds
- Events fire stochastically:
  - Goal: ~1.8 expected goals per team per 90min (weighted by team rating)
  - Yellow card: ~2 per team per 90min
  - Red card: rare (~0.1 per team per 90min), more likely after yellow
  - Substitution: 2-3 per team in second half
- Half-time: real pause at 45+stoppage, resumes after short interval
- Stoppage time: 1-5 minutes added at end of each half

### League Structure
- 5 fictional leagues from fictional countries
- Each league: 12-16 teams
- Current matchday: 6-8 matches playing simultaneously
- Matches stagger starts (not all kick off at once) to keep the ticker interesting
- Once a matchday completes, next matchday begins after a short "break"

---

## Visual Design

### Aesthetic: Modern Ceefax
Not a slavish pixel-perfect replica, but a loving interpretation — the *feeling* of teletext without the resolution constraints.

**Color palette:**
- Background: `#000000` pure black
- Primary text: `#FFFFFF` white
- Cyan: `#00FFFF` — headers, active states, live match indicator
- Yellow: `#FFFF00` — scores, goals, highlights
- Magenta: `#FF00FF` — page numbers, decorative
- Green: `#00FF00` — wins, positive stats
- Red: `#FF4444` — red cards, losses
- Blue: `#4444FF` — draws (replaces true #0000FF which is too dark)

**Typography:**
- Monospace throughout — `ui-monospace, 'Courier New', monospace`
- Large blocky "FIXTURE" header using CSS-styled block characters
- All-caps section headers
- Fixed-width layout so columns align perfectly

**Layout:**
- Full-screen, no scrolling on desktop
- Header row: "FIXTURE" branding + page-style number (e.g., "P.302") + clock
- Subtitle: "LIVE FOOTBALL RESULTS" in cyan
- Main content split: left ~65% fixtures/table, right ~35% match detail/commentary
- Footer: ticker scrolling all live scores

**Animations:**
- Score change: brief flash of yellow on the changed score
- New event in commentary: slides in from top
- Scanline overlay: subtle CSS repeating-linear-gradient scanlines at ~5% opacity
- Live "●" indicator pulsing in red next to live matches

**No gradients. No shadows. Flat, pure colours on black.**

---

## Information Architecture

```
App
├── Header (FIXTURE branding, clock, page number)
├── LeagueNav (tabs for 5 leagues)
├── MainPanel
│   ├── FixturesPanel (left)
│   │   ├── LiveMatches (list)
│   │   └── LeagueTable
│   └── DetailPanel (right)
│       ├── MatchDetail (if selected)
│       │   ├── Scoreline
│       │   └── CommentaryFeed
│       └── StandingsDetail (if no match selected)
├── ScoreTicker (bottom)
└── AudioToggle
```

---

## Technical Architecture

### File Structure
```
fixture/
├── src/
│   ├── App.svelte              # Root layout
│   ├── main.js
│   ├── lib/
│   │   ├── engine/
│   │   │   ├── generator.js    # Team/league name generation
│   │   │   ├── simulation.js   # Match simulation tick engine
│   │   │   └── scheduler.js    # Matchday scheduling
│   │   ├── stores/
│   │   │   └── universe.svelte.js  # Svelte 5 runes-based state
│   │   ├── audio/
│   │   │   └── stadium.js      # Web Audio stadium ambience
│   │   └── components/
│   │       ├── Header.svelte
│   │       ├── LeagueNav.svelte
│   │       ├── FixturesList.svelte
│   │       ├── LeagueTable.svelte
│   │       ├── MatchDetail.svelte
│   │       ├── CommentaryFeed.svelte
│   │       └── ScoreTicker.svelte
│   └── styles/
│       └── global.css
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

### State Management (Svelte 5 Runes)
```js
// universe.svelte.js
let leagues = $state([...])    // All league data
let matches = $state([...])    // All current matches
let selectedMatch = $state(null)
let clock = $state({ tick: 0 })
```

### Simulation Engine
- `setInterval` at ~1000ms = 1 simulated minute
- Each tick: iterate all live matches, roll dice for events
- Event probability model:
  ```
  P(goal in 1 min) = team_attack_rating * 0.02 * phase_modifier
  phase_modifier: 85-94min = 1.5x (late drama), 0-5min = 1.2x (early pressure)
  ```
- Events stored as array on match: `{ minute, type, team, player, detail }`

### Name Generator
- Countries: phoneme-based generator (~50 fictional countries)
- Cities: independent phoneme generator
- Team suffixes: City, United, Athletic, Rovers, Wanderers, FC, Town, Olympic, Sporting, Racing
- Player names: first name + surname from separate phoneme pools (locale-flavored per country)
- League names: "[Country] [Division name]" — Premier League, First Division, Superliga, Liga, Championship

---

## Audio System

Web Audio API — no files loaded, all synthesised:
- **Crowd ambience**: filtered noise + slow modulation, fades in on page load
- **Goal roar**: burst of amplitude + high-pass filter sweep, 3-second duration
- **Whistle**: short sine wave chirp (half-time, full-time)
- **Ticker click**: subtle hi-hat-style click when score updates

Toggle button — audio starts only after user interaction (browser policy).

---

## Accessibility Plan
- All match data in semantic `<table>` elements with proper `<caption>`, `<th scope>`
- Commentary feed uses `role="log" aria-live="polite"`
- League nav uses `role="tablist"` / `role="tab"` pattern
- Score changes announced via `aria-live="assertive"` in a visually-hidden region
- Keyboard: Tab through leagues, Enter to select, Arrow keys in match list
- `prefers-reduced-motion`: disable score flash animations, keep data updates
- `prefers-color-scheme`: already dark, so fine as-is
- Contrast: all text meets WCAG AA on black background

---

## Responsive Strategy
- **Desktop (>900px)**: Two-column layout (fixtures + detail panel side by side)
- **Tablet (600-900px)**: Single column, detail panel below fixtures, slightly smaller text
- **Mobile (<600px)**: Full single column, ticker scrolls horizontally, table condensed to 5 columns (P W D L Pts)
- Font size scales with viewport: base 14px mobile → 16px desktop

---

## Edge Cases
- **First load**: Matches already ~20min in (so you see live scores immediately, not 0-0 kickoffs)
- **All matches finished**: Brief "FULL TIME — MATCHDAY COMPLETE" screen, then new matchday begins
- **No match selected**: Detail panel shows league standings in full
- **Very fast ticking**: If browser tab is backgrounded, simulation catches up on focus
- **Audio blocked**: Graceful degradation, no error shown, toggle button just doesn't activate

---

## Performance Budget
- Target bundle: <150KB gzipped (no heavy deps)
- No external fonts (system monospace)
- No images (pure CSS/Unicode)
- 60fps animations via CSS transitions only, no JS animation loops
- Simulation runs in main thread (no worker needed at this scale — 8 concurrent matches max)
- Memory: match history capped at 500 events per match to prevent unbounded growth
