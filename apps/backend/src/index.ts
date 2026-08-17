import { serve } from '@hono/node-server'
import { app } from './app.js'
import { migrateToLatest } from './db/migrate.js'
import { ensureBucketExists } from './utils/minio.js'

const port = parseInt(process.env.PORT ?? '3000')

// Run migrations on startup
async function startServer() {
  try {
    console.log('Running database migrations...')
    await migrateToLatest()
    console.log('Database migrations completed')
    await ensureBucketExists()
    console.log('Object storage initialization completed')
  } catch (error) {
    console.error('Failed to run migrations:', error)
    process.exit(1)
  }

  serve({
    fetch: app.fetch,
    port
  }, (info) => {
    console.log(`Server is running on http://localhost:${String(info.port)}`)
  })
}

await startServer()
