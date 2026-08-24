# Learner Modeling — key findings

---

## 🔴 THE CONVERGENT NUMBER — three literatures, three domains, four decades apart

> **A misconception is exhibited on roughly one-fifth to two-fifths of the occasions where it *could* be exhibited.**

| Source | Domain | Consistency |
|---|---|---|
| **VanLehn (1982)** subtraction bugs, 2-day retest, no intervening instruction | arithmetic | **2 of 12 = 17%** kept the same bug set |
| **Palmer**, 8 physics isomorphs | physics | **6% of 545** fully consistent |
| **CAOS** (delMas et al. 2007), both/ever ratio across 6 items | statistics | **19–40%** |

### The four hard consequences
1. **Never store a boolean.** Store a graded, decaying belief-activation strength.
2. **Never write a status change from one prediction event.**
3. **Require ≥3 surface contexts before any status write.**
4. **Report inconsistency as a finding, not as noise to be resolved into a label.**

---

## 🟢 The bug-library question is settled — and the answer favours a *generative* architecture

**VanLehn (1982)**, LRDC-TR-ONR-8 — free full text at [ERIC ED245880](https://files.eric.ed.gov/fulltext/ED245880.pdf). ⚠️ *The journal version ("Bugs are not enough", J. Math. Behavior 1982) is not Crossref-indexed — cite the tech report.*

**N = 895** subtraction students, tests designed with DEBUGGY for high diagnosticity:

| Category | n | % |
|---|---|---|
| Correct algorithm | 99 | 11% |
| Slips only | 181 | 20% |
| **Buggy (bug assigned)** | **337** | **38%** |
| **Undiagnosed** | **277** | **31%** |

VanLehn, verbatim: ***"a third of the students who committed errors could not be modelled with bugs and slips."***
And the killer: ***"the proportion assigned to the Undiagnosed category remained relatively constant across grade levels."*** **Instruction removes bugs. It does not remove unanalysable errors.**

**Library economics were bad and getting worse:** 77 distinct bugs actually occurred · ***"About half the bugs (32) were quite rare, occurring only once or twice"*** · **27 of the 104 library entries never fired at all** in 925 students · growth across studies +45, +15, +55, with VanLehn noting it *"appears to be converging rather slowly."*

### Combinatorics (Burton, DEBUGGY)
> *"**thirty-seven percent of the diagnoses were compound bugs**… We have observed students with as many as **four bugs**… **With 110 primitive bugs, this leads quickly to more hypotheses than can be feasibly examined (approximately 10⁸) by exhaustive search.**"*

🔴 **And bugs do not compose cleanly:** *"on the problem 313−208, a student who has both the smaller-from-larger bug and the n−0=0 bug will get the **right answer**, 105."*
→ **A correct answer does not eliminate a misconception hypothesis. Build that into the evidence model or you will systematically under-diagnose.**

🟢 One encouraging number for item design: *"we were able to design a test capable of distinguishing among **1200 compound bugs with only 12 problems**."* **Diagnostic item design is extremely high-leverage.**

### Generation beat enumeration on the metric that matters
**Repair Theory** (Brown & VanLehn 1980, *Cognitive Science* 4:379–426): *"generates 33 different subtraction procedures… **21 are well documented bugs**, one is a star-bug, one is correct, and **the other 10 have not been observed** and hence are the theory's predictions… **in the intervening three months, 6 of the predicted bugs were actually found.**"*

Honest self-report: it generates only *"21 of the observed 89 bugs"* (~24%). With nine hand-tailored interrupt conditions it reaches ~48% — **but they refused to adopt it**: *"To do so would make the theory too easily tailored… **in a sense, they are just as ad hoc as a list of the bugs themselves.**"*

| | Enumerated library (DEBUGGY) | Generative theory (Repair Theory) |
|---|---|---|
| Hand-authored primitives | ~104 bugs | **9 core procedures** + impasse/repair rules |
| Coverage | 38% of students | ~24% of observed bugs, cleanly |
| Predicts unobserved errors | No | **Yes — 10 predicted, 6 confirmed in 3 months** |
| Falsifiable | Not really | **Yes** |
| Explains instability | No (treats as noise) | **Yes — bug migration is a prediction made before observation** |

> **Restructure the schema so `mal_rule` is *derived* from (p-prim × context × repair), not enumerated per misconception.** That buys (a) a small authored library, (b) predictions about untested contexts, and (c) an explanation for the instability we will certainly observe.

DEBUGGY's one clear win, worth keeping for gold-set design: against human expert diagnosticians, *"In almost every case (**220 out of 233, or 94%**), there was substantial agreement… and in many cases (**193, or 83%**) their diagnoses were identical."* **The search algorithm was never the bottleneck.**

---

## 🔴 The result that ended the paradigm — and our required control condition

**Sleeman, Kelly, Martinak, Ward & Moore (1989)**, *Cognitive Science* 13(4):551–568. ERIC ED294736, verbatim:

> ***"for algebra, when taught procedurally with this age group, reteaching seems as effective as MBR [Model-Based-Remediation]"***

**Sophisticated misconception-targeted remediation did not beat simply reteaching the material.**

> 🎯 **Make "reteach the concept" the active control condition.** If Handwave's targeted intervention doesn't beat "show them the correct explanation again," the diagnosis pipeline is expensive decoration. **This is the single most likely way our efficacy claim fails.**

Compounding: Sala & Gobet — active vs passive control collapses effect sizes by ~85%. Kulik & Fletcher — locally developed tests inflate ITS effects.

### Calibrate the ceiling
**VanLehn (2011)**, verbatim: *"It is widely believed… **d = 0.3, 1.0, and 2.0** respectively. **This review did not confirm these beliefs.** Instead, it found that **the effect size of human tutoring was much lower: d = 0.79. Moreover, the effect size of intelligent tutoring systems was 0.76.**"*
**Kulik & Fletcher (2016)**, 50 controlled evaluations: **median 0.66 SD** — *"the amount of improvement… depended to a great extent on whether improvement was measured on **locally developed or standardized tests**."*

> **d ≈ 0.76 is the ceiling for a good ITS, and the field's whole advantage over dumb answer-checking is ~0.76 vs ~0.3. The marginal return on very fine-grained error modelling is small relative to its authoring cost** — the structural argument for a small library.

---

## 🎯 Sim #1 should be Konold's coin item

**Konold (1995)**, *JSE* 3(1) — [free full text](https://jse.amstat.org/v3n1/konold.html). Two-part item, same four coin-flip sequences, same page:

> *"When we first administered Part 1… we expected the majority would apply the representativeness heuristic… However, **roughly 70% of the subjects correctly responded e**… We became suspicious after reading the written justifications, some of which were of the form '**Any of the sequences could occur.**'"*
>
> *"**In several administrations of this two-part item, slightly over half of the subjects who selected e on Part 1 did not select e on Part 2**… **this inconsistency results from subjects' applying different perspectives to the two parts of the problem.** In Part 1, many subjects think they are being asked, in accordance with the **outcome approach**, to predict which sequence will occur."*

> **Build this as sim #1. It demonstrates the entire product thesis in thirty seconds: the multiple-choice answer was right, the belief was wrong, and only the written prediction reveals it.** It fits on one screen, and the free-text justification — exactly what Handwave collects — is what exposes it.

---

## The probability instrument to copy: Garfield's SRA

**Garfield (2003)**, *SERJ* 2(1):22–38 — [free PDF](https://iase-pub.org/ojs/SERJ/article/download/557/420) *(note: `iase-web.org/documents/SERJ/…` paths are dead; use the OJS instance)*.

20 MCQ items where **each option is a reasoning statement, not just an answer**. Produces **8 correct-reasoning + 8 misconception scales**:

1. Misconceptions involving averages · 2. **Outcome orientation** · 3. **Good samples must represent a high % of the population** · 4. **Law of small numbers** · 5. **Representativeness** · 6. Correlation implies causation · 7. **Equiprobability bias** · 8. Groups only comparable if same size

**A ready-made, validated, item-level misconception tag set for our probability domain. Take it.**

⚠️ **But its psychometrics are the most important caveat here:**
> ***"the intercorrelations between items were quite low and that items did not appear to be measuring one trait or ability."***
> ***"The resulting correlations were all extremely low, suggesting that statistical reasoning and misconceptions are unrelated to students' performance in a first statistics course."***

Test–retest at one week (N=32): **.70 correct reasoning / .75 incorrect reasoning.** Prevalence (0–2 scale, US/Taiwan): **equiprobability bias 1.12 / 1.12** — most prevalent by a wide margin.

## CAOS: probability specifically does not budge
**delMas, Garfield, Ooms & Chance (2007)**, *SERJ* 6(2). 40 items, α = 0.82, matched pre/post N = 763. Overall **44.9% → 54.0%** — *"only a small average increase of 9 percentage points."*

**Section 7.7, verbatim:** ***"The probability topics presented in the CAOS 4 test were quite difficult for students. Students showed no gains from pretest to posttest."***

| Item | Pre | Post | p |
|---|---|---|---|
| 36 — conditional probability from a two-way table | 52.7% | 53.0% | **0.909** |
| 37 — simulate to find P(≥4 of 6 correct by chance) | 20.4% | **19.5%** | **0.659** |
| 32 — sampling error for informal inference | 16.9% | 17.1% | 0.883 |

***"Eighty percent of the students did not demonstrate knowledge of how to simulate data."***
On p-values: of 387 who answered item 25 correctly at posttest, ***"only 5% also indicated that the statements for items 26 and 27 were invalid"***; 39% endorsed both incorrect interpretations.

🔴 **Six misconceptions were MORE prevalent after the course than before** (all p ≤ .015), including *correlation ⇒ causation* (27.1% → 35.9%).

---

## 💡 Equiprobability bias — the reframe changes the remediation target

**Gauvrit & Morsanyi (2014)**, *Advances in Cognitive Psychology* 10(4), verbatim:

> *"researchers… have discussed the EB as an example of a mathematical 'misconception' about randomness. **Here we will argue that this is not the case. Although the EB might lead to reasoning errors, it is based on a sound mathematical assumption about randomness.**"*
> *"**the mathematical theory of randomness does imply uniformity. However, the EB is still a bias, because people tend to assume uniformity even in the case of events that are not random.** The pervasiveness of the EB reveals a paradox: **The combination of random processes is not necessarily random.**"*

> **The student's belief is correct. The error is failing to notice that a *function* of random variables is generally not itself uniform** — sum of two dice, Monty Hall's posterior, the two-children problem.
> **The remediation target is the closure property, not the definition of randomness.**

This is Hammer's p-prim point arriving independently in probability: **model the mis-*activation*, never the "false belief."** The same representational commitment covers both launch domains.

⚠️ **Prevalence within the construct varies wildly by item** ("equally likely" response rate): raffle **4–9%**, two-children **89–96%**, hospital **48–79%**. Monty Hall correct responses across five studies: **3–21%**.
→ **A single "equiprobability bias" strength parameter estimated from one item is meaningless.**

**Falk & Lann (2008)** — uniformity as a general judgment attractor across many surface tasks. That is a p-prim in all but name → **author ONE graded "uniformity attractor" node rather than separate equiprobability / gambler's-fallacy / law-of-small-numbers nodes.**

**Fischbein & Schnarch (1997)**, N=98, grade 5 → college: ***"availability was the only [misconception] that was stable across age groups."*** Everything else moved — some declining, some **growing**.

---

## What an LLM misconception classifier can actually achieve

### Eedi Kaggle 2024, reconstructed from HF row counts + six solution repos

| | |
|---|---|
| Metric | MAP@25 |
| **Misconception label space** | **2,587** (hard-verified: HF `cdtmc/eedi-ir`, `num_rows = 2587`) |
| Labelled (question, distractor) pairs | 4,370 |
| **1st place private MAP@25** | **≈ 0.64** ⚠️ *sources disagree: 0.638 vs 0.639* |
| Retriever-only reference | MAP@25 **0.4238**, R@25 .8126 |
| Zero-shot embedding baseline | MAP@25 **0.069** |

Every top solution was **retriever → reranker with LLM backbones plus heavy LLM-generated synthetic data**. 1st place distilled 6k chain-of-thought samples from **Claude 3.5 Sonnet** and fine-tuned Qwen2.5 at 7B–72B.
→ **Validates generate-retrieve-rerank, and shows the data flywheel shape: synthetic items from a strong model, then fine-tune a small one.**

> 🟢 **How to read 0.64 for Handwave — it's good news.** That is a **2,587-way** retrieval problem with unseen misconceptions in the test set. **Our library is 10–20 per domain.** A ~20-way classification with 3 gold examples each is a fundamentally easier task.
> **This is now a *quantitative* argument for keeping the library small, not merely an authoring-cost one: label-space size is the dominant difficulty term, and we control it.**

### But calibrate against the which-error ceiling
**Option Tracing** (Ghosh, Raspat & Lan, arXiv 2104.09043), Eedi >15M responses:

| Model | Option accuracy | Correctness accuracy |
|---|---|---|
| **Majority-class baseline** | **57%** | — |
| **BiGIKT (best)** | **66.16%** | 75.62% |

1. *"a significant dropoff (**≈10%**) in accuracy on the option prediction task compared to correctness prediction."* **Predicting *which* error is materially harder — the best model beats the majority baseline by 9 points.**
2. ***"performance gains on the option prediction task provided by complex model architectures are marginal."*** NCF → BiGIKT buys 1.4 points across 15M responses.
→ **Architecture is not the bottleneck. Ship Elo.**

### 🎯 The free-text number that is actually ours
**MiRAGE** (arXiv 2511.01182) on Kaggle's 2025 *MAP — Charting Student Math Misunderstandings* (**open-ended student responses**, not MCQ distractors): retrieval → CoT reasoning → reranking gives **MAP@1 / @3 / @5 = 0.82 / 0.92 / 0.93** vs 0.74 / 0.83 / 0.85 for retrieval alone. **Removing reasoner fine-tuning drops MAP@1 to 0.54.**

> **On free text, with a reasoning stage, MAP@1 = 0.82 is achievable. That is our realistic target, and the reasoning stage is worth 28 points.**

### ⚠️ Warning on LLM student simulation
**Sonkar et al. (2024)**, arXiv 2410.12294: *"LLMs trained on misconception examples can efficiently learn to replicate errors. **However, the training diminishes the model's ability to solve problems correctly, particularly for problem types where the misconceptions are not applicable.**"*
→ If we fine-tune a model to simulate a misconception-holding student (for synthetic data or distractor generation), **it loses correct competence elsewhere.** Calibrate the correct:misconception training ratio deliberately, and validate on problems where the misconception does not apply.

---

## Four changes to the design

1. **Make the generative layer primary.** `mal_rule` derived from (p-prim × context × repair), not enumerated. Small authored library, generated surface behaviour.
2. **Keep the library small — now for a measured reason.** Label-space size dominates difficulty. Merge equiprobability / gambler's fallacy / law of small numbers into **one graded "uniformity attractor" node**.
3. **Graded state, settled by four independent measurements.** Konold 1989 (*"beliefs individuals hold to differing degrees"*), VanLehn 17%, Palmer 6%, CAOS 19–40%. **Never a boolean. Never a status write from one event.**
4. **Active control = "reteach the concept."** Sleeman et al. The most likely way the efficacy claim fails.

## Three validity threats, with verified numbers
1. **The taxonomy may not name real entities.** FCI factor structure contested (Huffman & Heller 1995); SRA items *"did not appear to be measuring one trait"* and misconception scores were uncorrelated with course grades; 27 of 104 DEBUGGY bugs never fired; 32 of 77 observed bugs occurred once or twice. → *Dimensionality check at N = 200.*
2. **Free-text diagnosis is less reliable than the UI will imply.** Option prediction beats a majority baseline by 9 points on 15M responses; MalruleLib drops 66% → 40% cross-template. → *Abstention thresholds, confidence-weighted updates, a human gold set from week one, and the reasoning stage (worth 28 MAP@1 points).*
3. **Repair measured in the teaching context is not repair.** Singh: 72% → 20% on identical physics; Konold's coin item: 70% "correct" manufactured by framing, over half flipping on the mirror question; Shtulman & Young: instruction closes the accuracy gap and leaves the **latency** gap untouched. → *≥3 surface contexts before any status write, a sign-flipped item per misconception, speeded relapse probes with latency recorded.*

## ⚠️ Unverified
Brown & Burton 1978 full text (403 — the bug counts are quoted via VanLehn) · *Mind Bugs* coverage stats · Konold et al. 1993 item-level percentages · Ohlsson's constraint-based critiques (citations verified, texts closed) · Eedi team count, prize, and last digit of the winning score (third-party aggregators only) · FSRS-7 equations
