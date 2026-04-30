# CI and the AI Feedback Loop

## Watch

- [What is Continuous Integration?](https://www.youtube.com/watch?v=1er2cjUq1UI) (6 min)
- [What is Continuous Delivery?](https://www.youtube.com/watch?v=2TTU5BB-k9U) (6 min)

## The Problem

You finish adding the OpenAPI spec to the Music Finder backend. The app starts cleanly on your laptop. Swagger UI renders. The search works. You commit, push, and move on. Forty seconds later, your GitHub notifications light up: CI failed. Red badge.

You open the output. It is three hundred lines of terminal text. Somewhere in there is the actual failure, buried between npm install noise, test runner banners, and stack traces. You scroll. You find a line that says `error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.` You have seen this error before. Last time it took you twenty-five minutes to figure out what to change and why.

This is the moment the CI feedback loop lives or dies. In a traditional workflow, the student either grinds through Stack Overflow until something clicks, or asks a senior engineer for help, or, most often, just retries the pipeline hoping it was flaky. In the Codo workflow, the student pastes the error into the Claude Code session and types one question: "what does this mean?"

Ten seconds later, Claude has read the error, identified which line of code triggered it, explained why TypeScript is complaining, and described the fix. The student reads the explanation, applies the change themselves, pushes again, watches the badge turn green. The loop (push, fail, ask Claude *what this means*, understand, fix, push, green) took under three minutes. And the student learned what `string | undefined` narrowing means.

This video is about that loop. It is also about understanding what CI and CD actually do, how Testcontainers fits in, and why the difference between asking Claude "what does this mean?" and asking Claude "just fix it" is the difference between engineering and letting a tool carry you.

## The Concept

### CI and CD are two different things

The phrase "CI/CD" blurs two different jobs. Separate them.

**CI: Continuous Integration.** On every push, in a clean environment that is not your laptop, a pipeline runs checks against your code. Lint, typecheck, system tests, build. It produces one signal: green or red. Did these changes clear the bar? CI's job is to protect the shared base branch from broken commits and to give the developer immediate feedback. CI is a *gate*. It says yes or no.

**CD: Continuous Delivery (or Deployment).** When CI is green on the main branch, CD takes the artifact CI produced and ships it. For Exercise 3, "shipping it" means Render pulls the Docker image from the merged commit and runs it. CD is a *pipeline*. It says: now that this change is verified, get it into production.

The two are connected but separate. CI can run without CD. You can have CI on a side project with no deploy target at all, and it is still useful because it is still telling you whether your code is in a good state. CD without CI is reckless: you would be shipping unverified code.

In Exercise 3, CI runs on every push to `student/<name>` and to `exercise-3`. CD is configured on Render to pull from `exercise-3` when that branch updates. Push to your student branch: CI runs, nothing deploys. Merge your PR into `exercise-3`: CI runs on `exercise-3`, and if green, Render picks up the new image and deploys it. CI is what you interact with constantly as you work. CD is what happens silently after a merge.

Holding the two separate in your head is worth the small effort. "CI failed" and "the deploy failed" are different sentences and you debug them differently.

### Fail-fast: cheap checks first

The CI pipeline for Exercise 3 runs these steps, in this order: **lint → typecheck → system test → build**. The order is not aesthetic. It is economic.

Lint is the cheapest step. ESLint reads your source files without executing them and flags rule violations in a few seconds. Typecheck is the next cheapest: `tsc --noEmit` parses every file and checks types, still fast. System tests are expensive: they build a Docker image, start a container, wait for a health check, send HTTP requests. Build is the step that produces the final production artifact.

If the pipeline ran expensive steps first, a typo in your source code would waste two minutes on a Docker build before surfacing the lint error you could have seen in two seconds. Cheap-first means the feedback hits fast. If the lint step fails, the pipeline stops. No point typechecking code that is going to be fixed anyway.

This is called the *fail-fast principle*. Surface the cheapest failure signal first. It is not about being efficient with CI minutes, though it helps. It is about making the feedback loop tight enough that the developer still remembers what they were doing when the failure arrives.

Each step catches something the previous ones could not. Lint catches sloppiness. Typecheck catches structural type bugs that lint rules cannot know about. System tests catch behavior the type system cannot describe: "when you call `/api/search?q=radiohead`, real tracks come back." Build catches environment problems: dependencies that exist on your laptop but are not in `package.json`, case-sensitive file paths that break on Linux, anything that makes the image non-reproducible. You need all four, because each one is blind to different kinds of failure.

### Testcontainers, in one sentence

Testcontainers is a library that starts your Docker image from inside the test code, waits until the health check says the app is ready, runs the tests against the running container over HTTP, then tears it down.

That is it. That is the concept. You do not need to memorize the API. You do not need to know how the container networking is set up. The mental model is: your system test starts a real copy of your backend in a container, talks to it the way a real client would, and cleans up afterward. In Exercise 3 the reference code already does this. Your job is to understand *what* it is doing, not to configure it from scratch.

Why this approach instead of running the backend directly in the test process? Because the point of a system test is to verify the artifact that will run in production. If you test the backend by calling its functions in-process, you are testing code, not the container. Testcontainers tests the container. Same image that runs in production, same image the test exercises. One artifact, verified end to end.

### Claude as diagnosis partner, not autopilot

Here is the question that defines how you learn in this course: when CI fails, what do you type into Claude?

Option A: "Claude, fix it."
Option B: "Claude, what does this mean?"

They sound similar. They produce very different outcomes.

**Option A** is autopilot. Claude reads the error, makes a change, the pipeline goes green. You learned nothing about the error. The next time the same class of error appears (in a different file, in a different project, in six months) you are back to square one. You also have no way to tell if Claude's fix was correct or just suppressed the symptom. A TypeScript error can be fixed properly (narrow the type) or papered over (`as any`), and if you did not read the diagnosis, you cannot tell which happened. Autopilot is comfortable. It does not scale. When Claude makes a mistake, you cannot catch it.

**Option B** is diagnosis. Claude reads the error and explains it: what the compiler is complaining about, why the rule exists, which line triggered it, what the fix should do. *Then you apply the fix yourself*, or you tell Claude to apply it while you follow the diff. The difference is that the understanding happens in your head before the code changes. The next time you see `string | undefined` narrowing, you recognize it.

The engineering skill you are building in this course is reading CI output fluently. Not the ability to generate code (Claude does that) but the ability to read what the tools are telling you and understand what is actually wrong. After five or ten CI failures diagnosed this way, you stop needing Claude for the basic ones. You see the error, know what it means, and fix it directly. The training wheels come off because you trained, not because you avoided the problem.

Asking Claude "what does this mean?" over and over is how you build the instinct. Asking Claude "just fix it" over and over is how you stay permanently dependent.

## How It Works

### The pipeline on every push

When you push a commit to `student/<your-name>`, GitHub Actions picks it up and starts the CI workflow. It checks out your code into a fresh Ubuntu container. It sets up Node 22. It runs `npm ci` to install dependencies from your `package-lock.json`, the same lockfile you committed. Then it runs each step in sequence.

Lint runs in ten or fifteen seconds. Typecheck runs in twenty. If either fails, the pipeline stops, the badge on your commit turns red, and GitHub sends you a notification.

If lint and typecheck pass, the system test step runs. This one is slower, maybe ninety seconds. It builds the Docker image with `docker build`, then runs the Testcontainers-based test suite against the image. The tests start a container, wait for `/health` to respond 200, hit the search endpoint, verify the response shape against `SearchResponseSchema`, then tear the container down.

If system tests pass, the build step runs. This is the final Docker build, the one whose output (if this is the `exercise-3` branch after a PR merge) Render will pick up for deployment. If all four steps pass, the pipeline is green, and a little green checkmark appears next to your commit on GitHub.

The whole thing takes two or three minutes. Two or three minutes is how long you wait to find out whether your change is safe. That is cheap. That is the whole point.

### The Claude loop in the middle of work

The Codo Guide running in your Claude Code session is aware of the CI rhythm. When it notices you have local commits that have not been pushed, it nudges: "You have 3 commits locally that haven't been pushed. Want to push and let CI run?" The nudge is not a demand. It is Claude surfacing that the feedback you want is one `git push` away.

After a push, when CI produces output, the loop looks like this. You see a red badge. You click through to the failed job. You copy the relevant chunk of output, not three hundred lines, just the actual error. You paste it into your Claude session with one of two framings:

"This is from CI. What does this mean?" You are asking for explanation. Claude reads the error, tells you what it says, why it says that, and which line of your code triggered it.

"This is from CI. What is the smallest change that fixes it?" You are asking for a targeted fix proposal. Claude reads the error, proposes a specific diff, explains why that diff is the right fix. You apply it yourself (or review Claude's application of it), then push again.

Both framings are diagnosis-first. Neither is "fix it and go away." The work of understanding happens in you, supported by Claude. Over time, you notice that certain error types become familiar. You stop needing the explanation. You fix them directly. That is the skill developing.

## Common Mistakes

**Pushing huge batches so CI only runs once a day.** The longer you go between pushes, the more changes are in each push, and the harder it is to pinpoint what failed when the pipeline goes red. Small, frequent pushes make the feedback signal sharp. CI is cheap. Push early, push often.

**Rerunning CI until it passes.** If a test is flaky (passes sometimes, fails sometimes) the temptation is to just hit "re-run jobs" until the random gods smile. Do not. Flaky tests destroy the pipeline's meaning. If a test is flaky, the test is broken, and the first priority is figuring out why. In Music Finder system tests, the usual cause of flakiness is a misconfigured wait strategy: the test starts before the container is truly ready. That is a fix, not a nuisance.

**Treating CI failure as an obstacle rather than information.** A red badge is not a setback. It is CI doing its job: telling you something would have broken in production. Students sometimes get frustrated with red CI and want to push past it. The pipeline is the ally, not the enemy. Read the output. Understand the signal. Fix the actual thing.

**Copying the whole CI log into Claude.** Three hundred lines of noise plus one real error is worse than just the error. Skim the log, find the part that actually says "error" or "failed," copy that chunk, and paste *that* into Claude. Clean context in, better diagnosis out.

**Asking Claude to fix what Claude already fixed wrong.** If you ask Claude to fix an error and the fix makes the error go away by suppressing it (`as any`, a `// @ts-ignore`, a disabled lint rule), the pipeline goes green but the underlying problem is still there. Always read the diff Claude produces. If the fix is a suppression rather than a correction, push back: "that just silences the warning, what's the actual issue?"

**Skipping the system tests locally and only letting CI run them.** CI is fast, but running the system test locally is faster for iteration. The reference repo has a `npm run test:system` script. Use it while you are working. CI is the gate. Local running is the development loop. Don't confuse them.

**Not reading the deploy logs when CD fails.** A merge into `exercise-3` triggers a Render deployment. If that deployment fails (bad Dockerfile change, missing env var in Render's dashboard, health check never responding), Render shows the full log in its dashboard. The information is there. Students sometimes re-trigger the deploy instead of reading the log. The log is where the answer is.

## Connection to the Exercise

Exercise 3 Part D is "let machines prove it": the CI pipeline. You will push commits to `student/<your-name>`, watch CI run, read failures, diagnose them with Claude, and push fixes. The CI workflow file is already on the `exercise-3` branch. Your job is not to write the pipeline; your job is to *work inside it*, getting your own changes through it green.

Every time you push, you generate data. A green badge is evidence: this change passes lint, typechecks cleanly, the Docker image builds, the system tests pass against it. That evidence is what gives you the right to merge into `exercise-3` and eventually deploy to Render. Without the green badge, the merge button is blocked.

The commit log on your branch plus the CI run history is the record of how you built the production-ready version of Music Finder. Your instructor reads both. The pattern of small, frequent pushes with mostly-green CI (and a few red-to-green recoveries where you learned something) is what competent engineering looks like. That pattern is what the exercise asks you to produce.

## Connection to the Course Philosophy

CI is the guardrails-first philosophy compiled into an automated process. The "describe it → run it anywhere → prove it works → machines prove it → the world sees it" spine of Exercise 3 treats CI as *machines prove it*. Humans prove things by reading and thinking. Machines prove things by running the same checks every time, on every change, without forgetting. Both are necessary. Neither replaces the other.

The CI feedback loop is also the mechanism that makes AI-assisted development safe. Claude writes code fast. Without a feedback loop, that speed is dangerous. Bugs accumulate faster than anyone can review them. With CI, speed is usable: Claude generates, CI checks, failures surface immediately, and the developer diagnoses (with Claude's help) and fixes. The loop converts raw generation speed into verified progress. Without the loop, you have raw generation. With it, you have engineering.

The deeper point is about what kind of engineer this course is trying to produce. The old model was: you understand your code because you wrote every line of it. That model does not work anymore. Claude writes many of the lines. The new model is: you understand your system because you read every CI failure, approved every commit message, and verified every behavior change. The keyboard has moved. The responsibility for understanding has not. CI, read with Claude as a diagnosis partner, is how that responsibility is exercised, push after push, until reading CI output is as natural to you as reading code used to be.

---

See also: [./01-git-state-management.md](./01-git-state-management.md) | [./02-docker-what-and-why.md](./02-docker-what-and-why.md) | [./04-localhost-to-production.md](./04-localhost-to-production.md)
