import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../db/schema'

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function useDb() {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL fehlt')
    const pool = new pg.Pool({
      connectionString: url,
      // Serverless: wenige Verbindungen pro Instanz, Neon-Pooler übernimmt den Rest
      max: 3,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: true }
    })
    _db = drizzle(pool, { schema })
  }
  return _db
}

export { schema }
