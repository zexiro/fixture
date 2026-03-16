<script>
  import { onMount, onDestroy } from 'svelte';
  import { universe } from './lib/engine/universe.svelte.js';
  import MatchRow from './lib/components/MatchRow.svelte';
  import LeagueTable from './lib/components/LeagueTable.svelte';
  import MatchDetail from './lib/components/MatchDetail.svelte';

  let view = $state('results');
  let clock = $state('');
  let clockInterval;

  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clock = `${h}:${m}:${s}`;
  }

  onMount(() => {
    universe.init();
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
  });

  onDestroy(() => {
    universe.destroy();
    clearInterval(clockInterval);
  });

  const liveCount = $derived(universe.matches.filter(m => m.status === 'live').length);
  const ticker = $derived(universe.recentEvents.slice(0, 5));
</script>

<div class="ceefax">

  <!-- TOP BAR -->
  <div class="topbar">
    <span class="page-num">P300</span>
    <span class="title">FIXTURE</span>
    <span class="clock">{clock}</span>
  </div>

  <!-- HEADLINE -->
  <div class="headline">
    <span class="hl-left">MATCHDAY {universe.matchdayNumber}</span>
    <span class="hl-live">{liveCount > 0 ? `${liveCount} LIVE` : 'STANDINGS'}</span>
  </div>

  <!-- LEAGUE TABS -->
  <div class="league-tabs">
    {#each universe.leagues as league}
      <button
        class="ltab"
        class:active={league.id === universe.activeLeagueId}
        onclick={() => universe.setActiveLeague(league.id)}
      >
        {league.country.slice(0, 6).toUpperCase()}
      </button>
    {/each}
  </div>

  <!-- LEAGUE NAME -->
  <div class="league-name">{universe.activeLeague?.name ?? ''}</div>

  <!-- VIEW TOGGLE -->
  <div class="view-tabs">
    <button class="vtab" class:active={view === 'results'} onclick={() => view = 'results'}>RESULTS</button>
    <button class="vtab" class:active={view === 'table'} onclick={() => view = 'table'}>TABLE</button>
  </div>

  <!-- MAIN CONTENT -->
  <div class="main-content">
    {#if view === 'results'}
      <div class="results-col">
        {#each universe.activeMatches as match (match.id)}
          <MatchRow
            {match}
            selected={match.id === universe.selectedMatchId}
            onclick={() => universe.selectMatch(match.id === universe.selectedMatchId ? null : match.id)}
          />
        {/each}
      </div>
      {#if universe.selectedMatch}
        <div class="detail-col">
          <MatchDetail match={universe.selectedMatch} />
        </div>
      {/if}
    {:else}
      <LeagueTable />
    {/if}
  </div>

  <!-- TICKER -->
  {#if ticker.length > 0}
    <div class="ticker">
      {#each ticker as ev}
        {@const m = universe.matches.find(x => x.id === ev.matchId)}
        {#if m}
          <span class="tick-item">
            {#if ev.event.type === 'goal'}
              ⚽ {ev.event.player} ({m.homeTeam.shortName} {m.homeScore}-{m.awayScore} {m.awayTeam.shortName})
            {:else if ev.event.type === 'red'}
              🟥 {ev.event.player} ({m.homeTeam.shortName} v {m.awayTeam.shortName})
            {/if}
          </span>
        {/if}
      {/each}
    </div>
  {/if}

  <!-- FOOTER -->
  <div class="footer-bar">
    <span>P301 NEXT LEAGUE</span>
    <span>claudescorner.dev</span>
    <span>P100 INDEX</span>
  </div>

</div>

<style>
  .ceefax {
    background: var(--bg);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    max-width: 640px;
    margin: 0 auto;
    border-left: 4px solid #111;
    border-right: 4px solid #111;
  }

  .topbar {
    background: #000080;
    display: flex;
    justify-content: space-between;
    padding: 0.2rem 0.75rem;
    font-size: 1rem;
    border-bottom: 2px solid var(--yellow);
  }
  .page-num { color: var(--cyan); font-weight: bold; }
  .title { color: var(--yellow); font-weight: bold; letter-spacing: 0.3em; }
  .clock { color: var(--text); }

  .headline {
    background: #006600;
    display: flex;
    justify-content: space-between;
    padding: 0.15rem 0.75rem;
    font-size: 0.875rem;
    font-weight: bold;
  }
  .hl-left { color: var(--yellow); }
  .hl-live { color: var(--text); }

  .league-tabs {
    background: #000040;
    display: flex;
    padding: 0.2rem 0.5rem;
    gap: 0.25rem;
    border-bottom: 1px solid #336;
    flex-wrap: wrap;
  }
  .ltab {
    padding: 0.1rem 0.4rem;
    font-size: 0.75rem;
    color: #AAAAAA;
    border: 1px solid transparent;
    cursor: pointer;
    letter-spacing: 0.05em;
  }
  .ltab.active { color: var(--yellow); border-color: var(--yellow); background: #000060; }
  .ltab:hover:not(.active) { color: var(--text); }

  .league-name {
    padding: 0.15rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--cyan);
    letter-spacing: 0.05em;
    background: #000040;
  }

  .view-tabs {
    display: flex;
    border-bottom: 1px solid #336;
    background: #000060;
  }
  .vtab {
    padding: 0.25rem 1rem;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    color: #AAAAAA;
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }
  .vtab.active { color: var(--yellow); border-bottom-color: var(--yellow); }
  .vtab:hover:not(.active) { color: var(--text); }

  .main-content {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr;
    background: var(--bg);
    overflow: hidden;
  }

  .results-col { padding: 0.25rem 0; }
  .detail-col {
    border-top: 1px solid #336;
    background: #000060;
  }

  .ticker {
    background: #660000;
    padding: 0.2rem 0.75rem;
    font-size: 0.75rem;
    color: var(--yellow);
    display: flex;
    gap: 1.5rem;
    overflow: hidden;
    flex-wrap: wrap;
  }
  .tick-item { white-space: nowrap; }

  .footer-bar {
    background: #000040;
    display: flex;
    justify-content: space-between;
    padding: 0.2rem 0.75rem;
    font-size: 0.75rem;
    color: var(--cyan);
    border-top: 1px solid #336;
  }

  @media (min-width: 500px) {
    .main-content {
      grid-template-columns: 1fr 1fr;
    }
    .detail-col {
      border-top: none;
      border-left: 1px solid #336;
    }
  }
</style>
