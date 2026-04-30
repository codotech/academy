# From Localhost to Production

## Watch

- [What is Continuous Delivery?](https://www.youtube.com/watch?v=2TTU5BB-k9U) (6 min)
- [Continuous Deployment vs. Continuous Delivery](https://www.youtube.com/watch?v=LNLKZ4Rvk8w) (5 min)

## The Problem

The Music Finder backend runs on your laptop. You hit `localhost:3000/api/search?q=radiohead` and real Spotify tracks come back. It works. Now imagine someone in another country opens their browser. They type your app's URL. What has to happen between where you are now (a process running on your MacBook, reachable only from your own machine) and that person seeing search results?

It is a surprisingly long list. There has to be a server somewhere on the internet, not on your laptop. That server has to run your backend. It has to have a public URL. It has to have your Spotify credentials without those credentials ever appearing in your source code. It has to allow requests from the frontend's deployed origin and not from some random attacker's. It has to handle HTTPS, because browsers block mixed content. And it has to be able to update without going down every time you push a new version.

This video is about taking that leap. Not about every detail of every hosting platform, but about the *shape* of the journey. Four angles cover it: the credential journey (how secrets travel from your laptop to a running server without being committed), the deployment substrate (Render runs your Docker image, nothing more, nothing less), CORS in production (the one setting that breaks everything on day one), and the aha: your URL, on the internet, returning real results to real strangers.

## The Concept

### The four-layer credential journey

Your Spotify Client ID and Secret are the thread that ties the whole journey together. The same two values (the same strings) live in four different places by the time your app is running in production. They are named the same way (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`) at every layer. What changes is how they get there.

**Layer 1: Your laptop.** A `.env` file in the backend directory contains `SPOTIFY_CLIENT_ID=...` and `SPOTIFY_CLIENT_SECRET=...`. The `import 'dotenv/config'` at the top of `index.ts` reads that file on startup and puts the values into `process.env`. The file is listed in `.gitignore` and never committed. What IS committed is `.env.example`, a template with the variable names and placeholder values, so anyone cloning the repo knows what they need to supply.

**Layer 2: Docker locally.** When you run the backend in a container, the `.env` file is not automatically inside the container; containers have their own filesystem. You pass the environment in explicitly, via `docker-compose.yml`'s `env_file: .env`, or `docker run --env-file .env`. The container receives the same variables, but they are injected from outside the image, never baked into it. The Dockerfile itself contains no credentials. The `.dockerignore` excludes `.env` so it cannot accidentally be copied in.

**Layer 3: CI.** CI runs on a fresh machine in a data center; there is no `.env` file there. Instead, the credentials live in GitHub as encrypted Repository Secrets (Settings → Secrets and Variables → Actions). The CI workflow references them as `${{ secrets.SPOTIFY_CLIENT_ID }}` and injects them into the environment of the step that runs the system tests. From the backend's perspective, `process.env.SPOTIFY_CLIENT_ID` resolves to the real value, same as locally, but the value was never written into any file in the repo.

**Layer 4: Render.** You paste the Client ID and Secret into Render's dashboard under "Environment Variables." Render stores them encrypted and injects them into the container's environment when it starts. Again, same variable name, same value, different mechanism. The Render dashboard is the only place in layer 4 where the real value exists outside an encrypted store.

Four layers, same two variables, four different mechanisms. That is the credential journey. When you understand it, "how do I pass secrets to production?" stops being mysterious. It is the same pattern at every layer: the code reads `process.env.FOO`; something outside the code puts `FOO` into the environment before the process starts; the mechanism changes but the interface does not.

### Render is a Docker runner

This part surprises students. "Deploying to Render" sounds like a multi-step process with servers, SSH, operating system configuration, and firewalls. It is not. Render runs your Docker image. That is approximately everything it does.

You connect your GitHub repo to a Render service. Render watches the branch. On push, Render pulls your code, runs `docker build` using *the Dockerfile in your repo*, and starts a container from the resulting image. It injects the environment variables you configured in the dashboard. It exposes the container's port to the public internet via a URL like `music-finder-backend.onrender.com`. It polls your `/health` endpoint; when it responds, traffic is routed.

The consequence is that by the time you get to the deployment step in Exercise 3, deployment is not new work. You already wrote the Dockerfile in Part B. You already configured the health check. You already got the system tests passing against the image in Part D. Render takes that same image and runs it. Configuration, not code. The code is done. What you configure on Render is: which repo to watch, which branch, and which environment variables to inject. That is it.

### CORS: the one setting that breaks everything

Everything works locally. The frontend on `localhost:5173` calls the backend on `localhost:3000`. Search results come back. You deploy. You open your production frontend URL. The search returns nothing. The UI shows an error. You check the backend logs and there are no requests arriving. The backend thinks nothing is wrong. The network tab in your browser shows red: "blocked by CORS policy."

CORS (Cross-Origin Resource Sharing) is the browser's rule that a page loaded from one origin cannot make HTTP requests to a different origin unless the target server explicitly allows it. "Origin" means scheme + host + port. `https://music-finder-frontend.onrender.com` is one origin. `https://music-finder-backend.onrender.com` is a different origin. The browser will not send the request unless the backend's response includes a header that says "yes, requests from the frontend origin are allowed."

Locally, both frontend and backend are on `localhost` and the CORS middleware is configured to allow `http://localhost:5173`. After deployment, the frontend is on a Render URL. Unless the backend is told to also allow that URL, every request is blocked by the browser before it leaves the machine.

The fix is one environment variable. The backend reads `process.env.CORS_ORIGIN` on startup and configures CORS to allow exactly that origin. Locally, you set it to `http://localhost:5173` in your `.env`. On Render, you set it to `https://music-finder-frontend.onrender.com` in the dashboard. The code does not change between environments. The environment changes.

CORS is worth understanding as a category, not just a fix. It is environment configuration, the same kind as credentials. The backend's behavior depends on which environment it is in, and the environment is what tells it the right answer.

## How It Works

### The Render deployment flow

In Exercise 3, the shape is: push a commit to your `student/<name>` branch; CI builds the Docker image and runs system tests against it; when tests pass, you open a PR to `exercise-3`; once merged, Render is watching `exercise-3` and pulls the latest code. Render runs `docker build` (same Dockerfile you tested locally, same Dockerfile CI tested) and starts a container. It injects the environment variables you set in the dashboard: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `CORS_ORIGIN`, anything else your app reads from `process.env`.

Render waits for the container's health check to return 200. When it does, traffic switches to the new container and the old one is stopped. Your deployed backend URL is now serving the new version. HTTPS is handled for you. Render provisions and renews TLS certificates automatically.

You do not configure a server. You do not SSH anywhere. You do not manage operating system packages. You wrote a Dockerfile; you configured a dashboard; Render did the rest. That asymmetry (a lot of value from a small amount of configuration) is what makes the deployment step feel almost anticlimactic after the Docker and CI work is done. The hard part was making the artifact. Running the artifact is easy.

### The aha: your URL, returning real results

Here is the moment the whole exercise points at. You finish the deploy. You open a new browser window. You type the URL Render gave you, or you open the deployed frontend which points at your deployed backend. You type `radiohead` into the search box. You hit enter.

Real Spotify tracks appear. Your code did this. The backend you wrote, running in a container built from your Dockerfile, responded to an HTTP request from a public frontend, called the real Spotify API using credentials you configured in a dashboard, validated the response against your Zod schemas, and returned it. The search works from any device, anywhere on the internet, for as long as the service is running, without your laptop being on.

That is what all the previous pieces have been building toward. The contract (Exercise 3 Part A) is the agreement. The Docker image (Part B) is the artifact. The system tests (Part C) verify the artifact works. CI (Part D) automates the verification. Deployment (Part E) takes the verified artifact and puts it in the world. At the end, there is a URL. You can send it to your mom. You can put it on your résumé. It is real.

## Common Mistakes

**Committing the `.env` file.** The secret is in git history the instant it is pushed, even if the file is deleted in the next commit. GitHub's secret scanning runs *after* the push and sends an email saying the credentials are already exposed. You rotate the Spotify credentials, rewrite git history (force-push), and move on wiser. The prevention is a `.gitignore` entry for `.env` added before the file is ever created, and a `.env.example` template that is safe to commit.

**Baking credentials into the Docker image.** Adding `COPY .env .env` to the Dockerfile feels like a shortcut but puts the secrets into the image layers permanently. Anyone with the image has the credentials. Always inject at runtime, never build-time.

**Leaving `CORS_ORIGIN` set to localhost in production.** You deploy, open the frontend, see a blank page and an error in the console: "CORS policy: No 'Access-Control-Allow-Origin' header." The backend logs show no incoming requests. The request was blocked by the browser before it left the client. The fix is to set `CORS_ORIGIN` in the Render dashboard to the frontend's deployed URL, exactly as-is (with `https://`, no trailing slash).

**Assuming `localhost` inside a container means the host machine.** When a container tries to reach `localhost:5432` looking for Postgres running on your laptop, `localhost` resolves to the *container itself*. The host machine is unreachable under that name. Inside Compose, services reach each other by their service name (`postgres:5432`). Inside Render, services reach each other by their internal Render URL.

**Not reading the Render logs when a deploy fails.** A container that exits on startup because `SPOTIFY_CLIENT_ID` is missing prints a clear error to stdout. Render shows that error in the deploy logs. Students sometimes retry the deploy blindly without looking at what the first attempt said. The log is where the answer is. Read it first, ask Claude second.

**Pointing the frontend at localhost after deploying the backend.** You deploy the backend to Render, celebrate, then notice the deployed frontend still can't find it. The frontend is configured to call `http://localhost:3000`. You have to update the frontend's API base URL to the deployed backend URL and redeploy the frontend. Two services, two URLs, both have to know about each other.

## Connection to the Exercise

Exercise 3 Part E is this video in executable form. You will configure a Render service for the backend (Docker web service, environment variables set), configure another Render service for the frontend (or keep it on Netlify and understand the tradeoff), update the frontend's API base URL to point at the deployed backend, and fix CORS by setting `CORS_ORIGIN` in the backend's environment to the frontend's origin.

By the end, you will have two live URLs, one frontend and one backend. You will send the frontend URL to the instructor and to classmates. They will search from their own machines and see results. That is how the exercise ends. Not with a passing test (though the tests will pass). Not with a merged PR (though it will merge). With a URL that works, for anyone, from anywhere.

## Connection to the Course Philosophy

Deployment is not the end of the engineering process; it is the starting line for everything that follows. Load testing, caching, observability, alerting: none of them apply to software that only runs on a laptop. The course arc that continues after Exercise 3 (chaos testing, performance tuning, on-call rotations, SLOs) all assumes the system is deployed and reachable. You cannot observe what is not running. You cannot load-test localhost. The deploy is the step that unlocks the rest of the course.

It is also the step that changes how you think about your own code. Software on your laptop is a thing you made. Software at a URL, serving real requests, is a thing you *run*. That shift in framing (from "I wrote this" to "this is operating") is one of the most important in the course. Everything downstream of it is about keeping software operating well. Everything upstream of it has been about making software that is ready to operate.

Code is behavior. Configuration is environment. Credentials, CORS, and deployment settings are not properties of the code; they are properties of where the code runs. Separating those two categories cleanly is the guardrail-first approach applied to deployment. When the code is environment-agnostic and the environment is where all the specifics live, the same code can run safely in four layers (laptop, Docker, CI, production) without change. That reusability is what makes deployment fast and reliable.

---

See also: [./02-docker-what-and-why.md](./02-docker-what-and-why.md) | [./03-openapi-contracts.md](./03-openapi-contracts.md) | [./05-ci-and-ai-feedback-loop.md](./05-ci-and-ai-feedback-loop.md)
