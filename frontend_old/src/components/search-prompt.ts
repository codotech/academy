/**
 * SearchPrompt  GIVEN.
 *
 * Chat-style input. Emits a 'search' CustomEvent with detail = { query }
 * when the user submits a non-empty query (Enter or button click).
 *
 * Usage:
 *   const el = createSearchPrompt();
 *   el.addEventListener('search', (e) => {
 *     const { query } = (e as CustomEvent<{ query: string }>).detail;
 *     // call api, render results, etc.
 *   });
 */

export type SearchPromptProps = {
  placeholder?: string;
  initialValue?: string;
};

export type SearchEventDetail = { query: string };

export function createSearchPrompt(props: SearchPromptProps = {}): HTMLElement {
  const placeholder =
    props.placeholder ?? 'What do you want to listen to? e.g. "chill house for focus"';

  const form = document.createElement('form');
  form.className = 'prompt-form';
  form.setAttribute('role', 'search');

  form.innerHTML = `
    <span class="prompt-icon" aria-hidden="true">⌕</span>
    <label for="prompt-input" class="sr-only">Describe the music you want to find</label>
    <input
      id="prompt-input"
      class="prompt-input"
      type="text"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="${escapeAttr(placeholder)}"
      value="${escapeAttr(props.initialValue ?? '')}"
    />
    <button type="submit" class="btn btn-primary" aria-label="Search">
      <span aria-hidden="true">→</span>
    </button>
  `;

  const input = form.querySelector<HTMLInputElement>('#prompt-input');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = (input?.value ?? '').trim();
    if (value.length === 0) {
      input?.focus();
      return;
    }
    form.dispatchEvent(
      new CustomEvent<SearchEventDetail>('search', {
        detail: { query: value },
        bubbles: true,
      }),
    );
  });

  return form;
}

function escapeAttr(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
