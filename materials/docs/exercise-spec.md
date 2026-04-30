# Exercise 3: Make It Shippable: Spec

**Alignment session:** Mon Apr 27 · **Due:** Mon May 4
**Branch:** `student/<your-name>` off `exercise-3`
**Repo:** `github.com/codotech/academy` (clone if you haven't already)
**Premise:** You built a Music Finder backend that searches Spotify. It works on your laptop. That is not enough. Make it real.

**No new features.** Everything below is about the existing backend.

**Work order:** A → B → C → D → E. Each part builds on the previous one. Don't skip ahead.

---

## Part A: Describe It (OpenAPI)

> **Read first:** Concept 3 (OpenAPI and Contracts) · `/learn 3`

The OpenAPI spec (`backend/openapi.yaml`) and Swagger UI are already wired in the `exercise-3` template. Your job:

1. Open `http://localhost:3000/api-docs` and verify Swagger UI loads and you can execute a search from the browser.
2. Read `openapi.yaml`. Verify every field matches `frontend/src/contracts.ts`.
3. Try the search endpoint in Swagger UI with a real query. Verify the response matches the documented shape.

**If you ported your own HW2 implementation:** add `swagger-ui-express` and wire it to serve `openapi.yaml` at `/api-docs`. The reference implementation shows how (see `src/index.ts`).

### Acceptance

- [ ] `GET /api-docs` serves interactive Swagger UI
- [ ] You can execute a search from Swagger UI and get real Spotify results
- [ ] Every field in the OpenAPI spec matches `contracts.ts`

---

## Part B: Containerize It (Docker)

> **Read first:** Concept 2 (Docker) · Concept 9 (Artifacts and Versioning) · `/learn 2`

Write a Dockerfile for the backend. Multi-stage build: one stage compiles TypeScript, one runs the production app.

1. Create `backend/Dockerfile` (two stages: builder + production).
2. Add a `HEALTHCHECK` instruction that hits `GET /health`.
3. Create or update `docker-compose.yml` at the repo root with a `backend` service.
4. `docker compose up` and verify the backend responds on `localhost:3000`.

### Decisions you make (Claude implements)

- Which base image? (`node:22-alpine` is the standard for this exercise.)
- What goes in `.dockerignore`?
- What does the production stage copy from the builder?
- Which user does the container run as?

### Acceptance

- [ ] `docker compose up` starts the backend
- [ ] `curl http://localhost:3000/health` returns `{ "status": "ok" }`
- [ ] `curl "http://localhost:3000/api/search?q=radiohead"` returns valid tracks
- [ ] `docker images` shows the production image is under 250MB

---

## Part C: Prove It Works (System Test)

> **Read first:** Concept 8 (Test Taxonomy) · `/learn 8`

Write one system test file that proves the backend works from the outside. Black-box. No imports from your backend code. HTTP only.

1. Create `backend/tests/system/search.system.spec.ts`.
2. Use Testcontainers + Vitest: start the Docker image, wait for health check, hit the API, validate against Zod schemas.
3. At minimum, three test cases:
   - `GET /health` → 200 with `{ status: "ok" }`
   - `GET /api/search?q=radiohead` → 200 with valid `SearchResponseSchema` response, at least 1 result
   - `GET /api/search` (no q) → 400 with valid `ErrorResponseSchema` response

### How the test works

```
beforeAll:
  1. Build Docker image: docker build -t music-finder-backend:test ./backend
  2. Start container via GenericContainer with env vars (SPOTIFY_CLIENT_ID, etc.)
  3. Wait: Wait.forHttp('/health', 3000).forStatusCode(200)
  4. Get the mapped port: container.getMappedPort(3000)

each test:
  5. Plain fetch() to http://${host}:${port}/...
  6. Validate response with SearchResponseSchema or ErrorResponseSchema from contracts.ts

afterAll:
  7. Stop container
```

### Acceptance

- [ ] `npm run test:system` passes locally
- [ ] Tests import Zod schemas from `frontend/src/contracts.ts` (same contract as the frontend)
- [ ] Tests use `fetch()` only, no imports from `backend/src/`
- [ ] Container starts with real Spotify credentials and returns real data

---

## Part D: Let Machines Prove It (CI)

> **Read first:** Concept 6 (Why CI Exists) · Concept 7 (CI Building Blocks) · Concept 5 (CI + AI Feedback Loop) · `/learn 6`

Set up a GitHub Actions workflow that runs on every push to your branch.

1. Create `.github/workflows/ci.yml`.
2. Pipeline order: **lint → typecheck → system test → build**.
3. Lint and typecheck run in parallel. System test runs after both pass. Build runs last.
4. System test needs Docker and Spotify credentials (set as GitHub Secrets).

### A CI step looks like this

```yaml
- name: Typecheck
  run: cd backend && npm run typecheck

- name: System tests
  run: cd backend && npm run test:system
  env:
    SPOTIFY_CLIENT_ID: ${{ secrets.SPOTIFY_CLIENT_ID }}
    SPOTIFY_CLIENT_SECRET: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
```

### Acceptance

- [ ] CI triggers on push to `exercise-3` and `student/**` branches
- [ ] Pipeline runs: lint → typecheck → system test → build
- [ ] Green badge on your `student/<name>` branch

---

## Part E: Let the World See It (Deploy to Render)

> **Read first:** Concept 4 (From Localhost to Production) · `/learn 4`

Deploy the backend to Render.com as a Docker web service.

1. Create a Web Service on Render, connected to `codotech/academy`, your branch.
2. Set the root directory to `backend`.
3. Set environment variables in the Render dashboard: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `CORS_ORIGIN` (your deployed frontend URL).
4. Render builds your Dockerfile, runs the health check, and deploys.
5. Update `CORS_ORIGIN` on Render to your deployed frontend URL.

**Frontend:** Deploy as a Static Site on Render (or keep on Netlify). Update the frontend's API URL to point to your deployed backend.

### Acceptance

- [ ] Backend is live on Render with a public URL
- [ ] `curl https://<your-backend>.onrender.com/health` returns `{ "status": "ok" }`
- [ ] `curl "https://<your-backend>.onrender.com/api/search?q=radiohead"` returns tracks
- [ ] Frontend calls the deployed backend (not localhost)
- [ ] CORS configured: frontend origin allowed, others blocked

---

## What the Codo Guide Helps With

- Scaffolding the Dockerfile (Claude writes it, you understand the stages)
- Writing the system test (Claude implements, you define what "correct" means)
- Diagnosing CI failures (Claude reads the output, you learn from it)
- The Guide nudges commits, lint, and CI pushes at natural checkpoints

## What You Do Without Claude

- **Design decisions:** which base image? what goes in each Docker stage? what's in `.dockerignore`?
- **API documentation:** verify the OpenAPI spec matches your implementation
- **Render deployment:** configure the dashboard, set env vars, debug CORS
- **Commit messages:** articulate intent: what did you change and why?

---

## Commit Discipline

Your commit history is part of the deliverable. It should tell the story of how you made the backend shippable.

Good commit log:
```
feat: add Dockerfile with multi-stage build
feat: add docker-compose for local development
test: add system test for search endpoint
ci: add GitHub Actions workflow
deploy: configure Render with production CORS
```

Bad commit log:
```
wip
fix stuff
update
done
```

The Codo Guide nudges commits at natural checkpoints. Don't ignore the nudge. Use it.

---

## Summary: What "Done" Looks Like

| # | Criterion | How to verify |
|---|---|---|
| 1 | `/api-docs` serves Swagger UI | Open in browser |
| 2 | `docker compose up` runs the backend | `curl localhost:3000/health` |
| 3 | System test passes locally | `npm run test:system` |
| 4 | CI is green on your branch | GitHub Actions badge |
| 5 | Backend is live on Render | `curl https://<your-url>/health` |
| 6 | Frontend calls deployed backend | Search works from the deployed frontend |
| 7 | Commit history tells the story | `git log --oneline` |

---

## Getting Started

```bash
git clone https://github.com/codotech/academy.git
cd academy
git checkout student/<your-name>
cd backend && npm install
cp .env.example .env   # then fill in your Spotify credentials
npm run dev             # verify it works before you start
```

## Reading

- `materials/docs/walkthrough-laptop-to-production.md`: the "why" behind every step
- `materials/docs/api-contracts.md`: deep dive on contracts, OAuth, and the OpenAPI ecosystem
- `materials/concepts/`: 9 concept references with linked YouTube videos (git, Docker, OpenAPI, deploy, CI, testing, artifacts)
- Discuss any concept Socratically with the Codo Guide using `/learn <number>` inside Claude Code
