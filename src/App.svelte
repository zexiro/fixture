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
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
    universe.init();
  });

  onDestroy(() => {
    universe.destroy();
    clearInterval(clockInterval);
  });

  const liveCount = $derived(
    universe.activeMatches.filter(m => m.status === 'live' || m.status === 'halftime').length
  );

  const tickerItems = $derived(
    universe.activeMatches
      .filter(m => m.homeScore != null)
      .map(m => {
        const tag = m.status === 'live'
          ? (m.minute != null ? `${m.minute}\u2032` : '\u25CF')
          : m.status === 'halftime' ? 'HT' : 'FT';
        return `${m.homeTeam.shortName} ${m.homeScore}-${m.awayScore} ${m.awayTeam.shortName} ${tag}`;
      })
  );
</script>

<div class="ceefax">

  <!-- TOP BAR -->
  <div class="topbar">
    <span class="page-num">P300</span>
    <span class="title">FIXTURE</span>
    <span class="clock">{clock}</span>
  </div>

  {#if universe.loading && universe.leagues.every(l => !l.loaded)}
    <div class="status-screen">
      <span class="status-text">LOADING DATA...</span>
    </div>
  {:else if universe.error && universe.leagues.every(l => !l.loaded)}
    <div class="status-screen">
      <span class="error-text">
        {#if universe.error === 'RATE_LIMIT'}Rate limit reached — wait a moment
        {:else if universe.error === 'BAD_KEY'}Invalid API key
        {:else}Error: {universe.error}{/if}
      </span>
      <button class="retry-btn" onclick={() => universe.init()}>RETRY</button>
    </div>
  {:else}

    <!-- HEADLINE -->
    <div class="headline">
      <span class="hl-left">
        <button class="md-nav" onclick={() => universe.changeMatchday(-1)}>\u25C4</button>
        MATCHDAY {universe.matchdayNumber ?? '\u2014'}
        <button class="md-nav" onclick={() => universe.changeMatchday(1)}>\u25BA</button>
      </span>
      <span class="hl-live">
        {#if universe.loading}...
        {:else if liveCount > 0}{liveCount} LIVE
        {:else if universe.activeMatches.length > 0 && universe.activeMatches.every(m => m.status === 'fulltime')}RESULTS
        {:else}FIXTURES{/if}
      </span>
    </div>

    <!-- LEAGUE TABS -->
    <div class="league-tabs">
      {#each universe.leagues as league}
        <button
          class="ltab"
          class:active={league.id === universe.activeLeagueId}
          onclick={() => universe.setActiveLeague(league.id)}
        >
          {league.tab}
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
          {#if universe.activeMatches.length === 0}
            <div class="no-matches">{universe.loading ? 'LOADING...' : 'No matches for this matchday'}</div>
          {:else}
            {#each universe.activeMatches as match (match.id)}
              <MatchRow
                {match}
                selected={match.id === universe.selectedMatchId}
                onclick={() => universe.selectMatch(match.id === universe.selectedMatchId ? null : match.id)}
              />
            {/each}
          {/if}
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
    {#if tickerItems.length > 0}
      <div class="ticker">
        {#each tickerItems as item}
          <span class="tick-item">{item}</span>
        {/each}
      </div>
    {/if}

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

  .status-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 2rem;
  }
  .status-text { color: var(--yellow); font-size: 0.875rem; letter-spacing: 0.1em; }
  .error-text { color: var(--red); font-size: 0.875rem; text-align: center; }
  .retry-btn {
    background: #003300;
    color: var(--green);
    border: 1px solid var(--green);
    padding: 0.3rem 1.2rem;
    font-size: 0.8125rem;
    letter-spacing: 0.1em;
    cursor: pointer;
  }
  .retry-btn:hover { background: #004400; }

  .headline {
    background: #006600;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.15rem 0.75rem;
    font-size: 0.875rem;
    font-weight: bold;
  }
  .hl-left { color: var(--yellow); display: flex; align-items: center; gap: 0.4rem; }
  .hl-live { color: var(--text); }
  .md-nav {
    font-size: 0.75rem;
    color: var(--text);
    cursor: pointer;
    padding: 0 0.2rem;
    opacity: 0.7;
  }
  .md-nav:hover { opacity: 1; color: var(--yellow); }

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

  .no-matches {
    color: #AAAAAA;
    font-size: 0.8125rem;
    padding: 1rem 0.75rem;
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
