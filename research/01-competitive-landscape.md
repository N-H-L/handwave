# Competitive Landscape — key findings

Status legend: **[V]** verified from primary source · **[R]** reported, credible secondary · **[?]** unverified

## The headline: half our thesis is already commoditized

- Google shipped **on-the-fly generated interactive simulations into AI Mode in Search** with Gemini 3, 18 Nov 2025 — and the demo example was a *learning* one (how RNA polymerase works). **[V]** https://blog.google/products/gemini/gemini-3/
- Anthropic reports **500M+ artifacts created** by millions of users. **[V]** https://claude.com/blog/build-artifacts

**Conclusion: "AI generates a simulation on demand" is not a product, it is a feature of the default surface where people already type questions.** Do not lead with it.

## The crack that saves us: frontier models are bad at physics *specifically*

| Benchmark | Result |
|---|---|
| PHYBench (500 real physics problems) | Best LLM **36.9%** accuracy vs human baseline **61.9%** **[V]** https://www.emergentmind.com/papers/2504.16074 |
| PhysCodeBench (physics-aware sim of 3D scenes) | **64.2%** initial generation success; needs multi-agent self-correction + explicit physical validation **[V]** https://arxiv.org/html/2604.23580 |
| PhysReason | Categorises 7 distinct LLM physics failure modes **[V]** https://arxiv.org/html/2502.12054v1 |

A wrong simulation is **worse than no simulation**, because the entire mechanic is "trust the sim over your intuition." A wrong sim installs a new misconception *with authority*.

→ The technical claim is not "we generate sims." It is **"we generate sims that are verified correct, and one-shot frontier generation is 36–64% correct."**

→ Verification is only tractable in a **bounded domain**. Newtonian mechanics + elementary probability admit conservation checks, dimensional analysis, limiting cases, and closed-form ground truth. **The narrow domain is not a limitation — it is what makes the moat possible. Do not broaden it.**

→ Half-life: 24–36 months. Convert it into data before it expires.

## Why explorable explanations never scaled (thesis-critical)

Two causes. AI solves only one.

**Cause 1 — production cost. AI genuinely solves this.**
- Distill.pub's hiatus note: *"the primary bottleneck is the amount of effort it takes to produce these articles and the unusual combination of scientific and design expertise required"* — they gave **50+ hours of help per article** and called it unsustainable. **[V]** https://distill.pub/2021/distill-hiatus/
- Bartosz Ciechanowski, the best in the world at this: **~3.7 articles/year, declining** (5/3/3/3/1/2 for 2019–2024). **[V]** https://ciechanow.ski/archives/ · 543 Patreon members **[V]**
- Nicky Case: *"6 years… honestly, it's time for a change"*, *"being a financially sustainable indie is 50% luck."* **[V]** https://ncase.me/faq/
- oPhysics — 100+ physics sims — is **one retired teacher** working in GeoGebra. **[V]** https://ophysics.com/

**Cause 2 — no business model / public-goods dynamics. AI does not solve this, and may worsen it.**
- Matuschak & Nielsen: tools for thought are expensive to build, cheap to copy; sustainability comes from *"distribution and long-term lock in"*, not product quality. **[V]** https://numinous.productions/ttft/

**Do not pitch "AI removes the production bottleneck, therefore explorables scale." That answers the easier half.**

## Bret Victor's 2024 postscript — endorses our mechanic, warns against our generator

Victor complains the term "explorable explanations" has been *"diluted to mean any article with interactive pictures"* when he meant arguments whose models are **visible, editable, and critically evaluated rather than passively consumed**. **[V]** https://worrydream.com/ExplorableExplanations/

A forced prediction is the anti-decoration move. Interactivity as decoration is exactly what he's condemning.

## Eedi — the closest analogue, and the most useful signal in the report

UK maths, misconception-mapped multiple-choice distractors. Founded by Craig Barton out of Diagnostic Questions, inspired by Dylan Wiliam on formative assessment. Claimed ~70% of UK secondary schools (2020, self-reported). **[V]** https://www.eedi.com/

**The Kaggle competition is the single most valuable data point available to us:**
- "Eedi — Mining Misconceptions in Mathematics" (2024), **$55,000** prize pool, **1,850+ teams**, MAP@25, explicitly testing **generalisation to unseen misconceptions**. **[V]** https://www.eedi.com/news/from-wrong-answers-to-real-insights-how-we-used-a-kaggle-challenge-to-map-student-misconceptions
- Winners used multi-stage retrieve-and-rerank (Qwen + LoRA + contrastive learning).
- **Eedi's own conclusion: misconception prediction is "tough to solve."**

