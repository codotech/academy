/**
 * API CONTRACTS  GIVEN. DO NOT MODIFY.
 *
 * These Zod schemas define the contract between the frontend and the backend.
 * The backend MUST return responses that match these shapes.
 *
 * Why Zod (and not just TypeScript types)?
 *
 *   TypeScript types are erased at runtime. They tell the compiler what to
 *   expect, but they don't catch a backend that ships the wrong shape, an
 *   external API that changes overnight, or a typo in a JSON field name.
 *
 *   Zod parses the response at runtime. If the backend breaks the contract,
 *   the frontend catches it BEFORE rendering broken UI to the user.
 *
 *   The contract is the guardrail. The types are a side benefit.
 *
 * If you need to change the shape of an endpoint, change it HERE FIRST.
 * Then update the backend to match. Then update any consumer.
 */

import { z } from 'zod';

/**
 * A single track returned by the backend's /api/search endpoint.
 *
 * Shape mirrors a simplified Spotify track:
 *  - id:           Spotify track id (stable across requests)
 *  - name:         Track name
 *  - artist:       Primary artist name (joined with ", " if multiple)
 *  - album:        Album name
 *  - preview_url:  30s mp3 preview, or null if not available
 *  - external_url: Public Spotify URL (open.spotify.com/track/...)
 *  - cover_url:    Album cover image, or null if not available
 */
export const TrackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  artist: z.string().min(1),
  album: z.string(),
  preview_url: z.string().url().nullable(),
  external_url: z.string().url(),
  cover_url: z.string().url().nullable(),
});
export type Track = z.infer<typeof TrackSchema>;

/**
 * Successful search response from GET /api/search?q=<query>
 */
export const SearchResponseSchema = z.object({
  results: z.array(TrackSchema),
});
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * Error response shape. The backend should return this with a non-2xx status
 * when something goes wrong (validation, upstream failure, etc.).
 */
export const ErrorResponseSchema = z.object({
  error: z.string().min(1),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
