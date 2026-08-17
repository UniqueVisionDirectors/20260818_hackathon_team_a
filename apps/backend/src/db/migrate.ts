import * as path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import {
  Migrator,
  FileMigrationProvider,
  type MigrationResultSet,
} from 'kysely/migration'
import { db } from './connection.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function migrateToLatest(): Promise<MigrationResultSet> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`Migration "${it.migrationName}" was executed successfully`)
    } else if (it.status === 'Error') {
      console.error(`Failed to execute migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('Failed to migrate')
    console.error(error)
    throw error instanceof Error ? error : new Error('Failed to migrate', { cause: error })
  }

  return { error, results }
}

export async function migrateDown(): Promise<MigrationResultSet> {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateDown()

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`Migration "${it.migrationName}" was rolled back successfully`)
    } else if (it.status === 'Error') {
      console.error(`Failed to rollback migration "${it.migrationName}"`)
    }
  })

  if (error) {
    console.error('Failed to rollback')
    console.error(error)
    throw error instanceof Error ? error : new Error('Failed to rollback', { cause: error })
  }

  return { error, results }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1] ?? ''}`) {
  const command = process.argv[2]
  
  try {
    if (command === 'down') {
      await migrateDown()
      console.log('Migration rollback completed')
    } else {
      await migrateToLatest()
      console.log('Migrations completed')
    }
    await db.destroy()
  } catch (error) {
    console.error('Migration failed:', error)
    await db.destroy()
    process.exit(1)
  }
}
