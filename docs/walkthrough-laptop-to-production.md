# Laptop to Production

*The backbone walkthrough for Exercise 3 — keep this open while you work.*

---

You built something. It works on your machine. You can search for tracks, the Spotify OAuth flow is wired up, and the frontend talks to your backend. The contract is honored. HW2 is done.

Now a real question: **can anyone else use it?**

Right now the answer is no. Your backend lives at `localhost:3000`. Nobody outside your machine can reach it. There are no guarantees it will start cleanly in a different environment. There is no proof it works other than your memory of running it. There is nothing preventing a broken push from killing it.

This exercise is about closing that gap. Every section below is a question the real world will ask you about your system. By the end, you will have an answer to each one.

The questions, in order:

1. Can you describe it?
2. Can you run it anywhere?
3. Can you prove it works?
4. Can machines prove it works?
5. Can the world see it?
6. Can your AI partner help you keep it working?

---

## Can You Describe It? — API Contracts and OpenAPI

You already have a contract. Look at `frontend/src/contracts.ts`. Every field your backend must return is described there as a Zod schema. The frontend validates against it at runtime. If your backend ships the wrong shape, the frontend surfaces a `ContractError` immediately — not a silent rendering failure.

**That contract is the single source of truth. Everything else is derived from it.**

But Zod schemas are TypeScript. Humans outside your codebase cannot read them directly. Tools — Postman, documentation sites, generated clients — cannot consume them. OpenAPI solves this: it is a language-agnostic, human-readable format that describes your API the same way your Zod schemas describe it.

### Swagger UI: try it in the browser

Once you add an OpenAPI spec, Swagger UI gives you a browser-based interface where anyone can read your endpoints, see the expected request and response shapes, and hit the API directly — without writing a line of code. This is the standard way backend engineers share their API during development.

### Contract-first design

Here is a discipline that will save you hours of debugging in production: **change the spec first, then the code.**

When you need to add a field to the search response, do this:

1. Update `contracts.ts` (the Zod schema).
2. Update the OpenAPI spec.
3. Update the backend implementation.
4. Update the system test.

In that order. If you update the implementation first and the contract second, you will have a window where your code and your contract disagree — and your system tests will not tell you because they validate against the contract, not the implementation.

### Why Zod runtime validation matters even when you have TypeScript

TypeScript types are erased at runtime. The `Track` type you defined does not exist in the running JavaScript. At runtime, your backend receives a raw blob from Spotify and your frontend receives a raw blob from your backend.

Zod validates the shape of that blob at the boundary. TypeScript tells the compiler what to expect. They are not the same thing. This is why `SearchResponseSchema.safeParse()` is not optional and why you validate even data you put there yourself — the schema is not a hint, it is a guardrail.

---

## Can You Run It Anywhere? — Docker and Environment

"Works on my machine" is not a deployment strategy.

Your backend depends on a specific Node.js version, specific npm packages, environment variables with Spotify credentials, and port availability. On your machine, all of that is set up. On a CI server, on a teammate's laptop, or on a production host — none of it is set up.

**Docker packages your app and everything it needs into a single image that runs identically anywhere.**

### The Dockerfile

A Dockerfile is a recipe. It says: start from this base image, copy these files, install these dependencies, expose this port, run this command. The result is a container: an isolated, reproducible environment for your app.

A minimal two-stage build for this backend looks like:

```dockerfile
# Stage 1 — build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — production image
FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Why two stages?** The builder stage has your dev dependencies (TypeScript compiler, linters, test tools). The production image only has what the app needs to run. Smaller images start faster, have a smaller attack surface, and cost less to store and transfer. This matters at scale.

### docker-compose for local development

When your app needs Postgres or Redis alongside it, running three containers manually is error-prone. `docker-compose.yml` declares all of them together:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: dev
```

One command — `docker compose up` — starts everything.

### Environment variables: the flow

Every environment your app runs in has its own configuration. The same app runs in development with your local Spotify credentials, in CI with test credentials, and in production with real credentials. **The app code never changes — only the environment.

The flow is:

```
.env (local only, gitignored)
  → docker-compose (injects via env_file)
  → CI (set as GitHub Actions secrets)
  → Render (set in the dashboard)
```

