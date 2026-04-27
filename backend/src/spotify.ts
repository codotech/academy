const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SEARCH_URL = 'https://api.spotify.com/v1/search';

export type Track = {
  id: string;
  name: string;
  artist: string;
  album: string;
  preview_url: string | null;
  external_url: string;
  cover_url: string | null;
};

export class SpotifyError extends Error {}

let cached: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new SpotifyError('Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET');
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new SpotifyError(`Token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cached.token;
}

type SpotifySearchResponse = {
  tracks?: {
    items: Array<{
      id: string;
      name: string;
      artists: Array<{ name: string }>;
      album: { name: string; images: Array<{ url: string }> };
      preview_url: string | null;
      external_urls: { spotify: string };
    }>;
  };
};

export async function searchTracks(query: string): Promise<Track[]> {
  const token = await getToken();
  const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&type=track&limit=10`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new SpotifyError(`Search failed: ${res.status}`);
  }

  const data = (await res.json()) as SpotifySearchResponse;
  const items = data.tracks?.items ?? [];

  return items.map((t) => ({
    id: t.id,
    name: t.name,
    artist: t.artists.map((a) => a.name).join(', '),
    album: t.album.name,
    preview_url: t.preview_url ?? null,
    external_url: t.external_urls.spotify,
    cover_url: t.album.images[0]?.url ?? null,
  }));
}