// Line icons for the sign-in pages.
export const svg = (children, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

export const AUTH_ICONS = {
  mail: svg(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></>),
  lock: svg(<><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>),
  user: svg(<><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c1.2-3.8 4-5.5 7.5-5.5s6.3 1.7 7.5 5.5" /></>),
  key: svg(<><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3" /><path d="M16 7l2.5 2.5" /><path d="M18.5 4.5L21 7" /></>, 26),
  shield: svg(<><path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.3-7.5 9.5-4.3-1.2-7.5-4.9-7.5-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></>, 26),
  inbox: svg(<><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></>, 26),
  check: svg(<path d="M5 12.5l4.5 4.5L19 7.5" />, 16),
  alert: svg(<><circle cx="12" cy="12" r="9" /><line x1="12" y1="7.5" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" /></>, 16),
  arrow: svg(<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>, 18),
}
