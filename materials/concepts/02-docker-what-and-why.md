# Docker: What and Why

## Watch

- [Docker in 60 Seconds](https://www.youtube.com/watch?v=yUpJFd-bgsc) (1 min)
- [Containerization Explained](https://www.youtube.com/watch?v=0qotVMX-J5s) (8 min)

## The Problem

You want to deploy the Music Finder backend to Render.com so anyone on the internet can hit it. You open the Render dashboard. It asks you one question first: where is your Docker image? There is no "just run my Node app" button. There is no "point at my GitHub repo and figure it out" button. Render deploys Docker images. Full stop. If you do not have a Dockerfile, you do not have a deploy.

This is where most students hit Docker for the first time. Not as an abstract portability story, not as a DevOps keyword, but as the literal gate between their laptop and the internet. Render is not unusual here. Most modern platforms that run backend services (Fly.io, Railway, AWS ECS, Google Cloud Run, Kubernetes) assume Docker as the unit of deployment. Learning Docker is not optional infrastructure polish. It is the ticket to deployment.

This video answers two questions. What IS Docker, concretely, for someone who has never built a container? And why does the same Docker image that runs on your laptop become the same exact artifact that runs in CI and the same exact artifact that runs in production, and why does that matter enormously?

## The Concept

### Docker is the bridge from laptop to internet

Your laptop is a very specific environment. It has your version of Node, your filesystem layout, your shell configuration, your `.env` file in a particular location. When the code works on your laptop, it works *in that specific environment*. A different machine, a CI runner or a Render server, has none of those things. The code that worked on your laptop is a set of instructions that assumed your laptop's reality.

Docker lets you take the reality your code assumes and package it. You declare what operating system your code runs on. You declare what version of Node is installed. You declare which files exist, which environment variables are read, which port is exposed, and what command starts the process. All of that goes into a file called a `Dockerfile`. Docker reads that file and produces an image, a sealed snapshot of the entire environment, ready to run.

The image is portable. Any machine that has Docker installed can run the image. Your laptop, a CI server in a data center, a Render host in Virginia: they all see the same environment, because the environment came with the image. "Works on my machine" stops being a phrase anyone needs to say. The machine is in the image.

### The Dockerfile as executable documentation

Every project has a README that says something like "install Node 22, run `npm install`, copy `.env.example` to `.env`, run `npm run build`, then `npm start`." That README is documentation, but it is documentation only humans can execute, and humans make mistakes. One reader installs Node 20 instead of 22. Another forgets the `.env` step. A third has a global npm cache that behaves differently.

The Dockerfile is the same information, except it is not prose for humans to interpret. It is a script that Docker runs. The instructions are precise, ordered, and identical every time. `FROM node:22-alpine` does not mean "Node 22ish"; it means exactly that base image, byte-for-byte. `COPY package.json ./` does exactly that. `RUN npm ci` runs exactly that command. Two people who run `docker build` against the same Dockerfile and the same source code produce two images that behave the same.

That is the aha: the Dockerfile is not a better README. It is a README that executes. It captures the setup steps as code, which means the setup is versioned in git, reviewed in PRs, and guaranteed to match on every machine that runs it. The question "how do I get this running?" has a single answer that works everywhere: `docker build` and `docker run`.

## How It Works

### The Music Finder Dockerfile in plain English

You will not need to memorize the syntax. Claude generates it, and in Exercise 3 the reference Dockerfile is already on the `exercise-3` branch. The important thing is reading it and understanding what each instruction tells Docker to do.

It starts from a base image, `node:22-alpine`, which is a stripped-down Linux environment with Node 22 already installed. It copies your `package.json` in, runs `npm ci` to install dependencies, copies the source code in, compiles the TypeScript to plain JavaScript. At the end, it declares which port the app listens on (`EXPOSE 3000`), it declares a health check (more on this below), and it declares the command that starts the app (`CMD ["node", "dist/index.js"]`).

That is the entire conceptual shape. Install, build, declare, start. The `Dockerfile` in the reference implementation uses two stages to keep the final image smaller (one stage for building, one stage for running), but you do not need to understand every line of that technique to use it. You need to understand that the file tells Docker *how to produce your running application from scratch*, deterministically, every time.

### One image, three stops: PR, CI, production

This is the part of Docker that most introductions undersell, and it is the part that pays off the most in practice.

When you push a commit to your branch, CI runs `docker build` and produces an image. That image gets a tag, something like `music-finder-backend:a4ea31e`, where `a4ea31e` is the commit hash. CI runs your system tests against that exact image. The tests pass. The image is now known to be good at that commit.

When the PR gets merged, CI builds the image again from the merged commit. It gets tagged again, something like `music-finder-backend:main-7373d21`. Render pulls *that exact image* and runs it in production. No separate "production build." No "ok now we install the real dependencies." The image that ran the tests IS the image in production.

This is huge. It means: if the tests passed, production is running tested code. Literally the same bits. There is no gap where a different build process produced a subtly different artifact. The class of bug where "it worked in staging but broke in prod because the build was different" cannot happen, because there is no different build. There is one image, flowing from the PR through CI through deployment, identified by tag.

In Exercise 3, you will see this flow end to end: push a commit, CI builds the image, tests run against it, tag lands, Render pulls the tag, health check passes, traffic switches. Same bits, every step.

### docker-compose, briefly

You will see a `docker-compose.yml` in the repo. It exists so that when the app eventually needs more than one service (a Postgres database, a Redis cache), all of them can be started with one command: `docker compose up`. For Exercise 3, the Music Finder only has the backend service, so Compose feels almost unnecessary. Treat it as a preview: the file is there, and when you add a database in a later exercise, you will add it as a service to this same file and nothing about how you run the app changes.

Don't overthink Compose. It is a convenience for running multiple containers together locally. That is it.

### The HEALTHCHECK, and who reads it

The Dockerfile contains a `HEALTHCHECK` instruction that tells Docker how to verify the container is actually alive, typically by hitting `GET /health` and expecting a 200 response. This instruction looks like a throwaway line. It is not. Three different systems read it, and each one matters.

Locally, Docker itself uses the health check to mark the container as `healthy` or `unhealthy`. You see this when you run `docker ps`. If you added a dependency between services in Compose ("don't start the backend until Postgres is healthy"), that dependency is driven by the health check.

In CI, the system tests use Testcontainers to start the image and wait for the health check to pass before any test runs. If the health check never passes (because an environment variable is missing and the app crashed on startup, say) the tests do not run against a broken container. They time out quickly with a clear signal: the container never became healthy.

In production, Render uses the same health check to decide whether a new deployment is safe to switch traffic to. A new container comes up, Render polls `/health`, and only when the health check returns 200 does Render route traffic away from the old container. If the health check fails, the deployment is rolled back automatically. The old version keeps serving.

Same health check, three readers. Writing the health check once, in the Dockerfile, is how you get "does this container actually work?" answered consistently at every stage of the pipeline.

## Common Mistakes

**Forgetting the `.dockerignore`.** Without it, a `COPY . .` in the Dockerfile copies everything in your working directory into the image: `node_modules`, `.env` with your Spotify credentials, local build output, screenshots from last week. The image becomes enormous, slow to build, and potentially leaks secrets. A `.dockerignore` works like a `.gitignore`: list what to exclude. At minimum: `node_modules`, `.env`, `dist` (the builder stage regenerates it), anything you would not put in git.

**Copying `.env` into the image.** A variant of the above. Some students, trying to make the container "self-contained," write `COPY .env .env` in the Dockerfile. This defeats the entire point of external configuration: the image now carries the credentials, which means anyone with the image has the credentials. Images are shared artifacts. Secrets are never in the image. They are injected at runtime via environment variables in Compose, CI, or Render's dashboard.

**Running the container and hitting it at the wrong URL.** You start the container, it prints "listening on port 3000," and you curl `localhost:3000/health`. Nothing responds. The container is listening on *its own* port 3000, but you have not told Docker to map that port to your host. The fix is `-p 3000:3000` on `docker run`, or the `ports:` key in `docker-compose.yml`. The port inside the container and the port on your laptop are not the same thing unless you map them.

**Rebuilding from scratch every time.** A change to one line of source code triggers a full reinstall of `npm` dependencies. This happens when the Dockerfile copies source *before* running `npm ci`. The fix is to copy `package.json` and `package-lock.json` first, run `npm ci`, and only then copy the source. Docker's layer cache then reuses the dependency layer unless the package files change. The reference Dockerfile already does this; you should read it and understand why.

**Treating Docker as a mystery box.** The Dockerfile is plain text. You can read it line by line. When something goes wrong (the container crashes on startup, a file is missing, a port is unreachable) the answer is almost always in the Dockerfile or in the logs (`docker logs <container>`). Students sometimes skip reading, assume Docker is unknowable, and ask Claude to "fix the container." Claude will try, but it will do a much better job if you tell it what the logs say.

## Connection to the Exercise

Exercise 3 gives you a Dockerfile on the `exercise-3` branch. Your job is not to write it from nothing. Your job is to *understand* it: read the stages, follow what each instruction does, and be able to modify it when, for example, you need to pass a new environment variable through.

You will `docker build` it locally. You will `docker run` it and verify the health check responds. You will let CI build it on every push and run tests against it. You will deploy it to Render, which will build it again from your Dockerfile and host the running container. At each step, the same file is the source of truth: the Dockerfile on your branch.

When the system tests run in CI against the Docker image, and later the exact same image runs on Render serving real traffic, you will have the concrete experience of "the artifact that was tested is the artifact in production." That experience is the point of this video.

## Connection to the Course Philosophy

Every exercise in the course adds one more thing to the pipeline: git, Docker, OpenAPI, tests, CI, deployment, observability. Docker is where "code" stops being a loose collection of files on a laptop and becomes an artifact, a named, versioned, reproducible thing that flows through the pipeline.

The guardrails-first philosophy depends on this. You cannot have guardrails around an artifact that does not exist. Once the Dockerfile exists, CI has something concrete to test, Render has something concrete to deploy, and the team has something concrete to reason about. Every guardrail downstream of Docker (the health check, the CI build, the production rollout) is built on the assumption that the artifact is real, reproducible, and identified by tag.

"Can you run it anywhere?" is the question Docker answers, and in answering it, it unlocks every question that comes after: "can you prove it works?", "can machines prove it works?", "can the world see it?" All of those depend on there being an artifact to talk about. Docker is how that artifact comes into existence.

---

See also: [./01-git-state-management.md](./01-git-state-management.md) | [./04-localhost-to-production.md](./04-localhost-to-production.md) | [./05-ci-and-ai-feedback-loop.md](./05-ci-and-ai-feedback-loop.md)