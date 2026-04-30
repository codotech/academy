# Test Taxonomy: White-Box, Black-Box, and the Whole Family

## Watch

- [What is Continuous Testing?](https://www.youtube.com/watch?v=RYQbmjLgubM) (IBM Technology)

## The Problem

You join a team. You open their test folder. There are four thousand tests. The coverage report says ninety-two percent. You feel good. You ship a small change on day three. Production breaks. The tests all pass. Nothing in the suite would have caught it.

You look closer. Almost every test mocks the database. Almost every test mocks the HTTP client. Almost every test is asking, in effect, "if I call this function with these arguments, do I get the return value I expect?" The tests are testing the code as the developer who wrote it imagined it would be called. They are not testing whether the system, assembled from these pieces, actually works.

This is the most common shape of test debt in working teams: many tests, high coverage, low confidence. The fix is not "write more tests." It is to understand that *the type of test you write encodes a belief about what could break*. If the only beliefs your test suite expresses are "individual functions return what their authors think they return," you are protected against one class of bug and exposed to every other class.

This video is about the test family — black-box vs white-box as the foundational axis, then unit, integration, and system tests as the three you actually need to understand deeply, then a quick tour of e2e, smoke, and sanity so you recognize them when you see them.

## The Concept

### The foundational axis: white-box vs black-box

Every test sits somewhere on a spectrum from *white-box* to *black-box*. The axis is: how much does the test know about the implementation it is testing?

A white-box test knows the internals. It can reach into private methods, inspect intermediate state, replace dependencies with mocks, and assert on implementation details. It is written by someone who has the code in front of them and writes the test against the structure they see. Most unit tests are white-box.

A black-box test knows only the contract. It knows the input shape and the output shape and any visible side effect. It does not know how the code computes the answer. It asks "if I send this request, do I get the right response?" and it does not care which class, function, or layer produced it. System tests are the canonical black-box.

The trade-off between the two is the most important trade-off in testing, and most engineers spend years not seeing it clearly. White-box tests are fast and precise. They tell you exactly which line is wrong. But they are coupled to the implementation, which means a refactor breaks them even when behavior is unchanged, and they cannot detect bugs that emerge from how components are wired together. Black-box tests are slower and less precise (when they fail, the failure says "the system is wrong" not "line 47 of `userService.ts` is wrong"). But they are coupled to the *contract*, which is the thing you actually care about, and they catch bugs at every layer between the input and the output.

If you internalize one idea from this video, make it this: black-box tests verify what the system promises. White-box tests verify how the system is currently built. The first is what you ultimately need. The second is a development convenience.

### Unit tests, deeply

A unit test takes one unit (one function, one class, one module) and exercises it in isolation. Its dependencies are usually replaced with mocks: a fake database, a fake HTTP client, a fake clock. The test calls the unit, observes the return value or the calls made on the mocks, and asserts.

Unit tests are fast — milliseconds each — and they are precise. When one fails, you know exactly which function broke. They are also the easiest tests to write, which is why they dominate most test suites and why coverage metrics are often so high.

Here is what unit tests are bad at, and it is the part bootcamps usually skip. Mocks lie. The mock you wrote represents your *belief* about how the dependency behaves, not how the dependency actually behaves. If your code calls `db.findUser` and the mock returns a user, the test passes. If in production `db.findUser` actually throws on a malformed query, the test never sees that. Unit tests verify that the unit, when wrapped in your assumptions, behaves as you assumed it would. They do not verify that your assumptions about the surrounding world are correct.

This is why a suite of four thousand unit tests can pass while production breaks. Every test asserted that the unit, given its mock, did the right thing. None of them asserted that the assembled system, with real dependencies, did the right thing. The tests proved the developer understood their own code. They did not prove the system works.

### Integration tests, deeply

An integration test takes two or more real components and exercises them together. The most common shape is service plus real database: instead of mocking the database client, the test connects to an actual database (a Docker container, an in-memory instance, a test schema in a real Postgres) and makes the service do its real work against it.

Integration tests catch a class of bug that unit tests structurally cannot see: wiring bugs. Your service code thinks the database column is `created_at`. Your migration named it `createdAt`. Unit tests pass because the mock returned what the service expected. Integration tests fail immediately, because the real database returns nothing under `created_at`.

Integration tests are slower than unit tests (seconds instead of milliseconds, because real components have to start up) and harder to write (you need a way to set up and tear down the dependency cleanly). What you get in return is a much higher confidence that two pieces of your system actually agree with each other. Integration tests are where wiring is verified.

There is a subtle point about black-box vs white-box here. Integration tests can be either, depending on how much they reach into the components under test. The good shape is black-box-ish at the boundary you are testing across: you call the service, the service does its real thing against the real database, and you check the visible result. The bad shape is white-box even when components are real: you reach into the service's private state to verify intermediate values. The black-box discipline matters even when the test is integration-scale.

### System tests, deeply

A system test treats the whole application as a sealed black box and exercises it through its public interface. For a backend service, that interface is HTTP. The test starts the actual artifact (the Docker image you would ship), waits for it to become healthy, sends real HTTP requests, and asserts on the responses and on observable side effects.

This is the test type Codo's reference implementation centers on. The tool is Testcontainers. The test starts the container, waits for the health check, sends `POST /users` with a real body, gets a real response, then queries the database directly to confirm the row landed where it should. There are no mocks. The thing being tested is the same thing that would run in production. The contract being verified is the contract real clients would see.

System tests are the slowest — tens of seconds per test, because containers have to start. They are also the most valuable per unit of code tested, because they exercise every layer at once: routing, validation, business logic, persistence, configuration. When a system test passes, you know that a real client sending a real request would get a real response, end to end. When it fails, the failure could be in any of those layers, so the precision is low — but the precision was never the point. The point is whether the system delivers what it promises.

Codo's bias, embedded in the course philosophy, is "system tests over unit tests." This is the why. Unit tests verify pieces in isolation under your assumptions. System tests verify the assembled thing under reality. The latter is what production runs.

### The rest of the family, briefly

**End-to-end (e2e) tests** are system tests that include the client. The test drives the UI (or the mobile app, or whatever the user-facing surface is), the UI calls the backend, the backend hits its real dependencies, and the test asserts on what the user would see. Useful when the question is "does the whole user-visible flow work?" Slow, fragile, and worth having a small number of for the most critical flows.

**Smoke tests** are a small set of "is the deployed thing on?" checks. After a deployment, hit the health endpoint, hit one or two critical paths, confirm they respond. Smoke tests are not about catching bugs in the code; they are about catching deployment problems (wrong env var, missing secret, network not configured) that would not show up in pre-deploy CI.

**Sanity tests** are narrow regression checks after a small change. You changed how the search endpoint sorts results. You run the three tests that verify search behavior. You ship. Sanity tests are a usage pattern, not a test type — they are usually integration or system tests you choose to run because they are relevant to what you just changed.

You will encounter more names in the wild — acceptance tests, contract tests, snapshot tests, property-based tests, fuzzing. They are useful, but they are variations on the axes you already understand: where on the white-box / black-box spectrum does the test sit, and what scope (unit, integration, system, e2e) is it exercising? Two questions answer most of the taxonomy.

## How It Works

Picture a single feature: `POST /users` creates a user and returns the created user.

The unit version of this test imports the controller function directly. It mocks the user service. It calls the controller with a request object, asserts the controller called `userService.create` with the right arguments, asserts the controller returned the user the mock produced. Runtime: a few milliseconds. What it proves: the controller calls the service correctly, given the developer's mental model of how the service behaves.

The integration version imports the user service. It connects to a real test database. It calls `userService.create` with a real input. It asserts the user object is returned correctly. It queries the database to confirm the row is there with the right shape. Runtime: a couple of seconds. What it proves: the service and the database actually agree.

The system version starts the production Docker image. It waits for the health endpoint to respond 200. It sends an HTTP `POST /users` with a JSON body. It asserts the response is 201, the body matches the expected shape, and (optionally) queries the database directly to confirm the row exists. Runtime: ten or twenty seconds (most of which is container startup). What it proves: a real client sending a real request to the real artifact gets the correct outcome, end to end.

Three tests, same feature, very different beliefs about what could break. The unit test believes the developer's mocks are accurate. The integration test believes the service and the database connect correctly. The system test believes nothing — it just exercises the artifact and observes. Each catches different bugs. Each costs more than the last. The right mix depends on what you are willing to trust without verification.

## Common Mistakes

**"We have unit tests, we are covered."** Unit tests are the cheapest tests to write and the weakest evidence that the system works. A test suite of only unit tests has low confidence per coverage point. The suite passes; the system breaks. Coverage is not confidence.

**Confusing integration tests with e2e tests.** Integration tests verify components inside the system talking to each other. E2E tests verify the user-facing flow including the client. They are different scopes. "Integration test" used loosely to mean "any test that is not a unit test" makes the conversation harder.

**Mocking the database in tests that claim to test "the persistence layer."** If you mock the thing you are trying to test, you are not testing it. The mock represents your belief about the thing. Your belief is what is being tested. The actual database is not.

**Coverage as a quality metric.** Coverage tells you which lines of code were executed during tests. It tells you nothing about whether the executions verified the right behaviors. A test that calls a function and asserts nothing increases coverage and proves nothing.

**Smoke tests that test logic.** A smoke test should answer "is it on?" in a few seconds. If your smoke tests are validating business rules, they are slow, brittle, and they belong in a different test suite. Smoke is liveness, not correctness.

**Writing white-box tests for behavior you do not control.** If you mock a third-party API in detail and assert on every parameter your code passed to it, you have coupled your test to your understanding of the third party. When the third party changes (or your understanding was wrong), the test fails for the wrong reason. Black-box where you can. White-box only where you must.

## Connection to the Course

Codo's testing stance is unusual and intentional. No unit tests. No coverage targets. System tests over everything else, written in the black-box discipline, exercising the real artifact through HTTP. The reasoning is the reasoning in this video: unit tests with mocks verify the developer's understanding; system tests verify the system. The course teaches the more expensive, more honest practice on purpose, because the cheaper practice produces test suites that look impressive and protect against very little.

## Connection to the LLM Era

AI is excellent at writing the kind of test you describe to it. Ask an AI to write unit tests for a function and it will produce dozens, all internally consistent, all asserting that the function does what its mocks say it does. The tests will be thorough by every visible metric. They will also be circular: AI wrote both the function and the tests, and both reflect the same model of how the world works. If that model is wrong about how the database actually responds, or how the third-party API actually behaves under load, neither the function nor the tests will catch it. Black-box system tests are the answer to circular AI generation. They do not care what the AI thinks the function should do. They send a real request and verify a real response. The discipline of black-box testing is more important in the AI era, not less, because it is the layer the AI cannot satisfy by reasoning about its own output.

---

See also: [./06-why-ci-exists.md](./06-why-ci-exists.md) | [./07-ci-building-blocks.md](./07-ci-building-blocks.md) | [./09-artifacts-and-versioning.md](./09-artifacts-and-versioning.md) | [./05-ci-and-ai-feedback-loop.md](./05-ci-and-ai-feedback-loop.md)
