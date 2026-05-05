# API Contracts

*Deep-dive companion to [walkthrough-laptop-to-production.md](./walkthrough-laptop-to-production.md). Read that first for the full exercise context. When you finish here, start on `exercise-spec.md` for the actual deliverables.*

---

You already used Zod in HW2. You wrote `SearchResponseSchema.safeParse()`, you handled `ContractError`, and it worked. What you may not have noticed is that you were enforcing a formal contract between two independent systems — one that holds even when neither system can see the other's code. This document explains what that means, why it matters, and how to think about contracts as your system grows.

---

## What Is a Contract?

A contract is the agreement between a backend and every consumer that calls it. It says: "Send me this request and I will return this shape. Always. If I change it, I tell you first."

`frontend/src/contracts.ts` is the contract for this system. Every field the backend must return is declared there:

```typescript
export const TrackSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  artist: z.string().min(1),
  album: z.string(),
  preview_url: z.string().url().nullable(),
  external_url: z.string().url(),
  cover_url: z.string().url().nullable(),
});
```

Notice `cover_url: z.string().url().nullable()`. That `.nullable()` is a promise: "This field is either a valid URL or `null`. Never an empty string. Never undefined."

Now imagine the backend engineer ships a change. Spotify stopped returning images for some tracks, and they handle it by defaulting to an empty string:

```typescript
cover_url: track.album.images[0]?.url ?? "",  // BUG: contract says null, not ""
```

Without Zod, the frontend receives `cover_url: ""`, renders `<img src="">`, and the user sees a broken image placeholder. The system appears to work. No exception is thrown. No error is logged. A broken experience ships silently.

With Zod, `z.string().url()` rejects `""` because an empty string is not a valid URL. The frontend catches this as a `ContractError` before rendering anything. The failure is explicit, immediate, and named. That is the contract working.

**The contract is the guardrail. The types are a side benefit.**

---

## Why Zod at Runtime, Not Just TypeScript

TypeScript types are erased at runtime. The `Track` type you defined does not exist in the running JavaScript. When your frontend calls the backend, it receives a raw `unknown` blob from the network. TypeScript told the compiler what to expect — but the compiler is gone.

Zod validates the shape of that blob at the boundary. `SearchResponseSchema.safeParse(data)` either confirms that the data matches the contract or tells you precisely which field failed and why. TypeScript cannot do this, because TypeScript is not there.

This is not redundant. They solve different problems:

- TypeScript: "While writing code, warn me if I misuse this type."
- Zod: "While running code, reject data that violates this shape."

You need both. One without the other leaves a gap.

---

## Contract-First Design

**Change the spec first. Then the backend. Then the consumer.**

This order is not a preference — it is a discipline that prevents a class of silent failures. Here is the concrete example.

You want to add `duration_ms` to the search response so the frontend can display track length. The wrong order:

1. Backend engineer adds `duration_ms` to the response.
2. Frontend engineer notices it and starts using it.
3. Someone updates `contracts.ts` to match.

During the window between steps 1 and 3, the contract and the implementation disagree. Your system tests validate against the contract, not the implementation — so they will not catch the discrepancy. You have shipped a field that has no contract, which means no validation, which means no protection.

The right order:

1. Update `contracts.ts` — add `duration_ms: z.number().int().nonnegative()` to `TrackSchema`.
2. Update `openapi.yaml` — add `duration_ms` to the `Track` schema.
3. Update the backend — map `track.duration_ms` from the Spotify response.
4. Update any system tests that assert on specific field sets.

In this order, the contract is the source of truth from the start. The implementation follows the spec. If the backend does not ship the field, the system test fails because the contract requires it. The failure is caught before it reaches the frontend.

The file header in `contracts.ts` says it plainly: *"If you need to change the shape of an endpoint, change it HERE FIRST."* That comment is engineering policy, not documentation boilerplate.

---

## HTTP Status Codes as Contract

Status codes are part of the contract. The number you return tells the caller who is responsible for the failure and what to do about it.

The three codes this API uses:

**400 Bad Request** — the client sent an invalid request. Missing `q` parameter, empty `q` parameter. The backend is working correctly; the caller sent bad input. The fix is on the caller's side. Do not retry without changing the request.

**502 Bad Gateway** — the backend received a valid request, processed it correctly, but the upstream service it depends on (Spotify) failed. The backend is fine. Spotify is not. This is a transient failure; the caller can retry.

**500 Internal Server Error** — the backend broke. An unhandled exception, a code path that was not expected to be reached, a logic error. This is a backend bug. The caller cannot fix it by changing the request.

**Why 502 and not 500 for Spotify failures?** Because they mean different things to whoever is monitoring the system. If your error rate jumps and all the errors are 502, on-call knows immediately: Spotify is having an incident, not you. If everything is 500, on-call has to dig through logs to determine whether it is your code or an upstream. Status codes carry signal. Use them precisely.

Every non-2xx response from this API uses the same `ErrorResponse` shape:

