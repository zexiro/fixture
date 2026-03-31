<script>
  let { match, onclick, selected } = $props();

  function statusLabel(m) {
    if (m.status === 'upcoming') {
      if (m.utcDate) {
        const d = new Date(m.utcDate);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      return '  -  ';
    }
    if (m.status === 'halftime') return ' HT  ';
    if (m.status === 'fulltime') return ' FT  ';
    if (m.status === 'postponed') return ' PP  ';
    if (m.status === 'cancelled') return ' CAN ';
    if (m.minute != null) return `${String(m.minute).padStart(2, ' ')}'   `;
    return 'LIVE ';
  }

  function scoreStr(m) {
    if (m.homeScore == null || m.awayScore == null) return '   v   ';
    return `  ${m.homeScore} - ${m.awayScore}  `;
  }
</script>

<button
  class="row"
  class:selected
  class:live={match.status === 'live'}
  class:halftime={match.status === 'halftime'}
  class:fulltime={match.status === 'fulltime'}
  onclick={onclick}
  aria-label="{match.homeTeam.name} vs {match.awayTeam.name}"
>
  <span class="home">{match.homeTeam.shortName}</span>
  <span class="score">{scoreStr(match)}</span>
  <span class="away">{match.awayTeam.shortName}</span>
  <span class="status">{statusLabel(match)}</span>
</button>

<style>
  .row {
    display: grid;
    grid-template-columns: 3ch 9ch 3ch 6ch;
    align-items: center;
    padding: 0.1rem 0.5rem;
    width: 100%;
    text-align: left;
    font-size: 0.9375rem;
    cursor: pointer;
    color: var(--text);
    letter-spacing: 0.03em;
  }

  .row:hover, .row.selected { background: #004080; }
  .row.live .score { color: var(--yellow); }
  .row.fulltime .score { color: var(--cyan); }
  .row.halftime .score { color: var(--magenta); }

  .home { color: var(--text); text-align: right; }
  .away { color: var(--text); }
  .score { text-align: center; font-weight: bold; }
  .status { color: #AAAAAA; font-size: 0.75rem; }
</style>
