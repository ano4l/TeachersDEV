import pg from 'pg'
import type { Config } from '../config.js'

export function createPool(config: Config) {
  return new pg.Pool({
    connectionString: config.DATABASE_URL,
    ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 10,
  })
}

export type DbPool = ReturnType<typeof createPool>

