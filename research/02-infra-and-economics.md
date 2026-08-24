# Infrastructure, Latency & Unit Economics — key findings

Researched 25 Aug 2026. **[V]** verified from primary source · **[calc]** derived · **[E]** estimate, unverified

---

## 🔴 BLOCKER: Gemini AI Studio's terms forbid this product

https://ai.google.dev/gemini-api/terms — **Age Requirements**, verbatim:

> "You must be 18 years of age or older to use the APIs."
> "You also will not use the Services as part of a website, application, or other service … that is directed towards or is likely to be accessed by individuals under the age of 18."

Handwave is a classroom product for minors. **The AI Studio Gemini API (`generativelanguage.googleapis.com`) is contractually off-limits for production.**

No equivalent under-18 restriction was found in the Google Cloud Service Specific Terms for **Vertex AI**, which is governed by the Google Cloud Agreement + CDPA rather than the AI-Studio consumer terms.

→ **Build on Vertex AI.** Same models, same pricing, different legal surface, plus a DPA and a documented zero-data-retention path. Do it in week one — it is a config change now and a migration later.

### The free tier also trains on student data
Same terms page. Unpaid: *"Google uses the content you submit … to provide, improve, and develop Google products"* and *"Human reviewers may read, annotate, and process your API input and output."* Paid: *"Google doesn't use your prompts … or responses to improve our products."*

→ **Turn billing on day one.** Tier 1 costs $0 until you actually spend.

### Safety filters default to OFF
https://ai.google.dev/gemini-api/docs/safety-settings — defaults for Gemini 2.5/3.x are **Off** for all four adjustable categories. You must set them explicitly. Child-safety harms are non-adjustable and always blocked.

### COPPA
Amended Rule effective **23 Jun 2025**, full compliance **22 Apr 2026**. FTC **declined** to codify an ed-tech exception; schools may consent only where use is *entirely educational* — any commercial use of child data, **including contextual advertising**, voids school consent.
https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule

---

## Latency: the <8s target is tight and reasoning models blow it

Artificial Analysis measures TTFT **including reasoning tokens**:

| Model | Output speed | TTFT (incl. reasoning) |
|---|---|---|
| Gemini 3.7 Flash (high) | 347.9 tok/s | **12.19 s** ❌ |
| Gemini 3.5 Flash-Lite | 373.3 tok/s | 8.70 s |
| **Gemini 3.1 Flash-Lite** | 334.5 tok/s | **5.42 s** ✅ |
| Gemini 3.5 Flash (high) | — | 23.24 s ❌ |

Thinking tokens are **billed as output**. Defaults: 3.7 Flash → `medium`, 3.5 Flash-Lite → `minimal`, **2.5 Flash-Lite → off**.

### The biggest latency lever is spec size, not model choice
At ~350 tok/s, **every 350 output tokens costs one second.**

| Output tokens | Streaming time alone |
|---|---|
| 400 | 1.1 s |
| 1,400 | 4.0 s |
| 3,000 | 8.6 s — blows the budget by itself |

**Design mandate:** order the `responseSchema` so the **renderable core** (world bounds, bodies, forces, initial conditions) serializes **first**, then partial-JSON-parse and paint at ~350 tokens. First paint drops **5,280 ms → 2,280 ms** [calc].

Gemini confirms streamed structured output: *"The streamed chunks are valid partial JSON strings that can be concatenated"* — https://ai.google.dev/gemini-api/docs/structured-output

**Never put natural-language explanation in the same call.** Fetch it lazily after first render.

Modelled distribution at 58% cache hit [E]: **p50 456 ms, p95 6.5 s, p99 7.5 s, 99.6% under 8 s.** Almost no margin — **the cache is load-bearing, not an optimization.**

---

## Pricing (https://ai.google.dev/gemini-api/docs/pricing)

| Model | In /1M | Out /1M | Cached in /1M |
|---|---|---|---|
| 2.5 Flash-Lite | $0.10 | $0.40 | $0.01 |
| **3.1 Flash-Lite** | **$0.25** | **$1.50** | $0.025 |
| 3.7 / 3.6 Flash | $0.75 | $3.75 | $0.075 |
| 3.7 / 3.6 Flash **from 1 Jan 2027** | **$1.50** | **$7.50** | $0.15 |
| 3.1 Pro Preview | $2.00 | $12.00 | $0.20 |
| gemini-embedding-001 | $0.15 | — | — |

