import type { Track } from '../contracts.ts';

export type TrackCardProps = {
  track: Track;
  saved: boolean;
};

export function createTrackCard(props: TrackCardProps): HTMLElement {
  const { track, saved } = props;

  const root = document.createElement('div');
  root.className = saved ? 'track-card is-saved' : 'track-card';

  const art = document.createElement('div');
  art.className = 'track-art';
  if (track.cover_url) {
    const img = document.createElement('img');
    img.src = track.cover_url;
    img.alt = '';
    img.loading = 'lazy';
    art.appendChild(img);
  } else {
    art.textContent = '♪';
  }
  root.appendChild(art);

  const info = document.createElement('div');
  info.className = 'track-info';

  const title = document.createElement('div');
  title.className = 'track-title';
  title.textContent = track.name;
  info.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'track-meta';
  meta.textContent = `${track.artist} · ${track.album}`;
  info.appendChild(meta);

  root.appendChild(info);

  const actions = document.createElement('div');
  actions.className = 'track-actions';

  if (track.external_url) {
    const link = document.createElement('a');
    link.href = track.external_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'btn-icon';
    link.setAttribute('aria-label', 'Open on Spotify');
    link.textContent = '↗';
    actions.appendChild(link);
  }

  const button = document.createElement('button');
  button.type = 'button';
  button.className = saved ? 'btn-icon is-active' : 'btn-icon';
  button.setAttribute('aria-label', saved ? 'Remove from history' : 'Save to history');
  button.setAttribute('aria-pressed', String(saved));
  button.textContent = saved ? '♥' : '♡';

  button.addEventListener('click', () => {
    const eventName = saved ? 'unsave' : 'save';
    const detail = saved ? { id: track.id } : { track };
    root.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
  });

  actions.appendChild(button);
  root.appendChild(actions);

  return root;
}