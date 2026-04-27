/**
 * Header  GIVEN.
 *
 * Sticky top bar with brand and a "History" toggle. Emits a 'history' custom
 * event on the returned root element when the toggle is clicked.
 */

export type HeaderProps = {
  showHistory?: boolean;
};

export function createHeader(props: HeaderProps = {}): HTMLElement {
  const root = document.createElement('header');
  root.className = 'header';

  root.innerHTML = `
    <div class="header-inner">
      <a class="brand" href="/" aria-label="Music Finder home">
        <span class="brand-mark" aria-hidden="true">♪</span>
        <span>Music Finder</span>
      </a>
      <div class="header-actions">
        <button type="button" class="btn btn-ghost" data-action="history" aria-pressed="${
          props.showHistory ? 'true' : 'false'
        }">
          History
        </button>
      </div>
    </div>
  `;

  const historyBtn = root.querySelector<HTMLButtonElement>('[data-action="history"]');
  historyBtn?.addEventListener('click', () => {
    root.dispatchEvent(new CustomEvent('history', { bubbles: true }));
  });

  return root;
}
