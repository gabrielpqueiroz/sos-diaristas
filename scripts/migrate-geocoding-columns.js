// scripts/migrate-geocoding-columns.js
// Run: node scripts/migrate-geocoding-columns.js
// Adds lat, lng, geocoded_at columns to crm_orders (idempotent via IF NOT EXISTS)

process.loadEnvFile('.env.local')

import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const SQL = `
ALTER TABLE crm_orders
  ADD COLUMN IF NOT EXISTS lat NUMERIC,
  ADD COLUMN IF NOT EXISTS lng NUMERIC,
  ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
`

async function migrate() {
  console.log('Running migration: add lat, lng, geocoded_at to crm_orders...')
  await pool.query(SQL)
  console.log('Migration complete.')
  await pool.end()
}

migrate().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
