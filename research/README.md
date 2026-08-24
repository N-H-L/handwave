# Handwave — research index

Eight domain reports, compiled 25 Aug 2026. Every file separates **verified** claims (primary source + quote + URL) from **estimates** and **unverified leads**. Read the risk lines before the recommendations.

| # | File | The one thing to take from it |
|---|---|---|
| 01 | [Competitive landscape](01-competitive-landscape.md) | Google shipped on-the-fly generated simulations into Search (Gemini 3, Nov 2025). **The generator is commoditized; the prediction capture is not.** |
| 02 | [Infra & economics](02-infra-and-economics.md) | 🔴 **Gemini AI Studio's terms forbid serving under-18s.** Vertex AI or nothing. Also: the free tier trains on student data. |
| 03 | [Simulation runtime](03-simulation-runtime.md) | No physics engine, no generated code, no existing DSL. Deterministic interpreter over a JSON spec, velocity-Verlet, Canvas 2D. |
| 04 | [GTM & distribution](04-gtm-and-distribution.md) | 🟢 Our mechanic is **already a research-validated, AAPT-catalogued method** (Interactive Lecture Demonstrations). Beachhead = higher-ed intro physics. |
| 05 | [Generation reliability](05-generation-reliability.md) | Reasoning field first in the schema. Never emit solved numbers. **Headless expected-outcome assertion is the highest-value check we can build.** |
| 06 | [Business model & funding](06-business-model-and-funding.md) | Launch-domain TAM at 100% share = **$12.6M**. Not venture-scale. NSF SBIR, not VC. **Reuse (R), not caching, drives margin.** |
| 07 | [Learning science](07-learning-science.md) | delMas 1999 validates the gate (16%→72% vs 22%→49%) — **and three findings say our diagnostic is wrong as currently designed.** |
| 09 | [Compliance & safety](09-compliance-and-safety.md) | 🔴 **Vertex AI has the same under-18 ban — both Google paths are closed.** Anthropic/OpenAI/Bedrock permit it. EU AI Act high-risk, and profiling is what forecloses the exemption. |
| 10 | [Fact-check corrections](10-factcheck-corrections.md) | **Four claims wrong, two conclusion-reversing.** Read before quoting any figure. |
| 11 | [Red team](11-red-team.md) | 🔴 **Verdict: build the demo, do not start the company.** Four executed counterexamples defeat the verification layer; NSF SBIR is closed to a full-time student. |
| 08 | [Learner modeling](08-learner-modeling.md) | Misconceptions are exhibited on **~17–40%** of occasions where they could be. Never store a boolean. Generative library, not enumerated. |

## The five decisions that are settled

1. **Vertex AI, not AI Studio.** Terms, DPA, and the free tier's data handling. Config choice now, migration later.
2. **Declarative spec, never generated code.** Eliminates the entire sandbox threat class by construction, and it's the Action-Selector pattern with published security properties.
3. **Relations and named semantic states, never solved numbers.** LLM-emitted coordinates score at random-baseline (Holodeck: 0.364 vs random 0.369 vs 0.706 for relations).
4. **The prediction gate is the product, not a feature.** Crouch et al.: passive demo observation produces *no* gain over never seeing the demo (24% vs 22%, p=0.64).
5. **Graded belief state, ≥3 surface contexts before any status write.** Four independent measurements of misconception instability.

## The five things most likely to be wrong

1. **The diagnosis may not beat simply reteaching** (Sleeman et al. 1989). Active control condition, not a nice-to-have.
2. **Outcome-match diagnosis is mathematically invalid in probability** — a gambler's-fallacy learner who predicts "tails is due" and sees tails has been *rewarded*.
3. **Asking for a written rationale may strengthen the misconception** (Chan et al. 2017, k=52). Unresolved; must be an experimental arm.
4. **Synthetic models score as success** — "the sim turns off air, but in real life heavy things fall faster."
5. **A single prediction cannot identify a belief that may not be coherent** (Konold: 70% "correct", half flip on the mirror question).

## Standing caveats

- Several agents exhausted their web-search budgets and fell back to direct URL fetches. Coverage is uneven; every file has an uncertainty register at the end. **Read them.**
- **Instrument access is a real blocker:** every PhysPort physics instrument (FCI, FMCE, CSEM) is faculty-gated and the CAOS/ARTIST distribution site is dead. The SRA (Garfield 2003) is ungated and is what we can actually use.
- Anything marked ⚠️ 2026 preprint has not been peer reviewed.
- ✅ **Fact-check and adversarial passes have both run.** `10-factcheck-corrections.md` overrides figures in the other files; `11-red-team.md` overrides conclusions.
- 📋 **The plan built from all of this is in [`../docs/PLAN.md`](../docs/PLAN.md).**