→ Misconception diagnosis is **not** something you get free by calling an LLM. It is a hard ML problem needing labeled data. That is simultaneously the moat and the execution risk.

**Their 2026 pivot is a strategic tell:** rebranded **Eedi Labs**, selling **"Eedi Inside"** as infrastructure to *publishers, AI model developers and learning platforms*; shipped an **MCP server exposing their question bank to Claude**; describe their own school app as **"a testbed"**; earned a **gold EduEvidence certificate from a 2-year RCT**; running the first US RCT of a constrained AI tutor in '26–27.

**Decoded: the company with the deepest misconception asset in the world concluded the app is not the business — the taxonomy is. And that efficacy evidence *is* the product.**

## The validity anchor: Force Concept Inventory

30 five-way multiple-choice items whose distractors encode specific Aristotelian/impetus misconceptions. Hestenes, Wells & Swackhamer 1992. Hestenes' famous finding: **~80% could state Newton's Third Law at course start; <15% fully understood it at course end.** **[V]** https://en.wikipedia.org/wiki/Force_Concept_Inventory

Public, validated across thousands of studies, in exactly our launch domain, **and nobody has productized it as a live diagnostic engine.**

⚠️ Counter-argument to pre-empt: the FCI literature's conclusion favours **Peer Instruction** (Mazur) — predict → commit → *argue with a peer* → resolve. Our mechanic is Peer Instruction with the peer replaced by a simulation. The PI literature suggests **the peer argument is where the learning happens**, not the reveal. Design for that explicitly.

## The graveyard

| Company | Outcome | Lesson |
|---|---|---|
| **Chegg** | 2024 revenue $618M, operating loss −$737M, net loss −$873M; ~97–99% off peak; >50% of staff cut in 6 months of 2025; sued Google Feb 2025 over AI Overviews **[V/R]** | Never build on an information asymmetry the LLM erases. Never depend on organic search. **Effort-removing products get commoditized instantly.** |
| **Knewton** | Raised $180M+, sold to Wiley for **~$19.9M** after Pearson defected **[V]** https://www.edsurge.com/news/2019-05-06-wiley-to-acquire-knewton-s-assets-marking-an-end-to-an-expensive-startup-journey | The base rate for "smart inference layer with no distribution." Structurally the same claim we're making. |
| **Byju's** | $22B → founder says "worth zero"; spent ~$2.8B on acquisitions incl. GeoGebra at $100M **[V]** | — |
| **Wolfram Demonstrations** | 10,000+ interactives killed by the CDF browser-plugin death **[V]** https://community.wolfram.com/groups/-/m/t/1052516 | A content library 90× PhET's size is not a moat if the runtime rots. |
| **Distill** | Killed by production cost, explicitly **[V]** | — |

**Chegg's subtle lesson: our prediction gate is deliberately unpleasant. That is pedagogically correct and commercially dangerous. Consumers do not pay to be told they're wrong.** Argues hard for institutional over D2C.

## The empty quadrant

Axes: *fixed catalog ←→ generated on demand* × *presents content ←→ diagnoses the learner's belief*

- **Bottom-right** (generated / presents content): Gemini AI Mode, Claude Artifacts, ChatGPT, v0, Learn Your Way, Khanmigo. Crowded with trillion-dollar companies.
- **Top-left** (fixed / diagnoses): Eedi, Carnegie/MATHia, ALEKS, the FCI itself.
- **Bottom-left** (fixed / presents): PhET, Gizmos, Labster, Desmos, Brilliant, Ciechanowski, oPhysics, Algodoo.
- **Top-right: empty.** ← us

Read both ways honestly: either genuine whitespace, or a space founders reject because frontier labs eat it. Tiebreaker: the *diagnosis* layer is not on Google's or OpenAI's roadmap, and requires friction they are constitutionally unable to impose.

## YC scan

Full AI-Enhanced Learning list, W2015–S2026, 45 companies. **[V]** https://www.ycombinator.com/companies/industry/ai-enhanced-learning
Closest: Wondering (S2026), Pixley (F2025), SimCare (S2024), Chiron (P2025).
**Not one is doing AI-generated runnable simulations with misconception diagnosis.** Every one is a chat tutor, solver, grader, or roleplay.

## Incumbent scale + price anchors

