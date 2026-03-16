<script>
  import { universe } from '../engine/universe.svelte.js';

  function getTeam(id) {
    return universe.activeLeague?.teams.find(t => t.id === id);
  }

  const rows = $derived(
    (universe.activeLeague?.table ?? [])
      .slice()
      .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst))
  );
</script>

<div class="table-wrap">
  <div class="header-row">
    <span class="pos">#</span>
    <span class="team-name">TEAM</span>
    <span class="stat">P</span>
    <span class="stat">W</span>
    <span class="stat">D</span>
    <span class="stat">L</span>
    <span class="stat">GD</span>
    <span class="stat pts">PTS</span>
  </div>
  {#each rows as row, i}
    {@const team = getTeam(row.teamId)}
    {#if team}
      <div class="table-row" class:top3={i < 3}>
        <span class="pos">{i + 1}</span>
        <span class="team-name">{team.shortName}</span>
        <span class="stat">{row.played}</span>
        <span class="stat">{row.won}</span>
        <span class="stat">{row.drawn}</span>
        <span class="stat">{row.lost}</span>
        <span class="stat">{row.goalsFor - row.goalsAgainst}</span>
        <span class="stat pts">{row.points}</span>
      </div>
    {/if}
  {/each}
</div>

<style>
  .table-wrap { padding: 0.25rem 0.5rem; font-size: 0.875rem; }

  .header-row, .table-row {
    display: grid;
    grid-template-columns: 2ch 4ch 2ch 2ch 2ch 2ch 3ch 3ch;
    gap: 0.4rem;
    padding: 0.05rem 0;
  }

  .header-row {
    color: var(--cyan);
    font-size: 0.75rem;
    border-bottom: 1px solid #336;
    padding-bottom: 0.2rem;
    margin-bottom: 0.1rem;
    letter-spacing: 0.05em;
  }

  .table-row { color: var(--text); }
  .table-row.top3 .pts { color: var(--yellow); }
  .table-row.top3 .team-name { color: var(--green); }

  .pos { color: #AAAAAA; }
  .stat { text-align: right; }
  .pts { font-weight: bold; }
  .team-name { letter-spacing: 0.05em; }
</style>
