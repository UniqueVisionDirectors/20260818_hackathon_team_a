import { PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { defineConfig } from 'kysely-ctl'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from parent .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export default defineConfig({
	dialect: new PostgresDialect({
		pool: new Pool({
			connectionString: process.env.DATABASE_URL,
		})
	}),
	migrations: {
		migrationFolder: '../src/db/migrations',
		// Custom migration prefix function to use ISO 8601 format
		getMigrationPrefix: () => {
			const now = new Date()
			return now.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z-'
		},
	},
	//   plugins: [],
	//   seeds: {
	//     seedFolder: "seeds",
	//   }
})
