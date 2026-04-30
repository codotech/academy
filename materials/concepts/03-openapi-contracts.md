# OpenAPI and Contracts

## Watch

- [What is a REST API?](https://www.youtube.com/watch?v=lsMQRaeKNDk) (9 min)
- [REST API and OpenAPI: It's Not an Either/Or Question](https://www.youtube.com/watch?v=pRS9LRBgjYg) (9 min)
- [API vs. SDK: What's the difference?](https://www.youtube.com/watch?v=kG-fLp9BTRo) (9 min)

## The Problem

You already have a contract in the Music Finder. It is right there in `frontend/src/contracts.ts`, and you used it all through HW2 without necessarily noticing what was actually happening. `TrackSchema`, `SearchResponseSchema`, `ErrorResponseSchema`: three Zod schemas that the frontend uses to validate every response that comes back from `/api/search`. If the backend returns a broken shape, `safeParse` catches it, a `ContractError` fires, and you see a clean named failure instead of a silently broken UI.

That is half of contract enforcement. The other half is the part you did not build in HW2 and that you are about to build in Exercise 3. Zod validates the contract *at runtime*, in JavaScript, inside the frontend process. It answers the question "did the response match?" at the exact moment the response arrives. What it does not do is tell anyone what the contract IS before a request is ever made. A developer coming to the project for the first time, a tester trying to hit the API manually, a student in a future cohort who wants to see what endpoints exist: none of them can read `contracts.ts` and immediately understand "this is the API; here are the URLs, here are the query parameters, here are the status codes." Zod describes the *shape*. It does not describe the *surface*.

OpenAPI closes that gap. It is how the contract becomes visible, not just to the running JavaScript, but to every human and every tool that ever touches the API.

## The Concept

### What OpenAPI adds that Zod doesn't

Zod lives inside the running frontend. OpenAPI lives in a YAML or JSON file next to the backend source. The two describe overlapping information (the shape of responses) but they answer different questions and serve different audiences.

Zod answers: *when this response arrives, does it match?* It is a runtime guard. It protects the frontend from a broken backend. It exists as code.

OpenAPI answers: *what does this API look like, ahead of time, in a form anyone can read?* It describes the endpoints (URLs and methods), the query parameters, the request bodies, the response shapes for every status code, the error formats, the authentication requirements. It exists as a standalone document, `openapi.yaml`, that you read without running the app.

Those are different jobs. You need both. Zod catches violations at the moment of truth, when the request has completed and the response is in hand. OpenAPI prevents violations from being introduced in the first place, because the contract is written down, versioned, and discoverable.

### Swagger UI: the contract you can touch

OpenAPI on its own is a YAML file. That is useful for tools, less useful for humans. Swagger UI is a web page that reads the OpenAPI file and renders it as an interactive explorer. You open `/api-docs` in the browser. You see every endpoint listed. You click on `GET /api/search`. It shows you the query parameter `q`. It shows you the response schema. It shows you the possible error responses with their status codes. And then (this is the part that clicks for students) there is a button that says "Try it out."

You click it. You type `radiohead` into the `q` field. You hit Execute. The page makes a real HTTP request to the real backend, and the response comes back rendered right there: real Spotify tracks, the exact JSON shape the spec described. You just made a live call against the API without writing a line of code, without opening a terminal, without knowing `curl` existed.

Compare that to reading a README. A README says "the API has a search endpoint, here's a curl example." You have to copy the command, open a terminal, paste it, hope you pasted it right, read the raw output. Compare it to a PDF spec document. You read the spec, you imagine what the response looks like, you have to build a client to actually verify. Swagger UI collapses that gap. The documentation is interactive. You do not have to imagine the response; you can see it. The contract is not abstract; it is something you are pressing buttons on.

### The same contract in three formats

This is the part to sit with. In the Music Finder, after Exercise 3, the contract for the search endpoint lives in three places at once:

1. **Zod schemas in `contracts.ts`:** the contract as executable code, used by the frontend to validate responses at runtime.
2. **OpenAPI spec in `openapi.yaml`:** the contract as a documented surface, used by humans and tools to understand the API.
3. **System tests:** the contract as assertions, used by CI to verify the backend actually produces the shapes the contract promises.

Those are three representations of the same truth. If the contract says "a track has an `id`, `name`, `artist`, `album`, and a nullable `preview_url`," all three representations must agree. The Zod schema declares that shape. The OpenAPI spec documents that shape. The system tests assert that shape. When someone proposes a change ("let's add a `duration_ms` field"), the change has to land in all three places. Miss one, and the representations drift, and the contract is no longer coherent.

That is the aha. The same truth, three formats, three audiences. Zod talks to the frontend. OpenAPI talks to humans and tooling. System tests talk to CI. Together, they form a contract that is enforced at every layer where enforcement is possible.

## How It Works

### Adding OpenAPI to the Music Finder backend

In Exercise 3, the reference backend on `exercise-3` already serves the OpenAPI spec. The setup is small: a YAML file (`openapi.yaml`) describes the two endpoints (`/health`, `/api/search`), plus the Zod-shaped response schemas translated into OpenAPI's schema syntax. The Express app uses `swagger-ui-express` to serve that spec at `/api-docs`. A student running the backend locally with `npm run dev` can open `http://localhost:3000/api-docs` in the browser and see Swagger UI with the full API rendered.

The schema shapes in `openapi.yaml` match the schema shapes in `contracts.ts`. Every field that appears in `TrackSchema` appears in the OpenAPI `Track` schema, with the same type, the same nullability, the same required flag. This is not automatic. Someone (you, or Claude on your behalf) has to keep them in sync. The payoff is that the contract is now discoverable without running the frontend.

### CURL, Postman, and Swagger UI: when to use which

Students sometimes conflate these three. They serve overlapping purposes, but each is best at something specific.

**Swagger UI** is best for exploring an API you do not yet know. You arrive at `/api-docs`, you see the endpoints, you click one, you try it. The spec is the guide. Use Swagger UI when someone asks "what does this API do?" and you want to answer by showing them, not telling them.

**curl** is best for scripting and for reproducing bugs precisely. When you file a GitHub issue that says "the search endpoint returns 502 for certain queries," you attach the exact curl command that reproduced it. When you want to test the API inside a shell script, a Makefile, or a CI job, `curl` is the right tool. It is also the lowest common denominator: every server has it, every teammate on every OS can run it, every AI assistant understands it. `curl -s "http://localhost:3000/api/search?q=radiohead" | jq .` is a sentence any backend developer reads fluently.

**Postman** (or Insomnia, or HTTPie's GUI) is best for saved collections of requests that you run repeatedly during development. You set up the search endpoint with a query parameter, save it, and during the day as you are working on the backend, you hit it with one click to verify behavior. Postman shines when you are iterating: change the code, hit the saved request, see the response, change again. Teams also share Postman collections. The reference repo includes a `Music-Finder.postman_collection.json` that you can import to get all the example requests preconfigured.

The mental model: Swagger UI is for *discovery* (what does this API do?), curl is for *reproduction* (show exactly how to hit it), Postman is for *iteration* (I am working on this right now and want to call it over and over). In Exercise 3 you will use all three, and knowing which one fits which moment is itself a skill.

### Contract-first design in practice

When a change is needed (say, you want to add a `duration_ms` field to every track) the contract-first sequence is:

1. Update the Zod `TrackSchema` in `contracts.ts` to include `duration_ms: z.number()`.
2. Update `openapi.yaml` to add `duration_ms` to the `Track` schema.
3. Update the backend to populate `duration_ms` when building the response.
4. Update the system tests to assert the field is present.

The order matters. Starting with the contract means the implementation has a clear target. Starting with the implementation means the documentation lags behind the code and drifts out of sync one change at a time. Over a few months, a codebase that always starts with the implementation produces a documentation layer that is technically wrong in subtle ways everywhere. A codebase that always starts with the contract produces documentation that is as trustworthy as the code, because they were changed together.

## Common Mistakes

**Changing the response shape without updating the OpenAPI spec.** The backend developer adds a field or renames one, tests still pass (the backend's own tests, not the system tests that verify against the contract), the change deploys. The spec in `openapi.yaml` now lies. Anyone who reads Swagger UI sees the old shape. Anyone who generates a client from the spec gets a client that does not match reality. The fix is to treat the spec as part of the source code: when you change behavior, you change the spec in the same PR.

**Writing the OpenAPI spec by reverse-engineering the running backend.** This feels efficient (look at what the endpoint returns, write that down as the spec) but it locks in whatever the current behavior is, including bugs. If the backend accidentally returns `null` for a field that should be required, the "spec" now documents that null as valid. The spec loses its power as a contract because it is no longer ahead of the implementation.

**Treating TypeScript types as the contract.** TypeScript is erased at runtime. A TypeScript type that says `function search(): Promise<SearchResponse>` is a promise the compiler enforces during development, not at runtime. The contract has to exist in a form that survives compilation and runs against actual JSON. That is Zod. The TypeScript type is derived from the Zod schema via `z.infer<typeof SearchResponseSchema>`, not written by hand.

**Hiding Swagger UI in development only.** Some teams add Swagger UI under a dev flag so it is not served in production. In the Music Finder, the `/api-docs` endpoint should be available on the deployed Render backend too. The API is small and public; the interactive docs are part of the product. A student sharing their deployed URL can include `/api-docs` and the recipient immediately understands what the API does.

**Writing the spec but not linking it to the system tests.** The spec describes the contract; the system tests enforce it. If the two are independent, the spec can drift. A simple discipline: when a system test asserts a response shape, it should do so via the Zod schema that the OpenAPI spec mirrors. One violation, three alarms: Zod fails, the system test fails, the spec becomes visibly outdated. That alignment is cheap to set up and pays off for the lifetime of the project.

## Connection to the Exercise

Exercise 3 has Part A: "Describe it (OpenAPI)." You open the reference `openapi.yaml`, read it, understand what it documents about the search endpoint, verify that `swagger-ui-express` is serving it at `/api-docs`, and test that you can hit the API from the UI. If you want to extend the API (add a new endpoint, add a query parameter) you update the spec first, then the code.

When the system tests run in Part C, they import the Zod schemas from `contracts.ts`. The tests assert that real responses from the running Docker container parse correctly against those schemas. The tests are effectively saying: the contract in `contracts.ts` matches what the backend actually produces. The OpenAPI spec, the Zod schema, and the assertion all describe the same shape. If one drifts, the others catch it.

When you deploy to Render in Part E, Swagger UI deploys with the backend. Your deployed URL has an `/api-docs` page. Anyone who opens that URL (an instructor, a classmate, a stranger) can explore your API interactively. Your API becomes a thing that exists in the world and documents itself.

## Connection to the Course Philosophy

A contract is a guardrail between two systems. Zod is the guardrail between the backend's behavior and the frontend's assumptions, enforced at runtime. OpenAPI is the guardrail between the API's surface and the humans who need to understand it, enforced by making the surface visible. System tests are the guardrail between the code as it is today and the contract the code is supposed to honor, enforced by CI.

The course's broader argument is that the code is not the product. The system is the product, and a system that can be reasoned about, changed safely, and extended by people who did not write the original code is the system that survives. Contracts, in all three of their forms, are what make that possible. Without a contract, every change is risky, because nobody can tell what would break. With a contract enforced in three places, changes become tractable. You know exactly what has to stay true, and you have three alarms that go off when it stops being true.

OpenAPI is not documentation for its own sake. It is the form of the contract that talks to humans and tools. It is the one that lets a new developer show up on day one and actually see the shape of what the team has built.

---

See also: [./01-git-state-management.md](./01-git-state-management.md) | [./04-localhost-to-production.md](./04-localhost-to-production.md) | [./05-ci-and-ai-feedback-loop.md](./05-ci-and-ai-feedback-loop.md)
