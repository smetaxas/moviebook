// "Go to user" / "go to person" links push a `backTo` + reopen instruction
// so the destination's own "Back" button can return you to whatever was
// open (a movie's details) instead of a blank page. That alone only
// survives one hop: if you then take a detour from the destination page
// (e.g. open one of their posters, then click a cast member from there),
// the detour's own backTo/reopen state replaces the original one, so the
// original "return to the comment section" instruction is lost.
//
// buildNavState nests the current location's pending state (if any) under
// `resumeState` when pushing a new one, and resumeAfter unwraps it once a
// reopen instruction has been consumed — restoring the original backTo so
// a later "Back" press still has somewhere to go, however many hops deep.

export function buildNavState(location, extra) {
  return {
    backTo: location.pathname,
    ...extra,
    ...(location.state ? { resumeState: location.state } : {})
  }
}

export function resumeAfter(location) {
  return location.state?.resumeState || null
}
