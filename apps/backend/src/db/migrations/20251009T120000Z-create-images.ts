import type { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('images')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('file_key', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('original_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('mime_type', 'varchar(100)', (col) => col.notNull())
    .addColumn('size', 'bigint', (col) => col.notNull())
    .addColumn('user_id', 'uuid', (col) =>
      col.references('users.id').onDelete('set null')
    )
    .addColumn('created_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull()
    )
    .execute();

  // インデックス作成
  await db.schema
    .createIndex('idx_images_file_key')
    .on('images')
    .column('file_key')
    .execute();

  await db.schema
    .createIndex('idx_images_user_id')
    .on('images')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_images_created_at')
    .on('images')
    .columns(['created_at'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_images_created_at').execute();
  await db.schema.dropIndex('idx_images_user_id').execute();
  await db.schema.dropIndex('idx_images_file_key').execute();
  await db.schema.dropTable('images').execute();
}
