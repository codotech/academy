/**
 * api.ts  STUB (you implement this).
 *
 * What this module does:
 *   Talks to YOUR backend. Wraps fetch with sensible defaults and validates
 *   responses against the contract in `src/contracts.ts`.
 *
 * Why it exists:
 *   - Single place where HTTP lives (everyone else imports from here).
 *   - Runtime validation catches contract violations before they reach the UI.
 *   - Typed errors let the UI render the right state.
 *
 * What you need to implement:
 *   - searchTracks(query): calls GET /api/search?q=<query>, parses with Zod,
 *     returns Track[]. Throws one of the typed errors below on failure.
 *
 * Notes:
 *   - In dev, Vite proxies '/api/*' to the backend at http://localhost:3000.
 *     So fetch('/api/search?q=...') just works. No CORS dance needed.
 *   - Use VITE_BACKEND_URL only if you want to override the proxy.
 *
 * Suggested Claude Code prompt:
 *   "Implement searchTracks in src/api.ts. Call GET /api/search?q=<query>.
 *    Handle network errors (NetworkError), non-2xx responses (BackendError),
 *    and Zod validation failures (ContractError). Return Track[] on success.
 *    Read the existing contracts.ts and types defined in this file before
 *    implementing."
 */

import { SearchResponseSchema, type Track } from './contracts.ts';

export class NetworkError extends Error {
  override readonly name = 'NetworkError';
}

export class BackendError extends Error {
  override readonly name = 'BackendError';
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export class ContractError extends Error {
  override readonly name = 'ContractError';
}

/**
 * Search tracks via the backend.
 *
 * @param query - the user's search prompt (already trimmed and non-empty).
 * @returns array of Track on success.
 * @throws NetworkError | BackendError | ContractError
 */
export async function searchTracks(_query: string): Promise<Track[]> {
  // TODO: implement.
  //
  // Steps:
  //  1. Build the URL: '/api/search?q=' + encodeURIComponent(query)
  //  2. Try { await fetch(url) } catch { throw new NetworkError(...) }
  //  3. If !response.ok, throw new BackendError(`HTTP ${response.status}`, response.status)
  //  4. Parse the JSON body.
  //  5. Run SearchResponseSchema.safeParse(body). If !success, throw ContractError.
  //  6. Return parsed.data.results.
  //
  // Why: this gives the UI three precise failure modes to render differently.
  //
  // Tip: Reference SearchResponseSchema and Track in contracts.ts.
  void SearchResponseSchema; // remove this line once you actually use it
  await Promise.resolve(); // keeps this function honest as async; delete when you call fetch()
  throw new Error('searchTracks() not implemented yet');
}
