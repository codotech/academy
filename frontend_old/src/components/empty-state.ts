/**
 * EmptyState  GIVEN.
 *
 * Used when there are no results to show:
 *  - First load and history is empty: nudge the user to search.
 *  - History view with no saved tracks: same nudge, slightly different copy.
 */

export type EmptyStateProps = {
  title?: string;
  message?: string;
};

export function createEmptyState(props: EmptyStateProps = {}): HTMLElement {
  const title = props.title ?? 'Nothing here yet';
  const message =
    props.message ?? 'Use the prompt above to describe what you want to listen to.';

  const root = document.createElement('div');
  root.className = 'state';
  root.setAttribute('role', 'status');

  root.innerHTML = `
    <div class="state-title">${escapeText(title)}</div>
    <p class="state-message">${escapeText(message)}</p>
  `;

  return root;
}

function escapeText(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
