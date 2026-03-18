// scripts/geocode-backfill.js
// Run: node scripts/geocode-backfill.js
// Run (dry-run): node scripts/geocode-backfill.js --dry-run
//
// Geocodes all crm_orders where lat IS NULL and address IS NOT NULL.
// Writes lat, lng, geocoded_at back to each matching row.
// Enforces 1 req/s to respect Nominatim usage policy.

process.loadEnvFile('.env.local')

import pg from 'pg'
import { geocodeAddress } from '../src/lib/geocode.js'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const DRY_RUN = process.argv.includes('--dry-run')

// Rate limiter — enforces at least 1000ms between requests
function createThrottle(minGapMs = 1000) {
  let lastAt = 0
  return async function throttle() {
    const now = Date.now()
    const wait = minGapMs - (now - lastAt)
    if (wait > 0) await new Promise(r => setTimeout(r, wait))
    lastAt = Date.now()
  }
}

async function run() {
  if (DRY_RUN) {
    console.log('[DRY RUN] No database writes will be made.')
  }

  const result = await pool.query(
    `SELECT id, address FROM crm_orders WHERE lat IS NULL AND address IS NOT NULL ORDER BY created_at DESC`
  )
  const orders = result.rows
  const total = orders.length

  console.log(`Found ${total} orders to geocode`)

  if (total === 0) {
    console.log('Nothing to do.')
    await pool.end()
    process.exit(0)
  }

  const throttle = createThrottle(1000)
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const idx = i + 1

    try {
      await throttle()
      const coords = await geocodeAddress(order.address)

      if (coords) {
        if (!DRY_RUN) {
          await pool.query(
            `UPDATE crm_orders SET lat=$1, lng=$2, geocoded_at=NOW() WHERE id=$3`,
            [coords.lat, coords.lng, order.id]
          )
        }
        successCount++
        console.log(
          `${DRY_RUN ? '[DRY RUN] ' : ''}[${idx}/${total}] ${order.address} -> ${coords.lat},${coords.lng}`
        )
      } else {
        failCount++
        console.log(`[${idx}/${total}] ${order.address} -> NOT FOUND`)
        console.log(`[SKIP] Order ${order.id}: no result for '${order.address}'`)
      }
    } catch (err) {
      failCount++
      console.error(`[${idx}/${total}] Error processing order ${order.id}: ${err.message}`)
    }
  }

  const percent = total > 0 ? Math.round((successCount / total) * 100) : 0
  console.log('')
  console.log(`Done. Geocoded: ${successCount}/${total} (${percent}%). Failed: ${failCount} addresses.`)

  await pool.end()
  process.exit(0)
}

run().catch(err => {
  console.error('Backfill failed:', err.message)
  process.exit(1)
})