The `.env` file is **never committed**. The `.env.example` file **is committed**. The example file documents which variables are required, with placeholder values. Any engineer cloning the repo knows exactly what to configure.

---

## Can You Prove It Works? — Testing from Outside

You can run your app and manually check that a search returns results. That is proof — but it requires a human, and humans forget.

**Automated proof means a machine can run the same check, consistently, on every push, in two minutes.**

### Manual proof first: curl and Postman

Before automating, understand what you are automating. Use curl to hit your running backend directly:

```bash
curl "http://localhost:3000/api/search?q=radiohead"
```

If the response matches the contract shape, the system works. If it does not, you know immediately — before writing a single test. Postman is the same idea with a GUI: create a request, run it, inspect the response.

This manual check is also how you debug when automated tests fail. If the test fails and curl also fails, the problem is in the app. If curl succeeds and the test fails, the problem is in the test.

### System tests: automated proof from outside

System tests are the automated version of the curl check. They do not know how your code is structured. They do not import your modules. They speak HTTP and validate responses.

**This is the black-box principle: test the behavior of the system, not the implementation of the code.**

Why does this matter? Because your code will change. Refactors, dependency swaps, architecture improvements — the internals will move. But the behavior — what the API promises — should stay stable. Tests that verify behavior survive refactors. Tests that verify internals break constantly.

### Testcontainers: a real environment in your test suite

System tests need a real environment to run against. Testcontainers spins one up:

1. It starts your app as a Docker container.
2. It starts any dependencies (Postgres, Redis) as Docker containers.
3. It waits for health checks to pass.
4. Your test hits the real HTTP endpoint.
5. The test validates the response against the same Zod schema your frontend uses.

The schema is the contract. Your system test uses the same `SearchResponseSchema` from `contracts.ts` that the frontend uses. If the backend response fails Zod validation in the test, it would also fail in the frontend. One source of truth.

### Why no unit tests, no integration tests

This course does not use unit tests or integration tests. That is a deliberate decision, not an oversight.

**If the system works end-to-end — if a real HTTP request returns the correct response — the code that produced it is irrelevant.**

Unit tests verify that a function produces an output. But a function that produces the right output can still be wired into the system incorrectly. Integration tests verify that components talk to each other, but they require mocks and stubs that drift from reality. System tests verify that the whole thing works from the outside, which is the only perspective that matters to the user.

You are not verifying code. You are verifying behavior. System tests do that directly.

---

## Can Machines Prove It Works? — CI/CD

Every push to `exercise-3` or a `student/**` branch triggers the CI pipeline automatically. You do not run it. GitHub Actions runs it.

The pipeline has four stages, in this order:

```
lint → typecheck → system-test → build
```

**The order matters. Cheaper checks run first.**

Lint takes five seconds. If your code has an unsafe pattern or a style violation, you find out in five seconds — not after waiting three minutes for tests to spin up. Each stage is a gate. A failure stops the pipeline. You fix the issue and push again.

### What each stage catches

**Lint** catches style violations, unsafe patterns, and rules you set in your ESLint config. It does not run your code. It reads it. A `console.log` left in production code, a `==` instead of `===`, an import from the wrong layer — lint catches these without running anything.

**Typecheck** catches type errors that lint misses. `tsc --noEmit` runs the TypeScript compiler against your entire codebase without emitting output. If a function receives the wrong type, if a property does not exist, if a null check is missing — typecheck catches it. Again, without running your code.

**System tests** catch behavioral failures. Lint and typecheck can pass and your app can still be completely broken — returning wrong data, crashing on valid input, failing to authenticate. System tests run the app and verify behavior.

**Build** catches packaging failures. Your app might run fine in development but fail to compile for production, or produce a Docker image that crashes on startup. The build step surfaces those failures before deployment.

### What happens when each step fails

A lint failure means your code has an unsafe or non-compliant pattern. Fix the pattern. Do not disable the rule.

A typecheck failure means your types are wrong. Fix the types. The type system is a guardrail, not a suggestion.

A system test failure means your app does not behave correctly. This is the most serious failure. Something in the system is broken. Read the test output, reproduce it locally with curl, fix the behavior.

A build failure means packaging is broken. Check the Dockerfile and your build script.

### A CI step in practice

Each stage in your GitHub Actions workflow looks like this:

```yaml
- name: Typecheck
  run: npm run typecheck

- name: System tests
  run: npm run test:system
```

