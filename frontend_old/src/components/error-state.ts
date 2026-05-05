/**
 * ErrorState  GIVEN.
 *
 * Used when a search fails (network error, contract violation, backend down).
 * Emits a 'retry' CustomEvent when the retry button is clicked.
 */

export type ErrorStateProps = {
  title?: string;
  message: string;
  showRetry?: boolean;
};

export function createErrorState(props: ErrorStateProps): HTMLElement {
  const title = props.title ?? 'Something went wrong';
  const showRetry = props.showRetry ?? true;

  const root = document.createElement('div');
  root.className = 'state';
  root.setAttribute('role', 'alert');

  root.innerHTML = `
    <div class="state-title">${escapeText(title)}</div>
    <p class="state-message">${escapeText(props.message)}</p>
    ${
      showRetry
        ? `<div class="state-actions">
             <button type="button" class="btn btn-primary" data-action="retry">Try again</button>
           </div>`
        : ''
    }
  `;

  if (showRetry) {
    root.querySelector<HTMLButtonElement>('[data-action="retry"]')?.addEventListener('click', () => {
      root.dispatchEvent(new CustomEvent('retry', { bubbles: true }));
    });
  }

  return root;
}

function escapeText(value: string): string {
  const div = document.createElement('div');
  div.textContent = value;
  return div.innerHTML;
}
