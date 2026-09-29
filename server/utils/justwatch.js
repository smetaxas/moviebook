// Unofficial JustWatch GraphQL API (apis.justwatch.com/graphql) — not
// affiliated with or documented by JustWatch, so this can break or change
// without notice. It's the only place a real per-provider deep link to a
// title's actual page (Offer.standardWebURL) exists at all; TMDB's own
// watch/providers endpoint only ever hands back one shared JustWatch page
// link for the whole region. Query shape reverse-engineered from the
// justwatch.com web client, following the same structure used by the
// community's simple-justwatch-python-api project.
const JUSTWATCH_GRAPHQL_URL = 'https://apis.justwatch.com/graphql';

const SEARCH_QUERY = `
query GetSearchTitles(
    $searchTitlesFilter: TitleFilter!,
    $country: Country!,
    $language: Language!,
    $first: Int!,
    $filter: OfferFilter!,
    $offset: Int = 0,
) {
    popularTitles(
        country: $country
        filter: $searchTitlesFilter
        first: $first
        sortBy: POPULAR
        sortRandomSeed: 0
        offset: $offset
    ) {
        edges {
            node {
                ...TitleDetails
                __typename
            }
            __typename
        }
        __typename
    }
}

fragment TitleDetails on MovieOrShowOrSeasonOrEpisode {
    id
    objectId
    objectType
    content(country: $country, language: $language) {
        title
        ... on MovieOrShowOrSeasonContent {
            fullPath
            externalIds {
                imdbId
                tmdbId
                __typename
            }
        }
        __typename
    }
    offers(country: $country, platform: WEB, filter: $filter) {
        ...TitleOffer
    }
    __typename
}

fragment TitleOffer on Offer {
    id
    monetizationType
    presentationType
    package {
        ...PackageDetails
    }
    standardWebURL
    __typename
}

fragment PackageDetails on Package {
    id
    packageId
    clearName
    technicalName
    shortName
    __typename
}
`;

function normalizeProviderName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// True if two provider names plausibly refer to the same service across
// TMDB's and JustWatch's differing naming (e.g. TMDB's "Apple TV Store" vs
// JustWatch's "Apple TV"). Short names require an exact match so generic
// fragments like "tv" can't false-positive against everything.
function providerNamesMatch(a, b) {
  const na = normalizeProviderName(a);
  const nb = normalizeProviderName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length < 4 || nb.length < 4) return false;
  return na.includes(nb) || nb.includes(na);
}

// Looks up real per-provider deep links (Offer.standardWebURL) for a movie
// by searching JustWatch by title and matching the result back to our known
// TMDB id. Returns [] on any failure — a network error, a shape change in
// the unofficial API, or no confident match — so callers can fall back to
// their existing behavior without this being load-bearing.
async function getDirectOffers(title, tmdbId, country) {
  try {
    const response = await fetch(JUSTWATCH_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'GetSearchTitles',
        variables: {
          first: 4,
          searchTitlesFilter: {
            searchQuery: title,
            packages: null,
            includeTitlesWithoutUrl: true,
            objectTypes: ['MOVIE'],
            releaseYear: { min: null, max: null }
          },
          filter: { bestOnly: false },
          country,
          language: 'en',
          offset: null
        },
        query: SEARCH_QUERY
      }),
      signal: AbortSignal.timeout(4000)
    });
    const data = await response.json();
    const edges = data?.data?.popularTitles?.edges || [];
    const match = edges.find(e => String(e?.node?.content?.externalIds?.tmdbId) === String(tmdbId));
    if (!match) return [];

    return (match.node.offers || [])
      .filter(o => o.standardWebURL && o.package?.clearName)
      .map(o => ({
        providerName: o.package.clearName,
        monetizationType: o.monetizationType,
        url: o.standardWebURL
      }));
  } catch (err) {
    return [];
  }
}

module.exports = { getDirectOffers, providerNamesMatch };
