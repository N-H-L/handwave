# Handwave — build plan

Written 25 Aug 2026, after eleven research agents and an adversarial review. Deadline: **5 Sep 2026, 5:00pm PDT** (11 days).

---

## 1. What the research changed

The original idea was: *an LLM generates a runnable simulation of whatever confuses you, you commit a prediction, and it diagnoses your wrong belief.*

Three of those four parts did not survive.

| Original claim | What the research says |
|---|---|
| "AI generates the simulation on demand" | **Commoditized.** Google shipped generated simulations into Search (Gemini 3, Nov 2025). Claude Artifacts: 500M+ created. Their demo example is a pendulum. |
| "The prediction gate is our moat" | **The gate works — and is not ours.** Pivot Interactives has had prediction-gating since Jan 2021. ⚠️ *verify first-party* |
| "Misconception diagnosis is the defensible layer" | **Past the interaction plateau.** VanLehn 2011 Table 1: answer→step granularity **+0.45**; step→substep **+0.16**; substep→human tutor **−0.12**. Fine-grained diagnosis lives where returns go to zero and then negative. |
| "A verification harness makes generated physics safe" | **Necessary, nowhere near sufficient.** Four executed counterexamples pass schema + bounds + dimensional + conservation + outcome checks and still teach falsehoods. |

**The one thing that survived every attack:** Crouch, Fagen, Callan & Mazur (2004) — **passive demo observers learn nothing over students who never saw the demo; predictors show significantly greater understanding.** Plus delMas, Garfield & Chance (1999), verified verbatim: prediction-and-confront **16% → 72%**, guided discovery **22% → 49%**.

> **The prediction gate is real pedagogy. The generator is a commodity. The diagnosis is oversold. Build accordingly.**

---

## 2. The architecture that resolves the tension

The adversarial review says: hand-author the sims, drop the generation, drop the diagnosis. That is right about reliability and **wrong for this hackathon**, because *Creative Use of AI/ML* is 25 of 100 points and explicitly asks for AI *"core to the functionality, not an afterthought."* A hand-authored sim library with a prediction gate has no AI in the core loop.

**The resolution: the LLM never invents physics. It routes, parameterizes, and explains — grounded in what the verified simulator actually computed.**

```
student question (free text)
   │
   ▼
[LLM #1]  ROUTE + PARAMETERIZE          ← AI is visible here
   │      picks 1 of N verified sims,
   │      sets parameters, emits an
   │      intent key. Refuses if no
   │      sim fits.
   ▼
[DETERMINISTIC]  hand-written, unit-tested simulator
   │             runs headless first; invariants asserted
   ▼
PREDICTION GATE  ← the product. Run button locked until committed.
   │             free text + a numeric/directional commitment
   ▼
[DETERMINISTIC]  sim runs; prediction stays on screen as a ghost
   │
   ▼
[LLM #2]  EXPLAIN                        ← AI is visible here
          given: the student's own words + the ACTUAL computed
          numbers + the sim's idealization flags.
          Output: causal mechanism, ~80%; contrast, ~20%.
          Names where the student's rule IS correct.
```

**Why this survives the counterexamples.** The LLM cannot emit a wrong period equation because it never emits equations. It selects from simulators we wrote and tested. Its explanation is conditioned on numbers the simulator produced, not on its own physics reasoning — which is the failure mode every benchmark documents.

**Precedent:** the FEniCS natural-language interface (arXiv 2606.10928) — NL → structured JSON → validation → deterministic dispatcher → **five human-authored templates**, LLM *"never writes the solver core."* First-pass valid parses 9/15 → **100% final**.

---

## 3. Design rules that are non-negotiable

Each traces to a specific finding. Violating any of them makes the product actively harmful.

