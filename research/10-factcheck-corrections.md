# Independent fact-check — corrections to the research corpus

14 load-bearing claims re-verified against primary sources by an agent with no access to the earlier reports. **Four were wrong. Two were wrong in ways that reversed the conclusion.** Corrections below override the earlier files.

---

## 🔴 REFUTED — the VanLehn stability number was INVERTED

**Claimed** (in `08-learner-modeling.md`, and stated to the user): *"only 2 of 12 students kept the same bug set across a 2-day retest = 17% stability."*

**Actual text**, ERIC ED245880:

> *"of these 12 students, **two (17%) exhibited bug migration**, verifying the predictions of the Repair Theory."*

**17% is the INSTABILITY rate. 10 of 12 — 83% — kept the same bug set.** The claim was backwards.

### What this does to the argument
The "misconceptions are exhibited on only ~17–40% of occasions" convergence in `08` **loses its strongest leg.** Palmer (6% of 545) and CAOS (19–40%) stand; VanLehn now points the *other* way.

**The defensible instability statistic from this paper** is the DEBUGGY analysis of all 67 two-test students: stable procedure 23 (34%) · bug migration 2 (3%) · **unstable/unexplained 30 (45%)** · unanalysable 12 (18%).
⚠️ **And even that is contested within the paper** — hand analysis of the same 67 revised it to **39 (68%) stable, only 13 (19%) unexplained.**

**Net effect on the design:** the *direction* of the recommendation survives — graded state, multiple contexts before a status write — but it now rests on Palmer, CAOS and Konold, **not** on a clean four-way convergence. **Do not put the 17% figure anywhere.**

---

## 🔴 OVER-EXTENDED — the Chan et al. "writing your reasoning backfires" inference

**The numbers are exact and verified:** k = 52, N = 6,878; debunking d = 1.14–1.33; persistence d = 0.75–1.06; and verbatim *"Persistence was stronger and the debunking effect was weaker when audiences generated reasons in support of the initial misinformation."*

**But the inference drawn from it is not supported.** The moderator is audiences generating reasons **in support of the misinformation** — counter-attitudinal argument generation that entrenches a false belief. **That is not the same construct as asking a learner to write out their reasoning about their own answer.**

The paper also reports the opposite-signed result nearby: *"A detailed debunking message correlated positively with the debunking effect."*

Full title is *"Debunking: A Meta-Analysis of the **Psychological Efficacy of Messages Countering Misinformation**."*

→ **Soften considerably or drop.** The rationale-arm experiment is still worth running — it is a genuine open product question — but **Chan et al. is not evidence that the rationale will hurt.** Do not cite it that way.

---

## 🟡 MISATTRIBUTED SCOPE — Sleeman et al.

The quoted sentence *"reteaching seems as effective as MBR"* **does not appear.** Actual text:

> *"The three studies discussed in this article suggest that **when initial instruction and remediation are primarily rule-based and procedural, remedial reteaching appears to be as effective as MBR.** … **It is vital to investigate the range of subjects, instructional approaches, and student age-ranges for which this result holds. For example, if either or both instruction and remediation had been conceptually based, then the results might have been different.**"*

**The authors explicitly limit it themselves.** Samples: 44, 48, and 27→24 students. Linear-equation algebra. Human tutors.

**Handwave is conceptually based, not procedural** — which is precisely the case the authors flag as possibly different. **Not overturned, but much narrower than I represented.**

⚠️ **Keep the recommendation anyway:** "reteach the concept" should still be the active control. The finding is a warning worth designing against even at its narrow scope, and VanLehn 2011 (step-based d=0.76 vs answer-based d=0.31) shows granularity *does* matter — which cuts against the broad "CAI ≈ ITS" reading.

---

## 🟡 UNCONFIRMED — the Gemini 3.7 Flash degeneration "bug"

Thread verified to exist: topic 178681, created 17 Aug 2026, **every detail verbatim** (33% synthetic / up to 100% production, temperature-proof, 3-flash-preview clean, 241 runaway calls, ~$60).

⚠️ **But: `posts_count: 1`, `views: 82`, zero replies, no Google acknowledgement, no fix confirmed.**

**This is one user's unanswered post, not a documented platform defect.** I described it as an "active regression" — over-claimed.

