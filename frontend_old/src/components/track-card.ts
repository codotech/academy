/**
 * TrackCard  STUB (you implement the body).
 *
 * Renders a single track. Includes a save/unsave action.
 *
 * Contract:
 *   - Receives a Track and a `saved` flag.
 *   - Emits a 'save' CustomEvent with detail = { track }     when user saves.
 *   - Emits a 'unsave' CustomEvent with detail = { id }       when user unsaves.
 *   - Bubbles, so the parent (results-grid or main) can listen on the container.
 *
 * Why this exists as a stub (not given):
 *   - Forces you to think about how unidirectional event flow works without
 *     a framework: parent owns state, children emit events, parent re-renders.
 *
 * Suggested Claude Code prompt:
 *   "Implement createTrackCard(props) in src/components/track-card.ts.
 *    Render a div.track-card with .track-art (cover_url image OR fallback ♪),
 *    .track-info (title + 'artist · album'), and .track-actions with one
 *    button.btn-icon. The button toggles between save/unsave based on props.saved.
 *    Add 'is-saved' class on the root when props.saved is true. The button
 *    dispatches a CustomEvent('save' or 'unsave', { detail, bubbles: true })."
 */

import type { Track } from '../contracts.ts';

export type TrackCardProps = {
  track: Track;
  saved: boolean;
};

export function createTrackCard(_props: TrackCardProps): HTMLElement {
  // TODO: implement the DOM tree described above.
  // Return the root HTMLElement. Don't query the document; only build local DOM.
  const root = document.createElement('div');
  root.className = 'track-card';
  root.textContent = '(track-card not implemented)';
  return root;
}
