import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { imagetools } from 'vite-imagetools'

function vercelApiDevPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ? new URL(req.url, 'http://localhost') : null
        if (url && (url.pathname === '/api/photos' || url.pathname === '/api/photos/')) {
          try {
            // Ensure BLOB_READ_WRITE_TOKEN is available in process.env for @vercel/blob
            if (env.BLOB_READ_WRITE_TOKEN) {
              process.env.BLOB_READ_WRITE_TOKEN = env.BLOB_READ_WRITE_TOKEN
            }

            const mod = await server.ssrLoadModule('/api/photos.ts')
            const response: Response = await mod.default()
            res.statusCode = response.status
            response.headers.forEach((value, key) => {
              res.setHeader(key, value)
            })
            const body = await response.text()
            res.end(body)
          } catch (err: unknown) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            const message = err instanceof Error ? err.message : 'Internal Server Error'
            res.end(JSON.stringify({ error: message }))
          }
          return
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vercelApiDevPlugin(env),
      vue(),
      vueDevTools(),
      tailwindcss(),
      imagetools(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})