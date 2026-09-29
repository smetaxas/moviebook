import api from './axios'

// In-memory cache for the (fairly expensive — TMDB + community rating)
// /movies/tmdb/:id response, keyed by tmdb_id. Lets a movie already opened
// once this session reopen instantly, and lets callers prefetch on hover
// so by the time a poster is clicked the data is often already in hand.
const cache = new Map()
const inFlight = new Map()

export function getCachedMovie(tmdbId) {
  return cache.get(String(tmdbId)) || null
}

export function fetchMovie(tmdbId) {
  const key = String(tmdbId)
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (inFlight.has(key)) return inFlight.get(key)

  const promise = api.get(`/movies/tmdb/${key}`)
    .then(res => {
      cache.set(key, res.data)
      inFlight.delete(key)
      return res.data
    })
    .catch(err => {
      inFlight.delete(key)
      throw err
    })

  inFlight.set(key, promise)
  return promise
}

export function prefetchMovie(tmdbId) {
  if (!tmdbId) return
  fetchMovie(tmdbId).catch(() => {})
}
