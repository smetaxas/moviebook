const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const WatchedMovie = require('../models/WatchedMovie');
const requireAuth = require('../middleware/auth');
const { getDirectOffers, providerNamesMatch } = require('../utils/justwatch');

// Search movies via TMDB
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=en-US&sort_by=release_date.desc`
    );
    const data = await response.json();
    // TMDB's own order is by relevance (the film you meant first); newest-first
    // buried it under obscure shorts with the same words in the title. Only
    // poster-less entries — almost always those — are moved to the end.
    const movies = (data.results || [])
      .sort((a, b) => Number(!a.poster_path) - Number(!b.poster_path))
      .map(movie => ({
        tmdb_id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        description: movie.overview,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
      }));
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Search actors/directors via TMDB — feeds the search modal's People tab
router.get('/search/people', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const response = await fetch(
      `https://api.themoviedb.org/3/search/person?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=en-US`
    );
    const data = await response.json();
    const people = (data.results || [])
      // No profile photo usually means too obscure/mismatched a result to
      // be worth showing (TMDB's person search is fairly permissive).
      .filter(person => person.profile_path)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 20)
      .map(person => ({
        id: person.id,
        name: person.name,
        profile_url: `https://image.tmdb.org/t/p/w185${person.profile_path}`,
        department: person.known_for_department === 'Directing' ? 'Director' : 'Actor',
        known_for: (person.known_for || [])
          .filter(credit => credit.media_type === 'movie' && credit.title)
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 3)
          .map(credit => credit.title)
          .join(', ')
      }));
    res.json(people);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get trending movies from TMDB
