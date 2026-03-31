<script>
  import { setApiKey } from '../api/football.js';

  let { onconnect } = $props();
  let key = $state('');
  let error = $state('');
  let testing = $state(false);

  async function submit() {
    const trimmed = key.trim();
    if (!trimmed) return;

    testing = true;
    error = '';

    try {
      const res = await fetch('https://api.football-data.org/v4/competitions/PL', {
        headers: { 'X-Auth-Token': trimmed },
      });

      if (res.status === 403) {
        error = 'Invalid API key. Check and try again.';
        testing = false;
        return;
      }

      if (!res.ok) {
        error = `API error: ${res.status}`;
        testing = false;
        return;
      }

      setApiKey(trimmed);
      onconnect();
    } catch (e) {
      error = 'Network error. Check your connection.';
    } finally {
      testing = false;
    }
  }
</script>

<div class="setup">
  <div class="setup-title">FIXTURE — SETUP</div>

  <p class="info">
    This service shows live football
    scores from <span class="hl">football-data.org</span>
  </p>

  <p class="info">
    Register for a free API key
    <span class="dim">(no card required)</span>:
  </p>

  <a class="link" href="https://www.football-data.org/client/register" target="_blank" rel="noopener">
    football-data.org/client/register
  </a>

  <form onsubmit={(e) => { e.preventDefault(); submit(); }}>
    <label class="label" for="api-key-input">ENTER API KEY:</label>
    <input
      id="api-key-input"
      class="input"
      type="text"
      bind:value={key}
      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      disabled={testing}
      spellcheck="false"
      autocomplete="off"
    />

    {#if error}
      <div class="error">{error}</div>
    {/if}

    <button class="btn" type="submit" disabled={testing || !key.trim()}>
      {testing ? 'TESTING...' : 'CONNECT'}
    </button>
  </form>
</div>

<style>
  .setup {
    padding: 1.5rem 1rem;
    max-width: 420px;
    margin: 0 auto;
  }

  .setup-title {
    color: var(--yellow);
    font-size: 1rem;
    font-weight: bold;
    letter-spacing: 0.2em;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid #336;
    padding-bottom: 0.5rem;
  }

  .info {
    color: var(--text);
    font-size: 0.8125rem;
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .hl { color: var(--cyan); }
  .dim { color: #AAAAAA; }

  .link {
    display: block;
    color: var(--green);
    font-size: 0.8125rem;
    margin-bottom: 1.5rem;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .label {
    display: block;
    color: var(--cyan);
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    margin-bottom: 0.35rem;
  }

  .input {
    width: 100%;
    background: #000040;
    border: 1px solid #336;
    color: var(--yellow);
    font-family: var(--font);
    font-size: 0.8125rem;
    padding: 0.4rem 0.5rem;
    margin-bottom: 0.5rem;
    outline: none;
  }
  .input:focus { border-color: var(--cyan); }
  .input::placeholder { color: #444; }

  .error {
    color: var(--red);
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }

  .btn {
    background: #003300;
    color: var(--green);
    border: 1px solid var(--green);
    padding: 0.35rem 1.5rem;
    font-size: 0.8125rem;
    letter-spacing: 0.1em;
    cursor: pointer;
  }
  .btn:hover:not(:disabled) { background: #004400; }
  .btn:disabled { opacity: 0.4; cursor: default; }
</style>
