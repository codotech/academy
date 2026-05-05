/**
 * Toast  GIVEN.
 *
 * Tiny one-liner toasts. Auto-dismiss after `duration` ms.
 *
 *   showToast('Saved to history');
 */

export function showToast(message: string, duration = 1800): void {
  const region = document.getElementById('toast-region');
  if (!region) return;

  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  region.appendChild(el);

  window.setTimeout(() => {
    el.remove();
  }, duration);
}