1. **Idealization toggles, surfaced in the UI.** Air resistance on/off. Small-angle on/off. *Counterexample: a vacuum free-fall sim diagnoses "heavier things fall faster" as a misconception — but in air a shot put beats a baseball by 18.8 ms. The belief is true in the student's world.*
2. **Never diagnose a belief that is true under conditions the student inhabits.** Every sim carries a validity range; the explainer receives it.
3. **The prediction stays on screen beside the outcome.** Kendeou's KReC: coactivation of the old belief and the new information is the *necessary condition* for revision. Navigating away breaks it.
4. **~80% causal mechanism, ~20% contrast.** Kendeou Exp. 3: *"the explanation alone was as effective as the refutation-plus-explanation."* Saying "you were wrong" is not what works.
5. **Attack the rule, validate where it works, never the person.** *"Your rule is right for X — here's why it breaks for Y."* Both knowledge-in-pieces and warm-conceptual-change converge here.
6. **Fixed axes.** Compute domains at validation time and hold them. Heer & Robertson: *"axis rescaling made change estimation difficult."*
7. **Trial 1 is sacred.** Animate the first run slowly enough to narrate; then fast; then batch. Tversky's Apprehension Principle.
8. **Probability: diagnose from the rationale, never outcome-match.** A gambler's-fallacy student who predicts "tails is due" and sees tails has been *rewarded* by the sim. Default n ≥ 1,000; show the distribution, not the trajectory.
9. **Abstention is a first-class output.** "I can't build a simulation I'm confident in for that — try one of these." A graceful decline is a credibility win; a wrong physics demo is unrecoverable.
10. **Never `eval`. Never execute generated code.** The spec is data; the renderer is ours.
11. **Kill the "trust the simulation" copy.** Per *Garcia*, that framing is a **design choice**, not protected expression; per *Winter*, it voluntarily assumes a duty. Replace with *"here's what the model predicts — check it against what you already know."*

---

## 4. The 11-day build

| Day | Build | Done when |
|---|---|---|
| **1** | Next.js + Tailwind scaffold, deployed to Vercel on day one. Sim-spec **Zod** schema with render-order field ordering. One hardcoded sim end-to-end, no LLM. | A projectile renders from a spec object |
| **2** | Deterministic core: fixed-timestep accumulator, **velocity-Verlet**, invariants block (energy/momentum) computed and plotted. Seeded PRNG (**sfc32 + xmur3**, vendored — not mulberry32). | Energy trace is visibly flat with drag off |
| **3–4** | **Five mechanics sims, hand-written and unit-tested**, each with idealization toggles and a `validity_range`: free fall (air on/off) · projectile · pendulum (small-angle on/off) · collision (elastic/inelastic) · inclined plane. Headless invariant assertions in CI. | `npm test` asserts each sim against its closed-form solution |
| **5** | **The prediction gate.** Free text + a directional/numeric commitment. Run locked until submitted. Ghost marker persists through the run. | You cannot reach the sim without committing |
| **6–7** | **Four probability sims**: Konold's two-part coin item (sim #1 — see below) · Galton board · law of large numbers with a streak inspector · Monty Hall with N-doors and an **ignorant-host toggle**. `Uint32Array` histograms, Welford running stats, n ≥ 1,000 default. | Coin item reproduces the published inconsistency |
| **8** | **LLM #1 (route + parameterize)** on `gemini-3-flash` non-reasoning, `thinking_level: minimal`, `maxOutputTokens: 2000`, `responseJsonSchema` with **`reasoning` as the first field**. Refusal path when nothing fits. | 20 phrasings of 10 questions route correctly |
| **9** | **LLM #2 (explain)**, grounded strictly in computed output + idealization flags. 80/20 mechanism/contrast. Prompt carries the PhET prose conventions. | Explanations cite actual numbers from the run |
| **10** | **Polish for camera.** Okabe–Ito palette, `tabular-nums` on every readout, direct labels, ~1s slow-in/slow-out, `prefers-reduced-motion`, keyboard operability, visible seed, `?seed=&autoplay=1`. | Recording looks like a product |
| **11** | Record, fix, submit. **Submit on day 10 if possible** — the rules page carries stale August dates and says no extensions. | Submitted |

