// Spielt die Drizzle-Migrationen ein. Läuft vor jedem Build (auch in Vercel-Vorschauen,
// dort zeigt DATABASE_URL auf den eigenen Neon-Preview-Branch).
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

const url = process.env.DATABASE_URL
if (!url) {
  console.log('[migrate] DATABASE_URL fehlt – Migration übersprungen')
  process.exit(0)
}

const pool = new pg.Pool({
  connectionString: url,
  ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true }
})
await migrate(drizzle(pool), { migrationsFolder: './server/db/migrations' })
await pool.end()
console.log('[migrate] fertig')
