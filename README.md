# Music Finder — Exercise 3: Make It Shippable

You built a backend that searches Spotify and a frontend that displays results. It works on your laptop. Exercise 3 is about making it real: described, containerized, tested, validated, and deployed.

**No new features.** Everything is about the existing backend.

```
.
├── backend/       Express + Spotify integration + OpenAPI
├── frontend/      Pre-built UI (unchanged from HW2)
├── docs/          Exercise materials — start here
└── .claude/       Codo Guide config (loads automatically in Claude Code)
```

---

## Quick Start

```bash
git clone https://github.com/codotech/academy.git
cd academy
git checkout student/<your-name>
```

### Backend

```bash
cd backend_old
cp .env.example .env   # paste your Spotify credentials
npm install
npm run dev
# → http://localhost:3000/health returns { "status": "ok" }
# → http://localhost:3000/api-docs opens Swagger UI
```

### Frontend

```bash
cd frontend_old
npm install
npm run dev
# → http://localhost:5173
```

---

## Branch Topology

```
exercise-2              ← HW2 starting state (preserved)
exercise-3 (default)    ← Ex3 template: reference API + OpenAPI + scaffolding
student/<your-name>     ← your working branch
```

**Two paths to the starting line:**

- **Finished HW2?** Port your Spotify implementation onto your `student/<name>` branch. Good git practice.
- **Didn't finish HW2?** The reference implementation on `exercise-3` is ready. Start directly with Docker, CI, and deploy.

---

## Exercise Materials

All in `docs/`:

| File | What it is |
|---|---|
| **`exercise-spec.md`** | The homework: deliverables, acceptance criteria, step-by-step |
| **`walkthrough-laptop-to-production.md`** | Class backbone — the "why" behind every step |
| **`api-contracts.md`** | Deep dive on contracts, Zod, OAuth, and the OpenAPI ecosystem |

**Videos:** 7 NotebookLM deep-dives (git, Docker, CI, OpenAPI, env vars, Render, Claude+CI). Links shared in Slack.

Start with `docs/exercise-spec.md`.

---

## The Spine

Six questions. Each one depends on the previous.

```
You wrote code
  → Can you describe it?      (OpenAPI / Swagger UI at /api-docs)
  → Can you run it anywhere?  (Docker, env vars)
  → Can you prove it works?   (curl, Postman, system tests)
  → Can machines prove it?    (CI — GitHub Actions)
  → Can the world see it?     (Deploy to Render.com)
  → Can your AI partner keep it working?  (Claude + CI feedback loop)
```

---

## How Claude Works in This Exercise

The Codo Guide (`.claude/CLAUDE.md`) is configured for Exercise 3. It:

- **Greets you** on session start with context and available skills
- **Nudges commits** at natural checkpoints (test green, endpoint wired, before task switch)
- **Nudges lint** before you move to the next section
- **Nudges CI pushes** when you have local commits the pipeline hasn't seen

**Skills:**
- `/checkpoint` — 3 quick questions on what you just built (2 min)
- `/explainback` — explain a concept in your own words; the Guide critiques

The Guide implements, but it asks before explaining. Your job is to design, decide, and prove it works.
