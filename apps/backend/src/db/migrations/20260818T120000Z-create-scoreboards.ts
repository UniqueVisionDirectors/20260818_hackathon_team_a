import { sql } from 'kysely';
import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('scoreboards')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('nickname', 'varchar(255)', (col) => col.notNull())
    .addColumn('score', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('scoreboards').execute();
}