**Cut, deliberately:** spec generation from scratch · misconception enum and classifier · event detection with bisection (the review's assessment: this is where a 4–6 week plan dies) · pgvector · multi-provider failover · auth beyond a magic link · LTI · accessibility beyond keyboard + contrast.

### Sim #1 is Konold's coin item
Two parts, same four five-flip sequences, one screen. *Which is **most** likely?* → ~70% correctly answer "all equally likely." Then *which is **least** likely?* → **over half of those same people flip.**

The multiple-choice answer was right, the belief was wrong, **and only the written justification reveals it.** That is the entire product thesis in thirty seconds, it needs no physics engine, and it is the strongest opening the demo can have.

---

## 5. The two-minute video

| Time | On screen |
|---|---|
| 0:00–0:12 | One named person, one specific problem. No logo, no title card. |
| 0:12–0:25 | **Konold's coin item.** You answer "equally likely." You're right. Then the second question, and you flip. |
| 0:25–1:20 | One continuous walkthrough: type a question → sim appears → **commit a prediction before you can run it** → prediction sits beside the outcome → explanation names where your rule *is* correct. Say "Gemini," "Next.js," "Vercel" out loud. |
| 1:20–1:40 | Point at the mechanism: *"the model never writes the physics — it picks from simulators we verified, and every one asserts conservation of energy before it renders."* Show the CI output. |
| 1:40–1:55 | Who it's for. Live URL on screen. |
| 1:55 | Stop. Verify the exported file is under 2:00. |

**Golden-path it.** Every question you plan to type must be in the routing eval at 5/5. Audience questions go through the same path, and a failed route shows the honest refusal.

---

## 6. Model provider

**For the hackathon: Gemini free tier is acceptable** — synthetic content, adult judges, no real students, nothing retained. Set the four adjustable safety thresholds **explicitly**; they default to **Off** on 2.5/3.

**For anything beyond the hackathon it is not.** Google Cloud Service Specific Terms §20(d) and the Gemini API terms **both** prohibit use in a service *"directed towards or is likely to be accessed by individuals under the age of 18."* **Vertex does not fix this** — it drops the developer-age clause, not the audience prohibition. Anthropic (published minors checklist), OpenAI (permitted with parental consent), or Bedrock are the paths. Also: the free tier trains on submitted data and *"human reviewers may read, annotate, and process your API input and output."*

---

## 7. After the hackathon — the decision gates

The adversarial review's verdict is **build the demo, do not start the company**, and on the evidence assembled that is the right default. Three things would have to be true to override it. Each is cheap to test and none requires building more product.

**Gate 1 — Do students write real predictions?** Instrument the demo. Hand-classify 200 predictions: >8 words, mechanistically specific, not retrievable from on-screen text. **Under 40% substantive → the mechanic fails and nothing else matters.** *(1 week, $0. Run this first.)*

**Gate 2 — Does the diagnosis beat reteaching?** Two arms on the same sims: prediction-and-confront vs. "here's the correct explanation again." Sleeman found model-based remediation didn't clearly beat reteaching in procedural algebra — narrower than I first reported, but live. **If we don't beat reteach, the diagnosis layer is decoration.** *(2 weeks, $0.)*

**Gate 3 — Does the rationale help or hurt?** Prediction-with-rationale vs prediction-only vs no-prediction. Genuinely unresolved. ⚠️ *Chan et al. is **not** evidence it backfires — that inference was over-extended; the moderator there is generating reasons in support of misinformation, a different construct.* **Nobody has run this. It is the most publishable thing here.**

**If all three clear:** the beachhead is US higher-ed intro physics, positioned as *automated Interactive Lecture Demonstrations* (PhysPort catalogues ILDs as research-validated — we'd be automating a method faculty already endorse, not selling a new one). Join AAPT + PER Topical Group ($59). Submit to AAPT Winter 2027 — **the final Winter Meeting ever**, 9–11 Jan, New Orleans; **check the abstract deadline now.** Watch for the **Tools Competition 2027** announcement in September — the *Datasets* track fits, $50k–$300k.

**If they don't clear:** it was a good hackathon project and a real piece of learning-science engineering. Ship it, write it up, move on.

⚠️ **The NSF SBIR path in the earlier research does not work as written.** NSF 26-510: the PI must be **≥51% employed by the small business**, and employment elsewhere **>19.6 hrs/week disqualifies**. STTR is explicitly not relaxed. Funding rate 10–20%, ~9–11 months to first dollar, against a *"deep technologies"* bar that excludes *"incremental product development."* **A full-time student is ineligible.**

---

## 8. Verify before any of this goes in a pitch

- **Google's 19 Aug 2026 college-student release** — load-bearing for "no moat," single-sourced
- **Pivot Interactives' prediction-gating since Jan 2021** — first-party check; substantially changes flaw #1 either way
- **delMas** — figures verified exact, but two cohorts across terms, **not a randomised head-to-head**
- **PHYBench 36.9%** — unrefereed April 2025 preprint about Gemini 2.5 Pro. **Never state in present tense.**
- **FCI** — say "six categories"; attribute "28 misconceptions" to the authors (the table enumerates 30); **do not say it's freely available** — it's faculty-gated
- **PhET** — *most* sims are GPL-3.0, three are MIT; all 15 libraries are MIT. Check per sim.

**Never use:** the VanLehn "17% stability" figure (**it's inverted** — 17% is instability) · Chan et al. as a rationale-backfires argument · the Gemini 3.7 forum thread as an established bug (one post, 82 views, no reply).
