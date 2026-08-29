# Handwave

**Live: https://handwave-demo.vercel.app**

You ask a physics question. A simulation appears — and the Run button is locked
until you write down what you think will happen. Then it runs, your prediction
stays on screen beside the outcome, and the explanation names the place where
your rule *is* right before showing you where it breaks.

**The model never writes the physics.** It picks a hand-written, unit-tested
simulator, fills in typed parameters, and later explains the numbers that
simulator actually computed. Everything it can produce is data, validated
against a Zod schema; nothing is ever compiled or evaluated.

## Why it is built this way

Generated physics that *looks* right is worse than no physics at all. Four
executed counterexamples in [`research/11-red-team.md`](research/11-red-team.md)
pass schema, bounds, dimensional and conservation checks and still teach
falsehoods — a pendulum sim that tells a student who correctly says "the period
depends on amplitude" that they are wrong, a vacuum free-fall sim that
diagnoses "heavier things fall faster" as a misconception when in air a shot
put really does beat a baseball.

So: a closed registry of simulators we wrote and tested, explicit idealisation
toggles surfaced in the UI, a validity range on every sim, and an abstention
path for questions nothing in the registry can answer honestly.

## Status

| | |
|---|---|
| Day 1 | ✅ Scaffold, spec schema, deterministic core, projectile sim, renderer |
| Day 2 | ✅ Invariant plots, seeded PRNG |
| Day 3–4 | ✅ Four more mechanics sims — free fall, pendulum, collision, ramp |
| Day 5 | ✅ The prediction gate |
| Day 6–7 | ✅ Probability sims — Konold's coin item, law of large numbers, Monty Hall |
| Day 8–9 | ✅ LLM routing and explanation, with a grounding check |
| Day 10 | ✅ Shareable deterministic run links, prerender fix |
| Day 11 | Submission copy written — [`docs/SUBMISSION.md`](docs/SUBMISSION.md). Video and Devpost form are yours. |

**Deliberately cut:** the Galton board. The plan listed four probability sims;
three were built. The board's binomial is already on screen as the second
histogram of the coin item, so the fourth sim would have added a second view of
a distribution the app already shows rather than a fourth misconception. Eight
verified simulators is inside the 8–12 the adversarial review recommended.

Full plan: [`docs/PLAN.md`](docs/PLAN.md). The eleven research reports behind it,
including the fact-check corrections and the adversarial review that overrides
several of their conclusions, are indexed in
[`research/README.md`](research/README.md).

## Layout

```
src/lib/llm/catalog.ts      the menu, GENERATED from the registry
src/lib/llm/route.ts        LLM #1: pick a sim, fill its parameters, or refuse
src/lib/llm/explain.ts      LLM #2: explain the computed numbers + grounding check
src/lib/llm/fallback.ts     deterministic keyword router, for when there is no model
src/lib/llm/eval.ts         the routing eval set, shared by CI and the live run
src/lib/sim/types.ts        Simulator, Trace, Domain, Idealization contracts
src/lib/sim/spec.ts         Zod schemas. FIELD ORDER IS SEMANTIC — see the header
src/lib/sim/integrate.ts    Fixed-timestep velocity-Verlet, invariant checks
src/lib/sim/registry.ts     Closed sim_id -> simulator registry; runSpec()
src/lib/sim/sims/           One file per simulator, each with its own tests
src/components/SimCanvas    Two-layer Canvas 2D renderer, fixed axes
```

## The model's job, and its limits

Two model calls, and neither of them does physics.

**LLM #1 routes.** It is shown a menu generated from the registry and returns a
`sim_id` from a fixed list of eight, some numbers, and some booleans. The JSON
Schema handed to the decoder is generated from the same Zod schema that
validates the reply, so the two cannot drift. There is no field in that schema
a physical claim could be written into — which is why a prompt injection has
nothing to reach. The worst it can do is pick the wrong simulator from eight,
and all eight are hand-written and tested.

**LLM #2 explains.** It is given the numbers a tested simulator computed, the
idealisations that were in force, and the student's own words. It is never
asked what happens; it is told. Every figure in its prose is then checked
against the facts it was given, and any it cannot trace is reported on screen.
That does not make the explanation true — it makes it impossible for the
explanation to quote a number the simulation never produced.

Without `GEMINI_API_KEY` the app falls back to a deterministic keyword router
and says so. The simulations and their guarantees are identical either way;
only the quality of the match degrades.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # asserts every sim against its closed-form solution
npm run typecheck
npm run lint
npm run eval:routing   # needs GEMINI_API_KEY; costs money, not in CI
```

`npm test` is not optional before a commit that touches `src/lib/sim`. It is
the check that caught the first real bug in this repo: a closed-form apex that
was wrong for anything launched downward.
