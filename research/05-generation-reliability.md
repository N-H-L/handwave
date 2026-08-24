# Generation Layer: Reliability Engineering — key findings

Researched 25 Aug 2026. ⚠️ = unverified / volatile / 2026 preprint

---

## The three findings that change the design

### 1. Our architecture has a name, and it has provable security properties
**Beurer-Kellner et al., *Design Patterns for Securing LLM Agents against Prompt Injections*** — arXiv 2506.08837 (14 authors incl. Tramèr, Debenedetti, Fischer). They call it the **Action-Selector Pattern**: the LLM translates a request into predefined calls and never sees untrusted data downstream — *"trivially immune to prompt injections as the LLM never looks at any data directly."*

**Handwave's LLM→spec→deterministic-renderer split is exactly this. Make the security argument explicitly in the writeup.**

Simon Willison's **lethal trifecta** — (1) private data, (2) untrusted content, (3) exfiltration channel. **We have leg 2 only.** Structurally outside the trifecta. Say so.

### 2. 🔴 An LLM emitting final numeric coordinates is statistically indistinguishable from random

| System | LLM emits absolute coordinates | LLM emits relations | Random |
|---|---|---|---|
| **Holodeck** (CVPR 2024, arXiv 2312.09067) layout MRR | **0.364** | **0.706** | **0.369** |
| **SceneCraft** (ICML 2024, arXiv 2403.01248) constraint score | 3.2 (no relational IR) | **88.9** | — |

Holodeck's rationale, verbatim: *"instead of letting LLM directly operate on numerical values, we propose a novel constraint-based approach that employs LLM to generate spatial relations between the objects."*

→ **The spec must contain relations and named semantic states, never solved numbers.** A deterministic solver grounds them.

**RoboGen's failure lesson:** *"an LLM cannot judge whether the joint angle value 0 corresponds to the door being opened or closed."* → **Semantic labels on every numeric parameter.** `{"state": "released_from_rest"}` not `{"v0": 0}`.

### 3. 🟢 Reasoning-field ordering is worth more than everything else combined
**Tam et al., arXiv 2408.02442 (EMNLP 2024 Industry):** *"100% of GPT-3.5-Turbo JSON-mode responses placed the 'answer' key before the 'reason' key, resulting in zero-shot direct answering instead of zero-shot chain-of-thought"* — associated with Claude-3-Haiku GSM8K **86.5% → 23.4%**.

Gemini now preserves schema key order (Google, 5 Nov 2025). **Put `reasoning` before `expected_outcome`. A free ~30-point swing, one hour of work.**

---

## Does structure hurt reasoning? Resolved.

**The pessimistic case** (Tam et al.): GPT-3.5 GSM8K 75.99% (NL) → **49.25%** (JSON-mode + schema). Claude-3-Haiku 86.5 → 23.4. Parsing failures only 0.03–0.15% — **genuine reasoning loss, not extraction loss.**

**But the mechanism is a schema bug, disclosed in their own paper** (the 100%-answer-first finding above).

**The rebuttals reproduce and reverse it.** JSONSchemaBench (arXiv 2501.10868) Table 8, at scale:

| Task | LM-only | Guidance | XGrammar |
|---|---|---|---|
| GSM8K | 80.1% | **83.8%** | 83.7% |
| Last Letter | 50.7% | **54.0%** | 51.2% |

Verbatim: *"constrained decoding consistently improves the performance of downstream tasks up to 4%."*

**The theoretically honest middle — CRANE (ICML 2025, arXiv 2502.09061):** *"constraining LLM outputs to very restrictive grammars that only allow syntactically valid final answers reduces the reasoning capabilities… by augmenting the output grammar with carefully designed additional rules, it is always possible to preserve the reasoning capabilities."* Up to **+10 points**.

> **Verdict: structure does not hurt reasoning. Answer-first schemas and vocabulary-misaligned enforcement hurt reasoning.** Our spec must include a free-text reasoning field, positioned first. That is CRANE's "additional rules" implemented in JSON Schema.

---

## Gemini structured output specifics

### Schema acceptance is the bottleneck; compliance is perfect
**JSONSchemaBench** empirical coverage (fraction of 10,000 real schemas the engine accepts):