Simple. The pipeline does not need to understand your app. It runs your scripts. Your scripts know what to do.

---

## Can the World See It? — Deploy to Render

CI is green. The build succeeds. Now you need a URL that anyone can visit.

### Why Render, not Netlify

Netlify hosts static files and serverless functions. Your backend is a long-running Express server — it listens on a port, holds state in memory, manages connections. That is not a serverless function. **Render hosts full Docker web services. That is what your app is.**

### The deploy flow

When you push to your production branch:

1. Render detects the push.
2. Render pulls your code and builds your Docker image.
3. Render runs the new container and polls your `/health` endpoint.
4. Once `/health` returns 200, traffic routes to the new container.
5. The old container drains its in-flight connections and stops.

**Zero-downtime rollover.** The health check is the gate. If your app starts but `/health` fails, Render keeps the old container running. Your previous deployment stays live until the new one is healthy. This is why a health endpoint is not optional — it is how the platform decides whether to trust your new code.

### CORS in production

Your frontend currently calls `http://localhost:3000`. Once deployed, your backend URL is something like `https://music-finder-xyz.onrender.com`. The frontend must call that URL.

**Your backend also needs to accept requests from your deployed frontend origin.** Right now your Express app has `app.use(cors())` — that accepts requests from any origin, which is fine for development. In production, you should restrict this to your actual frontend URL:

```typescript
app.use(cors({ origin: process.env.CORS_ORIGIN }));
```

Set `CORS_ORIGIN` in the Render dashboard to your deployed frontend URL. This is the same environment variable pattern you already know — just configured in the Render dashboard instead of a `.env` file.

### Environment variables on Render

Do not upload your `.env` file to Render. Set each variable individually in the Render dashboard under Environment. Render injects them into your container at startup, exactly like `env_file` in docker-compose does locally. The pattern is the same; the mechanism is the platform.

---

## Can Your AI Partner Help You Keep It Working? — Claude and CI

The CI pipeline gives you a feedback loop. Claude Code makes that loop fast.

### The feedback loop

```
write → push → CI runs → result
```

When CI fails, the failure output appears in GitHub Actions. You can also see it in your terminal if you are watching. Claude Code reads that output. You paste the failure, or describe it, and Claude explains what is wrong and what to fix.

This is not Claude writing code in a vacuum. This is Claude participating in a real engineering feedback loop — the same loop you would have with a senior engineer on your team. You describe the symptom, Claude helps diagnose the cause, you fix it, you push, CI runs again.

### How the Codo Guide nudges you

The `demo/.claude/CLAUDE.md` file — the Codo Guide — is configured to keep you moving through this loop correctly. It nudges you to:

- Commit at natural checkpoints (when a test goes green, when a feature lands).
- Run lint before moving on from a section.
- Push when you have local commits that CI has not seen yet.

These nudges are not restrictions. They are the habits of engineers who have learned, through production incidents, what happens when you skip them. **A commit that has not been pushed has not been proven.** The CI pipeline is the proof.

### What this looks like in practice

You finish wiring up the Dockerfile. The app starts locally. You commit. You push. CI runs. The system test fails — the health check is returning 503 because an environment variable is missing in the CI configuration. Claude reads the failure output with you:

> "The 503 on `/health` suggests the app is starting but not reaching a ready state. Check whether `SPOTIFY_CLIENT_ID` is set in your GitHub Actions secrets — the app likely exits early if env validation fails."

You check. It is missing. You add the secret. Push. CI green.

That exchange took four minutes. The same debugging without a feedback loop would have taken an hour of guessing.

**The AI is not a code generator here. It is a participant in your engineering process.** The CI output is structured information. Claude knows how to read it. Your job is to keep the loop running — push often, read the output, fix what it tells you.

---

## Next Steps

You have the mental model. Now execute it.

- **`exercise-spec.md`** — the actual deliverables, acceptance criteria, and branch setup for Exercise 3. Start here.
- **`notebooklm/`** — deep-dive video guides per topic. One video per section of this walkthrough if you want to go further on Docker, OpenAPI, system testing, or Render specifically.
- **`api-contracts.md`** — a focused explainer on API contract design: how to evolve a contract without breaking consumers, versioning strategies, and the relationship between Zod schemas and OpenAPI.
