/**
 * LoadingState  GIVEN.
 *
 * Skeleton grid of placeholder cards while a search is in flight.
 */

export function createLoadingState(count = 6): HTMLElement {
  const root = document.createElement('div');
  root.className = 'skeleton-grid';
  root.setAttribute('aria-busy', 'true');
  root.setAttribute('aria-label', 'Loading results');

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'skeleton';
    card.innerHTML = `
      <div class="skeleton-art"></div>
      <div class="skeleton-lines">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    `;
    root.appendChild(card);
  }

  return root;
}