| Dataset | Guidance | Outlines | OpenAI | **Gemini** |
|---|---|---|---|---|
| GlaiveAI | 96 | 95 | 89 | **86** |
| GitHub Easy | 86 | 59 | 29 | **7** |

**But compliance rate given acceptance: OpenAI and Gemini both 1.00 across all datasets.**
⚠️ Measured ~10 months before the Nov 2025 JSON Schema expansion. **Treat the shape as durable (compliance ≈ 1.0, acceptance is the risk); the 7% is stale.**

### What's supported (after the 5 Nov 2025 expansion)
`anyOf`, `$ref` (recursion via `"$ref": "#"`), `minimum`/`maximum`, `additionalProperties`, `type: "null"`, `prefixItems` — this is what makes **Zod and Pydantic work out-of-the-box**. Plus key-order preservation for Gemini 2.5+.

⚠️ **`pattern` exists on the SDK `Schema` type but is absent from the structured-output docs' supported list. Do not assume regex constraints are enforced.** Firebase is blunt about the failure mode: *"If you use an unsupported field, the model can still handle your request, but **it ignores the field**"* — silent, not loud.

⚠️ **Google publishes no numeric schema limits** — no max depth, property count, or enum cardinality. You discover the boundary via `400 INVALID_ARGUMENT`. **The response schema counts against your input token limit.**

### Docs' own best practices, verbatim
> *"Validation: While output is syntactically correct JSON, always validate values."*
> *"Error handling: Implement robust error handling for schema-compliant but semantically incorrect outputs."*

