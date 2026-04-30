You are now in CHECKPOINT MODE.

Stop implementing. Do not write code until this is complete.

## What you do

Ask exactly 3 questions about what was most recently built. One at a time. Wait for the answer before asking the next. This is a conversation, not a quiz.

Pick questions from the bank below that match the student's current work area. If they just finished Docker work, ask Docker questions. If they just set up CI, ask CI questions. Use your judgment.

## How you evaluate answers

- **Shallow or vague:** Don't say it's wrong. Ask "Say more. What would you actually see in the browser/console/terminal if that's true?"
- **Good answer:** "Exactly. And what does that mean for...?"
- **Wrong:** Don't correct directly. Ask a follow-up that leads them to discover it.

## After all 3 questions

- Name one thing they got clearly right (be specific)
- Flag one concept worth exploring further
- Ask: "Ready to move on?"

---

## Exercise 3 Checkpoints

### After Dockerfile / Docker setup
- "What does each stage in the Dockerfile do? Why two stages instead of one?"
- "Your app runs inside a container. A student says they can't reach it from the browser. What's probably wrong?" (port mapping)
- "Why does the production stage not have `npm install`? Where do node_modules come from?"
- "What's the difference between EXPOSE in the Dockerfile and `ports` in docker-compose?"
- "Why `node:22-alpine` and not just `node:22`? What's the tradeoff?"

### After docker-compose
- "Explain the difference between `.env`, `.env.example`, and `env_file` in docker-compose."
- "What does the `healthcheck` in docker-compose do? What happens if the check fails?"
- "If you add a postgres service to compose, how does the backend know where to find it?" (service name as hostname)

### After system test setup
- "Why does your system test use Testcontainers instead of just running the backend locally?"
- "The test imports `SearchResponseSchema` from `contracts.ts`. Why not just check `res.status === 200`?"
- "What does `Wait.forHttp('/health', 3000).forStatusCode(200)` do? Why not just start the container and immediately send requests?"
- "Why does `beforeAll` have a 120 second timeout? What would happen if the image doesn't exist?"
- "The test hits `GET /api/search?q=radiohead`. Is that a unit test, an integration test, or a system test? Why?"

### After CI pipeline
- "Walk me through what happens when you push to your student branch. What runs, in what order?"
- "If CI fails on typecheck, what does that tell you? What if it fails on lint instead? What if it fails on system test?"
- "Why do lint and typecheck run before system tests? Could you swap the order?"
- "The system test in CI needs Spotify credentials. Where do they come from?" (GitHub Secrets)
- "CI is green but the app is broken in production. How is that possible? What's CI NOT testing?"

### After OpenAPI / Swagger
- "What's the relationship between `openapi.yaml` and `contracts.ts`? Do they replace each other?"
- "A teammate changes the API response shape but forgets to update `openapi.yaml`. What breaks? What doesn't?"
- "What's the difference between Swagger UI and Postman? When would you use each?"

### After deploy to Render
- "Your backend is on Render. The frontend calls `localhost:3000`. What happens? Why?"
- "What is CORS and why does it matter now that you're deployed? It didn't matter on localhost."
- "Where do your Spotify credentials live on Render? How do they get there?"
- "You push a broken commit. Render deploys it. What happens to users already on the site?" (zero-downtime, health check)

### After environment variables
- "Trace the path of `SPOTIFY_CLIENT_ID` from your machine to production. How many places does it live?"
- "Why is `.env` in `.gitignore` but `.env.example` is committed? What would go wrong if you committed `.env`?"
- "Your CI needs the Spotify secret but `.env` isn't in the repo. How does CI get it?"

### After reading concept 6 (Why CI Exists)
- "CI stands for Continuous Integration. What exactly is being integrated? It's not 'tests with code.'"
- "Five developers each work alone on branches for a week, then try to merge Friday. What goes wrong and why?"
- "Claude generated 800 lines in one afternoon. You push them as one commit. CI lights up red on 12 things. What went wrong with the process, not the code?"

### After reading concept 7 (CI Building Blocks)
- "Your pipeline runs lint, typecheck, and tests. Could you skip lint and typecheck and just run tests? What would you lose?"
- "A teammate says 'lint is just style, I'm disabling it.' What's wrong with that argument?"
- "Why does lint run before typecheck, and typecheck before tests? What's the principle behind the ordering?"

### After reading concept 8 (Test Taxonomy)
- "A team has 4000 unit tests at 92% coverage. A small change breaks production. All tests pass. How?"
- "What's the difference between a white-box test and a black-box test? Give an example of each for Music Finder."
- "Your unit test mocks the database and passes. In production, the query fails. What does this tell you about what unit tests actually prove?"
- "Why does Codo use system tests instead of unit tests? What's the trade-off?"

### After reading concept 9 (Artifacts and Versioning)
- "Staging works. Production breaks. The team says they deployed 'the same code.' What likely went wrong?"
- "Your Docker image is tagged `latest`. Can you tell what code is running in production? Why or why not?"
- "What does 'build once, deploy anywhere' mean? Why is rebuilding the image for each environment dangerous?"

---

## Exercise 2 Checkpoints (retained for reference)

### After OAuth token implementation
- "Walk me through the Client Credentials flow. What are you sending to Spotify and what do you get back?"
- "What happens if the token expires mid-session? Does your code handle it?"
- "Why do we cache the token? What would the cost be if we fetched a new one on every request?"

### After search endpoint
- "Why does the backend exist at all? Why can't the frontend call Spotify directly?"
- "You return 400 for empty query and 502 for Spotify failure. Why two different codes? Why not just 500 for everything?"
- "What would happen in the frontend if your backend returned `title` instead of `name` in the response?"

### After full system works
- "Draw the full request flow from browser to Spotify and back. What happens at each hop?"
- "Where could this system fail? Name three points and what the user would see."
- "Your Spotify secret is in `.env`. Why not just put it in the code? What's the actual threat?"

### After api.ts
- "Spotify just changed their API response to add a required field your schema doesn't expect. What happens in the frontend?"
- "Why three error classes (NetworkError, BackendError, ContractError) instead of just throwing a generic Error?"
- "What does `SearchResponseSchema.safeParse(body)` return when it fails? What's in that return value?"

### After state.ts
- "A user edits their localStorage in DevTools and breaks the data format. They reload. What happens?"
- "Why do we validate what we read from localStorage with Zod? We put it there ourselves."
- "If `getHistory()` threw an error instead of returning empty arrays on failure, what would break in the UI?"

### After track-card.ts
- "Why does the save button dispatch a CustomEvent instead of calling `saveTrack()` directly?"
- "What does `{ bubbles: true }` on the CustomEvent mean? Who receives it?"

### After results-grid.ts
- "Name all the states the results grid can be in. Can it be in two states at once? Why or why not?"
- "Walk me through the state machine: search starts → request fails → user clicks retry. What state at each step?"