Related-but-distinct older threads exist (#175138 Jul 2026 on Vertex, #107176 Oct 2025 on 2.5-flash), suggesting a **recurring family of issues** — but nothing authoritative.

→ **Keep the engineering mitigations** (cap `maxOutputTokens`, repetition detector, pinned fallback model) — they are cheap and correct regardless. **Do not cite it as an established bug. Biggest credibility risk in the set.**

---

## 🟡 STALE — PHYBench

Verified exact: *"Even the best-performing model, **Gemini 2.5 Pro**, achieves only **36.9%** accuracy compared to human experts' **61.9%**."*

⚠️ **Submitted April 2025, last revised 18 May 2025, no journal_ref, no published version in OpenAlex — unrefereed preprint. And the frontier has moved a long way past Gemini 2.5 Pro since.**

→ **Never state in the present tense.** Date-stamp it: *"as of the April 2025 preprint, with Gemini 2.5 Pro."* The verification-layer argument should rest on our own measured eval numbers, not on a 16-month-old snapshot.

---

## 🟡 PRICING — the Pivot comparator was wrong for K-12

**$11.10/seat/semester is the HIGHER-ED tier** (Flexible Institutional, Student Pay, Course Codes).
**Grades 6–12 Classroom is $6.10 per seat per YEAR** — a **3.6× difference in annual cost.**

→ Our beachhead is higher-ed intro physics, so **$22.20/student/year remains the right anchor for that market.** But the K-12 TAM arithmetic in `06` should use **$6.10**, and quoting $11.10/semester against a high-school use case is a real credibility risk.

---

## 🟡 PhET licensing is not a clean split

Verified: all **15 libraries MIT** (scenery, axon, dot, kite, sun, joist, phetcommon, tambo, tandem, phet-core, scenery-phet, griddle, utterance-queue, chipper, perennial). **21 of 24 sims GPL-3.0** — **but energy-skate-park, wave-interference and fractions-intro are MIT.**

→ Say *"the common libraries are MIT while most simulations are GPL-3.0"* and **check each sim individually.** Asserting a clean split is wrong.

---

## 🟡 FCI details

- Table II title ✅ verbatim, six categories ✅, item-and-distractor mapping ✅
- ⚠️ **The body text says 28 misconceptions; the table enumerates 30.** Attribute "28" to the authors rather than asserting it.
- ⚠️ **`davidhestenes.net` no longer resolves.** Use the Wayback copy of the authors' reprint.
- 🔴 **The FCI IS gated today.** The 1992 paper says *"A copy of the instrument … is included here for teachers to use in any way they see fit"* — but PhysPort now restricts downloads to verified faculty, and AMTA distributes a password-protected PDF of the **revised 1995** version. **Do not say the FCI is freely available.**

---

## ✅ VERIFIED EXACTLY — and the delMas garble is explained

**delMas, Garfield & Chance (1999):**
> *"students displayed acceptable reasoning … on only **22%** of the items on the pretest, increasing to … about **49%** on the posttest."*
> *"the new activity students went from having correct or good reasoning on **16%** of the pretest items to … **72%** of the posttest items."*

**Both figures confirmed. N = 89 (guided discovery) vs N = 141 (prediction-confront).**

**The source of the "16 vs 36" garble is identified** — it is a *different metric* in the very next sentence: choosing the **correct pair of graphs**, not reasoning quality. *"the initial activity students chose the correct pair of graphs on an average of 16% … the new activity students were correct on 36%."*

⚠️ **Caveat for any pitch: two different cohorts compared across terms, not a randomised head-to-head.**

**Also verified exactly:** Gemini API under-18 terms · Chan et al. numbers · Konold 1995 wording · VanLehn 2011 (with the caveat that **d=0.76 is step-based specifically; substep-based measured 0.40**; answer-based/CAI 0.31) · all five AP 2026 counts (per Trevor Packer's 2026 commentary) · ADA 2027/2028 dates (correctly post-extension, ⚠️ but an *interim* rule).

### On Vertex — both agents agree, with a precision
Cloud/Vertex **§20(d) carries the under-18 *audience* restriction verbatim**, but **not** the personal *"you must be 18 years of age or older to use the APIs"* clause.

→ **Moving to Vertex removes the developer-age requirement, not the under-18-audience prohibition. Do not pitch Vertex as a workaround.**

Bonus, same page: *"Use of Google AI Studio and Gemini API is for developers building with Google AI models for **professional or business purposes, not for consumer use**."*

---

## What is safe to put in a public pitch

✅ **Safe, verified verbatim:** delMas figures · Gemini under-18 terms · Chan et al. *numbers* · Konold 1995 · VanLehn 2011 · AP 2026 counts · ADA dates

⚠️ **Usable with the stated qualifier:** Pivot pricing (say **$6.10/seat/year** for K-12) · PHYBench (date-stamp it) · PhET licensing ("most sims are GPL-3.0", verify per sim) · Sleeman (quote correctly, keep the procedural-algebra scope) · FCI ("six categories"; attribute "28" to the authors; **do not** say it's freely available)

🔴 **Do NOT use:**
- **The VanLehn 17% stability line — it is factually backwards**
- **Chan et al. as a "writing your reasoning backfires" argument** — numbers solid, inference unsupported
- **The Gemini 3.7 Flash thread as an established bug** — one unanswered post, 82 views
- **PHYBench in the present tense** — a 16-month-old snapshot
