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

export async function searchTracks(query: string): Promise<Track[]> {
  const url = `/api/search?q=${encodeURIComponent(query)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new NetworkError(err instanceof Error ? err.message : 'fetch failed');
  }

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === 'string') message = body.error;
    } catch {
      // body wasn't JSON — keep the HTTP message
    }
    throw new BackendError(message, response.status);
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ContractError('Response was not valid JSON');
  }

  const parsed = SearchResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ContractError(parsed.error.message);
  }

  return parsed.data.results;
}
