/**
 * state.ts  STUB (you implement this).
 *
 * What this module does:
 *   Persists the user's local history in localStorage:
 *     - recent search queries (de-duplicated, capped)
 *     - saved tracks (de-duplicated by id, capped)
 *
 * Why it exists:
 *   - One source of truth for "what has the user interacted with."
 *   - The home view uses getHistory() to render the empty/suggested grid.
 *   - The track card uses saveTrack() / unsaveTrack() and isTrackSaved().
 *
 * What you need to implement (suggested API):
 *   - getHistory(): { queries: string[]; tracks: Track[] }
 *   - recordSearch(query: string): void
 *   - saveTrack(track: Track): void
 *   - unsaveTrack(id: string): void
 *   - isTrackSaved(id: string): boolean
 *
 * Notes:
 *   - Validate what you read back from localStorage with the schemas in
 *     contracts.ts. localStorage is an external boundary: the data could
 *     be wrong (older format, hand-edited, etc.). Don't trust it.
 *   - Keep it small: pure functions, no framework, no library.
 *
 * Suggested Claude Code prompt:
 *   "Implement state.ts. Use localStorage with key 'mf:v1'. Cap queries to
 *    10 most recent (de-duplicated, newest first). Cap saved tracks to 30.
 *    Validate the read shape with Zod arrays of TrackSchema and z.string().
 *    If validation fails, return an empty history (don't throw)."
 */

import type { Track } from './contracts.ts';

export type History = {
  queries: string[];
  tracks: Track[];
};

export function getHistory(): History {
  // TODO: read from localStorage, validate with Zod, return parsed.
  // On any error, return { queries: [], tracks: [] }.
  return { queries: [], tracks: [] };
}

export function recordSearch(_query: string): void {
  // TODO: prepend to queries, de-dupe, cap at 10, persist.
}

export function saveTrack(_track: Track): void {
  // TODO: prepend to tracks, de-dupe by id, cap at 30, persist.
}

export function unsaveTrack(_id: string): void {
  // TODO: remove track with this id, persist.
}

export function isTrackSaved(_id: string): boolean {
  // TODO: return true if the id is in the saved tracks.
  return false;
}
