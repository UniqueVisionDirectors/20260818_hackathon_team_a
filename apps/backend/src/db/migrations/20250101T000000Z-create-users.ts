import type { Kysely } from 'kysely'
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('active', 'boolean', (col) => col.defaultTo(true).notNull())
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute()

  // Create index for email
  await db.schema.createIndex('idx_users_email')
    .on('users')
    .column('email')
    .execute()

  // Insert initial data with demo accounts
  // Password for all accounts: password123
  const passwordHash = '$2b$10$TIMlZeMFkb9hYdp8EtHPTutZ/vXQEHG.CyAoJ/GF/W7LXS103hltS'

  await db
    .insertInto('users')
    .values([
      { name: 'Test User 1', email: 'test1@example.com', password_hash: passwordHash, active: true },
      { name: 'Test User 2', email: 'test2@example.com', password_hash: passwordHash, active: true }
    ])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_users_email').execute()
  await db.schema.dropTable('users').execute()
}