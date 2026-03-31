export default async function handler(req, res) {
  const { path } = req.query;

  if (!path || (!path.startsWith('/competitions/') && !path.startsWith('/matches/'))) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  const apiKey = process.env.FOOTBALL_DATA_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  try {
    const upstream = await fetch(`https://api.football-data.org/v4${path}`, {
      headers: { 'X-Auth-Token': apiKey },
    });

    const data = await upstream.text();
    const ttl = path.includes('/matches') ? 60 : 300;

    res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=${ttl * 2}`);
    res.setHeader('Content-Type', 'application/json');
    res.status(upstream.status).end(data);
  } catch (e) {
    res.status(502).json({ error: 'Upstream error' });
  }
}
