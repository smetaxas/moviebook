import api from './axios'

// Same purpose as movieCache: /movies/person/:id fetches a bio + full
// filmography from TMDB, which is slow enough to be worth caching and
// prefetching on hover so the person page can open instantly.
//
// Cached per (personId, role) — role picks which credit list the backend
// treats as "movies this person participated in" (acting vs directing), so
// the same person visited both ways must not share one cache entry.
const cache = new Map()
const inFlight = new Map()

function cacheKey(personId, role) {
  return `${personId}:${role || ''}`
}

export function getCachedPerson(personId, role) {
  return cache.get(cacheKey(personId, role)) || null
}

export function fetchPerson(personId, role) {
  const key = cacheKey(personId, role)
  if (cache.has(key)) return Promise.resolve(cache.get(key))
  if (inFlight.has(key)) return inFlight.get(key)

  const promise = api.get(`/movies/person/${personId}`, { params: role ? { role } : {} })
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

export function prefetchPerson(personId, role) {
  if (!personId) return
  fetchPerson(personId, role).catch(() => {})
}