- **PhET**: ~110 open-licensed sims, **250M uses/year**, 120 languages, 60+ partner integrations, ~16 staff, entirely grant-funded (NSF, Moore, Hewlett, Yidan, Mastercard Fdn), **no AI features anywhere** **[V]** https://phet.colorado.edu/en/about
- **Gizmos/ExploreLearning**: 550+ sims; district licence quoted at **$2,995 min + $6.00/student/year** **[R]** ← this is our price ceiling
- **ASSISTments**: free, nonprofit, **$50M+ federal/philanthropic** **[V]** https://www.assistments.org/about ← sets a $0 floor in US K-12
- **Brilliant**: shipping **Probability in 2026** **[V]** https://www.brilliant.org/about/ ← direct collision with a launch domain
- **Google Learn Your Way** RCT: n=60, ages 15–18, 40 min, vs PDF baseline → **+11pp on 3–5 day retention (78% vs 67%)** **[V]** https://research.google/blog/learn-your-way-reimagining-textbooks-with-generative-ai/ ← the study design we need to beat

## Funding environment

- 2024: **~$2.4B**, worst edtech VC year in a decade **[R]**
- 2025: **~$2.8B global / ~$1.2B US** **[V]** https://news.crunchbase.com/venture/edtech-funding-stays-low/
- Capital concentrating in healthcare education, K-12 teacher-workload AI, corporate upskilling.
- Crunchbase's own caveat: these counts **exclude** horizontal AI tools that millions of teachers use daily. The money isn't leaving education — it's going to the entity that shipped our feature.

## Moats, ranked

**Tier 1 — genuinely defensible**
1. **The prediction corpus.** Nobody else records *what a learner believed before seeing the outcome*. Novel data type, collected free as a byproduct of the core loop, compounds, and is exactly the labeled data the Eedi Kaggle competition proved is the bottleneck. **The only asset no incumbent can buy, copy or scrape.**
2. **Efficacy evidence.** ESSA tiers gate procurement. Takes 18–24 months of calendar time regardless of money. **The only time-locked moat.**
3. **Verified-correctness layer** for a bounded domain. Real today, depreciating over 24–36 months.

**Tier 2 — real but ordinary:** teacher workflow lock-in · curriculum alignment (absence is disqualifying) · brand/trust

**Tier 3 — not moats, don't claim them:** a content library (Wolfram had 10,000, it evaporated) · prompt engineering · "better UX"

## The wedge, in one line

> **Every learning tool records what students answered. Handwave records what students believed. Those are different data, and only one of them tells you what to fix.**

Three reasons it's the right wedge: no competitor contradicts it; it converts a UX gimmick into a data asset collected for free; and **it survives model improvement** — when GPT-7 generates flawless sims our generation advantage dies but the prediction corpus is bigger than ever.

## Three most dangerous competitors

1. **Google.** Category-eraser, not competitor. Free, at the moment of confusion, with Chegg's head on the wall. **Our only shelter is that a search product can never force you to predict before showing the answer.** That UX incompatibility is real and durable — and thinner than we'd like.
2. **Anthropic / OpenAI.** Claude for Education already ships **Learning Mode** (Socratic), campus contracts (Northeastern 50k users, LSE, Champlain), Canvas integration. **One product decision away** from us: "make the Socratic tutor render a sim and require a prediction first." Watch quarterly.
3. **Eedi Labs.** The only one with the diagnostic asset, now attacking as infrastructure *inside* the frontier models via MCP. If they succeed, Claude and Gemini get misconception diagnosis by partnership and our Tier-1 moat evaporates. They're in maths, not physics. **That gap is our window and it is not permanent.**

## Verdict

**Defensibility: weak-to-moderate, entirely contingent on execution sequencing, with a hard clock.**

Decided by whether we spend the next 18 months building generation (dead in 24 months) or building the prediction corpus + efficacy evidence (permanent). **Eedi already made this choice publicly, in the direction advised, and it cost them a decade to learn it.**

→ **Ship the generator as the acquisition surface. Treat it as depreciating. Measure exclusively on prediction-events-captured and effect size in a registered trial.**

## Open research gaps

1. Interactive-sim efficacy meta-analyses (D'Angelo; Smetana & Bell 2012; Rutten 2012) and the guidance counter-argument (Kirschner/Sweller/Clark 2006) — **biggest gap**
2. POE / pretesting effect / productive failure (White & Gunstone; Kornell; Kapur)
3. Probability misconceptions (Konold's outcome approach; Shaughnessy; equiprobability bias)
4. A credible bottom-up science-education-software TAM
5. Defunct AI-simulation startups — graveyard search incomplete, do not assume it's empty
6. Whether anyone has productized FCI-based diagnosis (low-confidence negative)
