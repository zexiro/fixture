<script>
  let { match } = $props();

  const eventIcons = { goal: '\u26BD', yellow: '\uD83D\uDFE8', red: '\uD83D\uDFE5', sub: '\u2195' };

  function minuteStr(m) {
    if (m.status === 'upcoming') {
      if (m.utcDate) {
        const d = new Date(m.utcDate);
        return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) +
          ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      }
      return 'Kick off TBC';
    }
    if (m.status === 'halftime') return 'Half Time';
    if (m.status === 'fulltime') return 'Full Time';
    if (m.status === 'postponed') return 'Postponed';
    if (m.minute != null) return `${m.minute}'`;
    return 'Live';
  }
</script>

<div class="detail">
  <div class="match-header">
    <span class="team home">{match.homeTeam.displayName ?? match.homeTeam.name}</span>
    <span class="scoreline">
      {#if match.homeScore != null}
        <span class="goals">{match.homeScore} - {match.awayScore}</span>
      {:else}
        <span class="vs">v</span>
      {/if}
    </span>
    <span class="team away">{match.awayTeam.displayName ?? match.awayTeam.name}</span>
  </div>

  <div class="match-status">{minuteStr(match)}</div>

  {#if match.eventsLoaded && match.events.length > 0}
    <div class="events">
      <div class="events-header">MATCH EVENTS</div>
      {#each [...match.events].reverse() as ev}
        <div class="event" class:goal={ev.type === 'goal'}>
          <span class="ev-min">{ev.minute}'</span>
          <span class="ev-icon">{eventIcons[ev.type] ?? '\u00B7'}</span>
          <span class="ev-player">
            {ev.player}
            {#if ev.detail}<span class="ev-detail">({ev.detail})</span>{/if}
          </span>
          <span class="ev-team">({ev.team === 'home' ? match.homeTeam.shortName : match.awayTeam.shortName})</span>
        </div>
      {/each}
    </div>
  {:else if match.eventsLoaded}
    <div class="no-events">No events recorded</div>
  {:else if match.status !== 'upcoming'}
    <div class="no-events loading-events">Loading events...</div>
  {/if}
</div>

<style>
  .detail { padding: 0.5rem; font-size: 0.875rem; }

  .match-header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 0.5rem;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #336;
    margin-bottom: 0.35rem;
  }

  .team { font-size: 0.8125rem; color: var(--cyan); }
  .home { text-align: right; }
  .away { text-align: left; }

  .scoreline { text-align: center; }
  .goals { font-size: 1.25rem; color: var(--yellow); font-weight: bold; }
  .vs { color: #AAAAAA; }

  .match-status {
    text-align: center;
    font-size: 0.75rem;
    color: var(--green);
    letter-spacing: 0.1em;
    margin-bottom: 0.5rem;
  }

  .events-header {
    font-size: 0.6875rem;
    color: var(--magenta);
    letter-spacing: 0.1em;
    margin-bottom: 0.25rem;
  }

  .event {
    display: flex;
    gap: 0.4rem;
    padding: 0.05rem 0;
    color: #CCCCCC;
    font-size: 0.8125rem;
  }

  .event.goal { color: var(--yellow); }
  .ev-min { color: #AAAAAA; width: 3ch; flex-shrink: 0; }
  .ev-team { color: #AAAAAA; }
  .ev-detail { color: #AAAAAA; font-size: 0.75rem; margin-left: 0.2rem; }

  .no-events { color: #666; font-size: 0.8125rem; padding: 0.5rem 0; }
  .loading-events { color: #AAAAAA; }
</style>