```typescript
export const ErrorResponseSchema = z.object({
  error: z.string().min(1),
});
```

Consistent error shapes let the frontend handle errors generically. It does not need to branch on status code to know how to extract the error message. The shape is always `{ error: "..." }`.

---

## Spotify Client Credentials Flow

Your backend does not ask users to log in to Spotify. It authenticates itself to Spotify as a server application. This is the Client Credentials OAuth flow — server-to-server, no user involved.

The flow has two steps:

**Step 1: Get a token.** POST to `https://accounts.spotify.com/api/token` with your Client ID and Secret encoded as a Basic auth header and `grant_type=client_credentials` in the body. Spotify returns an access token valid for one hour.

```typescript
const res = await fetch('https://accounts.spotify.com/api/token', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
  },
  body: 'grant_type=client_credentials',
});
```

**Step 2: Use the token.** Attach it as a Bearer token on every Spotify API call.

```typescript
const res = await fetch(searchUrl, {
  headers: { Authorization: `Bearer ${token}` },
});
```

The token is cached in memory with an expiry timestamp. Before every Spotify call, the code checks whether the cached token is still valid. If it is, it reuses it. If it is expired (or will expire within 10 minutes), it fetches a new one. This means one token request per hour under normal load, not one per search query.

**Why can the browser not do this directly?** Two reasons:

First, secret exposure. The Client Secret must stay secret. If you put it in frontend JavaScript, anyone who opens DevTools can read it and use your Spotify credentials to make requests on your behalf. It belongs on the server, never in the browser.

Second, CORS. Browsers enforce the Same-Origin Policy — JavaScript running on `yourdomain.com` cannot make requests to `accounts.spotify.com` unless Spotify explicitly allows it via CORS headers. Spotify's token endpoint does not allow arbitrary browser origins. The request will be blocked before it leaves the browser.

Your backend is the proxy. It holds the secret, gets the token, and acts as the authorized party. The browser talks to your backend; your backend talks to Spotify.

---

## Auth Patterns Across Music APIs

As you build on more services, you will encounter different authentication models. The pattern you choose affects how you structure your backend.

| Service | Auth Model | Secret Required | User Login Required |
|---|---|---|---|
| Spotify | OAuth 2.0 Client Credentials (server-to-server) | Yes — Client Secret | No (for public data) |
| Last.fm | API key in query string | Yes — API key | No |
| Deezer | None for public endpoints | No | No (for search) |

**Spotify** requires a token exchange on every credential rotation, but the 1-hour TTL and caching mean the overhead is minimal in practice. The token must never reach the browser.

**Last.fm** uses a simpler API key model — append `api_key=<your_key>` to every request. Still a secret that must live on the server, but no token exchange step. Easier to implement, slightly less secure if the key is ever exposed (no expiry).

**Deezer** allows unauthenticated access to its public search endpoint. No secret, no token. This means you could call it directly from the browser — but routing it through your backend keeps the architecture consistent and makes it easy to add rate limiting, caching, or auth later without changing the frontend.

In all three cases, the backend is the right place for the API calls. Even when auth is not required, centralizing external API calls in one place keeps your frontend free of third-party dependencies and gives you a single point to add caching, error handling, and observability.

---

## Common Challenges

**Rate limits.** Spotify limits how many requests you can make per hour. If you exceed the limit, Spotify returns 429. Your backend should handle this as a 502 (upstream failure), not let it surface as a 500. In production you would add exponential backoff and log the rate limit headers (`Retry-After`) to know when you can try again.

**Error propagation.** When Spotify fails, do not leak Spotify's raw error to your frontend. Map it to your `ErrorResponse` shape and use 502. The frontend does not need to know which upstream failed or what error code it returned — that is internal to your backend. What the frontend needs is: "upstream failed, not my bug, possibly retry."

**Timeout handling.** Spotify may respond slowly or not at all. Without a timeout, your backend request handler can hang indefinitely, holding a connection open and blocking resources. Set an explicit timeout on your `fetch` calls using `AbortController`. If the timeout fires, return 502 — the upstream did not respond in time.

**Graceful degradation.** When `preview_url` or `cover_url` is `null`, the system should still work. The contract explicitly allows null for these fields. The frontend must handle null without rendering a broken `<audio>` or `<img>` element. Graceful degradation means the system provides reduced functionality rather than no functionality when an optional upstream resource is unavailable.

**Token caching.** Fetching a new Spotify token on every search request would waste network time, add latency, and quickly exhaust your rate limit for token requests. Cache the token in memory with its expiry timestamp. Refresh it before it expires (the reference implementation refreshes 10 minutes early, giving a buffer for clock skew and slow network). This is a standard pattern for any short-lived credential.

---

## Using curl and Postman

Before writing a system test, verify your endpoint manually. This tells you whether the problem is in the app or in the test.

**curl** is a command-line HTTP client. The flags you will use most:

- `-s` — silent mode, suppresses the progress bar
- `-S` — show errors even in silent mode (use with `-s`)
- `-i` — include response headers in the output (lets you see the status code and Content-Type)

The examples in `backend/api-examples/search.sh` cover every endpoint and error case. Run the script against a local backend, or copy individual commands:

```bash
# Happy path
curl -sS -i "http://localhost:3000/api/search?q=radiohead"

# Missing parameter — expect 400
curl -sS -i "http://localhost:3000/api/search"

# Empty parameter — expect 400
curl -sS -i "http://localhost:3000/api/search?q="
```

The `-i` flag is important here. The status code is in the response headers, not the body. Without `-i` you see the JSON but not the 400 or 502 that matters.

**Postman** is a GUI HTTP client with collections, environment variables, and test scripts. The collection at `backend/api-examples/Music-Finder.postman_collection.json` has all the same requests as `search.sh`, plus automated assertions written in `pm.test(...)`:

```javascript
pm.test('status is 200', () => pm.response.to.have.status(200));
pm.test('body has results array', () => {
    const body = pm.response.json();
    pm.expect(body).to.have.property('results');
    pm.expect(body.results).to.be.an('array');
});
```

Import the collection into Postman (File > Import, or drag the JSON file in). The `baseUrl` collection variable defaults to `http://localhost:3000`. Change it to your Render URL to run the same tests against production — no request changes needed.

To run assertions programmatically, Postman has a Collection Runner. Select the collection, click Run, and Postman executes every request and reports pass/fail for each `pm.test`. This is the manual precursor to automated system tests.

---

## OpenAPI and Swagger UI

Zod schemas validate data at runtime. They do not help a developer who wants to understand your API without reading TypeScript, generate a client in another language, or click through your endpoints in a browser.

OpenAPI solves this. It is a language-agnostic, machine-readable description of your API — endpoints, parameters, request bodies, response shapes, status codes, examples. The spec at `backend/openapi.yaml` describes everything `contracts.ts` describes, plus the HTTP layer (routes, parameters, status codes) that Zod does not cover.

**What OpenAPI gives you that Zod does not:**

- Human-readable documentation that any engineer can read without knowing TypeScript
- A machine-readable format that tools can consume (client generators, linters, mock servers)
- An interactive "try it out" interface via Swagger UI — hit your API from the browser without curl or Postman

The reference backend already serves Swagger UI. The setup in `backend/src/index.ts` is three lines:

```typescript
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const openapiSpec = parse(readFileSync(new URL('../openapi.yaml', import.meta.url), 'utf-8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
```

With the backend running, open `http://localhost:3000/api-docs`. You will see the full API — endpoints, parameters, response schemas, and examples — rendered as interactive documentation. Click "Try it out" on `/api/search`, enter a query, and execute. Swagger UI sends the real request and shows you the real response.

**The tooling ecosystem.** These are names you will encounter and should recognize:

- **Swagger UI** — browser-based interactive docs rendered from an OpenAPI spec. What you see at `/api-docs`.
- **ReDoc** — alternative OpenAPI renderer, three-panel layout, often used for published documentation. Drop-in for Swagger UI.
- **openapi-generator** — generates fully typed client SDKs in 50+ languages from an OpenAPI spec. Run once against your spec; get a TypeScript, Python, or Java client.
- **orval** — TypeScript-focused alternative to openapi-generator. Generates React Query hooks or Axios clients from OpenAPI. Popular in frontend-heavy teams.
- **Spectral** — OpenAPI linter. Validates that your spec follows best practices and your own custom rules. Catches spec drift before it reaches production.
- **Prism** — OpenAPI mock server. Point it at your spec and it serves a mock API that responds according to the spec's examples. Useful for frontend development before the backend is ready.
- **Mockoon** — GUI mock server with OpenAPI import. Similar to Prism but desktop-based, with a visual interface for editing mock responses.

You do not need to use all of these now. You do need to know they exist, because they are what makes an OpenAPI spec valuable beyond human documentation. The spec is the source of truth; these tools consume it.

---

## Connection to the Exercise

In Exercise 3, you add `swagger-ui-express` to your backend and serve the existing `openapi.yaml` at `/api-docs`. The spec is already written — your job is to wire it up and verify it works.

Once running, you have three ways to interact with your API:

1. **Swagger UI** at `/api-docs` — visual inspection, interactive requests in the browser
2. **curl** with `backend/api-examples/search.sh` — command-line verification, scriptable
3. **Postman** with the collection in `backend/api-examples/` — GUI client with automated assertions

The system test in CI validates that your endpoint responses match `contracts.ts`. The spec in `openapi.yaml` describes the same contract for humans and tools. If your implementation matches the contract, all three validation methods agree. That agreement is what "shippable" means.

---

*Continue to `exercise-spec.md` for the deliverables, acceptance criteria, and branch setup.*
*Back to [walkthrough-laptop-to-production.md](./walkthrough-laptop-to-production.md) for the full exercise context.*