⚠️ **The 3.7/3.6 Flash intro price doubles on 1 Jan 2027.** Never build a plan on introductory pricing.

### Context caching: make the prompt LONGER to make it CHEAPER
Implicit caching is on by default for 2.5+. **Minimum prefix for a hit: 4,096 tokens** (3.x Flash/Pro), 2,048 (2.5).

→ System prompt + sim-spec schema + few-shot examples **must exceed 4,096 tokens** or you get zero implicit caching. Saves 31–40% on total cost [calc].

→ **Assert `total_cached_tokens > 0` on every call.** A silent drop below the threshold raises input cost 1.5–3× with no errors and no alarm. This is the #1 silent cost regression.

### Batch API — 50% off, 24h turnaround
https://ai.google.dev/gemini-api/docs/batch-api

---

## The pre-seed move — the highest-leverage decision in the document

Generate the curriculum head **offline via Batch API at 50% off, with the best model**, and hand-QA it.

| Model (batch) | 10k sims | 50k sims |
|---|---|---|
| 2.5 Flash-Lite | $5 | $25 |
| 3.1 Flash-Lite | $16 | $81 |
| **3.1 Pro** | **$129** | $646 |

**$129 buys 10,000 Pro-quality, human-reviewed sims covering ~68% of query volume on day one.**
Re-seed quarterly: **$517/year = $43/month, flat, at any MAU.**

Simultaneously solves: cold-start, quality, latency, cost, **and** the outage fallback tier.

---

## Cache design

### Head-heaviness, quantified
Zipf(s=1.0) over 1M intents [calc]: top 1,000 intents = **52%** of volume; top 10,000 = **68%**; top 50,000 = **79%**.