### 🔴 Active regression in our exact domain
[Google AI Developers Forum, 17 Aug 2026](https://discuss.ai.google.dev/t/gemini-3-7-flash-schema-constrained-json-output-degenerates-into-repeated-0-until-maxoutputtokens-regression-vs-gemini-3-flash-preview/178681):

Under `responseMimeType: "application/json"` + `responseSchema`, **`gemini-3.7-flash` intermittently emits a valid JSON prefix then repeats an integer field's digits until `maxOutputTokens`.**
- **~33% failure on synthetic payloads, up to 100% on production data**
- Triggered by prompts containing **many near-identical items** — exactly what a physics spec looks like
- **`temperature: 0` does not prevent it**
- `gemini-3-flash-preview` is clean
- **Reported by a production education workload: 241 runaway calls over 3 days, ~$60 of unwanted output tokens**
- Runaway reaches the **65,536-token** default ceiling

Compounding: [python-genai issue #1039](https://github.com/googleapis/python-genai/issues/1039) — with a schema set, exceeding `max_output_tokens` returns **`None` for both `.text` and `.parsed`**. Nothing to salvage. **Detection must happen during the stream.**

### ⚠️ Temperature is now a trap
Gemini 3 guide, verbatim: *"For all Gemini 3 models, we strongly recommend keeping the temperature parameter at its default value of 1.0. Changing the temperature… may lead to unexpected behavior, such as looping or degraded performance, particularly in complex mathematical or reasoning tasks."*

**Changelog, 21 July 2026: `temperature`, `top_p` and `top_k` are deprecated.** → Kills the "temperature 0 for eval determinism" recipe. Use **`seed`** and accept best-effort reproducibility.

### ⚠️ API surface has forked
`responseMimeType` / `responseSchema` / `responseJsonSchema` / `responseFormat` all coexist. Changelog **6 May 2026** records a breaking change to the Interactions API. Docs carry a live note: *"For stable production deployments, we recommend you continue to use the `generateContent` API."* → **Ship on `generateContent` + `responseJsonSchema`.**

**Do not use function calling for the spec** — unpredictable key ordering breaks chain-of-thought. Structured output is the right tool; function calling is for actions.

---

## DSL design — the verdict contradicts intuition

The evidence does **not** support "LLMs generate a constrained DSL more reliably than general code." It supports:

> **LLMs are worst at unfamiliar surface syntax and best at familiar syntax carrying constrained semantics.**

**The decisive experiment** — Bogin, Gupta, Clark, Sabharwal (AI2/UCI), **NAACL 2024**, arXiv 2311.09519, verbatim:
> *"we improve the effectiveness of ICL for semantic parsing by (1) using general-purpose programming languages such as Python instead of DSLs, and (2) augmenting prompts with a structured domain description… Combined, they lead to dramatic improvements (e.g. **7.9% to 66.5% on SMCalFlow compositional split**)… **the resemblance of the target parse language to general-purpose code is a more important factor than the language's popularity in pre-training corpora.**"*

Single demonstration, GeoQuery: **77% (Python) vs 17% (DSL).** Python beat DSL prompts even when the DSL got 25 demos plus a domain description.
And: *"providing domain descriptions is often more effective than additional demonstrations"* — a direct prompt-budget rule.

**The cost of a novel DSL, quantified.** MultiPL-T: StarCoderBase saw *"64GB of Python, but only around 1GB of OCaml and 0.5GB of Scheme/Racket."* **Our bespoke DSL has ~0 GB.**
Real-world niche-DSL failure: 39 open LLMs tested on a grammar-based DSL — **only 26 of 39 (67%) produced even one syntactically valid output within the retry limit.** ⚠️2026

**Grammar prompting** (Wang, Wang, Wang, Cao, Saurous, Kim — NeurIPS 2023, arXiv 2305.19234; *not* Zelikman) is worth **+6 to +8 points** (SMCalFlow 46.4→52.4). **But the oracle column is alarming: 52.4% vs 83.6% with the oracle grammar. Most residual error is choosing the wrong rules, not violating them.**

→ Compare: grammar prompting gets SMCalFlow to 52.4%. Bogin's Python + domain description gets 66.5%. **Changing the target language beats constraining it.**

### Ten design rules
1. **Reasoning field first.** Highest ROI on the list.
2. **Never emit solved numbers for anything spatial or dynamical.** Relations + named states; deterministic solver grounds them.
3. **Named enums over free strings — the failure is silent.** CodeBotler/RoboEval found the dominant failure is **hallucinated location and object names** — plausible-looking wrong specs, not catchable undefined-variable errors. Enums convert silent semantic failures into loud schema violations.
4. **Familiar syntax over minimal syntax.** JSON that looks like config files the model has seen a million of. LayoutGPT deliberately chose literal **CSS** because it is pretraining-abundant.
5. **Flat and shallow beats deeply nested.** StructuredRAG: 82.55% avg, **0–100% range**, *"tasks involving lists or composite object outputs proving more challenging."* ⚠️small benchmark
6. **Closed library of named parameterized operations over an open expression language.** ReGAL: +11.5 (LOGO), +26.1 (Date). LILO: REGEX 43.93→77.07.
7. **Semantic labels on every numeric parameter.** (RoboGen door-angle.)
8. **Spend prompt budget on schema documentation before few-shot examples — but retrieve examples well.** 3D-GPT: full function docs cut malformed calls 3.6%→0.8%. Counterweight — **LayoutGPT random vs retrieved exemplars: out-of-bounds 43.26% → 85.58%.**
9. **Structure buys syntax, never semantics.** Budget for semantic verification separately — **validity is the easy half.**
10. **Measure the full cascade, never just parse rate.**

### 🔴 FactorSim — the definitive warning about eval design
NeurIPS 2024, arXiv 2409.17652, 12 tasks:

| Method | Syntax | Runtime | Task-solvable | Human-judged correct |
|---|---|---|---|---|
| GenSim vanilla | 75% | 8% | 0% | 0% |
| **FactorSim** | 92% | **58%** | **33%** | **25%** |

**92% of generated sim specs parse, 42% run, 8% are solvable, 0% matched the prompt** (GenSim CoT). **Syntactic validity is nearly worthless as a proxy for spec correctness.**

GenSim's honest limitation: *"GPT-4 sometimes hallucinates concepts such as 'boundary' and 'ascending size' **without actually implementing them in code**."* **Execution does not catch this class of error.**

### The closest published precedent to Handwave
**Upadhyay & Reinhart, FEniCS NL interface** — arXiv 2606.10928 (Jun 2026). NL → structured JSON → schema validation with retry feedback → deterministic dispatcher → **five human-authored templates**. The LLM *"never writes FEniCS solver templates, derives weak forms, or writes the numerical solver core."*
Results on 15 prompts: **first-pass valid parses 9/15 → final valid parse rate 100.0%**, problem-class accuracy 100.0%, field-extraction 97.1%. ⚠️2026 preprint — **but it is our architecture, validated, with numbers.**

---

## Self-repair: extrinsic works, intrinsic fails

**The line that matters:** *intrinsic* self-correction (LLM critiques its own output, no ground truth) **fails or degrades**. *Extrinsic* feedback (real execution / validator / console errors) **works reliably**.

**The critical literature is decisive:**
- **Olausson et al. (ICLR 2024, arXiv 2306.09896):** *"when the cost of carrying out repair is taken into account, performance gains are often **modest, vary a lot between subsets of the data, and are sometimes not present at all**"*; *"self-repair is **bottlenecked by the model's ability to provide feedback on its own code**."*
- **Huang et al. (ICLR 2024, arXiv 2310.01798):** *"LLMs struggle to self-correct… at times, **their performance even degrades after self-correction**."*
- **Stechly, Valmeekam, Kambhampati (arXiv 2402.08115):** **"significant performance collapse with self-critique"** vs **"significant performance gains with sound external verification."** Plus the cost-saving corollary: *"merely re-prompting with a sound verifier maintains most of the benefits."*
- **Kamoi et al. (TACL 2024):** *"No prior work demonstrates successful self-correction with feedback from prompted LLMs"*; *"self-correction works well in tasks that can use **reliable external feedback**."*

**Measured extrinsic numbers:**

| System | Signal | Before → After |
|---|---|---|
| Text2Reward (ICLR 2024) | Python interpreter | ***"decreases error rates from 10% to near zero"*** |
| FEniCS ⚠️2026 | JSON schema validation | **9/15 first-pass → 100% final** |
| 3DCodeBench ⚠️2026 | ≤2 traceback retries | executability **0.692 → 0.972** |
| Self-Debug (MBPP) | unit tests | up to **+12%** |

→ **Expect 55–70% first-pass validity → 95–100% final within 1–2 rounds.**
→ **Budget exactly 2 repair rounds and stop.** Text2Reward converges in <3; 3DCodeBench caps at 2; Olausson says past that you should have spent the tokens on a fresh sample.
→ **Never ask Gemini to diagnose its own error. Feed it the deterministic validator's structured error and re-prompt.** Cheaper, faster, better-evidenced.
→ ⚠️ Each repair round ≈ 1,500 output tokens ≈ $0.006 and ~4s. **Two rounds can blow the entire 8-second budget** — repair must be off the critical path for the common case.

---

## Verification > repair

**Governing principle: a deterministic external verifier beats LLM self-critique.**

*Large Language Monkeys* (arXiv 2407.21787): with an automatic verifier, SWE-bench Lite **15.9% (1 sample) → 56% (250 samples)**. But *"majority voting and reward models plateau beyond several hundred samples."* **The verifier is the scaling lever, not the sampler.**

### The checks, ranked by cost-effectiveness

| # | Check | Cost | Catches |
|---|---|---|---|
| 1 | Zod/Ajv schema validation | ~0ms | Structural violations, enum drift |
| 2 | Range/bounds assertions (mass>0, g ∈ [0.1,100]) | ~0ms | Nonsense params; the degeneracy bug |
| 3 | **Dimensional analysis** — tag every param with SI units as an `enum`, check derived dimensions | ~1ms | **Unit confusion, the #1 silent physics bug** |
| 4 | 🟢 **Reference-invariant check: run the sim headlessly and assert the stated `expected_outcome` actually occurs** | ~10–50ms | **The single highest-value check. Directly catches confidently-wrong physics — our core product risk** |
| 5 | **Conservation / energy-drift check** with drag and driving forces zeroed | ~10ms | Wrong update rules, wrong force signs. A symplectic integrator bounds energy error; large monotonic drift implies the *spec* is wrong |
| 6 | **Degeneracy check** — does the observable actually vary across the parameter range? | ~10ms | Sims where the "interactive" parameter does nothing — a pedagogical failure invisible to every other check |
| 7 | **Prediction-discriminability check** — are two distinct predictions distinguishable in the observable? | ~10ms | Specs where prediction-vs-outcome diffing cannot fire |
| 8 | LLM-as-judge on pedagogy/wording | ~1–2s | Framing quality only |

> **Checks 4–7 are the ones nobody else has, because we own a deterministic renderer.** Running the sim headlessly before showing it is far cheaper than any LLM call and catches exactly the class of error the literature says LLMs make. **Build these before building a repair loop.**

**Supporting:** ContPhy (ICML 2024) — GPT-4V on rope goal-driven questions **12.1% vs human 84.0%**; fluid counterfactual **5.1% vs 60.6%**; Gemini/GPT-4V frequently *below random*. Their simulator-in-the-loop oracle **exceeds human accuracy**. Our renderer is that oracle.

### Calibration: you cannot ask the model how sure it is
Kadavath et al. — calibration is format-conditional and *"they struggle with calibration of P(IK) on new tasks."*
⚠️2026 counterweight (arXiv 2606.29490): *"verbal confidence predicted the commit/abstain decision substantially better than whether the answer was correct."*
→ **A `confidence` field in the spec is decoration, not a gate.**

### LLM-as-judge
Zheng et al. (NeurIPS 2023): GPT-4 judges achieve *"over 80% agreement, the same level of agreement between humans."*
→ **That is a preference-ranking number, not a physics-correctness number.** Use for pedagogical framing only, and **validate against 40 hand-labelled items — if Cohen's κ < 0.6, do not ship the judge.**

---

## Latency: the number that reframes everything

Artificial Analysis, first-party Google API ⚠️*changes weekly*:

| Model | Output speed | **TTFT** |
|---|---|---|
| **gemini-3-flash (non-reasoning)** | 195.7 tok/s | **0.72s** ✅ |
| gemini-3.5-flash-lite (reasoning) | 373.3 tok/s | 8.70s ❌ |
| gemini-3.7-flash (high) | 347.9 tok/s | 12.19s ❌ |
| gemini-3.5-flash (high) | 206.6 tok/s | 16.42s ❌ |

> **AA's TTFT for reasoning variants includes thinking time. Every reasoning-mode Flash model blows the 8-second budget on time-to-first-token alone.** The non-reasoning `gemini-3-flash` at **0.72s TTFT** is the only configuration compatible with the target.

**Gemini 3 uses `thinking_level`, not `thinking_budget`.** `minimal` is supported only on **3 Flash and 3.1 Flash-Lite**. No Gemini 3 model accepts a budget of 0. Thinking tokens are **billed as output**.
→ **`thinking_level: "minimal"`. Worth ~8–15 seconds.**

### The dominant lever: output token count
At 195.7 tok/s, **every token removed is ~5ms**:

| Spec size | Decode | +0.72s TTFT | Fits 8s? |
|---|---|---|---|
| 400 tok | 2.0s | 2.7s | ✅ |
| 800 tok | 4.1s | 4.8s | ✅ |
| 1,500 tok | 7.7s | 8.4s | ⚠️ marginal |
| 3,000 tok | 15.3s | 16.0s | ❌ |

→ Argues directly for the DSL rules: relations not solved numbers, enum IDs not prose, a template library the spec **references** rather than inlines.

### ⚠️ Do the arithmetic before enabling explicit context caching
A 5,000-token system prompt cached at **$0.50/hr = $12/day = $360/month** whether or not anyone uses it. Break-even is **~3,200 requests/hour**. **For a demo, use implicit caching only** (free, automatic, 4,096-token minimum) and put the stable schema + examples first so it hits.

### 🟢 The prediction gate is our latency superpower
The commit step is a *product requirement* that happens to consume 3–5 seconds of human time. **Overlap it completely with generation** and the effective budget becomes ~10–12s of wall clock inside an 8s-feeling experience.

```
t=0.0  Skeleton UI + PREDICTION COMMIT widget mounts immediately
t=0.2  Single streaming call, thinking_level minimal, maxOutputTokens 2000
t=0.9  TTFT — first fields arrive
t=1.5  partialOutputStream: entities + params complete → canvas mounts
t=3.0  Update rules + observables complete → sim interactive
t=3.2  Deterministic verifier runs headlessly
t=3.3  PASS → reveal · FAIL → one repair round (budget 2.5s)
t=5.8  Worst-case reveal
```

---

## Eval harness

**EvalPlus warning:** HumanEval extended 80× in test cases → **pass@k dropped 19.3–28.9%** *and model rankings flipped.* Weak tests silently inflate everything.

### Proposed: 120 hand-built private items, six-gate funnel

Stratified: 60 concepts × 2 phrasings (one textbook, one misconception-laden — *"why doesn't a heavier ball fall faster?"* is the latter). Kinematics 25 / forces 25 / energy-momentum 25 / oscillation 20 / thermal 15 / circuits 10. Difficulty: 40 canonical, 60 standard, 20 adversarial (ambiguous, under-specified, or containing a false premise).

**Keep it private and never publish it** — EvalPlus and SWE-bench-Verified both show public benchmarks degrade. Rotate 20% annually.

Golden **record**, not golden output:
```json
{
  "id": "mech-freefall-mass-01",
  "question": "why doesn't a heavier ball fall faster?",
  "concept_id": "independence_of_mass_in_free_fall",
  "must_vary_parameters": ["mass"],
  "must_not_vary": ["gravitational_field"],
  "expected_outcome_assertion": "abs(t_a - t_b) / t_a < 0.01 when drag = 0",
  "misconception_targeted": "heavier_objects_fall_faster",
  "discriminating_prediction": "t_a < t_b",
  "forbidden": ["drag enabled by default", "different g per body"]
}
```

| Gate | Metric | Target |
|---|---|---|
| G1 | Schema validity | ≥99% |
| G2 | Renderability | ≥98% |
| G3 | Physical sanity (bounds + dimensional + conservation) | ≥97% |
| G4 | Concept accuracy (`concept_id` matches golden) | ≥95% |
| **G5** | **Outcome correctness — headless run satisfies the assertion** | **≥95% — the money metric** |
| G6 | Pedagogical validity (degeneracy + discriminability + judge) | ≥90% |

> **G5 is what "did the generated sim correctly model this concept?" actually means, and it is fully automatic because we own the renderer.** Our structural advantage over every code-gen benchmark: ground truth is an executable assertion, not a hidden test suite.

**Statistics:** at n=120 and 95% observed, Wilson 95% CI ≈ ±4 points. Detects a ~5-point regression, not 95 vs 96. **Gate CI on G5 only.** Use **pass@1 across 5 samples** (temperature is deprecated, so single-sample determinism isn't available). **Any item at 0/5 is a hard regression regardless of the mean.**

**Error analysis over aggregate scores:** every G5 failure gets a one-line failure-mode tag; review the tag histogram weekly. That histogram, not the headline number, tells you what to fix.

---

## Guardrails

### OWASP GenAI Top 10 is now **2026**, not 2025
LLM01 Prompt Injection · LLM02 Sensitive Info Disclosure · LLM03 **Excessive Agency** (up from 06) · LLM04 Supply Chain · LLM05 Data/Model Poisoning · LLM06 Unbounded Consumption · LLM07 Misinformation · LLM08 **Hidden Context Exposure** (new) · LLM09 Vector/Embedding Weaknesses · LLM10 Improper Output Handling (down from 05)

LLM01:2026 prevention opens, verbatim:
> *"Prompt injection is intrinsic to current generative AI: LLMs make no architectural distinction between instructions and data… **no reliable prevention mechanism exists today**… Defense is therefore architectural rather than interceptive."*
> *"there is no clean equivalent to parameterized queries."*

Its most relevant mitigation, verbatim: *"Define a strict output schema and validate every response in trusted application code before any downstream system acts on it, **using structural validation rather than a second LLM call**."*

⚠️ **Temper every defense number:** OWASP 2026 cites Nasr et al. (2025) finding *"static attack success near zero while **adaptive attack success exceeded 90% for most of 12 recent defenses**."*

### ⚠️ Structured output is itself an attack surface — but not for us
**Zhang, Zhao, Dong et al., arXiv 2503.24191:** *"schema-enforced logit masking injects a malicious prefix into the generation trajectory… **CDA acts on the decoding process itself, so internal safety alignment alone cannot stop it.**"* Across 13 models, **DictAttack achieves 94.3–99.5% ASR** on gpt-5, gemini-2.5-pro, deepseek-r1; **75.8% persists against SOTA guardrails.**

> **Why it doesn't apply to us: the attack requires the attacker to control the schema. Ours is server-side and fixed; the learner controls only free text.**
> **→ Make "the schema is a server-side constant" an explicit invariant with a test.** No dynamic enum construction from user text, no user-supplied schema fragments.

### 🔴 Confidently wrong physics — our actual biggest risk

| Evidence | Finding |
|---|---|
| Kortemeyer, arXiv 2301.12127 | ChatGPT would narrowly pass intro physics *"while **exhibiting many of the preconceptions and errors of a beginning learner**"* |
| West, FCI | GPT-3.5 **15/30 = 50%** (~39th percentile). **Only 43% of its free-response explanations fully passed an expert test on the reasoning** — right answers, wrong reasoning. Errors clustered on items *"depended on reasoning about directions and spatial relationships"* |
| arXiv 2505.20707 (3,162 questions, 58,000 responses) | **Among final-answer-correct solutions, 75–98% contain at least one reasoning error** — explicitly *"'right answer, wrong procedure' failures that can reinforce student misconceptions"* |
| PHYBench | Gemini 2.5 Pro **36.9%** vs human experts 61.9% |
| UGPhysics (5,520 problems) | highest overall **49.8%** |
| PhysBench (ICLR 2025, 75 VLMs) | GPT-4o **49.49%** vs human 95.87% |

**And the sharpest nuance** ⚠️2026 (arXiv 2605.09602, using a concept inventory *unpublished at test time*): Gemini 3 Flash 97%, GPT-5.2 73%, students 62% — but *"all three models fail completely on a small number of items"*, and critically:

> ***"when models err, they converge on a single distractor with high consistency, whereas student errors are more broadly distributed."***

**Threat:** when Gemini is wrong, it's wrong the *same way every time* — a systematic, reproducible defect our eval will either catch completely or miss completely.
**Opportunity:** **systematic errors are exactly what a fixed eval set catches well.** 120 items × 5 samples will find them; random errors would need far more.

### 🔴 SafeTutors — the most important number for our product category
⚠️2026, arXiv 2603.17373, verbatim:
> *"tutoring safety is fundamentally different from conventional LLM safety: the primary risk is not toxic content but **the quiet erosion of learning through answer over-disclosure, misconception reinforcement, and the abdication of scaffolding**."*

**"all models show broad harm; scale doesn't reliably help; and multi-turn dialogue worsens behavior, with pedagogical failures rising from 17.7% to 77.8%."**

> **A 4× degradation from multi-turn. Our single-shot, deterministic-renderer architecture is a pedagogical safety feature. Guard it.** Resist "let the student ask a follow-up."

### Safety filters default to OFF
Four configurable `HarmCategory` values; **default is `Off` for Gemini 2.5 and 3**. Child-safety harms always blocked, non-adjustable.
⚠️ **None of these address prompt injection** — they are content-harm filters. Model Armor (Cloud/Vertex only) offers injection detection but ⚠️ **publishes no accuracy or ASR numbers.**

### Public-demo abuse
- Verbatim: **"Rate limits are applied per project, not per API key."** There is **no per-user or per-IP limit.** Google's limits protect Google, not our budget from one abusive visitor. **Per-IP limiting is entirely our responsibility in the proxy.**
- **Cloud Billing budgets do not cap spend by default:** *"Setting an alerts-only budget doesn't automatically cap… usage or spending."* The hook is Pub/Sub → billing-disable function. Spend caps are **Preview**.
- Never expose keys client-side. Run a backend proxy.

---

## Free-tier reality

🔴 **Google no longer publishes free-tier numbers.** The rate-limits page contains **no per-model RPM/TPM/RPD tables** — *"can be viewed in Google AI Studio"*, which 302-redirects to sign-in. **Your actual limits are project-specific and only visible signed-in. Check AI Studio for your project and record them.**

⚠️ **Third-party rate-limit numbers are unreliable and self-contradictory** — the main source cites no official source and contradicts itself within one article. **These are commercial API resellers with an incentive to make the free tier look inadequate. Do not cite them.**

### What the free tier does to your data
Gemini API Additional Terms, effective 23 Mar 2026:

| | Unpaid | Paid |
|---|---|---|
| Human review | **"human reviewers may read, annotate, and process your API input and output"** | no |
| Training | **"Google uses the content you submit… to provide, improve, and develop Google products"** | *"Google doesn't use your prompts… to improve our products"* |
| Warning | **"Do not submit sensitive, confidential, or personal information to the Unpaid Services."** | DPA applies |

→ **Must be on paid tier before real users. Say so in privacy copy.** Synthetic demo questions on free are fine.

### The realistic demo failure sequence
1. Limits are **per project** — every viewer shares one bucket
2. **RPM binds first**, not RPD — 10–30 simultaneous viewers can exhaust it in one minute
3. A repair loop **multiplies requests 2–3×** against that same ceiling
4. Self-consistency at n=3 multiplies again
5. `429` → SDK backoff → the 8-second budget becomes 30 seconds

**Mitigations in order:** link billing to reach Tier 1 *before* the demo (documented as instant; the constraint becomes a $10/10-min spend cap rather than tight RPM) · pre-generate and cache every canonical demo spec · server-side queue with a visible position indicator · static fallback spec per demo question.

---

## The 8 highest-leverage techniques, ranked

| # | Technique | Effort | Payoff |
|---|---|---|---|
| **1** | **Reasoning field first in the schema** | ~1 hour | **Very high** — potentially tens of points |
| **2** | **Relations + enum'd semantic states, never solved numbers** | 1–2 weeks (needs a solver) | **Very high** |
| **3** | **Headless expected-outcome assertion before reveal** | 2–4 days | **Very high** — the only check that catches confidently-wrong physics |
| **4** | **`thinking_level: "minimal"` + hard `maxOutputTokens: 2000`** | ~1 hour | **Very high** — latency, cost, and the 3.7-flash degeneracy bug |
| **5** | **Validator → structured-error repair, capped at 2 rounds** | 3–5 days | High |
| **6** | **Six-gate eval funnel, 120 private items, pass@1 over 5 samples** | 1–2 weeks | High, compounding |
| **7** | **Dimensional analysis + bounds + degeneracy checks** | 2–3 days | Medium-high |
| **8** | **Server proxy + per-IP limits + Pub/Sub billing kill-switch** | 1–2 days | Medium, but unbounded downside if skipped |

**Deliberately not in the top 8:** self-consistency (3× cost against our tightest constraints; worth it only on `concept_id`/`misconception_id`, and only after 1–7) · LLM-as-judge as a gate (validate κ≥0.6 first) · grammar prompting (+6–8 pts, but token budget buys more from schema documentation) · explicit context caching (needs ~3,200 req/hr to beat its storage cost).

---

## The 3 things most likely to break in a live demo

**C1 — `429` in front of an audience.** Per-project limits, unpublished RPM, RPM binds before RPD, repair loops triple request count.
→ **Link billing before the demo** (Free→Tier 1 is instant) · **pre-generate every canonical demo spec** · queue with visible position · static fallback per question.

**C2 — Schema-constrained decode degeneration.** The exact documented bug, in our exact domain, ~33–100% on production-shaped data, temperature-proof.
→ **Pin `gemini-3-flash-preview` or `gemini-3.1-flash-lite`** (the reporter confirmed 3-flash-preview is clean, and it also has the only sub-second TTFT) · **`maxOutputTokens: 2000`, non-negotiable** · **repetition detector in the stream handler** (abort if a short n-gram repeats >20×) · fallback model one env var away.

**C3 — A confidently wrong simulation shown live.** The product-ending failure, and the literature says it is likely, not hypothetical.
→ **Gate the reveal on the headless expected-outcome assertion.** ~50ms, and it is the whole ballgame.
→ **Golden-path the demo** — every planned question at 5/5 in the eval set. Audience questions go through the same gate; a failed gate shows *"I couldn't build a simulation I'm confident in for that one — try one of these."* **A graceful decline is a credibility win; a wrong physics demo is not recoverable.**
→ **`misconception_id` as an enum**, never free text — that's where confidently-wrong reasoning surfaces most visibly to a learner.
→ **Keep it single-shot** (SafeTutors 17.7% → 77.8%).

---

## Uncertainty register
**Volatile:** all Artificial Analysis figures · Gemini pricing (intro rates end 31 Dec 2026, then double) · model availability.
**Documented as absent:** Gemini publishes **no numeric schema limits** · **no free-tier RPM/TPM/RPD anywhere public** · Model Armor has **no published accuracy figures**.
**2026 preprints, peer review unverified:** DCCD, FEniCS, SafeTutors, CRCI, and ~8 others.
**Could not verify — do not cite:** any paper titled "Attacks on LLM safety via format constraints" (**treat as non-existent**) · any paper testing LLMs for **impetus theory** by name · any **ViperGPT program-failure rate** (the paper reports none) · XGrammar's hardware for its 100× claim.
**Corrected assumptions:** Grammar Prompting is Wang/Wang/Wang/Cao/Saurous/Kim, **not Zelikman** · OWASP list is **2026**, not 2025 · `thinking_budget` is superseded by `thinking_level`.
