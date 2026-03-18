// src/lib/geocode.js
// Geocoding via Nominatim (OpenStreetMap) — no API key, free, rate limit 1 req/s
// Caller is responsible for spacing requests (do NOT call in parallel).

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'sos-diaristas/1.0 (sistemasos.queirozautomacoes.com.br)'

/**
 * Geocode an address in Foz do Iguacu, Brazil.
 * Returns { lat: number, lng: number } or null if not found.
 * Does NOT rate-limit — caller is responsible for spacing requests.
 *
 * @param {string} address - Free-form address string (complement after first comma is stripped)
 * @returns {Promise<{lat: number, lng: number}|null>}
 */
export async function geocodeAddress(address) {
  if (!address || address.trim().length < 3) return null

  const normalized = normalizeAddress(address)

  const params = new URLSearchParams({
    street: normalized,
    city: 'Foz do Iguacu',
    format: 'json',
    limit: '1',
    countrycodes: 'br',
  })

  const url = `${NOMINATIM_BASE}?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    if (!response.ok) return null

    const results = await response.json()

    if (!results || results.length === 0) return null

    // Nominatim returns `lon` (not `lng`) — map explicitly to avoid undefined
    const { lat, lon } = results[0]
    return { lat: parseFloat(lat), lng: parseFloat(lon) }
  } catch {
    return null
  }
}

/**
 * Normalize Brazilian address strings before geocoding.
 * Strips complement/neighbourhood info after the first comma so Nominatim's
 * structured `street=` parameter receives only the street name and number.
 *
 * Example: "Rua Xavier da Silva 100, Apto 3, Vila A" -> "Rua Xavier da Silva 100"
 *
 * @param {string} address
 * @returns {string}
 */
function normalizeAddress(address) {
  return address
    .trim()
    // Remove complement info after comma (e.g., "Rua X 123, apto 2, bairro")
    // Keep only "Rua X 123" — structured query handles city separately
    .split(',')[0]
    .trim()
}
