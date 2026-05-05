import { z } from 'zod';
import { TrackSchema, type Track } from './contracts.ts';

export type History = {
  queries: string[];
  tracks: Track[];
};

const STORAGE_KEY = 'mf:v1';
const QUERY_CAP = 10;
const TRACK_CAP = 30;

const HistorySchema = z.object({
  queries: z.array(z.string().min(1)),
  tracks: z.array(TrackSchema),
});

function read(): History {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { queries: [], tracks: [] };
    const parsed = HistorySchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { queries: [], tracks: [] };
    return parsed.data;
  } catch {
    return { queries: [], tracks: [] };
  }
}

function write(history: History): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // storage full or disabled — silently drop
  }
}

export function getHistory(): History {
  return read();
}

export function recordSearch(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) return;
  const current = read();
  const queries = [trimmed, ...current.queries.filter((q) => q !== trimmed)].slice(0, QUERY_CAP);
  write({ ...current, queries });
}

export function saveTrack(track: Track): void {
  const current = read();
  const tracks = [track, ...current.tracks.filter((t) => t.id !== track.id)].slice(0, TRACK_CAP);
  write({ ...current, tracks });
}

export function unsaveTrack(id: string): void {
  const current = read();
  const tracks = current.tracks.filter((t) => t.id !== id);
  write({ ...current, tracks });
}

export function isTrackSaved(id: string): boolean {
  return read().tracks.some((t) => t.id === id);
}