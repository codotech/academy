/**
 * ResultsGrid  STUB (you implement the body).
 *
 * Owns the "results area" of the home view. Has four states:
 *   - empty        show <EmptyState> (history-empty copy)
 *   - suggested    show user's saved tracks under "Suggested from your history"
 *   - results      show search results under "Results for <query>"
 *   - loading      show <LoadingState>
 *   - error        show <ErrorState> with a retry handler
 *
 * Why this exists as a stub:
 *   - You'll design the small state machine that swaps the contents in.
 *   - You'll wire 'save' / 'unsave' bubbling events from track cards into state.ts.
 *
 * Suggested Claude Code prompt:
 *   "Implement createResultsGrid in src/components/results-grid.ts. Return
 *    an object { element, setLoading, setError, showResults(query, tracks),
 *    showSuggested(tracks), showEmpty }. The element wraps a section divider
 *    and a results container. Use createTrackCard, createEmptyState,
 *    createLoadingState, createErrorState. Use isTrackSaved from state.ts to
 *    set the saved flag on each card."
 */

import type { Track } from '../contracts.ts';

export type ResultsGrid = {
  element: HTMLElement;
  setLoading: () => void;
  setError: (message: string, onRetry: () => void) => void;
  showResults: (query: string, tracks: Track[]) => void;
  showSuggested: (tracks: Track[]) => void;
  showEmpty: () => void;
};

export function createResultsGrid(): ResultsGrid {
  // TODO: implement.
  //
  // The stub bodies below render a visible "stub called" card so you can see
  // the event flow is working before you implement anything. Replace each
  // body with the real DOM-building logic described in the comment above.

  const element = document.createElement('section');
  element.className = 'results-section';
  element.appendChild(stubBlock('initial', 'createResultsGrid()', 'Type a search above and click submit to see the event flow.'));

  return {
    element,
    setLoading: (): void => {
      element.replaceChildren(stubBlock('setLoading', 'setLoading()', 'Replace this with createLoadingState() while a search is in flight.'));
    },
    setError: (message, _onRetry): void => {
      element.replaceChildren(
        stubBlock('setError', 'setError(message, onRetry)', `Replace this with createErrorState(). Message received: "${message}"`),
      );
    },
    showResults: (query, tracks): void => {
      element.replaceChildren(
        stubBlock(
          'showResults',
          'showResults(query, tracks)',
          `Replace this with a section divider ("Results for ${query}") and a grid of createTrackCard() for ${tracks.length} tracks.`,
        ),
      );
    },
    showSuggested: (tracks): void => {
      element.replaceChildren(
        stubBlock(
          'showSuggested',
          'showSuggested(tracks)',
          `Replace this with a section divider ("Suggested from your history") and a grid of createTrackCard() for ${tracks.length} tracks.`,
        ),
      );
    },
    showEmpty: (): void => {
      element.replaceChildren(stubBlock('showEmpty', 'showEmpty()', 'Replace this with createEmptyState().'));
    },
  };
}

function stubBlock(_id: string, methodLabel: string, hint: string): HTMLElement {
  const root = document.createElement('div');
  root.className = 'state';
  root.innerHTML = `
    <div class="state-title">🔧 stub: ${methodLabel}</div>
    <p class="state-message">${escape(hint)}</p>
  `;
  return root;
}

function escape(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
