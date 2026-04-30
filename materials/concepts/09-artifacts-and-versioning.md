# Artifacts and Versioning: One Built Thing, Tagged by Hash

## Watch

- [Containerization Explained](https://www.youtube.com/watch?v=0qotVMX-J5s) (8 min)
- [Continuous Deployment vs. Continuous Delivery](https://www.youtube.com/watch?v=LNLKZ4Rvk8w) (5 min)

## The Problem

Staging is green. Production is broken. The team is convinced they shipped the same code to both. Someone runs `git log` on production and gets a commit. Someone else checks staging — different commit. They dig. The two environments were built at different times, by different jobs, from different branches, with different versions of dependencies that floated in between builds. The code is "the same" only in the loosest possible sense: similar files were typed by similar humans on similar days. The actual bytes running on the two machines are different artifacts entirely.

This is the most common shape of "works in staging, breaks in prod" bugs. It is not a bug in the code. It is a bug in the model of what is running. And the cure is not better discipline. The cure is to stop letting the same code get rebuilt at different stages of the pipeline. Build once. Tag the artifact with the commit hash. Let that exact artifact, byte for byte, flow from CI through staging to production. If staging is broken or working, production will be broken or working in exactly the same way, because they are running the same thing.

This video is about that practice. What is an artifact, why does the concept exist, and why does tagging it with the git commit hash turn "which code is this?" from a research project into a one-line lookup.

## The Concept

### What an artifact is, and why the word matters

An artifact is a built, named, immutable thing your pipeline produces. The build step takes source code (a git tree) and produces an artifact (a Docker image, a static bundle, a JAR file, a compiled binary). Once produced, the artifact is sealed. It is not modified. It is not rebuilt. It is *moved* through the rest of the pipeline — tested, scanned, eventually deployed — and downstream stages consume it as a single, named noun.

The reason the word artifact exists is to give every stage of the pipeline a single thing to talk about. Without artifacts, every stage has to ask "what code am I working with?" and the answer involves branches, merges, dependency versions, build environments. With artifacts, the answer is one identifier: `image:a4ea31e`. That is the thing. Every stage handles the same thing. The conversation about "what is being deployed" reduces to a tag.

This separation — between the *building* and the *running* of code — is one of the high-leverage ideas in modern software delivery. Building is a thing you do once, in a clean environment, at a specific point in time. Running is a thing you do many times, on many machines, with that same artifact. Confusing the two — rebuilding when you should be running, or running with no clear sense of what was built — is what produces the staging-and-prod-disagree class of bug.

### The backend artifact: a Docker image

For a backend service, the artifact is almost always a Docker image. The image is built once, from a Dockerfile, in CI. It contains everything the service needs at runtime: the OS, the language runtime, the dependencies, the compiled application code, the entry command. It is sealed, identified by a digest, and tagged with a name.

The same image flows from CI's test stage to a staging deploy to a production deploy. CI builds it. CI tests run against it (system tests using something like Testcontainers spin up the exact image). The image gets pushed to a registry. The staging environment pulls the image and runs it. The production environment, when promotion happens, pulls the same image and runs it.

The phrase "the same image" deserves emphasis. There is no "production build" that happens after testing. There is no "now we install the real dependencies." The bits that ran the tests in CI are the bits running in production. If the tests passed, you have a guarantee — not a hope — that the production code passes those tests, because it is the same compiled, packaged thing.

### The frontend artifact: a `dist/` bundle

The shape changes for frontend, but the concept does not. A frontend build (Webpack, Vite, esbuild, whatever) takes your TypeScript or JSX source and produces a folder, usually called `dist/` or `build/`. Inside that folder are the static files — bundled JavaScript, CSS, hashed asset filenames, an `index.html` — that get served to the browser.

That folder is the artifact. It is built once, in CI. It is uploaded to a CDN or a static host, identified by a version tag. The same files that the local preview command served, that the test environment served, that staging served, are the files production serves. Different stack, different file shapes, identical concept: build once, name it, ship the named thing.

The mental shift worth making is that "Docker image" and "frontend `dist/` bundle" are the same idea wearing different clothes. Both are immutable, named, build-once outputs of the pipeline. Both flow through stages without modification. Both let you point at one identifier and say "that is the thing running in production." Once you see the parallel, the artifact concept stops being a Docker thing and starts being a delivery thing.

### Hash-as-tag, correlated with git

Now the lever. The tag on the artifact is the git commit hash.

When CI builds the image for commit `a4ea31e7c0`, it tags the image `service:a4ea31e7c0`. When the frontend builds for that commit, the `dist/` upload is named `frontend-a4ea31e7c0` or written to a versioned path. The artifact's identity is the commit it was built from. Every artifact answers the question "which code is this?" in a single lookup. There is no separate version registry to maintain, no manually incremented build number, no "let me check who deployed last." The git history and the artifact registry are correlated by hash. Trace either one and you find the other.

Why is this so much better than `latest`, or `v1.4.2`, or `2025-04-25-1330`?

`latest` answers no question. It tells you "the most recent thing built." It does not tell you which code, or when, or whether it has been promoted from staging. Running `latest` in production means you cannot say what is running.

`v1.4.2` is better, but it is one indirection away from the source. You have to look up which commit produced 1.4.2. The version is human-meaningful (so users can talk about it) but not directly traceable.

`2025-04-25-1330` is a timestamp. It tells you when, not what. Two builds produced at the same moment from different branches collide.

The git hash is what the code actually is. It is unique, immutable, and directly readable from the source repository. If you see `service:a4ea31e7c0` in production, you can `git checkout a4ea31e7c0` locally and look at the exact code that is running. You can read the commit message and see why that change was made. You can trace it back to the PR that merged it. The artifact is a pointer into the git history, and the git history is the truth.

Most teams that use this pattern combine it with human-friendly version tags (`v1.4.2` is also `a4ea31e7c0`) so users get readable versions and engineers get the precise hash. That pairing is the production-grade shape: one identifier for humans to talk about, one identifier for tools to be exact about, and they always point to the same artifact.

### One artifact, flowed everywhere

Put the pieces together and the practice has a name: *build once, deploy anywhere*. CI builds one artifact tagged with the commit hash. That same artifact gets tested in CI. That same artifact gets pushed to staging. That same artifact, when promoted, runs in production. There is never a moment when the bits are rebuilt for a different stage. There is never a moment when "what is running?" requires investigation.

This is the foundation that makes CI gates meaningful. If the artifact you tested is not the artifact you shipped, your green CI badge is theater. The green badge is a guarantee about a thing — and the thing has to be the same thing all the way through. Otherwise the guarantee evaporates somewhere in the middle and nobody can point to where.

## How It Works

A commit lands on `main`. Its hash is `a4ea31e7c0`.

CI checks out the commit. CI runs lint, typecheck, tests against source. Then CI builds. The build produces a Docker image. The image is tagged `service:a4ea31e7c0` and (optionally) `service:main-a4ea31e7c0` and `service:latest`. The hash-tagged version is the canonical name; the others are conveniences.

CI runs system tests against `service:a4ea31e7c0`. The container starts, the tests pass, the artifact is now known to be tested at that exact commit.

The image is pushed to a registry. Staging is configured to pull `service:a4ea31e7c0` (or whatever the deployment system says is current). Staging starts the container. Same bits as CI tested.

A human (or an automated promotion) decides to ship to production. The production deploy configuration changes to pull `service:a4ea31e7c0`. Production pulls the image. The container starts. Same bits as staging, same bits as CI tested.

If something goes wrong in production, the rollback is "use the previous tag." The previous tag is also a git hash. The rollback is exact. There is no ambiguity about what is running before, during, or after the deploy.

For frontend, the equivalent flow uploads `dist/` to a CDN at a versioned path (or with hashed asset filenames that act as content addresses). The HTML page references the versioned bundle. A deploy is a change in which version the HTML points to. The bundle itself is immutable, identified by the same git hash, traceable to the same commit.

## Common Mistakes

**Rebuilding the artifact at every stage.** A pipeline that builds locally, builds again in CI, builds again before deploy is a pipeline where four "same builds" can produce three different artifacts. Build once. The thing that runs in production is the thing CI built and tested.

**Tagging only with `latest`.** If your only tag is `latest`, you cannot answer what is running. You cannot roll back to a known good version, because you do not know which version was good. `latest` is a convenience for development; it is not an identity for production.

**Tagging with build numbers instead of git hashes.** Build numbers are sequence, not identity. They do not let you trace from a running artifact back to source code without a registry lookup. Git hashes give you the trace for free, because the hash is the source code's own name.

**Treating the artifact as a build output, not as the unit of trust.** The artifact is the boundary at which testing becomes meaningful. The CI tests prove that this artifact, exactly as built, behaves correctly. If anything happens between the artifact and production — a rebuild, a re-tag, a manifest change — the proof is broken. The artifact has to be the unit of trust, end to end.

**Frontend developers thinking artifacts are a backend concept.** A `dist/` folder is an artifact. A static bundle uploaded to a CDN is an artifact. The concept applies on both sides of the stack. Frontend pipelines that rebuild on every environment have the same staging-and-prod-disagree class of bug, and the same fix.

**Forgetting that environment configuration is separate from the artifact.** The artifact is the same in staging and production. What changes between them is configuration: environment variables, secrets, connection strings, feature flags. "Same artifact, different configuration" is the right shape. If staging and prod need different artifacts, you do not actually have an artifact strategy.

## Connection to the Course

The course's reference implementation builds a Docker image in CI, tags it with the commit hash, runs system tests against it, pushes it to a registry, and deploys the same tagged image to production. The pattern is not optional infrastructure decoration; it is the substrate that makes everything else trustworthy. Lint matters because it gates the artifact. System tests matter because they verify the artifact. Deploys are safe because the artifact does not change. Read the pipeline file with this in mind and the structure stops looking like YAML configuration. It starts looking like the assembly line for a single, named, named-by-hash, trusted thing.

## Connection to the LLM Era

In the era of human-typed code, the discipline of "build once, deploy the artifact" was a best practice that mature teams converged on. In the era of AI-generated code, it is a survival requirement. The volume of change is too high for any reviewer to verify line by line. What you can verify is the artifact: the sealed thing, tagged with the commit, that passed every check in CI. The artifact is the unit at which trust is computable. Trace any production behavior back to its commit hash, trace the commit back to the prompt that generated it, and you have a complete provenance chain. Without artifacts and hash-tagging, that chain breaks in the middle and AI-generated code becomes untraceable. With them, the keyboard moved but the audit trail did not.

---

See also: [./06-why-ci-exists.md](./06-why-ci-exists.md) | [./07-ci-building-blocks.md](./07-ci-building-blocks.md) | [./08-test-taxonomy.md](./08-test-taxonomy.md) | [./02-docker-what-and-why.md](./02-docker-what-and-why.md) | [./05-ci-and-ai-feedback-loop.md](./05-ci-and-ai-feedback-loop.md)
