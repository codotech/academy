# The Four Building Blocks of CI

## Watch

- [What is Continuous Integration?](https://www.youtube.com/watch?v=1er2cjUq1UI) (6 min)
- [What is Continuous Delivery?](https://www.youtube.com/watch?v=2TTU5BB-k9U) (6 min)

## The Problem

You inherit a TypeScript service from someone who left the company three months ago. You open the CI workflow file. There are eight steps, plus three more inside a "build" job, plus a separate matrix that runs them again on Node 20 and Node 22. Half of it feels redundant. There is a `lint` step. There is a `typecheck` step. Then there is a `build` step that — as far as you can tell — also does typechecking. There are tests. There is something called `prettier --check`, separately from lint. You ask yourself the obvious question: what does each of these actually catch? Could you delete half of them and never notice?

You probably could, on a good day. The problem is the bad day. On the bad day, the step you deleted is the one that would have caught the regression, and you find out three weeks later in production. So the steps stay, and you accept the pipeline as folklore: a thing that runs, that someone once knew the reasons for, that you do not touch.

This video is about the four conceptual building blocks every CI pipeline is made of, no matter what stack you are on. Once you can name the four and say what each one is for, the eight-step YAML stops being folklore. It becomes a sequence you can reason about, modify, and explain to someone else.

## The Concept

### Building block one: build / compile

For a TypeScript codebase, the build step is `tsc`. It reads your `.ts` files and writes `.js` files. The runtime — Node, the browser — does not run TypeScript. It runs JavaScript. So at some point, before the code can be deployed or even tested in its real form, the compiler has to turn your source into the artifact that will actually execute.

But here is the part that surprises people coming from JavaScript: TypeScript types are *erased* at compile time. The compiled `.js` looks like the JavaScript you would have written if you had never typed anything. The types do not survive compilation. So why bother compiling, if the runtime gets stripped JavaScript anyway?

Because the compile step is where the type checker runs. The compile is two things at once: it produces the JavaScript output *and* it verifies that the types are consistent. The output is what you ship. The check is what you get for free in the same step. If the types do not check, the compile fails, no JavaScript is produced, and the rest of the pipeline does not get to run code that the type system already proved was wrong.

This is why "build" and "typecheck" feel redundant when you read a CI file. They overlap. A pipeline can run them as one step (`tsc` builds and checks together) or as two (`tsc --noEmit` for the check, then a separate build for the output). Both shapes are valid. What matters is that the type check is happening, and that the artifact you ship is built from source that passed it.

### Building block two: lint

Lint is rule enforcement on source text. It does not run your code. It reads it. ESLint, the linter most TypeScript projects use, walks the abstract syntax tree of every file and applies a set of rules: this variable is assigned but never read, that `if` block has no braces, this file imports something the team agreed not to import, that function has a side effect inside what is supposed to be a pure module.

The first reaction most people have to lint rules is that they look like style nitpicks. Some are. But lint is not really about style. It is about encoding team agreements into the toolchain. The team decided that `console.log` should not appear in production code? Lint catches it. The team decided that ramda should never be imported in this service? Lint catches it. The team has a pattern where every API handler must wrap its logic in a specific helper? Lint can catch the missing wrap.

The compiler will not catch any of these, because the compiler only knows about the language. Lint is where the team's *additional* rules live, the ones that go beyond "this is valid TypeScript" into "this is the kind of TypeScript we want." Skipping lint because "it is just style" is dropping the layer that catches the mistakes the language could not have known were mistakes.

### Building block three: static analysis

Lint and typecheck are both examples of a broader category called *static analysis*: reasoning about your code without running it. You can think of static analysis as the work the toolchain does by reading your source.

This is worth naming explicitly, because static analysis catches whole categories of bug for free. The type system tells you that a function expecting a `string` cannot be called with `string | undefined` until you handle the undefined case. The linter tells you that you imported something but never used it. A more advanced static analyzer can tell you that this `Promise` is created but never awaited, that this branch is unreachable, that this exception is thrown but never caught up the call chain. None of this requires running the program, generating test data, or thinking about edge cases. It falls out of reading the source carefully.

Static analysis is the cheapest defensive layer in your pipeline, in two senses. It is cheap to run (seconds, no environment, no data) and it is cheap to use (you do not have to write tests for it; the analyzer just tells you). When people argue that TypeScript "pays for itself," what they mean is that the static analysis you get from the type system catches enough bugs to be worth the syntax overhead. It is the highest leverage layer in CI by a wide margin.

### Building block four: runtime validation, also known as tests

Static analysis is powerful, but there are things it cannot prove. It cannot prove that your `/users` endpoint returns the user that was just created. It cannot prove that two services connected through a queue actually agree on the message format. It cannot prove that your retry logic recovers from a transient network failure. The only way to verify behaviors like these is to *run* the code and observe what happens. That is what tests are.

The four-block taxonomy is sometimes drawn as two halves: static (analysis without running, including build and lint) and dynamic (validation by running, also known as tests). Both halves are necessary. Static analysis is cheaper but blind to behavior. Tests are more expensive but see things static cannot. A pipeline that has only static analysis will ship code that compiles cleanly and breaks at runtime. A pipeline that has only tests will spend ten times the budget catching bugs that a type checker could have caught in milliseconds. You want both, in the right order.

## How It Works

A well-ordered CI pipeline runs the four blocks from cheapest to most expensive, so failures surface as fast as possible.

Lint runs first, in five to fifteen seconds. It needs no environment, no dependencies installed beyond the linter itself. If lint fails, the pipeline stops. There is no point typechecking code that is going to be reformatted anyway.

Typecheck (or build with type checking, depending on how the pipeline is structured) runs next, in fifteen to forty seconds for a service of moderate size. Same idea: cheap, no runtime, fail fast. If types do not check, no point running tests against broken types.

Tests run after the static layers pass. Tests need a running environment: a Node process at minimum, sometimes containers, databases, real HTTP. They take a minute or several. They are the most expensive step, so they run last.

Build (the artifact-producing variant) runs at the end if the pipeline is producing a deployable artifact. By the time you are building the production artifact, you already know lint passes, types check, tests pass. You are committing CPU time to producing the thing that will ship, and you only do that when everything upstream is green.

The order is not aesthetic. It is economic. Each step is more expensive than the one before it, and each step blocks the next. The total expected time of the pipeline is dominated by how often you fail at each stage, multiplied by the cost of that stage. Cheapest checks first means the average pipeline takes the least time.

## Common Mistakes

**Skipping lint because "it is just style."** Lint encodes team rules. Style is one type of rule, but it is far from the only one. Disabling lint means you have decided the team's rules do not need enforcement. That is a decision worth making consciously, not a default to drift into.

**Putting tests before lint and typecheck.** A pipeline that runs the slow step first wastes minutes on every failed run. The signal you want comes from the cheap steps. Order them in front so failure surfaces in seconds, not minutes.

**Treating compile output as the artifact.** The `dist/` folder a TypeScript compile produces is an *intermediate*. It is what gets bundled into the real artifact (a Docker image for backend, a static bundle for frontend). Confusing the intermediate with the artifact leads to deployment shapes that ship loose JavaScript files instead of the sealed thing CI tested.

**Conflating typecheck with test.** "We have TypeScript, we do not need many tests." TypeScript proves structural correctness — the right shapes flow through the right functions. It cannot prove behavior. A function with the right types can still return the wrong value. Both layers are needed, because they catch different things.

**Adding lint rules without removing folklore.** Pipelines accrete steps over years. New rules get added, old ones rarely get removed. Once a year, read the pipeline file and ask which rules still earn their place. Folklore in a pipeline is just slow CI nobody trusts.

## Connection to the Course

In Codo, the building blocks show up exactly in this order in the reference pipeline. Lint, typecheck, system tests, build. Each one earns its place. The point of working inside this pipeline as a student is not to memorize the YAML; it is to internalize what each block does, so that when you see a CI failure you know which block flagged it and what category of bug that block catches. The blocks are mental tools, not pipeline configuration.

## Connection to the LLM Era

When AI generates a function for you, the most valuable thing the toolchain can do is read that function before you do. Static analysis runs in seconds and catches the structural mistakes — wrong types, unused imports, banned patterns — at the moment of generation, not in code review hours later. Tests catch the behavioral mistakes that static analysis cannot see. Without these layers, AI-generated code goes straight from prompt to production with only your eyes between. With them, the toolchain reads first, you read second, and the categories of bug each layer catches are well-understood. The four blocks are how you trust generated code without reading every line.

---

See also: [./06-why-ci-exists.md](./06-why-ci-exists.md) | [./08-test-taxonomy.md](./08-test-taxonomy.md) | [./09-artifacts-and-versioning.md](./09-artifacts-and-versioning.md) | [./05-ci-and-ai-feedback-loop.md](./05-ci-and-ai-feedback-loop.md)
