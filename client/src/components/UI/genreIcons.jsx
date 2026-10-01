// A line icon for each TMDB movie genre (same stroke style as the rest of
// the app's icons). genreIcon(name) falls back to a film frame.

const icon = (children) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

const FILM = icon(<>
  <rect x="3" y="4" width="18" height="16" rx="2.5" />
  <line x1="7.5" y1="4" x2="7.5" y2="20" /><line x1="16.5" y1="4" x2="16.5" y2="20" />
  <line x1="3" y1="12" x2="7.5" y2="12" /><line x1="16.5" y1="12" x2="21" y2="12" />
</>)

const GENRE_ICONS = {
  'Action': icon(<path d="M13 2.5L4.5 13.5h6.5l-1 8 8.5-11h-6.5z" />),
  'Adventure': icon(<><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>),
  'Animation': icon(<><path d="M12 3l1.8 5.7L19.5 10.5l-5.7 1.8L12 18l-1.8-5.7L4.5 10.5l5.7-1.8z" /><path d="M19 16v4M17 18h4" /></>),
  'Comedy': icon(<><circle cx="12" cy="12" r="9" /><path d="M8 14c1 1.7 2.4 2.5 4 2.5s3-.8 4-2.5" /><path d="M9 9.5h.01M15 9.5h.01" strokeWidth="2.6" /></>),
  'Crime': icon(<><path d="M5 12a7 7 0 0 1 14 0v2" /><path d="M8.5 20v-7a3.5 3.5 0 0 1 7 0v3" /><path d="M12 13v8" /><path d="M5 15.5v1" /><path d="M19 17.5V19" /></>),
  'Documentary': icon(<><rect x="2.5" y="7" width="13" height="10" rx="2" /><path d="M15.5 10.5l6-3.5v10l-6-3.5z" /></>),
  'Drama': icon(<><path d="M5 4h14v7a7 7 0 0 1-14 0z" /><path d="M9 9h.01M15 9h.01" strokeWidth="2.6" /><path d="M9.5 14.5c1.5-1 3.5-1 5 0" /></>),
  'Family': icon(<><path d="M3 11l9-7 9 7" /><path d="M5.5 9.5V20h13V9.5" /><path d="M10 20v-5h4v5" /></>),
  'Fantasy': icon(<><path d="M4 20L15 9" /><path d="M13 7l4 4" /><path d="M18 2.5v4M16 4.5h4" /><path d="M20.5 10v2.5M19.25 11.25h2.5" /></>),
  'History': icon(<><path d="M3 21h18" /><path d="M12 3l8.5 5H3.5z" /><path d="M6 11v7M10 11v7M14 11v7M18 11v7" /></>),
  'Horror': icon(<><path d="M5.5 21V11a6.5 6.5 0 0 1 13 0v10l-2.2-1.6-2.1 1.6-2.2-1.6-2.2 1.6-2.1-1.6z" /><path d="M10 10.5h.01M14 10.5h.01" strokeWidth="2.8" /></>),
  'Music': icon(<><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>),
  'Mystery': icon(<><circle cx="10.5" cy="10.5" r="7" /><line x1="15.8" y1="15.8" x2="21" y2="21" /><path d="M8.5 8.8a2 2 0 1 1 2.6 1.9c-.5.2-.6.6-.6 1.1" /><path d="M10.5 14h.01" strokeWidth="2.6" /></>),
  'Romance': icon(<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20z" />),
  'Science Fiction': icon(<><path d="M12 2.5c3 2.2 4.8 5.8 4.8 9.8l-1.8 3.7H9l-1.8-3.7c0-4 1.8-7.6 4.8-9.8z" /><circle cx="12" cy="10" r="1.6" /><path d="M9.5 19.5L12 22l2.5-2.5" /></>),
  'TV Movie': icon(<><rect x="3" y="7" width="18" height="13" rx="2.5" /><path d="M8 2.5l4 4.5 4-4.5" /></>),
  'Thriller': icon(<><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  'War': icon(<><path d="M5 3l12 12" /><path d="M19 3L7 15" /><path d="M14.5 17.5l3-3M9.5 17.5l-3-3" /><path d="M17 17l3.5 3.5M7 17l-3.5 3.5" /></>),
  'Western': icon(<><path d="M10 21V5.5a2 2 0 0 1 4 0V21" /><path d="M10 13.5H7.5a2 2 0 0 1-2-2V8.5" /><path d="M14 11.5h2.5a2 2 0 0 0 2-2V7" /><path d="M6 21h12" /></>),
}

export const genreIcon = (name) => GENRE_ICONS[name] || FILM
