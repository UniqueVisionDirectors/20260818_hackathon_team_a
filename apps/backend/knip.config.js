export default {
  $schema: 'https://unpkg.com/knip@latest/schema.json',
  entry: [
    'src/db/migrations/*.ts',
    '.config/kysely.config.ts',
  ],
  project: ['src/**/*.ts', '.config/**/*.ts'],
  ignoreExportsUsedInFile: { interface: true, type: true },
}
