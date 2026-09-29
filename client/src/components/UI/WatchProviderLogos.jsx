import { useState } from 'react'

const CATEGORY_LABELS = { flatrate: 'Stream', rent: 'Rent', buy: 'Buy' }
const CATEGORY_ORDER = ['flatrate', 'rent', 'buy']

// TMDB's watch/providers endpoint only hands back one shared JustWatch link
// per region — it has no per-provider deep link to the movie's actual page
// on Netflix, Apple TV, etc. (that data lives behind JustWatch's paid
// partner API, which TMDB doesn't expose). The next best thing is sending
// each provider straight to its own site's search results for the title,
// keyed by TMDB's stable provider_id, so the click lands on the right
// platform instead of bouncing through JustWatch. Providers TMDB shows that
// aren't in this map fall back to the JustWatch link.
const PROVIDER_SEARCH_URL = {
  8: title => `https://www.netflix.com/search?q=${title}`,
  9: title => `https://www.amazon.com/s?k=${title}&i=instant-video`,
  10: title => `https://www.amazon.com/s?k=${title}&i=instant-video`,
  119: title => `https://www.amazon.com/s?k=${title}&i=instant-video`,
  2100: title => `https://www.amazon.com/s?k=${title}&i=instant-video`,
  1825: title => `https://www.amazon.com/s?k=${title}&i=instant-video`,
  2: title => `https://tv.apple.com/search?term=${title}`,
  350: title => `https://tv.apple.com/search?term=${title}`,
  3: title => `https://play.google.com/store/search?q=${title}&c=movies`,
  192: title => `https://www.youtube.com/results?search_query=${title}+full+movie`,
  337: title => `https://www.disneyplus.com/search?q=${title}`,
  15: title => `https://www.hulu.com/search?q=${title}`,
  1899: title => `https://play.max.com/search?q=${title}`,
  384: title => `https://play.max.com/search?q=${title}`,
  531: title => `https://www.paramountplus.com/search/?query=${title}`,
  1770: title => `https://www.paramountplus.com/search/?query=${title}`,
  386: title => `https://www.peacocktv.com/search?q=${title}`,
  387: title => `https://www.peacocktv.com/search?q=${title}`,
  68: title => `https://www.microsoft.com/en-us/search?q=${title}`,
  // Vudu was rebranded/merged into Fandango At Home in 2024, but TMDB still
  // lists the provider as "Fandango At Home" under the old provider_id (7).
  7: title => `https://athome.fandango.com/search?searchString=${title}`,
  538: title => `https://watch.plex.tv/search?query=${title}`,
  43: title => `https://www.starz.com/us/en/search?q=${title}`,
  11: title => `https://mubi.com/search/films?query=${title}`,
  283: title => `https://www.crunchyroll.com/search?q=${title}`,
  526: title => `https://www.amcplus.com/search?q=${title}`
}

function providerLink(provider, title, fallback) {
  // The server may have already resolved a real deep link to this exact
  // title on this exact provider via JustWatch (see server/utils/justwatch.js)
  // — use it when present, since it's strictly better than a search page.
  if (provider.direct_url) return provider.direct_url
  const build = PROVIDER_SEARCH_URL[provider.provider_id]
  return build ? build(encodeURIComponent(title)) : fallback
}

function ProviderLogo({ provider, title, fallbackLink }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={providerLink(provider, title, fallbackLink)}
      target="_blank"
      rel="noopener noreferrer"
      title={provider.provider_name}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', display: 'block', width: '46px', height: '46px', borderRadius: '13px', overflow: 'hidden',
        border: '1px solid ' + (hovered ? 'rgba(220,60,79,0.7)' : 'rgba(255,255,255,0.12)'), flexShrink: 0,
        transform: hovered ? 'translateY(-4px) scale(1.08)' : 'none',
        boxShadow: hovered
          ? '0 10px 22px rgba(179,31,47,0.5), 0 0 0 3px rgba(220,60,79,0.15)'
          : '0 2px 8px rgba(0,0,0,0.4)',
        filter: hovered ? 'brightness(1.06)' : 'none',
        transition: 'transform 0.2s cubic-bezier(.2,.8,.3,1.2), box-shadow 0.2s ease, border-color 0.2s ease, filter 0.2s ease'
      }}
    >
      <img
        src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
        alt={provider.provider_name}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </a>
  )
}

function formatReleaseDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// A reusable pill for all three "nothing to show yet" states below. `link`
// omitted renders a plain, non-clickable notice (nothing to click when we
// already know why); `link` present renders an actual anchor.
function StatusPill({ icon, iconBg, text, link, accent }) {
  const [hovered, setHovered] = useState(false)
  const Tag = link ? 'a' : 'span'

  return (
    <Tag
      {...(link ? { href: link, target: '_blank', rel: 'noopener noreferrer' } : {})}
      onMouseEnter={link ? () => setHovered(true) : undefined}
      onMouseLeave={link ? () => setHovered(false) : undefined}
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.6rem 1.3rem 0.6rem 1rem',
        borderRadius: '10px',
        background: accent
          ? (hovered ? 'linear-gradient(135deg, #dc3c4f, #b31f2f)' : 'linear-gradient(160deg, rgba(179,31,47,0.18), rgba(24,24,26,0.55))')
          : 'rgba(255,255,255,0.05)',
        border: '1px solid ' + (accent ? (hovered ? 'rgba(220,60,79,0.8)' : 'rgba(220,60,79,0.35)') : 'rgba(255,255,255,0.12)'),
        color: accent ? 'white' : '#999',
        textDecoration: 'none', fontWeight: '600', fontSize: '0.85rem',
        boxShadow: accent
          ? (hovered ? '0 8px 20px rgba(179,31,47,0.45)' : 'inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.22)')
          : 'none',
        cursor: link ? 'pointer' : 'default',
        transition: 'background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '20px', height: '20px', borderRadius: '50%',
        backgroundColor: iconBg, fontSize: '0.65rem', flexShrink: 0
      }}>
        {icon}
      </span>
      {text}
    </Tag>
  )
}