router.get('/trending', requireAuth, async (req, res) => {
  try {
    // /trending has no `region` param at all (unlike /upcoming and
    // /now_playing below), so its release_date can be the earliest release
    // found ANYWHERE in the world — a festival premiere, a different
    // country's release — rather than a real US date. That's only visibly
    // wrong for movies recent enough to still be within the now_playing /
    // upcoming windows (an older established hit's exact release day
    // doesn't matter, it's unambiguously long past); for those, prefer the
    // region-scoped date from the two region-aware lists we already fetch
    // elsewhere, fetched here too since they're cheap list calls.
    const [trendingRes, nowPlayingRes, upcomingRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=${process.env.TMDB_API_KEY}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${process.env.TMDB_API_KEY}&language=en-US&region=US`),
      fetch(`https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&language=en-US&region=US`)
    ]);
    const [data, nowPlaying, upcoming] = await Promise.all([trendingRes.json(), nowPlayingRes.json(), upcomingRes.json()]);

    const regionDateById = new Map();
    for (const m of [...(nowPlaying.results || []), ...(upcoming.results || [])]) {
      regionDateById.set(m.id, m.release_date);
    }

    const today = new Date().toISOString().split('T')[0];
    const movies = data.results
      .map(movie => ({ ...movie, release_date: regionDateById.get(movie.id) || movie.release_date }))
      .filter(movie => movie.release_date && movie.release_date <= today)
      // Kept in TMDB's order — it's the trending rank the page shows (#1, #2…).
      .map(movie => ({
        tmdb_id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        release_date: movie.release_date,
        description: movie.overview,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
        backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : ''
      }));
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get upcoming movies from TMDB
router.get('/upcoming', requireAuth, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/upcoming?api_key=${process.env.TMDB_API_KEY}&language=en-US&region=US`
    );
    const data = await response.json();
    const today = new Date().toISOString().split('T')[0];
    const movies = data.results
      .filter(movie => movie.release_date && movie.release_date > today)
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date))
      .map(movie => ({
        tmdb_id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        release_date: movie.release_date,
        description: movie.overview,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
      }));
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Award-winning movies come from curated TMDB lists — the public API has
// no dedicated awards endpoint (only the TMDB website does). Coverage is
// uneven because not every category has a reliable, well-populated list.
// Categories with no usable community list (e.g. Best Casting, which is
// too new/niche for one to exist) use a hand-verified `movieIds` array
// instead — each winner looked up and confirmed against Wikipedia/BAFTA's
// own records, so it's more accurate than trusting a random user list.
const AWARDS = {
  oscars: {
    name: 'Academy Awards',
    categories: {
      picture: { listId: 7237, label: 'Best Picture' },
      actor: { listId: 3729, label: 'Best Actor' },
      actress: { listId: 3730, label: 'Best Actress' },
      // Best Casting is a brand-new category (introduced for the 98th
      // Academy Awards, March 2026) — only one winner exists so far.
      casting: { movieIds: [1054867], label: 'Best Casting' }, // One Battle After Another (2026)
      // No public TMDB list exists for these categories, so all of the
      // below are hand-verified winners, 91st-98th ceremonies (2019-2026),
      // cross-checked against Wikipedia, TMDB movie pages, and news-wire
      // ceremony recaps.
      director: {
        movieIds: [426426, 496243, 581734, 600583, 545611, 872585, 1064213, 1054867],
        label: 'Best Director'
      },
      supportingActor: {
        movieIds: [490132, 466272, 583406, 776503, 545611, 872585, 1013850, 1054867],
        label: 'Best Supporting Actor'
      },
      supportingActress: {
        movieIds: [465914, 492188, 615643, 511809, 545611, 840430, 974950, 1078605],
        label: 'Best Supporting Actress'
      },
      originalScreenplay: {
        movieIds: [490132, 496243, 582014, 777270, 545611, 915935, 1064213, 1233413],
        label: 'Best Original Screenplay'
      },
      adaptedScreenplay: {
        movieIds: [487558, 515001, 600354, 776503, 777245, 1056360, 974576, 1054867],
        label: 'Best Adapted Screenplay'
      },
      animated: {
        movieIds: [324857, 301528, 508442, 568124, 555604, 508883, 823219, 803796],
        label: 'Best Animated Feature'
      },
      internationalFilm: {
        movieIds: [426426, 496243, 580175, 758866, 49046, 467244, 1000837, 1124566],
        label: 'Best International Feature Film'
      }
    }
  },
  globes: {
    name: 'Golden Globes',
    categories: {
      // list 2469 is TMDB's own "Best Picture Winners - The Golden Globes"
      // list, which (verified by inspection) only covers the Drama
      // category — Musical/Comedy has always been a separate award and
      // needs its own hand-verified array below.
      picture: { listId: 2469, label: 'Best Motion Picture – Drama' },
      // No public TMDB list exists for any of the below, so all are
      // hand-verified winners, 75th-83rd ceremonies (2018-2026),
      // cross-checked against Wikipedia, TMDB's editorial awards pages,
      // and news-wire ceremony recaps. Labelled by ceremony year, matching
      // the existing Oscars "Best Casting" comment style above.
      musicalComedy: {
        movieIds: [391713, 490132, 466272, 740985, 511809, 674324, 792307, 974950, 1054867],
        label: 'Best Motion Picture – Musical or Comedy'
      },
      director: {
        movieIds: [399055, 426426, 530915, 581734, 600583, 804095, 872585, 549509, 1054867],
        label: 'Best Director'
      },
      actorDrama: {
        movieIds: [399404, 424694, 475557, 615667, 614917, 614934, 872585, 549509, 1220564],
        label: 'Best Actor – Drama'
      },
      actressDrama: {
        movieIds: [359940, 340613, 491283, 566076, 517088, 817758, 466420, 1000837, 858024],
        label: 'Best Actress – Drama'
      },
      actorMusicalComedy: {
        movieIds: [371638, 429197, 504608, 740985, 537116, 674324, 840430, 989662, 1317288],
        label: 'Best Actor – Musical or Comedy'
      },
      actressMusicalComedy: {
        movieIds: [391713, 375262, 565310, 601666, 511809, 545611, 792307, 933260, 1160360],
        label: 'Best Actress – Musical or Comedy'
      },
      supportingActor: {
        movieIds: [359940, 490132, 466272, 583406, 600583, 545611, 872585, 1013850, 1124566],
        label: 'Best Supporting Actor'
      },
      supportingActress: {
        movieIds: [389015, 465914, 492188, 644583, 511809, 505642, 840430, 974950, 1054867],
        label: 'Best Supporting Actress'
      },
      screenplay: {
        movieIds: [359940, 490132, 466272, 556984, 777270, 674324, 915935, 974576, 1054867],
        label: 'Best Screenplay'
      },
      animated: {
        movieIds: [354912, 324857, 458253, 508442, 568124, 555604, 508883, 823219, 803796],
        label: 'Best Animated Feature Film'
      }
    }
  },
  bafta: {
    name: 'BAFTA',
    categories: {
      picture: { listId: 3681, label: 'Best Film' },
      // BAFTA Best Casting winners, 2019-2025 (73rd-79th ceremonies),
      // verified individually against Wikipedia's award history.
      casting: {
        movieIds: [475557, 575773, 511809, 614934, 840430, 1064213, 1317149],
        label: 'Best Casting'
      },
      // No public TMDB list exists for these categories, so all of the
      // below are hand-verified winners, 2018-2025 (72nd-79th ceremonies),
      // cross-checked against Wikipedia and bafta.org's own winner archive.
      // Labelled by film year, not ceremony year, matching the pattern
      // above — note Nomadland/Judas and the Black Messiah/Minari (the
      // "2020" entries) all carry a TMDB release_date of early 2021 due to
      // COVID-delayed wide releases; the TMDB ids are still the single
      // correct match for each film.
      director: {
        movieIds: [426426, 530915, 581734, 600583, 49046, 872585, 549509, 1054867],
        label: 'Best Director'
      },
      actor: {
        movieIds: [424694, 475557, 600354, 614917, 614934, 872585, 549509, 1317149],
        label: 'Best Actor'
      },
      actress: {
        movieIds: [375262, 491283, 581734, 714011, 817758, 792307, 1064213, 858024],
        label: 'Best Actress'
      },
      supportingActor: {
        movieIds: [490132, 466272, 583406, 776503, 674324, 872585, 1013850, 1054867],
        label: 'Best Supporting Actor'
      },
      supportingActress: {
        movieIds: [375262, 492188, 615643, 511809, 674324, 840430, 974950, 1233413],
        label: 'Best Supporting Actress'
      },
      originalScreenplay: {
        movieIds: [375262, 496243, 582014, 718032, 674324, 915935, 1013850, 1233413],
        label: 'Best Original Screenplay'
      },
      adaptedScreenplay: {
        movieIds: [487558, 515001, 600354, 776503, 49046, 1056360, 974576, 1054867],
        label: 'Best Adapted Screenplay'
      },
      animated: {
        movieIds: [324857, 508965, 508442, 568124, 555604, 508883, 929204, 1084242],
        label: 'Best Animated Film'
      },
      internationalFilm: {
        movieIds: [426426, 496243, 580175, 758866, 49046, 467244, 974950, 1124566],
        label: 'Best Film Not in the English Language'
      }
    }
  }
};

// Get award-winning movies from a curated TMDB list, or a hand-verified set of movie IDs
router.get('/awarded', requireAuth, async (req, res) => {
  try {
    const award = AWARDS[req.query.award] ? req.query.award : 'oscars';
    const { name, categories } = AWARDS[award];
    const category = categories[req.query.category] ? req.query.category : Object.keys(categories)[0];
    const { listId, movieIds, label: categoryLabel } = categories[category];

    let allItems;
    if (movieIds) {
      allItems = await Promise.all(
        movieIds.map(id =>
          fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.TMDB_API_KEY}&language=en-US`).then(r => r.json())
        )
      );
    } else {
      const baseUrl = `https://api.themoviedb.org/3/list/${listId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`;
      const firstRes = await fetch(`${baseUrl}&page=1`).then(r => r.json());
      const totalPages = Math.min(firstRes.total_pages || 1, 10);

      const pagePromises = Array.from({ length: totalPages - 1 }, (_, i) =>
        fetch(`${baseUrl}&page=${i + 2}`).then(r => r.json())
      );
      const restPages = await Promise.all(pagePromises);
      allItems = [firstRes, ...restPages].flatMap(page => page.items || []);
    }

    const today = new Date().toISOString().split('T')[0];
    const movies = allItems
      .filter(movie => movie.release_date && movie.release_date <= today)
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .map(movie => ({
        tmdb_id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        description: movie.overview,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
      }));
    const availableCategories = Object.entries(categories).map(([key, c]) => ({ value: key, label: c.label }));

    res.json({ award, name, category, categoryLabel, categories: availableCategories, movies });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all award shows and their available categories
router.get('/awards-meta', requireAuth, (req, res) => {
  const meta = Object.entries(AWARDS).map(([key, a]) => ({
    value: key,
    name: a.name,
    categories: Object.entries(a.categories).map(([ckey, c]) => ({ value: ckey, label: c.label }))
  }));
  res.json(meta);
});

// Get all genres from TMDB
router.get('/genres', requireAuth, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.TMDB_API_KEY}&language=en-US`
    );
    const data = await response.json();
    res.json(data.genres);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get movies by genre
// :genreId is one TMDB genre id or several comma-separated ("35,10749").
// TMDB's with_genres treats commas as AND, so several ids mean movies that
// are ALL of those genres (Comedy + Romance = romantic comedies).
router.get('/genre/:genreId', requireAuth, async (req, res) => {
  try {
    // It goes straight into the TMDB URL, so only allow ids and commas.
    if (!/^\d+(,\d+){0,5}$/.test(req.params.genreId)) {
      return res.status(400).json({ message: 'Invalid genre list' });
    }
    const { yearFrom, yearTo } = req.query;
    const today = new Date().toISOString().split('T')[0];

    let baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.TMDB_API_KEY}&with_genres=${req.params.genreId}&language=en-US&sort_by=popularity.desc`;

    if (yearFrom) baseUrl += `&primary_release_date.gte=${yearFrom}-01-01`;
    if (yearTo) baseUrl += `&primary_release_date.lte=${yearTo}-12-31`;
    else baseUrl += `&primary_release_date.lte=${today}`;

    const firstRes = await fetch(`${baseUrl}&page=1`).then(r => r.json());
    const totalPages = Math.min(firstRes.total_pages, 10);

    const pagePromises = Array.from({ length: totalPages }, (_, i) =>
      fetch(`${baseUrl}&page=${i + 1}`).then(r => r.json())
    );

    const pages = await Promise.all(pagePromises);
    const allResults = pages.flatMap(page => page.results || []);

    const movies = allResults
      .filter(movie => movie.release_date && movie.release_date <= today)
      .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
      .map(movie => ({
        tmdb_id: movie.id,
        title: movie.title,
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
        description: movie.overview,
        poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : ''
      }));

    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// TMDB's top-level /movie/{id} release_date is the earliest release found
// ANYWHERE in the world — a festival premiere, a different country's
// release — not a meaningful "when did this come out" answer. /movie/{id}
// /release_dates gives a per-country breakdown with a type per entry
// (1=Premiere, 2=Theatrical limited, 3=Theatrical, 4=Digital, 5=Physical,
// 6=TV); pick the real theatrical date for US first, then GR — deliberately
// the OPPOSITE priority from watch/providers (which is GR-first, since
// that's about what's actually available to this app's user). A "release
// date" is an informational fact people expect to match the
// internationally-known date (what Wikipedia/IMDb cite, what the US
// trending/upcoming filters above are already keyed to) — Greece's
// theatrical date is often weeks or months later and would just read as
// wrong to someone expecting "Oppenheimer released July 2023", not its
// Greek premiere date. Prefers a wide release over a limited one, and
// ignores festival premieres entirely since those aren't a real release.
// Falls back to the (possibly wrong) top-level date only when neither
// region has any theatrical entry at all.
function regionalReleaseDate(releaseDatesResults, fallbackDate) {
  for (const region of ['US', 'GR']) {
    const entries = releaseDatesResults?.find(r => r.iso_3166_1 === region)?.release_dates || [];
    for (const type of [3, 2]) {
      const match = entries.find(e => e.type === type);
      if (match) return match.release_date.split('T')[0];
    }
  }
  return fallbackDate;
}

// Get movie details from TMDB
router.get('/tmdb/:tmdbId', requireAuth, async (req, res) => {
  try {
    const [movieRes, creditsRes, videosRes, imagesRes, releaseDatesRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}/credits?api_key=${process.env.TMDB_API_KEY}`),
      fetch(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}/videos?api_key=${process.env.TMDB_API_KEY}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}/images?api_key=${process.env.TMDB_API_KEY}&include_image_language=en,null`),
      fetch(`https://api.themoviedb.org/3/movie/${req.params.tmdbId}/release_dates?api_key=${process.env.TMDB_API_KEY}`)
    ]);
    const [data, credits, videos, images, releaseDates] = await Promise.all([movieRes.json(), creditsRes.json(), videosRes.json(), imagesRes.json(), releaseDatesRes.json()]);
    const release_date = regionalReleaseDate(releaseDates.results, data.release_date);

    const directorCredit = credits.crew?.find(member => member.job === 'Director') || null;
    const director = directorCredit ? {
      id: directorCredit.id,
      name: directorCredit.name,
      profile_url: directorCredit.profile_path ? `https://image.tmdb.org/t/p/w185${directorCredit.profile_path}` : null,
      role: 'director'
    } : null;
    const trailer = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || null;

    // Backdrops - up to 8, best-rated first, deduped with the primary one on top
    const backdrops = [
      data.backdrop_path,
      ...(images.backdrops || [])
        .sort((a, b) => b.vote_average - a.vote_average)
        .map(b => b.file_path)
    ]
      .filter((path, i, arr) => path && arr.indexOf(path) === i)
      .slice(0, 8)
      .map(path => `https://image.tmdb.org/t/p/w1280${path}`)

    // Cast - top 10
    const cast = credits.cast?.slice(0, 10).map(member => ({
      id: member.id,
      name: member.name,
      character: member.character,
      profile_url: member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : null,
      role: 'actor'
    })) || []

    // Community rating - average of user ratings from everyone who logged this movie
    const loggedMovies = await WatchedMovie.find({ movie_id: req.params.tmdbId, rating: { $exists: true, $ne: null } }).select('rating')
    const communityRating = {
      average: loggedMovies.length > 0
        ? Math.round((loggedMovies.reduce((sum, m) => sum + m.rating, 0) / loggedMovies.length) * 10) / 10
        : null,
      count: loggedMovies.length
    }

    const movie = {
      tmdb_id: data.id,
      imdb_id: data.imdb_id,
      title: data.title,
      year: release_date ? new Date(release_date).getFullYear() : null,
      release_date,
      description: data.overview,
      director,
      genres: data.genres?.map(g => g.name) || [],
      poster_url: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : '',
      backdrop_url: data.backdrop_path ? `https://image.tmdb.org/t/p/w1280${data.backdrop_path}` : '',
      backdrops,
      runtime: data.runtime,
      trailer_key: trailer ? trailer.key : null,
      cast,
      communityRating
    }
    res.json(movie)
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a cast/crew member's bio and filmography from TMDB
router.get('/person/:personId', requireAuth, async (req, res) => {
  try {
    const [personRes, creditsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/person/${req.params.personId}?api_key=${process.env.TMDB_API_KEY}&language=en-US`),
      fetch(`https://api.themoviedb.org/3/person/${req.params.personId}/movie_credits?api_key=${process.env.TMDB_API_KEY}&language=en-US`)
    ]);
    const [data, credits] = await Promise.all([personRes.json(), creditsRes.json()]);

    if (!data.id) {
      return res.status(404).json({ message: 'Person not found' });
    }

    // Which credit list actually answers "movies this person participated
    // in" depends on how they were being looked up — an actor's photo wants
    // their acting filmography (credits.cast), a director's name wants the
    // movies they directed (credits.crew, job === 'Director'). Using cast
    // credits unconditionally (the old behavior) showed a director's
    // unrelated acting cameos — or nothing at all if they never acted.
    // ?role is passed by whichever photo/name was clicked; direct
    // navigation (e.g. a page refresh) has no role hint, so it falls back
    // to TMDB's own known_for_department.
    const role = req.query.role === 'director' || req.query.role === 'actor'
      ? req.query.role
      : (data.known_for_department === 'Directing' ? 'director' : 'actor');

    // TMDB's cast credits aren't a filmography: they also list every
    // documentary, award show and "making of" the person merely appears in
    // as themselves, plus films that only reuse old footage of them. For a
    // famous director that's nearly all of it (Spielberg: 174 of 181 "acting"
    // credits are "Self"). Keep only credited parts they actually played —
    // voice work and narration still count. Uncredited parts are dropped
    // too: they're background extras (Brad Pitt's 1987 "Boy at the Beach")
    // and directors' cameos in their own films, which already appear in
    // their "Directed" list.
    const ownName = (data.name || '').toLowerCase();
    const isRealRole = (m) => {
      const character = (m.character || '').trim();
      if (!character) return false;
      if (/\bsel(f|ves)\b|\bhim\s*self\b|\bher\s*self\b|\bthemselves\b|archive footage|uncredited/i.test(character)) return false;
      // a cameo as themselves under their own name: "Brad Pitt (uncredited)"
      if (character.replace(/\(.*?\)/g, '').trim().toLowerCase() === ownName) return false;
      return true;
    };

    const toCard = (m, character) => ({
      tmdb_id: m.id,
      title: m.title,
      character,
      year: new Date(m.release_date).getFullYear(),
      release_date: m.release_date,
      poster_url: `https://image.tmdb.org/t/p/w342${m.poster_path}`,
      // how widely seen it is — for the filmography's "Known for" row and
      // "Popular" sort (TMDB's rating itself isn't shown anywhere)
      vote_count: m.vote_count || 0,
      popularity: m.popularity || 0,
      // position in the cast list (0 = top-billed); null for directing
      // credits. Tells a lead role from a one-line cameo in a big film.
      billing: typeof m.order === 'number' ? m.order : null
    });
    // newest first, one card per movie (TMDB repeats a movie when someone
    // has several credits on it)
    const prepare = (list, characterOf) => {
      const seen = new Set();
      return list
        .filter(m => m.poster_path && m.release_date)
        .sort((a, b) => new Date(b.release_date) - new Date(a.release_date))
        .filter(m => !seen.has(m.id) && seen.add(m.id))
        .map(m => toCard(m, characterOf(m)));
    };

    const directed = prepare((credits.crew || []).filter(m => m.job === 'Director'), () => 'Director');
    const acted = prepare((credits.cast || []).filter(isRealRole), m => m.character);

    // The list for the role they were opened as comes first; the other side
    // of their career (if any) is sent as a second section.
    const movies = role === 'director' ? directed : acted;
    const secondary = role === 'director'
      ? { role: 'actor', label: 'Acting', movies: acted }
      : { role: 'director', label: 'Directed', movies: directed };

    const person = {
      id: data.id,
      name: data.name,
      biography: data.biography || '',
      birthday: data.birthday,
      deathday: data.deathday,
      place_of_birth: data.place_of_birth,
      known_for_department: data.known_for_department,
      profile_url: data.profile_path ? `https://image.tmdb.org/t/p/w500${data.profile_path}` : null,
      role,
      movies,
      secondary: secondary.movies.length ? secondary : null
    }
    res.json(person);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get watch providers from TMDB, enriched with real per-provider deep links
// (Offer.standardWebURL) from JustWatch's unofficial API where a confident
// match can be found — see server/utils/justwatch.js for why TMDB alone
// can't give us these.
//
// The JustWatch lookup runs even when TMDB itself has no watch/providers
// data at all: TMDB's copy of that data can lag behind, and — more
// commonly for a movie that's already out — it may simply not be
// streaming/rentable/buyable ANYWHERE yet because it's still in its
// theatrical-only window. JustWatch tracks that as a CINEMA-type offer
// (a ticketing link, e.g. Fandango, Atom Tickets), which TMDB's provider
// categories have no slot for. When that's genuinely the only thing
// available, we surface it as `providers.cinema_offer: true` so the client
// can say "still in theaters" instead of a dead-end generic search link.
// Just a flag, not the ticket URL itself — most ticket vendors sit behind
// bot protection that blocks a direct, referrer-less navigation to their
// page, so the client shows this as informational text rather than a link.
router.get('/tmdb/:tmdbId/providers', requireAuth, async (req, res) => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${req.params.tmdbId}/watch/providers?api_key=${process.env.TMDB_API_KEY}`
    );
    const data = await response.json();
    const region = data.results?.GR ? 'GR' : (data.results?.US ? 'US' : null);
    let providers = region ? data.results[region] : null;

    if (req.query.title) {
      const offers = await getDirectOffers(req.query.title, req.params.tmdbId, region || 'US');

      if (providers && offers.length > 0) {
        const attachDirectLinks = (category, monetizationType) => {
          (providers[category] || []).forEach(p => {
            const offer = offers.find(o =>
              o.monetizationType === monetizationType && providerNamesMatch(p.provider_name, o.providerName)
            );
            if (offer) p.direct_url = offer.url;
          });
        };
        attachDirectLinks('flatrate', 'FLATRATE');
        attachDirectLinks('rent', 'RENT');
        attachDirectLinks('buy', 'BUY');
      }

      const hasHomeOffer = providers && ['flatrate', 'rent', 'buy'].some(c => providers[c]?.length > 0);
      if (!hasHomeOffer && offers.some(o => o.monetizationType === 'CINEMA')) {
        providers = providers || {};
        providers.cinema_offer = true;
      }
    }

    res.json({ providers });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all movies
router.get('/', requireAuth, async (req, res) => {
  try {
    const movies = await Movie.find().select('-__v');
    res.json(movies);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single movie
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).select('-__v');
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;