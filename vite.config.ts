/// <reference types="vitest/config" />
import { existsSync } from 'node:fs'
import path from 'node:path'
import type { IncomingMessage } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Local development only: serves /api/* by calling the same Vercel Function
 * handlers that run in production (files under api/). Not used in builds.
 */
function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      // Server-side secrets from .env (no VITE_ prefix, so never sent to the browser)
      Object.assign(process.env, loadEnv(server.config.mode, process.cwd(), ''))

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        const base = path.join(process.cwd(), url.pathname)
        const file = [`${base}.ts`, path.join(base, 'index.ts')].find((f) => existsSync(f))
        if (!file) {
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { code: 'NOT_FOUND', message: 'הנתיב לא נמצא' } }))
          return
        }

        try {
          const mod = await server.ssrLoadModule(file)
          const handler = mod[req.method ?? 'GET'] as ((r: Request) => Promise<Response>) | undefined
          const request = await toWebRequest(req, url)
          const response = handler
            ? await handler(request)
            : Response.json(
                { error: { code: 'METHOD_NOT_ALLOWED', message: 'פעולה לא נתמכת' } },
                { status: 405 },
              )
          res.statusCode = response.status
          response.headers.forEach((value, key) => res.setHeader(key, value))
          res.end(Buffer.from(await response.arrayBuffer()))
        } catch (err) {
          server.config.logger.error(String(err))
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'שגיאת שרת' } }))
        }
      })
    },
  }
}

async function toWebRequest(req: IncomingMessage, url: URL): Promise<Request> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  const body = chunks.length ? Buffer.concat(chunks) : undefined
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
  }
  return new Request(url, {
    method: req.method,
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body,
  })
}

export default defineConfig({
  plugins: [react(), devApi()],
  test: {
    environment: 'node',
  },
})
