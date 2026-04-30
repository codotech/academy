# Git in the LLM Era

## Watch

- [Git vs. GitHub: What's the difference?](https://www.youtube.com/watch?v=wpISo9TNjfU) (10 min)

## The Problem

Claude just wrote three hundred lines of code. You asked for Docker support on the Music Finder backend, and the assistant produced a Dockerfile, a docker-compose.yml, a `.dockerignore`, an updated health-check route, and changes to the npm scripts. You skimmed it, it compiled, the container started, and the search endpoint responded. The whole thing took four minutes.

Now you have a decision. You can stage everything and commit it as one lump, "add docker support", and move on. Or you can stop, read what was actually changed, and break it into three or four small commits, each one a meaningful step. The first path feels faster. The second path is the whole difference between shipping software you understand and shipping software that happens to work.

This video is about why, in the LLM era (when an assistant generates code faster than you can type), the discipline of small, frequent commits matters more than it ever did when humans wrote every line by hand. It is also about a twist that catches students off guard: Claude writes the commit messages too. The developer's job is no longer to type the message. It is to read what Claude wrote, confirm the message accurately describes the change, and approve. That moment of reading and approving is where understanding gets built.

## The Concept

### Why small commits matter more, not less, in the LLM era

When a human writes fifty lines of code, those fifty lines move through a human brain. The developer touches every variable, chooses every name, structures every block. By the time the code compiles, the developer has a mental model of what it does.

When Claude writes fifty lines of code, the code exists before the developer has thought about it. Unless the developer does something deliberate, something structural, to engage with those lines, the understanding never forms. The code ships; the developer cannot explain it a week later.

The commit is that deliberate structural engagement. A commit forces two things: you select the hunks that belong to this change, and you confirm a message that describes them. If those two acts are happening every twenty or thirty lines, you have read every hunk and confirmed every intent. If those two acts are happening every three hundred lines, you have skimmed a wall of code and rubber-stamped a label. The generation speed has not changed, but the understanding density has collapsed.

This is the first and most important reframe. Small commits in the LLM era are not a style preference. They are the mechanism by which a developer stays inside the loop while the assistant is writing the code.

### The twist: Claude writes the commit message

In most tutorials, you learn to write commit messages by hand. In the LLM era, you usually will not. The Codo Guide, Claude Code, or whatever assistant you are pairing with generates the commit message along with the change. It proposes something like "add multi-stage Dockerfile and configure .dockerignore to exclude node_modules." You are asked to approve or revise.

This sounds like it removes the learning moment. It does the opposite, if you engage with it correctly. The developer's job has shifted from *writing* the message to *reading* it and checking that it accurately describes the diff. That check is the same cognitive act as writing the message yourself: you have to understand the change to know whether the message fits. But it is faster, and it scales to the volume of code the assistant produces.

The failure mode is obvious: students approve the message without reading the diff, because it takes thirty seconds instead of five minutes. When that happens, the commit log fills up with messages that are technically accurate but describe code the student cannot explain. The remedy is not to reject LLM-written messages. It is to make the reading of the diff a ritual: a pause, every time, before approving.

### The five operations that matter

Git has dozens of commands. In Exercise 3 you need exactly five: commit, branch, tag, PR, merge. Everything else is a specialist tool you do not need yet.

**Commit** is the checkpoint. You made a thing work; you freeze it. The commit becomes a named state you can return to.

**Branch** is parallel work. Each student on the pilot team (omer-morag, amit-cohen, itay-shapira, gal-hadad) has their own branch off `exercise-3`. Nobody's in-progress Docker experiment can break anyone else's CI pipeline because each branch is an independent line of history.

**Tag** is a permanent name for an important commit. When the Docker image gets built for deployment, it carries the tag of the commit it was built from. That tag is how you know which exact state of the code is running in production right now.

**PR** (pull request) is how a branch gets proposed for merging. It is also where CI runs, where teammates comment, and where the history of that work becomes visible to everyone. A PR is both a merge proposal and a conversation.

**Merge** is the combination of two lines of history into one. When a student's branch merges into `exercise-3`, the `exercise-3` branch now contains their commits, in order, woven into its own.

That is the complete vocabulary you need for Exercise 3. No stash, no rebase, no cherry-pick, no bisect. Those exist and have their uses; they are not in scope.

## How It Works

### The LLM-era commit loop

Here is the actual loop a student runs during Exercise 3. You ask Claude to add the OpenAPI spec. Claude writes `openapi.yaml`, updates `index.ts` to mount Swagger UI at `/api-docs`, adds the `swagger-ui-express` dependency to `package.json`, and proposes the commit message "add OpenAPI spec and serve Swagger UI at /api-docs."

Before approving, you do three things. You read the diff, really read it, not skim. You check whether the message matches the diff: is everything in the diff described by the message? Is there anything in the diff that the message does not mention? Then you approve, or you revise the message, or you ask Claude to split the commit.

The splitting moment is the most valuable. If Claude's commit covers adding the dependency AND writing the spec AND mounting the UI, you can ask it to make three commits instead of one. Each one now has a narrower scope and a clearer message. Your future self, reading the log, will see three small steps instead of one blob. When CI fails on the third step, you know the first two were fine. That is only true because you asked for the split.

### Commits as navigation in high-volume generation

In a pre-LLM workflow, a developer might write a hundred lines in a day. In an LLM workflow, a developer might generate a thousand. The volume is ten times higher, which means the risk of getting lost is ten times higher. Small commits are the breadcrumbs that let you find your way back.

When something breaks (a test that was green is now red, a build that worked now fails), the first question is always "what changed?" With small commits, `git log --oneline` answers it. You see the last five messages, one of them is obviously the suspect, you read its diff, you understand the regression. With one giant commit, the log tells you nothing you did not already know; you have to read every line of the thousand-line diff.

This is not about git mechanics. It is about working sustainably when the assistant is writing at a rate no human could match.

### Team flow with the five operations

The pilot cohort is four students sharing one repository. Each student has a `student/<name>` branch. The `exercise-3` branch is the shared base. Here is how the five operations compose into a team workflow.

Each student works on their own branch. They commit frequently: Claude generates, student reads and approves, commit lands. Every few hours, the student pushes to GitHub. CI runs on the push. If it is green, the work is visible as a set of commits on that student's branch. If it is red, the student fixes the failure (or asks Claude to) and pushes again.

When a piece of work is complete (Dockerfile done, or system tests passing, or CI green), the student opens a PR from their branch to `exercise-3`. The PR is the public view of their work: every commit, every diff, CI status, and any comments. Instructors and classmates can review. When the PR is approved, it merges.

A tag gets applied when a student's work is deployable, for example when the Dockerfile is final and Render is about to deploy from it. The tag is a permanent name for that exact state, so even six months later you can `git checkout v0.3.1-docker-ready` and see the code that produced the running image.

Four students, four branches, a shared base, PRs as the merge gate, tags as the production markers. That is the entire collaboration model for this exercise.

## Common Mistakes

**The LLM squash.** Claude produces three hundred lines in one generation and the student commits them all as one commit with a one-line message. The label is meaningless at that scope, the diff is too large to have been read carefully, and the understanding did not get built. When CI fails on that commit, the student cannot tell whether the problem is in the Dockerfile, the compose file, the health-check route, or the package scripts, because the commit contains all of them. The fix is to ask Claude to split the change as it generates it, or to stage and commit hunk by hunk after the fact.

**Never committing.** The opposite failure. The student works for hours, accumulates a massive uncommitted working directory, and never reaches a checkpoint. This is worse than the squash, not better. If anything goes wrong (the machine crashes, the branch gets confused, a change needs to be reverted) there is nothing to return to. The pressure to "just keep going until it all works" is the pressure that produces the squash in the first place. The habit of committing as soon as one thing works short-circuits the whole problem.

**Approving Claude's commit message without reading the diff.** The message says "add health check endpoint." The diff also includes a change to the Spotify client, which the message does not mention. Six commits later, the search results are broken and the student has no idea when or why. Every approved commit message is a claim the student is making about what they understand. Unapproved, un-*read* claims accumulate as technical debt in the commit log and as blind spots in the student's own head.

**Pushing directly to `exercise-3` instead of opening a PR.** The student's branch is `student/amit-cohen`. They finish the Docker work and push it straight to `exercise-3` by mistake or to "save time." Now the shared base has a change that nobody else reviewed, CI was not required to be green, and if the change breaks something, everyone's branch inherits the break. Always merge via PR, never by direct push to the base.

**Forgetting what branch you are on.** A student checks out `exercise-3` to look at the reference implementation, then starts making edits, forgetting they are not on their own branch. When they commit, the commit lands on `exercise-3` locally. They push, and the push is rejected because `exercise-3` is protected, which is the protection working correctly. Always `git branch` before editing. In this course, if you are editing, you should be on `student/<your-name>`.

## Connection to the Exercise

Exercise 3 is the first time you will work on a branch alongside other humans, with CI running on every push, and with Claude generating most of the code. The discipline of small, frequent commits is not decoration on top of that workflow: it *is* the workflow. The Codo Guide in this exercise explicitly nudges you toward commits at natural checkpoints: when a test goes green, when an endpoint responds for the first time, when a refactor leaves behavior unchanged.

Every commit on your `student/<name>` branch is a public artifact. Your instructors read the log to understand how you built the system. CI reads each commit to decide whether the push is green or red. Your classmates, looking at your PR, read your commits to learn from how you structured the work. The log is not a private scratchpad. It is a document you are co-authoring with Claude, and the quality of that document is one of the things being assessed.

## Connection to the Course Philosophy

The course treats every interaction with the LLM as a place where understanding either gets built or gets skipped. The commit is the single highest-leverage instance of that choice. The generation is free; the comprehension is not. Every approved commit message is a tiny contract: "I read what was generated, I understand what it does, and I am naming it so my future self and my team can find it later."

A commit log that reads like a coherent story, "add health route; wire up search endpoint; validate Zod response shape; add Spotify client with token cache; handle 502 on upstream failure", is the signature of a developer who stayed in the loop while the assistant was working. A commit log that reads "wip; more changes; fix; final; actually final" is the signature of someone who let the assistant run without them. The guardrails-first philosophy is, in the end, about staying in the loop, and commits are the primary guardrail you control.

---

See also: [./02-docker-what-and-why.md](./02-docker-what-and-why.md) | [./05-ci-and-ai-feedback-loop.md](./05-ci-and-ai-feedback-loop.md)