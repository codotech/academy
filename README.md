# Music Finder — Exercise 3: Make It Shippable

You built a backend that searches Spotify and a frontend that displays results. It works on your laptop. Exercise 3 is about making it real: described, containerized, tested, validated, and deployed.

**No new features.** Everything is about the existing backend.

---

## Quick Start

```bash
git clone https://github.com/codotech/academy.git
cd academy
git checkout student/<your-name>
```

### Backend

```bash
cd backend
cp .env.example .env   # paste your Spotify credentials
npm install
npm run dev
# → http://localhost:3000/health returns { "status": "ok" }
# → http://localhost:3000/api-docs opens Swagger UI
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## The Spine

Six questions. Each one builds on the previous.

```
You wrote code
  → Can you describe it?      (OpenAPI / Swagger UI at /api-docs)
  → Can you run it anywhere?  (Docker, env vars)
  → Can you prove it works?   (curl, Postman, system tests)
  → Can machines prove it?    (CI — GitHub Actions)
  → Can the world see it?     (Deploy to Render.com)
  → Can your AI partner keep it working?  (Claude + CI feedback loop)
```

Open Claude Code and type `/letsgo` to see the full roadmap with parts A-E.

**The spec:** [`materials/docs/exercise-spec.md`](materials/docs/exercise-spec.md) — deliverables, acceptance criteria, and work order. Due Mon May 4.

---

## The Nine Concepts

Each concept has a written reference with linked YouTube videos. Use `/learn <number>` to discuss any of them Socratically with the Codo Guide.

| # | Concept | Prepares you for |
|---|---------|-----------------|
| 01 | Git in the LLM Era | Everything (meta-skill) |
| 02 | Docker: What and Why | Part B — Containerize |
| 03 | OpenAPI and Contracts | Part A — Describe |
| 04 | From Localhost to Production | Part E — Deploy |
| 05 | CI and the AI Feedback Loop | Part D — CI |
| 06 | Why CI Exists | Part D — CI |
| 07 | The Four Building Blocks of CI | Part D — CI |
| 08 | Test Taxonomy: White-Box, Black-Box | Part C — System tests |
| 09 | Artifacts and Versioning | Part B + D |

Concepts are in `materials/concepts/`. Start with the ones that match the part you are working on.

---

## Exercise Materials

| Path | What it is |
|---|---|
| `materials/docs/exercise-spec.md` | The homework: deliverables, acceptance criteria, step-by-step |
| `materials/docs/walkthrough-laptop-to-production.md` | The backbone reference — the "why" behind every step |
| `materials/docs/api-contracts.md` | Deep dive on contracts, Zod, OAuth, and the OpenAPI ecosystem |
| `materials/concepts/*.md` | 9 concept references with YouTube videos |

Start with `materials/docs/exercise-spec.md`.

---

## Branch Topology

```
exercise-2              ← HW2 starting state (preserved)
exercise-3 (default)    ← Ex3 template: reference API + OpenAPI + scaffolding
student/<your-name>     ← your working branch
```

---

## The Codo Guide

The Guide (`.claude/CLAUDE.md`) loads automatically when you open Claude Code in this repo.

**Skills:**
- `/letsgo` — See the exercise roadmap and pick where to start
- `/learn <number>` — Socratic walk-through of a concept (5-10 min)
- `/checkpoint` — 3 quick questions on what you just built (2 min)
- `/explainback` — Explain a concept in your own words; the Guide critiques

**Nudges:** The Guide nudges you to commit at natural checkpoints, run lint before moving on, and push to CI after a few local commits. These are learning guardrails, not rules.
