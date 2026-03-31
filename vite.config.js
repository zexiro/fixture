import { defineConfig, loadEnv } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      svelte(),
      {
        name: 'football-api-proxy',
        configureServer(server) {
          server.middlewares.use('/api/football', async (req, res) => {
            const url = new URL(req.url, 'http://localhost')
            const path = url.searchParams.get('path')

            if (!path) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing path' }))
              return
            }

            const apiKey = env.FOOTBALL_DATA_KEY
            if (!apiKey) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Set FOOTBALL_DATA_KEY in .env' }))
              return
            }

            try {
              const upstream = await fetch(`https://api.football-data.org/v4${path}`, {
                headers: { 'X-Auth-Token': apiKey },
              })
              const data = await upstream.text()
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = upstream.status
              res.end(data)
            } catch (e) {
              res.statusCode = 502
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Proxy error' }))
            }
          })
        },
      },
    ],
  }
})
