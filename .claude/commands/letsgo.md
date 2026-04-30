The student is starting Exercise 3. Show them the roadmap. Do not start building anything yet.

## What to show

Print this exactly, then ask which part they want to start with:

```
Exercise 3: Make It Shippable

Your backend works on localhost. Time to make it real.
Five parts, in order. Each one builds on the previous.

Part A: Describe It (OpenAPI)
  Read first: /learn 3
  Wire Swagger UI at /api-docs. Verify the contract matches contracts.ts.

Part B: Containerize It (Docker)
  Read first: /learn 2, /learn 9
  Write a Dockerfile. Add docker-compose. Health check built in.

Part C: Prove It Works (System Test)
  Read first: /learn 8
  One test file. Testcontainers + Vitest. Black-box, HTTP only.

Part D: Let Machines Prove It (CI)
  Read first: /learn 6, /learn 7, /learn 5
  GitHub Actions: lint, typecheck, system test, build. Green badge.

Part E: Let the World See It (Deploy)
  Read first: /learn 4
  Render.com. Docker web service. CORS. Live URL.

Full spec: materials/docs/exercise-spec.md
Concepts: materials/concepts/ (9 written references)
```

After printing, ask: "Which part are you starting with?"

## Rules

- Print the roadmap as-is. Do not add commentary, motivation, or encouragement.
- Do not start implementing anything. This is orientation only.
- If the student says which part, switch to implementation mode for that part.
- If the student wants to read a concept first, suggest the relevant `/learn` command.
