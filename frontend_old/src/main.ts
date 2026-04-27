/**
 * main.ts  STUB (you implement the wiring).
 *
 * The only entry point. Vite serves this from index.html.
 *
 * Responsibilities:
 *   1. Import all CSS so Vite bundles it.
 *   2. Mount the home view into #app.
 *   3. Wire the events:
 *        - 'search' from SearchPrompt  -> call api.searchTracks, render results,
 *                                         record the query in history.
 *        - 'save' / 'unsave' from any TrackCard (bubbled through ResultsGrid)
 *          -> update state, show a toast, re-render the saved-flag where needed.
 *        - 'history' from Header -> show the "suggested from history" view.
 *
 * Suggested Claude Code prompt:
 *   "Implement the wiring in main.ts. After mounting the home view, attach a
 *    listener for 'search' on the search prompt that calls searchTracks and
 *    swaps the results-grid into loading -> results / error. Attach 'save' /
 *    'unsave' listeners on the results-grid root that call state.saveTrack /
 *    state.unsaveTrack and showToast. On initial load, read history and call
 *    showSuggested(tracks) if any, else showEmpty()."
 */

import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components.css';

import { mountHome } from './views/home.ts';

const root = document.getElementById('app');
if (!root) {
  throw new Error('Missing #app mount point in index.html');
}

mountHome(root);
