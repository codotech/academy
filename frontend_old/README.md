# Music Finder  Frontend

The frontend you'll wire up to your backend in Homework #2.

This is **not** a clean slate. Treat it like joining a real engineering team: the platform team has already built the structure, the design system, the contracts, and the build pipeline. Your job is to fill in the wiring that makes the system behave correctly.

## What's here

```
.
├── index.html                  # SPA shell, mounts #app
├── vite.config.ts              # dev server + /api proxy to localhost:3000
├── tsconfig.json               # TypeScript strict mode (a guardrail)
├── .eslintrc.cjs               # lint rules (a guardrail)
├── package.json
└── src/
    ├── main.ts                 # entry: imports CSS, mounts the home view
    ├── api.ts                  # 🔧 STUB  fetch wrapper to your backend
    ├── state.ts                # 🔧 STUB  localStorage history
    ├── contracts.ts            # ✅ GIVEN  Zod schemas for the API contract
    ├── views/
    │   └── home.ts             # ✅ GIVEN  composes header, prompt, results
    ├── components/
    │   ├── header.ts           # ✅ GIVEN
    │   ├── search-prompt.ts    # ✅ GIVEN
    │   ├── empty-state.ts      # ✅ GIVEN
    │   ├── loading-state.ts    # ✅ GIVEN
    │   ├── error-state.ts      # ✅ GIVEN
    │   ├── toast.ts            # ✅ GIVEN
    │   ├── track-card.ts       # 🔧 STUB  renders a single track + save button
    │   └── results-grid.ts     # 🔧 STUB  owns the results area state machine
    ├── styles/
    │   ├── tokens.css          # ✅ GIVEN  design tokens
    │   ├── base.css            # ✅ GIVEN  reset
    │   ├── layout.css          # ✅ GIVEN  app shell
    │   └── components.css      # ✅ GIVEN  buttons, cards, states
    └── fixtures/
        └── mock-search.json    # ✅ GIVEN  realistic Spotify-shape data for dev
```

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You'll see the page render, but searches will fail because `api.ts` is not implemented yet. That's the point.

## What you need to implement

Each STUB file has detailed comments explaining what to build and a Claude Code prompt template you can paste.

In order:

1. **`src/api.ts`**  `searchTracks(query): Promise<Track[]>`
   Validate the response with `SearchResponseSchema`. Throw typed errors (`NetworkError`, `BackendError`, `ContractError`) so the UI can render the right state.

2. **`src/state.ts`**  localStorage-backed history (saved tracks + recent queries).
   Validate what you read back with Zod. Don't trust localStorage.

3. **`src/components/track-card.ts`**  render one track with a save toggle.
   Emit `save` / `unsave` CustomEvents that bubble.

4. **`src/components/results-grid.ts`**  small state machine for the results area:
   `setLoading`, `setError`, `showResults`, `showSuggested`, `showEmpty`.

That's it. The home view (`src/views/home.ts`) wires these together once they exist. The CSS is done. The HTML shell is done. The Vite config is done.

## The contract

`src/contracts.ts` defines the API shape. Your backend MUST honor it:

```ts
GET /api/search?q=<query>

200 OK
{
  "results": [
    {
      "id": "string",
      "name": "string",
      "artist": "string",
      "album": "string",
      "preview_url": "string|null",
      "external_url": "string",
      "cover_url": "string|null"
    },
    ...
  ]
}

400 Bad Request | 502 Bad Gateway | 5xx
{
  "error": "string"
}
```

If the backend breaks the contract, the Zod parser in `api.ts` catches it and the UI shows a clear `ContractError`. **The contract is the guardrail.**

## Dev tips

- Vite proxies `/api/*` to `http://localhost:3000`. So in `api.ts` just `fetch('/api/search?q=...')`  no CORS pain in dev.
- Run `npm run typecheck` to catch type errors without starting the dev server.
- Run `npm run lint` to catch style and unsafe patterns.
- The dev server has hot module reload. Save and the page updates instantly.

## Scripts

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Start the dev server on `:5173` with HMR        |
| `npm run typecheck` | Run TypeScript in --noEmit mode                 |
| `npm run lint`      | Run ESLint over `src/`                          |
| `npm run build`     | Type-check then produce a production build      |
| `npm run preview`   | Serve the production build locally for sanity   |

## When you're done

You should be able to:

1. Type a search prompt → see real Spotify tracks render
2. Save a track → reload the page → see it in "Suggested from your history"
3. Stop the backend → search → see the error state with a Try Again button
4. Run `npm run typecheck && npm run lint` cleanly
