import type { Track } from '../contracts.ts';
import { createTrackCard } from './track-card.ts';
import { createEmptyState } from './empty-state.ts';
import { createLoadingState } from './loading-state.ts';
import { createErrorState } from './error-state.ts';
import { isTrackSaved } from '../state.ts';

export type ResultsGrid = {
  element: HTMLElement;
  setLoading: () => void;
  setError: (message: string, onRetry: () => void) => void;
  showResults: (query: string, tracks: Track[]) => void;
  showSuggested: (tracks: Track[]) => void;
  showEmpty: () => void;
};

export function createResultsGrid(): ResultsGrid {
  const element = document.createElement('section');
  element.className = 'results-section';

  function renderGrid(title: string, tracks: Track[], emptyMessage: string): void {
    element.replaceChildren();

    const divider = document.createElement('div');
    divider.className = 'section-divider';
    divider.textContent = title;
    element.appendChild(divider);

    if (tracks.length === 0) {
      element.appendChild(createEmptyState({ title: 'Nothing to show', message: emptyMessage }));
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'results-grid';
    for (const track of tracks) {
      grid.appendChild(createTrackCard({ track, saved: isTrackSaved(track.id) }));
    }
    element.appendChild(grid);
  }

  return {
    element,
    setLoading: (): void => {
      element.replaceChildren(createLoadingState());
    },
    setError: (message, onRetry): void => {
      const errorEl = createErrorState({ message });
      errorEl.addEventListener('retry', () => onRetry(), { once: true });
      element.replaceChildren(errorEl);
    },
    showResults: (query, tracks): void => {
      renderGrid(`Results for "${query}"`, tracks, 'No tracks matched that search.');
    },
    showSuggested: (tracks): void => {
      renderGrid('Suggested from your history', tracks, 'Save some tracks and they will appear here.');
    },
    showEmpty: (): void => {
      element.replaceChildren(createEmptyState());
    },
  };
}