// TMDB watch/providers logos, grouped by flatrate/rent/buy so a title's
// purchase options read the same way JustWatch presents them, each linking
// to that provider's own search results (see PROVIDER_SEARCH_URL above).
// When a movie has no regional streaming/rent/buy data, the reason matters:
//  - Not released yet: no provider could possibly exist — a search link
//    would be a dead end, so show a plain, non-clickable date notice.
//  - Released but still theatrical-only: the server (see movies.js) may
//    have found a JustWatch CINEMA offer (a ticketing link) even though
//    there's nothing to stream/rent/buy — link straight to that instead of
//    guessing.
//  - Released with genuinely no data anywhere (TMDB/JustWatch don't have
//    it, e.g. a title stuck between the end of its theatrical run and a
//    digital release): fall back to JustWatch's own search page, which is
//    the same authoritative source used everywhere else in this file — a
//    far better bet than a generic Google search.
function WatchProviderLogos({ providers, title, releaseDate }) {
  const [activeKey, setActiveKey] = useState(null)

  const groups = CATEGORY_ORDER
    .map(key => ({ key, list: providers?.[key] || [] }))
    .filter(g => g.list.length > 0)

  if (groups.length === 0) {
    const today = new Date().toISOString().split('T')[0]
    const notYetReleased = releaseDate && releaseDate > today

    // Checked before cinema_offer: JustWatch can carry a CINEMA-type offer
    // (advance-ticket/pre-sale links) for a title that hasn't released yet,
    // which isn't "still" showing anywhere — it hasn't started. Only treat
    // a CINEMA offer as "still in theaters" once we know the release date
    // has actually passed.
    if (notYetReleased) {
      return (
        <StatusPill
          icon="🗓️" iconBg="rgba(255,255,255,0.1)"
          text={`Not yet released · ${formatReleaseDate(releaseDate)}`}
        />
      )
    }

    if (providers?.cinema_offer) {
      // No link: ticket-vendor pages (Atom Tickets, Fandango, etc.) often
      // sit behind bot protection that blocks a direct navigation like this
      // one — no referrer, no session — so a "click through" here is more
      // likely to dead-end on a "you've been blocked" page than an actual
      // ticket page. Purely informational instead.
      return (
        <StatusPill
          icon="🎬" iconBg="rgba(255,255,255,0.1)"
          text="Still in Theaters"
        />
      )
    }

    return (
      <StatusPill
        icon="📺" iconBg="rgba(255,255,255,0.15)" accent
        text="Where to Watch" link={'https://www.justwatch.com/us/search?q=' + encodeURIComponent(title)}
      />
    )
  }

  const active = groups.find(g => g.key === activeKey) || groups[0]

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      padding: '1.1rem 1.25rem',
      borderRadius: '16px',
      background: 'linear-gradient(160deg, rgba(179,31,47,0.13), rgba(24,24,26,0.5))',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 28px rgba(0,0,0,0.28)'
    }}>
      <style>{'@keyframes watchProvidersFadeIn { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }'}</style>

      {/* Ambient corner glow — purely decorative, sits behind the content */}
      <div style={{
        position: 'absolute', top: '-46px', right: '-36px', width: '150px', height: '150px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(220,60,79,0.4), transparent 70%)',
        filter: 'blur(6px)', pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '22px', height: '22px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #dc3c4f, #b31f2f)', fontSize: '0.68rem', flexShrink: 0,
          boxShadow: '0 2px 8px rgba(179,31,47,0.5)'
        }}>
          📺
        </span>
        <span style={{ color: 'white', fontWeight: '700', fontSize: '0.82rem', letterSpacing: '0.01em' }}>
          Where to Watch
        </span>
      </div>

      {/* Category switcher — segmented control, one category shown at a
          time instead of stacking all of them, so this reads like a real
          app control rather than a plain labeled list. */}
      <div style={{
        position: 'relative', display: 'inline-flex', gap: '0.25rem',
        padding: '0.25rem', marginBottom: '1rem',
        backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        {groups.map(g => {
          const isActive = g.key === active.key
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setActiveKey(g.key)}
              style={{
                display: 'inline-flex', alignItems: 'baseline', gap: '0.35rem',
                padding: '0.42rem 0.9rem', borderRadius: '8px', border: 'none',
                background: isActive ? 'linear-gradient(135deg, #dc3c4f, #b31f2f)' : 'transparent',
                color: isActive ? 'white' : '#999',
                fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(179,31,47,0.45)' : 'none',
                transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              {CATEGORY_LABELS[g.key]}
              <span style={{ opacity: 0.7, fontWeight: '600' }}>{g.list.length}</span>
            </button>
          )
        })}
      </div>

      <div key={active.key} style={{
        position: 'relative', display: 'flex', gap: '0.65rem', flexWrap: 'wrap',
        animation: 'watchProvidersFadeIn 0.18s ease'
      }}>
        {active.list.map(p => (
          <ProviderLogo key={active.key + p.provider_id} provider={p} title={title} fallbackLink={providers.link} />
        ))}
      </div>
    </div>
  )
}

export default WatchProviderLogos
