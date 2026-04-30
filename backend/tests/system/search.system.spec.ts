import { GenericContainer, Wait } from 'testcontainers';
import type { StartedTestContainer } from 'testcontainers';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Import the contract schemas — same ones the frontend uses
import { SearchResponseSchema, ErrorResponseSchema } from '../../../frontend/src/contracts.js';

describe('Music Finder API (black-box)', () => {
  let container: StartedTestContainer;
  let baseUrl: string;

  beforeAll(async () => {
    container = await new GenericContainer('music-finder-backend:test')
      .withExposedPorts(3000)
      .withEnvironment({
        PORT: '3000',
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID!,
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET!,
      })
      .withWaitStrategy(Wait.forHttp('/health', 3000).forStatusCode(200))
      .withStartupTimeout(60_000)
      .start();

    baseUrl = `http://${container.getHost()}:${container.getMappedPort(3000)}`;
  }, 120_000);

  afterAll(async () => {
    await container?.stop();
  });

  it('GET /health → 200 ok', async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('GET /api/search?q=radiohead → 200 with valid tracks', async () => {
    const res = await fetch(`${baseUrl}/api/search?q=radiohead`);
    expect(res.status).toBe(200);
    const body = await res.json();
    const parsed = SearchResponseSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.results.length).toBeGreaterThan(0);
    }
  });

  it('GET /api/search (no query) → 400 error', async () => {
    const res = await fetch(`${baseUrl}/api/search`);
    expect(res.status).toBe(400);
    const body = await res.json();
    const parsed = ErrorResponseSchema.safeParse(body);
    expect(parsed.success).toBe(true);
  });
});
