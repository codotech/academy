/**
 * Home view  GIVEN.
 *
 * Composes the page: header on top, prompt section, results section.
 *
 * NOTE: This file ASSEMBLES the components but it does NOT wire the search
 * flow. That belongs in main.ts (you'll write it). Here we just lay things
 * out and expose handles the wiring layer can listen to.
 *
 * Why this split?
 *   Views build the DOM. main.ts owns app-level behavior. Keeping them
 *   separate makes it obvious where state and side effects live.
 */

import { createHeader } from '../components/header.ts';
import { createSearchPrompt } from '../components/search-prompt.ts';
import { createResultsGrid } from '../components/results-grid.ts';
import { createEmptyState } from '../components/empty-state.ts';
import { showToast } from '../components/toast.ts';
import { searchTracks, NetworkError, BackendError, ContractError } from '../api.ts';
import {
  getHistory,
  recordSearch,
  saveTrack,
  unsaveTrack,
  isTrackSaved,
} from '../state.ts';
import type { Track } from '../contracts.ts';

export function mountHome(root: HTMLElement): void {
  // Build the static structure.
  const app = document.createElement('div');
  app.className = 'app';

  const header = createHeader();
  app.appendChild(header);

  const main = document.createElement('main');
  main.className = 'main';

  const promptSection = document.createElement('section');
  promptSection.className = 'prompt-section';

  const headline = document.createElement('h1');
  headline.className = 'prompt-headline';
  headline.textContent = 'What do you want to listen to?';
  promptSection.appendChild(headline);

  const sub = document.createElement('p');
  sub.className = 'prompt-sub';
  sub.textContent =
    'Describe a vibe, an activity, a genre  anything. We search Spotify and bring back what fits.';
  promptSection.appendChild(sub);

  const prompt = createSearchPrompt();
  promptSection.appendChild(prompt);

  main.appendChild(promptSection);

  const results = createResultsGrid();
  main.appendChild(results.element);

  app.appendChild(main);
  root.replaceChildren(app);

  // Initial state: render history (suggested) or empty nudge.
  renderHistoryView();

  // ---- Wiring ----

  // Search submitted from the prompt.
  prompt.addEventListener('search', (e) => {
    const detail = (e as CustomEvent<{ query: string }>).detail;
    void runSearch(detail.query);
  });

  // Save / unsave bubbled from any TrackCard inside the results grid.
  results.element.addEventListener('save', (e) => {
    const detail = (e as CustomEvent<{ track: Track }>).detail;
    saveTrack(detail.track);
    showToast('Saved to your history');
  });

  results.element.addEventListener('unsave', (e) => {
    const detail = (e as CustomEvent<{ id: string }>).detail;
    unsaveTrack(detail.id);
    showToast('Removed from history');
  });

  // History toggle in the header re-renders the suggested view.
  header.addEventListener('history', () => {
    renderHistoryView();
  });

  // ---- Helpers ----

  async function runSearch(query: string): Promise<void> {
    results.setLoading();
    try {
      const tracks = await searchTracks(query);
      recordSearch(query);
      results.showResults(query, tracks);
    } catch (err) {
      const message = describeError(err);
      results.setError(message, () => {
        void runSearch(query);
      });
    }
  }

  function renderHistoryView(): void {
    const { tracks } = getHistory();
    if (tracks.length === 0) {
      results.element.replaceChildren(
        createEmptyState({
          title: 'Your history is empty',
          message:
            'Search for something above. Tracks you save will show up here next time.',
        }),
      );
      return;
    }
    results.showSuggested(tracks);
  }
}

function describeError(err: unknown): string {
  if (err instanceof NetworkError) {
    return 'Could not reach the backend. Is it running on http://localhost:3000?';
  }
  if (err instanceof BackendError) {
    return `The backend returned ${err.status}. ${err.message}`;
  }
  if (err instanceof ContractError) {
    return `The backend returned an unexpected shape. ${err.message}`;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Something unexpected went wrong.';
}

// Re-export so main.ts can call it via the same import path students see.
export { isTrackSaved };
