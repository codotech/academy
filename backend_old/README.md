# Music Finder — Backend

Express + TypeScript backend that proxies Spotify search. Serves OpenAPI docs at `/api-docs`.

## API

| Endpoint | Success | Errors |
|---|---|---|
| `GET /health` | `200 { status: "ok" }` | — |
| `GET /api/search?q=<query>` | `200 { results: Track[] }` | `400` missing q · `502` Spotify down · `500` internal |
| `GET /api-docs` | Swagger UI | — |

The response shape is defined in `frontend/src/contracts.ts` (Zod schemas). The backend validates against the same contract.

## What's Here

```
src/
├── index.ts            Entry point — Express, CORS, Swagger UI, health check
├── search.route.ts     GET /api/search — validation, error mapping
└── spotify-client.ts   Client Credentials OAuth, token cache, Spotify search
```

- `openapi.yaml` — OpenAPI 3.1 spec (source of truth for Swagger UI)
- `api-examples/search.sh` — curl commands for every endpoint and error case
- `api-examples/Music-Finder.postman_collection.json` — importable Postman collection

## Setup

```bash
cp .env.example .env   # paste your Spotify Client ID and Secret
npm install
npm run dev            # → http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start with nodemon + tsx (auto-reload) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled `dist/index.js` (production) |
| `npm run typecheck` | `tsc --noEmit` — type validation only |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SPOTIFY_CLIENT_ID` | Yes | From [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) |
| `SPOTIFY_CLIENT_SECRET` | Yes | Same dashboard |
| `PORT` | No | Defaults to `3000` |
| `CORS_ORIGIN` | No | Defaults to `*`. Set to deployed frontend URL in production. |

App exits immediately if Spotify credentials are missing.

## Verify

```bash
curl localhost:3000/health
# → { "status": "ok" }

curl "localhost:3000/api/search?q=radiohead" | head -c 200
# → { "results": [ { "id": "...", "name": "Creep", ... } ] }

curl "localhost:3000/api/search"
# → 400 { "error": "Missing or empty query parameter: q" }

open http://localhost:3000/api-docs
# → Swagger UI
```
