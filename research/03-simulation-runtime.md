# Simulation Runtime & Rendering — key findings

**Headline: do not use a physics engine. Do not generate code. Do not adopt an existing DSL.**

Build a small deterministic interpreter over a JSON sim-spec: mechanics = explicit ODE integrator with fixed timestep; probability = seeded Monte Carlo. Render to Canvas 2D with React/DOM chrome.

---

## 🟢 The empirical result that validates our core mechanic

**delMas, Garfield & Chance (1999), *Journal of Statistics Education* 7(3)** — https://jse.amstat.org/v7n3/delmas.cfm

Same sampling-distribution software, two conditions:

| Condition | Posttest correct |
|---|---|
| Guided discovery (free exploration of the sim) | **16%** |
| **Predict-then-test** (commit a prediction, *then* run) | **36%** |

Their conclusion, verbatim: ***"computer simulations alone do not guarantee conceptual change."***

→ **This is the most important sentence in the research so far.** A beautiful simulation the learner watches is not an intervention. `prediction` must be a **structurally required node** in any spec whose answer is counterintuitive: the learner commits *before* Run unlocks, and the prediction persists on screen as a ghost marker for the whole run.

→ Note also how low 36% is. **Calibrate demo claims accordingly.** Don't over-promise.

---

## Copy Bret Victor's Ladder of Abstraction — highest impact-per-effort in the plan

https://worrydream.com/LadderOfAbstraction/

| Rung | Shows | Visualization |
|---|---|---|
| 0 | One concrete run | Live animated sim |
| 1 | Abstracting over **time** | Whole trajectory as one static image |
| 1.5 | Stepping back down | Trajectory + scrubbable position |
| 2 | Abstracting over a **parameter** | Overlaid trajectories, derived metrics |
| 3 | Abstracting over **all** variables | Parameter-space plot colour-coded by outcome |

→ **Every mechanics sim ships three views from the same spec: the live sim, the trace (whole trajectory + scrubber), the sweep (quantity across a parameter range).** Nearly free once the model is a pure function of `(params, t)`. **One slider drag redraws rung 3 — the single best demo-video beat available.**

Also steal **Tangle**'s inline drag-scrubbable numbers inside prose (worrydream.com/Tangle). Borrow the interaction, not the 2011 unmaintained code.

Victor's 2024 postscript rebukes the field for diluting "explorable explanation" into *"any article with interactive pictures."* A forced prediction is the anti-decoration move.

---

## 2026 literature: our architecture is the one the field converged on

**"Bridging Natural Language and Interactive What-If Interfaces via LLM-Generated Declarative Specification"** — arXiv 2604.07652 (8 Apr 2026). Intermediate spec language between NL and rendered interface. Across 405 questions:

> **52.42% of specs generated correctly with no intervention; targeted repair raised it to 80.42%.**

→ **This number should shape the engineering plan. Roughly half of raw LLM specs will be wrong. Budget a validate-and-repair loop from day one — it is not polish.**

**"Evaluating Interactivity: Toward Automated Assessment of AI-Generated Explorable Explanations"** — arXiv 2606.31012 (30 Jun 2026). Models interactivity as *"a finite space of learner-controllable states and transitions, represented as a Finite State Machine."*
→ Our spec's control surface **is** an FSM. Makes a free validity check: is every state reachable? Does any control do nothing?

---

## ⚖️ PhET licensing — the surprising and consequential finding

Verified directly from LICENSE files:

