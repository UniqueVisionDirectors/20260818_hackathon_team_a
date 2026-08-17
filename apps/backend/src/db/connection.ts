import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { DB } from './generated-types.js'

const dialect = new PostgresDialect({
  pool: new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'password',
    database: process.env.DB_NAME ?? 'dev',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  })
})

export const db = new Kysely<DB>({ dialect })