Empirical anchor — AltaVista, 575M queries (https://bitsavers.org/pdf/dec/tech_reports/SRC-TN-1998-014.pdf): **63.7% of unique queries occur exactly once**; the 25 most common queries are 1.5% of all volume. Google still reports **15% of daily searches are never-before-seen**.

Education should be **fatter-headed** than open web search — finite curriculum, time-synchronised assignments, textbook problems recurring across cohorts. **That is reasoning, not measurement. No published repeat-rate data exists for Khan Academy / Photomath / Chegg / Quizlet. Measure your own logs in week 2.**

### Published hit rates — honest evidence base
| Source | Hit rate | FP rate |
|---|---|---|
| GPTCache Table 1 (queries drawn only from cached items) | 87.6% | 4.45% |
| **GPTCache Table 2 (50/50)** | **49.1%** | 3.68% |
| GPT Semantic Cache (arXiv 2411.05276) | 61.6–68.8% | 2.7–7.5% |
| **Mangoes.ai via Redis LangCache — real production** | **70%** | — |

Correct GPTCache citation: https://aclanthology.org/2023.nlposs-1.24/ (no arXiv preprint exists; the widely-circulated 61.6–68.8% belongs to a *different* system).

**Plan for 55–58% base, 40% conservative, 68% optimistic.**

### 🔴 Why naive semantic caching is DANGEROUS in education
These pairs are near-identical in embedding space and **pedagogically opposite**:
- "why **doesn't** a heavier ball fall faster" vs "why **does** a heavier ball fall faster"
- projectile motion **with** vs **without** air resistance
- "**double** the mass" vs "**halve** the mass"
- series vs parallel circuit; elastic vs inelastic collision

**vCache (ICLR 2026, arXiv 2502.03771 — Zaharia, Gonzalez et al.):** correct and incorrect cache hits have *"highly overlapping distributions"* with means **0.84 vs 0.85**; optimal per-entry thresholds range **0.71 to 1.0**. **No global threshold separates them.**

**GPTCache authors §5:** *"results with semantics opposite to the input text are acceptable in search since they have structural similarity, but this is unacceptable in caching scenarios."*

**Cache poisoning (arXiv 2601.23088, Jan 2026):** CacheAttack achieves **86% hit rate in LLM response hijacking**, black-box, transferable across embedding models. *"The locality required to maximize cache hit rates fundamentally conflicts with collision resistance."* → **Partition the cache per tenant.**

**Mitigations, ranked:**
1. Cache on an **extracted intent key**, not the raw string
2. Require cosine ≥ threshold **AND** exact match on discriminating slots (negation, direction-of-change, toggled constraints)
3. Threshold ≥0.95 and eat the lower hit rate — **a miss costs $0.002; a wrong sim costs a student's understanding**
4. Flash-Lite judge on borderline 0.90–0.95 matches at **$0.000105, 21× cheaper than a generation**
5. Namespace by `(grade_band, locale, tenant)`
6. Log every hit with original query + served spec; sample offline

⚠️ **Threshold-scale trap:** GPTCache 0.8 (similarity), redisvl 0.1 (distance), LangChain-Redis 0.2 (distance), Azure 0.05 (distance), Portkey 0.95 (similarity). **Three are inverted scales. Never copy a threshold across libraries.**

### The three-layer cache
| Layer | Latency | Mechanism | Contribution [E] |
|---|---|---|---|
| **L0** exact hash on normalised query | <1 ms | Postgres unique index | ~25–35% |
| **L1** structured intent-key exact match | ~3 ms | btree on `intent_key` | +~20% |
| **L2** semantic ANN, cosine ≥0.95 | ~15 ms | pgvector HNSW, 768d halfvec | +~13–20% |
| **L3** miss → Flash-Lite `minimal` | ~5.3 s | stream + progressive render | 32–45% |

**L1 is the layer everyone skips and shouldn't.** Have the same Gemini call emit an intent key as an extra schema field — `projectile-motion|vary=angle|air-resistance=off|grade=9-12` — for ~25 extra tokens (**$0.0000375, free**). It collapses thousands of phrasings before any vector math *and* is exactly the discriminator that stops the dangerous false positives.

**Embeddings:** `gemini-embedding-001` MRL truncation — 1536d = 68.17 MTEB, **768d = 67.99**. 0.18 MTEB points for **4× less index memory**. Use 768d halfvec. Embedding cost is **1/500th of a generation**.

**Economic floor** (arXiv 2510.26835, IBM/Red Hat): a 30 ms remote vector lookup needs **15–20% hit rate to break even**; a **2 ms local lookup** needs only 3–5%. → **Keep pgvector co-located. This is why Supabase beats a separate vector SaaS.**

### Assignment dedup — the second multiplier
A teacher assigning one question to 30 students is **one generation, not thirty**. Pre-warm at assignment-creation time.

At 1M MAU × 20 sims/mo: no cache $44,340 → semantic cache only $14,189 → **+ assignment pre-warm $7,833** → classroom mode $5,291.

---

## Serving

**Use Vercel Node runtime + Fluid compute, NOT Edge.** Edge must begin responding within **25 s**; its memory/CPU ceilings and the **1,024 file descriptors shared across concurrent executions** make it wrong for holding many concurrent upstream connections.

**The second-most-important economic fact:** Vercel Fluid bills *"only during actual code execution and not during I/O operations (database queries, like AI model calls)."* Waiting 5 s on Gemini costs memory rent, not CPU.

→ **Vercel compute is ~0.3% of the LLM bill.** At 1M MAU × 20 sims: **$126/month.**

**Transport: SSE via the Vercel AI SDK, not WebSockets** — Vercel Functions don't support WebSockets. Use `streamObject`/`useObject` with a partial-JSON parser.

**Resumability:** a student closing a laptop lid mid-generation is common. Back the stream with Redis so reconnect replays from buffer rather than re-billing.

**Gateway: Vercel AI Gateway — zero markup**, automatic cross-provider failover, cross-model fallback, and a public uptime API. Caveats: BYOK failures **silently fall back to Vercel system credentials billed to your credits**; BYOK spend is **not capped by budgets**; budgets are *"a soft cap, not a hard limit."*

**Failover for latency, not just price:** Groq GPT-OSS 20B runs at **1,000 tok/s — 3× Gemini's 350.**

**Retries:** don't stack client retries on a gateway that already retries. `p-retry` defaults (`retries:10, factor:2`) mean ~17 minutes — use `retries: 2–3`, `maxTimeout: 8000`, **`randomize: true`** (without jitter, 30 students who submitted together retry in lockstep). Circuit breaker: `cockatiel` with **`ConsecutiveBreaker(5)`**, not a percentage breaker — a rolling-window breaker never accumulates enough volume between bells to trip.

---

## The bell schedule is real

Politecnico di Torino, 16,000 students/day (https://arxiv.org/abs/2004.13569): live-classroom access *"clearly follow the schedule of the campus lectures, which begin every 90 minutes"*, producing **peaks of more than 4,500 concurrent connections** at each lecture start. **Load is 6 near-instantaneous step functions per day, not a diurnal sine wave.**

### Peak load [calc]
| MAU | Peak |
|---|---|
| 10,000 | 42 RPM |
| 100,000 | 420 RPM |
| **1,000,000** | **4,200 RPM** |

Tier ceilings (secondary source — **verify in AI Studio**): Free 10 RPM, T1 300, T2 2,000, T3 ~4,000.
→ **At 1M MAU the bell peak exceeds Tier 3. Rate limits, not cost, are the wall.**

1,000 simultaneous classrooms take **144 s to drain even at Tier 3.** **No rate limit saves you — only pre-warming does.** Since a teacher creates an assignment minutes-to-days before the bell, you already know the question. **Pre-generate at assignment creation and the bell becomes a cache-hit event.**

### Degradation ladder
L0 semantic cache 60% → L1 pre-verified curriculum library 15% → L2 secondary provider (Groq) 20% → L3 queue + honest "ready in a minute" 5%.
Availability [calc]: **user-visible failure 0.002%.**

---

## Never execute generated code

Handwave generates a **declarative sim spec**; a hand-written fixed renderer interprets it. Validate against strict Zod, reject unrecognised fields, clamp every numeric to sane physical ranges, render. **No `eval`, no `new Function`, no dynamic import.** This eliminates the entire risk class and is why spec-not-code is the right design.

If you ever must execute generated JS client-side: cross-origin iframe with `sandbox="allow-scripts"` **and nothing else**. Per MDN, combining `allow-scripts` with `allow-same-origin` lets the document remove its own sandbox attribute — *"no more secure than not using the sandbox attribute at all."*

Residual injection risk is **free-text fields** (labels, captions) other students may see. Moderate those specifically, cap length, strip non-plain-text.

---

## Data layer

**Supabase.** The hidden cost is **auth MAU, not compute**: at 1M MAU, 900k × $0.00325 = **$2,925/month**, nearly twice the compute bill. Mitigate with school-federated SSO / roster provisioning. **Model this before scaling.**

**RLS performance is not optional** (https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv):

| Fix | Before → After |
|---|---|
| Index the `user_id` column used in the policy | 171 ms → <0.1 ms |
| Wrap `auth.uid()` in `(select auth.uid())` | 179 ms → 9 ms |
| Wrap `is_admin()` | **11,000 ms → 7 ms** |
| Wrap `has_role()` | **178,000 ms → 12 ms** |
| Restructure join | 9,000 ms → 20 ms |

Wrap every function call in a subselect, index every column in a policy, add `TO authenticated`.

**Multi-tenancy:** `district → school → class → enrollment`, `tenant_id` denormalised onto every row, included in every RLS policy **and every cache-lookup predicate**.

---

## Observability

**Sample to 10%.** At 1M MAU, full-fidelity Langfuse tracing costs **$4,101/mo = 29% of the Gemini bill**. Log 100% of: errors, cache hits (FP auditing), schema-validation failures, safety blocks. Langfuse is MIT and self-hostable free above ~500k MAU.

**The highest-signal quality metric is not an LLM judge — it's re-ask rate within 60 seconds.** A student who immediately rephrases got a wrong sim. Free, unbiased, real-time, and it also detects cache false positives.

OpenTelemetry GenAI semantic conventions moved to a separate repo and **Schema URL is still "TODO"** — instrument with OTel but don't assume attribute names are frozen.

---

## Scaling table (20 sims/student/month)

| MAU | Cache hit | Gemini | Supabase | Obs | **TOTAL** | **$/MAU** |
|---|---|---|---|---|---|---|
| 10,000 | 58% | $186 | $40 | $0 | **$271** | $0.0271 |
| 100,000 | 58% | $1,862 | $235 | $69 | **$2,241** | $0.0224 |
| 1,000,000 | 58% | $18,623 | $4,484 | $621 | **$24,187** | **$0.0242** |

**All-in ~$0.02–0.03 per MAU/month.** At 80% gross margin, break-even list price is **~$0.09–0.12 per student per month** — against a $6/student/**year** market anchor. Enormous headroom.

> **The cost structure is not the problem. Distribution and trust are.**

Marginal cost: **one extra student ≈ 2.4¢/month · one cached sim ≈ $0.0000075 · one generated sim ≈ $0.0022.**

### Where it breaks, in order
| # | Constraint | Breaks at |
|---|---|---|
| 1 | **Gemini terms — under-18 prohibition** | **First real classroom user** |
| 2 | Free tier (trains on data, 10 RPM) | ~2,400 MAU |
| 3 | Tier 1 (300 RPM) at bell peak | ~180,000 MAU |
| 4 | Supabase auth MAU billing | ~$2,925/mo at 1M |
| 5 | Full-fidelity tracing | ~$4,101/mo at 1M |
| 6 | Single-node pgvector HNSW in RAM | ~2M cache rows |
| 7 | Tier 2 (2,000 RPM) | ~1.19M MAU |
| 8 | Tier 3 (~4,000 RPM) | ~2.38M MAU |

**Rate limits break before cost does, every time.** Worry order: legal terms → rate limits → auth billing → observability billing → vector index memory. **Compute never appears.**

---

## Hackathon week — build only these five things (~$12 total)

| Day | Build | Why it doesn't paint us into a corner |
|---|---|---|
| 1 | **Sim spec schema** (Zod → `responseSchema`), render-order field ordering. Fixed client renderer, no `eval`. | The schema *is* the product; everything else is swappable around it. |
| 2 | Single route handler, Node runtime + AI SDK `streamObject` + partial-JSON progressive render. `gemini-2.5-flash-lite`. | Node+Fluid, not Edge — no 25 s trap to unwind later. |
| 3 | **Batch-generate 1,000 curriculum sims ($4.32) and hand-check 50.** Store with `intent_key`. | This *is* the L1 cache, the demo content, and the outage fallback. It only grows. |
| 4 | L0 exact-hash + L1 intent-key lookup in Postgres. **Skip pgvector entirely.** | Two btree lookups get ~45–55% hit rate. Add L2 later without touching the interface. |
| 5 | Log everything to a `generations` table incl. `total_cached_tokens`, TTFT, re-ask-within-60s. | Can't tune a cache you haven't measured — and this table becomes the eval set. |

**Deliberately skipped:** pgvector, multi-provider failover, Langfuse, queues, auth beyond magic link, sandboxing.

**Must NOT skip even in week one:**
1. **Turn on billing** — the free tier trains on prompts and human reviewers read them.
2. **System prompt ≥4,096 tokens** — retrofitting means re-tuning every few-shot example.
3. **Never `eval` generated output** — declarative from day one means never building a sandbox.

⚠️ **Demo-day warning:** on the free tier, 10 RPM means a live 30-student demo takes **180 s to drain**. Pre-seed the exact demo questions into the cache (which is the honest demo anyway — it's the real architecture), or spend $10 for Tier 1 the day before.

---

## Numbers NOT verified — do not treat as fact
- Exact Gemini RPM/TPM/RPD per tier (Google stopped publishing; figures from a Jan-2026 secondary source)
- **TTFT at `thinking_level: minimal`** — all AA figures are reasoning-enabled. The 900 ms estimate is interpolation. **Benchmark it in week one; the entire <8 s claim rests on it.**
- Vertex AI ZDR clause text and EU residency specifics
- Vercel AI Gateway free-tier limits (docs 404)
- Education-platform repeat rates — **no published data exists anywhere**
- HNSW index overhead (~1.6×), vLLM throughput