| Repo | License |
|---|---|
| phetsims/**scenery** | **MIT** © University of Colorado Boulder |
| phetsims/**axon** | **MIT** |
| phetsims/**projectile-motion** | **GPL-3.0** |
| phetsims/**plinko-probability** | **GPL-3.0** |

**Common libraries are MIT; individual simulations are GPL-3.0.**
- ✅ May use scenery/axon/dot/kite as MIT deps in a commercial product
- ❌ May **not** copy code out of a PhET sim repo without GPL obligations attaching
- ⚠️ **PhET trademark and embed/iframe terms NOT verified** — phet.colorado.edu/en/licensing returned only nav chrome. **Get a human to read it before embedding any PhET sim in a commercial demo.**

**Verdict: borrow the pattern, not the stack.** Use `@preact/signals-core` (MIT, ~3KB) for the same `Property`/`DerivedProperty` reactive model instead of adopting scenery. Revisit PhET's accessibility work at the 6-month mark — it is genuinely the best in the field.

**Steal PhET's control vocabulary:** reset-all, play/pause/step cluster, overlay checkboxes (velocity vectors, force arrows, energy bars), draggable measuring tools. Battle-tested across hundreds of sims; maps directly onto our `controls` node.

---

## Why NOT a physics engine

Box2D-lineage engines (matter.js, planck.js) use **sequential impulses** — an iterative solver tuned for *plausible, stable, fast*, not *correct*.

> If a student sets drag to zero and asks "what's the range?", the closed form is `v₀²sin(2θ)/g`. **An engine gives a number a few percent off and you cannot explain why.** Our core loop is "compare predicted vs actual numerically." An engine puts an unexplainable error term in the middle of the value proposition.

An ODE model lets us display the closed form *and* the integrated answer and show they agree to 6 digits — a far better demo than a plausible bounce.

**If we ever need contacts/stacking: Rapier** (Apache-2.0). Only engine with a real determinism story: *"the same simulation… on two different machines (even with different browsers, operating systems, and processors) will give the exact same results."* Verifiable via `world.createSnapshot()` + MD5.

⚠️ Rapier's own caveat: *"transcendental functions like `Math.sin, Math.cos` are not cross-platform deterministic."* Even with a deterministic engine, the moment our init code calls `Math.cos(theta)` bit-identity is gone.

⚠️ **Discard all engine benchmark numbers found via search** ("2–5× faster", "fastest in browser mid-2026") — traced only to SEO content farms.

---

## Integrator choice

Glenn Fiedler, https://gafferongames.com/post/integration_basics/ :
- **Explicit Euler**: *gains* energy, diverges. Never use.
- **Semi-implicit Euler**: symplectic, bounded energy error, no secular drift. Fiedler's recommendation.
- **RK4**: 4th-order but **not symplectic** — holds frequency, *loses energy over time*. Wrong tool for Hamiltonian systems.

**Our recommendation — more opinionated than Fiedler:**
- **Default: velocity Verlet.** Symplectic *and* 2nd-order in position, ~same cost. For a product selling an on-screen conserved-energy readout that visibly stays flat, this is the sweet spot. Semi-implicit Euler's phase drift is *visible* on a pendulum over 60s.
- **RK4 as a spec option** for non-conservative systems (RC circuits, population models) where there's no energy to conserve.
- **Semi-implicit Euler as a "watch a bad integrator fail" mode** — an integrator picker with a live energy plot *is itself an excellent sim*, free once you've written three.

**Always use the fixed-timestep accumulator** (https://gafferongames.com/post/fix_your_timestep/), capped to avoid the *spiral of death*.

→ **Design rule: simulation time advances only in integer counts of `dt`.** Wall clock decides *how many* steps, never enters state. A 60 Hz laptop and a 144 Hz monitor produce byte-identical trajectories; scrubbing to step N is exact; demo recordings replay perfectly.

→ **Give every mechanics sim an `invariants` block** — energy, momentum, angular momentum, computed each step and plotted. Cheapest thing that makes Handwave look like a scientific instrument rather than a game, and it doubles as a regression test.

---

## Probability

### Natural frequencies — best-evidenced design rule available
Gigerenzer & Hoffrage (1995), *Psych Review* 102(4). ⚠️ *Citation verified; exact percentages NOT retrieved — do not quote numbers.*

**Rule: every probability gets a frequency twin.** Not "P = 0.078" but "of 1,000 people, 100 test positive, 8 actually have it" — rendered as nested icons. **Area/grid diagrams beat probability trees**, because a tree renormalizes at each branch and destroys the nested-set structure that makes frequency formats work.

### Simulation-based inference: real but narrow
Cobb (2007) gives the best name for the inference primitive: ***"Randomize, repeat, reject."***

Tintle et al. (2011), *JSE* 19(1) — the honest audit. Aggregate CAOS gains were **a wash** (11.0 vs 8.9/9.1, p=0.093). **But inference items moved hugely:** interpreting a *lack* of significance +17.8 points where traditional cohorts gained nothing. One item got *worse*.

→ **Don't market "simulations teach better." Market: *simulations make the logic of inference visible, and that specific thing transfers.*** That's the defensible claim.

### Ship these six first
1. **Galton board** — cheapest, most legible, the 5-second establishing shot
2. **LLN + streak inspector** — "after every run of 5 heads, the next was heads 50.1% of the time." Targets gambler's fallacy, which instruction alone provably doesn't fix
3. **Sampling distribution / CLT triple-panel** — hardest to build, most important, and delMas proves it *requires* the prediction gate
4. **Monty Hall with an N-doors slider and an "ignorant host" toggle** — repetition alone provably fails; the N-slider is the manipulation with evidential support, and the ignorant-host toggle isolates the causal variable (almost nobody implements it)
5. **Bayes as a natural-frequency area diagram** — 1,000 draggable icons. Best-evidenced design here, and **has no time dimension at all**, which usefully proves the runtime isn't just an animation engine
6. **Permutation test** — Cobb's three Rs rendered literally. *One* parameterized sim covers t-test, correlation, chi-square, and A/B testing. Highest leverage per unit build cost

*v2:* hot hand / Miller–Sanjurjo (the sim refutes a famous paper), bootstrap CIs. *Skip:* birthday problem — it's a fact, not a mechanism.

### RNG stack
**sfc32 + xmur3**, vendored (~15 lines), from https://github.com/bryc/code/blob/master/jshash/PRNGs.md — passes PractRand and TestU01 BigCrush.

❌ **Do not ship mulberry32** despite being the most copy-pasted seeded PRNG on the internet — bryc documents it *"appears to skip a third of all 32-bit values"* and its author has disowned it. ❌ Skip xoshiro128** (weak low bits). ❌ Skip `seedrandom` — frozen since Sept 2019, CJS-only, no types, slower than 15 lines you control.

**Distributions: `d3-random`** (ISC, zero deps) with our PRNG injected: `d3.randomNormal.source(myPrng)(mu, sigma)`. 17 distributions.

🔴 **Stream splitting will bite in week 3.** Derive independent streams by hashing and enforce separation in the validator:
```ts
const rngTrials = streamFor(seed, "sim.trials");    // statistical — SACRED
const rngVisual = streamFor(seed, "render.jitter"); // cosmetic only
```
Otherwise a designer adding dot-jitter silently changes statistical results and the demo recording stops replaying.

Use **Welford's algorithm** for running mean/variance — at 100k+ samples naive sum-of-squares genuinely loses precision, and precision to 3 decimals is the whole predicted-vs-actual pitch.

---

## Rendering: Canvas 2D, and it isn't close

**Horak, Kister & Dachselt (2018)** — https://imld.de/cnt/uploads/Horak-2018-Graph-Performance.pdf

> *"SVG and Canvas almost perform on par, with performance drops starting at around 10,000 graphical elements, while WebGL performs slightly better when showing text elements."*

And the surprise: *"This is interesting, as it is often assumed that Canvas is faster than SVG… there is no advantage regarding FPS."*

⚠️ 2018 hardware — treat ~10k as an order of magnitude. Also note their SVG numbers involve pan/zoom on a *static* scene; **per-frame attribute mutation on thousands of SVG nodes is far worse**, and that's exactly what an animated Monte Carlo does.

**Two stacked Canvas 2D layers:**
- **Static** — axes, gridlines, theory curve, prediction ghost. `getContext("2d", { alpha: false })`. Redraw only on resize/param change.
- **Dynamic** — particles, histogram bars, moving body. Per frame.
- **React/DOM chrome** — sliders, labels, readouts, transport. Never canvas-drawn: real focus management, keyboard support, and screen-reader semantics for free.

Per MDN canvas optimization: scale by `devicePixelRatio` (**mandatory for a crisp recording**), `Math.floor()` coordinates, pre-render sprites, `fillRect` beats `arc()` for ≤3px dots, batch and sort by `fillStyle`, **avoid `shadowBlur`**, `requestAnimationFrame` never `setInterval`.

❌ **Skip WebGPU** — MDN: *"not Baseline because it does not work in some of the most widely-used browsers."* Disqualifying for a demo that must run anywhere.
❌ **Skip WebGL** — unnecessary below ~100k marks, and its text rendering is the exact weakness Horak identified while our sims are label-heavy.

---

## DSL: build our own, steal the ergonomics

### Penrose — assessed seriously, answer is no
MIT, ~8k★, active. Domain/Substance/Style, compiles to constrained optimization.
**Structurally wrong tool: Penrose's runtime loop is an optimizer searching for a good static layout. Ours is an integrator advancing state through time.** No timestep, no conserved quantity, no seeded draw, no transport controls. Its solver's whole point is *you don't control where things end up* — the opposite of what a projectile sim needs.
→ **Right fit for v2 static explanatory diagrams** (free-body, Venn, geometric constructions).

### Vega-Lite — steal the design, not the grammar
Its `params` system is the closest existing thing to our control layer. But it's a **view** grammar — no seed, no ODE integration, no time-stepping. Cannot express "integrate these three coupled ODEs at dt=0.002 and stop when y crosses zero."

→ **Copy three properties** (they're why LLMs are good at emitting Vega-Lite): (1) every field has a sensible default so a minimal spec still renders; (2) transforms are an ordered composable array; (3) params/selections are named first-class objects referenced by name.

### Others
- **Modelica** — right *semantics* (acausal component connection, declare equations not update rules) but no browser runtime and symbolic DAE index reduction is research-grade. **Steal one idea: acausal connectors.** "A spring connects to a mass" beats "write the spring's force term" for LLM generation because it removes a whole class of sign errors. 6-month goal.
- **Manim** — Python, renders to *video files*. Not a runtime. Steal visual vocabulary only.
- **Mermaid / SBML** — not applicable.

**Verdict: invent our own DSL that looks like Vega-Lite's ergonomics wrapped around Modelica's semantics.** No existing language covers both "integrate this ODE" and "run this seeded Monte Carlo."

---

## Sandboxing — our architecture already wins

| Threat | Eliminated by a declarative spec? |
|---|---|
| Data exfiltration via `fetch` | ✅ no network verb exists |
| Cookie / localStorage theft | ✅ no storage access exists |
| DOM manipulation, clickjacking | ✅ spec names views, never gets a DOM handle |
| Cryptomining | ✅ bounded step counts |
| Infinite loop / RAF starvation | ⚠️ **must** bound `maxSteps`, `maxTrials`, recursion depth |
| Memory exhaustion | ⚠️ **must** cap array/particle/trial counts in the validator |
| Nonsense physics | ❌ not security, but the real quality risk (52% figure above) |

**11-day posture: never `eval`, never `new Function`, never `dangerouslySetInnerHTML`. Zod at the boundary. Hand-write a ~200-line AST interpreter for the expression sub-language with a whitelisted function table, recursion cap, and step budget.** Genuinely sufficient; costs a day.

❌ **Do not use mathjs for untrusted expressions.** Its own security page: *"It's possible though that there are unknown security vulnerabilities, so it's important to be careful"* and flags 8 functions needing disabling. **That is a library telling you it is not a security boundary.**

### If we ever run real code — learn from Figma
Three attempts, documented at https://www.figma.com/blog/how-we-built-the-figma-plugin-system/ :
1. Null-origin iframe + postMessage — killed by ergonomics and *"14 seconds just to serialize the document"*
2. Duktape in WASM — secure but ES5-only, no devtools
3. Realms shim + membrane — shipped, then **broken**: sharing one VM let an attacker *"confuse an object from outside the sandbox with an object from inside."*

They migrated to **QuickJS in WASM**, accepting it is *"somewhat slower… but intrinsically more secure."*

> **Lesson: same-VM JavaScript sandboxes are a losing game. If you must run untrusted JS, run it in a different VM.** (`quickjs-emscripten`, ~500KB–1MB.)

⚠️ **ShadowRealm is Stage 2.7, not shippable in 2026, and the proposal does not characterize it as a security boundary.**
⚠️ **iframe `sandbox`**: MDN — combining `allow-scripts` with `allow-same-origin` *"lets the embedded document remove the sandbox attribute — making it no more secure than not using the sandbox attribute at all."*

---

## Beauty & legibility

### Tversky: animation usually does NOT help — and that's good news for us
**Tversky, Morrison & Bétrancourt (2002), *IJHCS* 57(4):247–262**, verbatim:

> *"In cases where animated graphics seem superior to static ones, scrutiny reveals lack of equivalence between animated and static graphics in content or procedures; **the animated graphics convey more information or involve interactivity**."*

Two principles: **Congruence** (format should correspond to the concept's structure) and **Apprehension** (graphics must be accurately perceived — *"animations are often too complex or too fast"*).

→ **Read that "lack of equivalence" clause carefully — it's a gift.** Handwave *is* the more-information-and-interactivity condition. We're not making the claim she debunked. But Apprehension is a live warning against making the demo dazzling.

→ **Design rule: trial 1 is sacred.** Animate the first trial slowly enough to narrate. Trials 2–10 fast. Then batch. **Never open at full speed.**

⚠️ Höffler & Leutner (2007) meta-analysis, d=0.37 (CI 0.25–0.49), moderators 0.40 representational / 0.76 realistic / 1.06 procedural-motor — **consistent across secondary sources but primary abstract not retrieved; verify before publishing.** The actionable part is the moderator pattern: **representational animation earns its keep; decorative animation does not.**

### Heer & Robertson (2007), *IEEE TVCG* 13(6) — animated transitions
https://idl.cs.washington.edu/files/2007-AnimatedTransitions-InfoVis.pdf

Guidelines: maintain valid data graphics during transitions · consistent semantic-syntactic mappings · *"marks representing specific data points should not be reused to depict different data points"* · group similar transitions · minimize occlusion · slow-in slow-out · *"translation and divergence motions are easier to understand than rotation"* · stage complex transitions · as long as needed but no longer.

**Durations: ~1s per stage** (they revised up from 0.5s).

**Two findings that save us from mistakes:**
- **Over-staging backfires.** Multi-stage transitions *"resulted in increased error"*, and *"most subjects laughed upon first viewing the multi-staged stacked bars transition."*
- 🔴 **Axis rescaling is the enemy.** *"Axis rescaling made change estimation difficult."*

→ **Rule: fix the axes.** Compute a fixed domain across the whole parameter range **at spec-validation time** and hold it. When a slider moves and the plot autoscales, you've made the comparison harder. **This single rule makes Handwave feel dramatically more solid than most generated visualizations.**

### Craft checklist for the recorded demo
- Scale canvas by `devicePixelRatio`; `Math.floor` coords; `alpha: false`
- Respect `prefers-reduced-motion` — **replace**, don't remove: swap scaling/panning for opacity. MDN: *"animations involving scaling or panning large objects are particularly problematic vestibular motion triggers."*
- **Okabe–Ito colourblind-safe palette** (https://jfly.uni-koeln.de/color/): vermilion not pure red, bluish-green, reddish-purple not violet; **magenta/green instead of red/green**. Their rule 2: redundant encoding — *"not only different colors but also… different shapes, positions, line types."*
- **`font-variant-numeric: tabular-nums` on every live readout.** Numbers must not jitter while a slider is dragged. Cheapest possible polish; its absence reads as amateur on video.
- Direct-label series; kill legends (Tufte)
- **Show the seed in the UI** — reproducibility as a visible claim, cheap credibility on video

⚠️ Video-codec folklore (thin lines dithering under H.264, avoiding pure #000/#FFF) — **no authoritative source found.** Safe defensible version: larger marks, higher contrast, flat fills, capture at native frame rate.

---

## Recommended architecture

```
AUTHORING:  LLM ──► sim-spec JSON ──► Zod validate ──► REPAIR LOOP
                                            │
                        (~50% of raw specs fail — arXiv 2604.07652.
                         Feed validator error back, retry. Budget for it.)

RUNTIME (pure TS, zero DOM, zero deps):
  ExpressionInterpreter  ~200 LOC AST walker, whitelisted fns, depth+step budgets
                         NEVER eval / new Function
  RNG                    sfc32 + xmur3; streamFor(seed, path)
                           sim.*    = statistical (SACRED)
                           render.* = cosmetic only
  MechanicsCore          fixed-dt accumulator; velocity-Verlet | semi-implicit | RK4
                         event detection w/ bisection; invariants each step
                         state(n) is a PURE fn of (params, seed, n)
  MonteCarloCore         runOneTrial pure; Uint32Array histograms; Welford
                         ~8ms/frame budget, clock checked every 64 trials
  Store                  @preact/signals-core (the axon pattern in 3KB)
        │ throttled ~10Hz              │ per-frame
        ▼                              ▼
  REACT CHROME                   CANVAS 2D (two layers)
  sliders, transport,            static:  axes, gridlines, theory curve,
  readouts (tabular-nums),                PREDICTION GHOST
  prediction gate, seed,         dynamic: bodies, particles, bars
  real a11y for free             dpr-scaled, alpha:false
```

### Five load-bearing invariants
1. **Simulation time is an integer step count.** Wall clock decides only *how many* steps.
2. **`state(n)` is a pure function of `(params, seed, n)`.** Scrubbing backward is recomputation, not undo.
3. **Zero `setState` per frame.** Animation state in refs; chrome subscribes to a throttled snapshot via `useSyncExternalStore`. **Cancel rAF in effect cleanup** — React StrictMode double-invokes in dev and the sim silently runs at 2×.
4. **Statistical and cosmetic randomness never share a stream.** Enforced in the validator.
5. **Axes fixed at validation time** across the full declared parameter range.

---

## Build vs borrow

| Component | Call |
|---|---|
| Sim-spec DSL | **BUILD** — no existing language covers ODE-stepping *and* seeded Monte Carlo |
| Spec validation | **BORROW — Zod** (its error messages feed the repair loop; that's the actual need) |
| Expression evaluator | **BUILD ~200 LOC** — mathjs tells you itself it isn't a security boundary |
| Reactive state | **BORROW — `@preact/signals-core`** (MIT) |
| Physics engine | **BUILD (none)** — Rapier (Apache-2.0) is the v2 answer *if* we need contacts |
| Integrators | **BUILD ~80 LOC for all three** |
| Seeded PRNG | **BUILD — vendor sfc32 + xmur3 (~15 LOC)**. Not mulberry32 |
| Distributions | **BORROW — `d3-random`** (ISC), `.source()` is the exact injection seam |
| Density curves | **BORROW — `jstat`** (MIT) pdf/cdf/inv **only**; never its `.sample()` (no seed hook) |
| Renderer | **BUILD on raw Canvas 2D** |
| Static side panels | **BORROW — Observable Plot** (ISC), optional |
| PhET scenery | **BORROW ideas only** — adopting it in 11 days means learning PhET's world |
| PhET sim code | 🚫 **OFF LIMITS — GPL-3.0** |
| Seeing Theory | 🚫 **OFF LIMITS** — repo's Apache file is the Bootstrap template's; README says no commercial use |
| Penrose | **DEFER to v2** |
| CSP | **BORROW — Next.js nonce recipe** (note: forces dynamic rendering) |

---

## 11-day plan

| Days | Work |
|---|---|
| 1–2 | **Spine.** Zod schema, expression AST interpreter with budgets, sfc32+xmur3 + stream derivation, signals store, fixed-timestep accumulator. **Ship one hardcoded sim end-to-end before touching the LLM.** |
| 3–4 | **Mechanics core.** Three integrators, event detection w/ bisection, invariants + energy plot, `analytic`/`compareTo`. Canvas renderer: two layers, dpr scaling, `scene` + `trace`. |
| 5 | **Ladder of Abstraction — the `sweep` view.** Highest impact-per-effort in the whole plan. |
| 6–7 | **Probability core.** MC loop w/ frame budgeting, Uint32Array histograms, Welford. Views: running-estimate, histogram, icon-array. Four sims: Galton, LLN+streaks, Monty Hall, Bayes icons. |
| 8 | **The prediction gate.** Input, ghost persistence, predicted-vs-actual readout. **Do not cut. It is the product, not a feature.** |
| 9 | **LLM authoring + repair loop.** Assume ~50% first-pass. Budget the whole day. |
| 10 | **Polish for camera.** Okabe–Ito, tabular-nums, direct labels, 1s slow-in/slow-out, fixed axes, reduced-motion, dark/light, visible seed, `?seed=&autoplay=1`. |
| 11 | Record, fix, buffer. |

**Cut:** physics engine, rigid-body contacts, 3D, WebGL, Workers, OffscreenCanvas, code execution, PhET integration, Penrose, collaboration, mobile layouts.

**Ship 6 sims done properly, not 15 thin ones** — each exercising a *different* runtime primitive so the demo proves generality: continuous ODE, event/collision, parameter sweep, streaming Bernoulli, nested sampling, and a static area-partition with **no time dimension at all**.

## 6-month version
Acausal component model (Modelica's idea — kills a whole class of LLM sign errors) · Rapier as opt-in `rigid-body` mode · PhET-grade accessibility + sonification · adaptive/higher-order symplectic integration · Penrose for static diagrams · spec repair as a real system with automatic **dimensional analysis** (the most common and most catchable LLM physics error) · FSM interactivity audit as a CI gate · **author mode** (fork a generated sim, edit, share — the refined-spec corpus is the moat) · WebGPU tier when Baseline · **run delMas's own comparison on our own product and publish it.**

---

## Uncertainty register
- **PhET trademark and embed terms** — not verified, get a human to read them
- PhET-iO licensing and whether it exposes a usable external API
- `@dimforge/rapier2d-deterministic` npm packages — claimed by search, **not on Rapier's official page**
- Höffler & Leutner effect sizes — secondary sources only
- Gigerenzer & Hoffrage exact percentages — citation verified, numbers not
- mathjs CVE numbers — **don't cite any**
- Idyll last-commit date; p2.js license type
- Video-codec advice — production folklore, unverified
- **All engine benchmarks found via search — discard**
