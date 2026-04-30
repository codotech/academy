# Exercise 3: Make It Shippable

**Alignment session:** Mon Apr 27 · **Due:** Mon May 4 · **Cohort:** Pilot (4 students)

---

## The Pivot

HW1 taught you CDN and Netlify. HW2 taught you CORS, OAuth, and how a backend proxies a real API. Both exercises asked the same implicit question: can you build it?

Exercise 3 asks a different question: **can you ship it?**

Those are not the same thing. Every junior engineer eventually hits this moment. You built something. It runs on your laptop. You're proud of it. Then someone asks: "Can we put this in production?" And you realize you don't know how to answer. Not because the code is bad, but because the code is all you have.

Production doesn't care about your code. It cares about containers, environment variables, CI pipelines, deployed URLs, and proof that the thing works. That proof is not your word. It is a test suite that a machine runs on every commit.

Exercise 3 is that moment, deliberately. We are not adding features to Music Finder. We are making what you already built real.

---

## The Story: Laptop to Production

Here is the spine of this exercise. Six questions. Each one depends on the previous.

```
You wrote code
  → Can you describe it?      (OpenAPI/Swagger)
  → Can you run it anywhere?  (Docker, env vars)
  → Can you prove it works?   (Postman / curl, system tests)
  → Can machines prove it?    (CI)
  → Can the world see it?     (Deploy to Render, CORS)
  → Can your AI partner keep it working?  (Claude + CI feedback loop)
```

This is not an arbitrary checklist. Each step closes a gap that the previous one leaves open.

**OpenAPI** closes the gap between "I know what my API does" and "anyone can know what my API does." A contract written in your head is worthless to a consumer, a test harness, or a future version of yourself.

**Docker** closes the gap between "it works on my machine" and "it works on any machine." Environment variables are part of this: secrets that live in your `.env` must work through a container's environment, not hardcoded paths or local assumptions.

**System tests** close the gap between "I manually tested it" and "I can prove it behaves correctly." In this course, we test from the outside only, with no mocking internals and no unit tests for functions. A Testcontainers test that spins up the real container and hits the real endpoint is the only evidence that matters. This is the testing philosophy you will carry through the full Codo Academy course.

**CI** closes the gap between "the tests pass on my laptop" and "the tests pass on every commit, automatically, forever." A test suite that only runs when you remember to run it is not a guardrail. A GitHub Actions workflow that runs on every push is a guardrail.

**Deploy** closes the gap between "CI is green" and "users can reach it." Render.com is the deployment target for this exercise. You will configure CORS to allow your deployed frontend. The URL in your browser will no longer be `localhost`.

**The AI feedback loop** closes the last gap: a CI pipeline gives your AI partner structured, machine-readable feedback on every change. Claude reading a CI failure log is a different kind of collaboration than Claude reading your code. The loop (commit, CI runs, failure surfaces, Claude helps fix) is the working rhythm of professional engineering. You practice it here for the first time.

---

## This Is Chapter 0

The Codo Academy course has three chapters: Build, Architect, Harden. But before any of them, there is a prerequisite layer, what we call Chapter 0. It is not a chapter you study. It is a set of practices you internalize by doing them.

Chapter 0 is: git discipline, CI, contracts, Docker, deploy, system tests. The engineer's job in the AI era is to design the system, set up guardrails, and prove it works. Code is the implementation detail.

Exercise 3 is your first encounter with Chapter 0 applied to something you built. Every artifact you produce here (the OpenAPI spec, the Dockerfile, the system test, the CI workflow, the deployed URL) is not homework. It is the scaffolding that professional engineers use to ship with confidence. It is reusable. It is the paved road.

Think of it this way: a platform team does not build features. They build the road that product teams drive on. Every CI pipeline you configure, every container you harden, every system test you write: you are building that road. Features ride on top. Without the road, features are just code on a laptop.

---

## What Is Different from HW1 and HW2

HW1 and HW2 were about building. You added capabilities. The deliverable was a working system.

Exercise 3 adds nothing to the Music Finder backend. The `GET /api/search` endpoint is done. No new routes. No new integrations. No new features.

Everything in Exercise 3 is about making the existing backend real:

- Describing what it does (OpenAPI)
- Containerizing it (Docker)
- Proving it works without you watching (system tests)
- Automating that proof (CI)
- Putting it on the internet (Render.com)

The exercise is complete when the CI badge is green, the deployed URL returns results, and you did not prove it works. The machine did.

---

## How to Start Monday Morning

**Repo:** `git clone https://github.com/codotech/academy.git` (renamed from `academy-part-2`; GitHub auto-redirects old clones).

**Default branch:** `exercise-3`. This is the template. It contains a working Spotify search backend, OpenAPI at `/api-docs`, a Dockerfile, a CI pipeline, and system tests. Everything you need to begin the production-hardening work.

**Your branch:** `student/<your-name>`. Omer creates these before class. You push to your branch. PRs go from `student/<name>` → `exercise-3`.

**Two paths to the starting line:**

- **You finished HW2.** Checkout `student/<your-name>`. Port your Spotify integration from your HW2 work onto this branch by cherry-picking, rebasing, or copying your files. This is a real git exercise: moving code between branches deliberately.
- **You didn't finish HW2.** Checkout `student/<your-name>`. The reference implementation on `exercise-3` is already there. Start directly with Docker, CI, and deploy.

Both paths converge on the same work: make what you have shippable.

**The Codo Guide:** When you open Claude Code inside the repo, it loads `demo/.claude/CLAUDE.md` automatically. The Guide knows where you are in the exercise and will nudge you through commits, lint, and CI pushes at natural checkpoints.

---

## The Nine Concepts

Each concept has a written reference in `materials/concepts/` with linked YouTube videos. Use `/learn <number>` inside Claude Code to discuss any of them Socratically with the Codo Guide.

| # | Concept | Read before |
|---|---------|-------------|
| 01 | Git in the LLM Era | Everything (meta-skill) |
| 02 | Docker: What and Why | Part B |
| 03 | OpenAPI and Contracts | Part A |
| 04 | From Localhost to Production | Part E |
| 05 | CI and the AI Feedback Loop | Part D |
| 06 | Why CI Exists | Part D |
| 07 | The Four Building Blocks of CI | Part D |
| 08 | Test Taxonomy: White-Box, Black-Box | Part C |
| 09 | Artifacts and Versioning | Part B, Part D |

Concepts 06-09 go deeper on CI, testing, and artifacts. They are not prerequisites for the exercise, but reading them will change how you think about what you are building and why.

---

## What Comes Next

The sibling files in this folder:

- **`exercise-spec.md`:** the full spec: deliverables, acceptance criteria, step-by-step tasks
- **`walkthrough-laptop-to-production.md`:** the guided walkthrough, the backbone reference
- **`api-contracts.md`:** deep dive on API contract design, Zod, OAuth, and the OpenAPI ecosystem
- **`../concepts/`:** 9 written concept references

Start with `exercise-spec.md`. Read it before the alignment session on Apr 27.