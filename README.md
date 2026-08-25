# Handwave

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
| Day 6–7 | Probability sims |
| Day 8–9 | LLM routing and explanation |
| Day 10–11 | Polish, record, submit |

Full plan: [`docs/PLAN.md`](docs/PLAN.md). The eleven research reports behind it,
including the fact-check corrections and the adversarial review that overrides
several of their conclusions, are indexed in
[`research/README.md`](research/README.md).

## Layout

```
src/lib/sim/types.ts        Simulator, Trace, Domain, Idealization contracts
src/lib/sim/spec.ts         Zod schemas. FIELD ORDER IS SEMANTIC — see the header
src/lib/sim/integrate.ts    Fixed-timestep velocity-Verlet, invariant checks
src/lib/sim/registry.ts     Closed sim_id -> simulator registry; runSpec()
src/lib/sim/sims/           One file per simulator, each with its own tests
src/components/SimCanvas    Two-layer Canvas 2D renderer, fixed axes
```

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # asserts every sim against its closed-form solution
npm run typecheck
npm run lint
```

`npm test` is not optional before a commit that touches `src/lib/sim`. It is
the check that caught the first real bug in this repo: a closed-form apex that
was wrong for anything launched downward.
