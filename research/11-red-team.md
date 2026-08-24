# Adversarial review — the case against Handwave

Agent briefed to assume the plan is wrong and find out why. Deliberately hostile; read the fairness caveats it flagged itself. All findings from direct primary-source fetches — its search budget was exhausted before it began.

---

## Verdict: **build the demo, do not start the company**

---

## 🔴 Flaw 1 — No moat. The product shipped free to our beachhead six days ago. (~93% confidence)

Four independent hits on the "prediction capture is the moat" thesis:

1. **Prediction-gating is a documented Pivot Interactives feature since January 2021.** Not a novel mechanic. Not ours.
2. **The architecture is already published** — LivePhys, arXiv, July 2026.
3. **The corpus is public, synthesizable, and barred from sale by FERPA/SOPIPA.** (Consistent with `09-compliance-and-safety.md`: NY 121.1(c), COPPA FAQ N.5, India s.9(3).)
4. **Google shipped generated simulations plus knowledge-gap diagnosis free to US college students on 19 August 2026 — and their demo example is a pendulum.**

**The comparable, from SEC XBRL (CIK 0001364954):** Chegg revenue **$776.3M (2021) → $376.9M (2025)** — **−51.4% from peak, −38.9% in 2025 alone.** The largest homework-help business in US higher education lost half its revenue to general-purpose AI.

> That is the single most relevant comparable to "help students understand physics problems."

---

## 🔴 Flaw 2 — Fine-grained diagnosis is past the interaction plateau (~85%)

**VanLehn (2011) Table 1 — the numbers I under-read:**

| Comparison | Effect size |
|---|---|
| answer-based → step-based | **+0.45** (0.31 → 0.76) |
| **step-based → substep-based** | **+0.16** |
| **substep-based → human tutor** | **−0.12** |

> **The entire payoff is in answer→step granularity. Everything finer is noise.** Handwave's misconception diagnosis lives in the region where the measured returns are ~0.16 and then negative.

Compounding:
- **Sleeman:** model-based remediation doesn't clearly beat reteaching (scope-limited — see `10-factcheck-corrections.md` — but directionally live).
- **Cognitive conflict shows weak-to-nonexistent effects and appears to hinder low achievers** — the exact users this is meant to serve.
- **Khan Academy independently concluded on-the-fly generation is the wrong architecture.**

---

## 🔴 Flaw 3 — The verification layer verifies the wrong thing (~80%)

**This is the finding I most wanted attacked, and it broke.**

The agent constructed **four executable counterexamples that pass all four checks** (schema, bounds, dimensional analysis, conservation, expected-outcome assertion) **and teach falsehoods:**

| Counterexample | Why it passes | What it teaches |
|---|---|---|
| **Pendulum at large amplitude** | Energy conserved exactly; dimensions correct; stated outcome occurs | The small-angle period. **Real period at 90° is +18.0% longer.** A student who correctly says "it depends on amplitude" is **told they are wrong.** |
| **Free fall, vacuum idealization** | All invariants hold | Diagnoses "heavier objects fall faster" as a misconception — **but in air a shot put beats a baseball by 18.8 ms.** The belief is *true* in the student's world. |
| **Radial fictitious forces** | **Provably invisible to conservation and dimensional checks** — they do no work and have correct units | Centrifugal force as real |
| *(fourth in agent transcript)* | — | — |

> **Determinism launders hallucinated physics into authoritative-looking physics.** Conservation and dimensional checks are necessary and nowhere near sufficient. A sim can be numerically exact and pedagogically false.

**This converges exactly with *Aetna v. Jeppesen* in `09`:** the chart's data was *entirely accurate*; the defect was *"in the graphic presentation of that information."*

**Required fixes if we build any of this:** explicit idealization toggles surfaced in the UI (air on/off, small-angle on/off) · never diagnose a belief that is true under conditions the student actually inhabits · a validity-range field on every spec, enforced.

---

## 🔴 Flaw 4 — NEW, and independently fatal to the funding plan (~90%)

**NSF 26-510, verbatim:**

> *"The primary employment of the Principal Investigator (PI) must be with the small business at the time of award and for the duration of the award… **Primary employment is defined as at least 51 percent employed by the small business.** NSF normally considers a full-time work week to be 40 hours and **considers employment elsewhere greater than 19.6 hours per week to conflict with this requirement.**"*

**And NSF explicitly closes the STTR workaround** — the standard advice for university-affiliated founders:

> *"For NSF STTR: … **the PI must be an employee of the proposing small business for at least 51% of his/her time (as stated above)**."*

> **"Solo full-time student funded by NSF SBIR" is a contradiction in terms unless the founder stops being a full-time student.** The company must legally employ the founder at ≥51% time, on payroll, *before award money exists*.

Plus:
- **Funding rate, from NSF directly: "between 10% and 20%."**
- Project Pitch is gated: max 2/company/year, max 3 ever for the same technology.
- **Fit risk:** the solicitation is titled *"Developing **Deep Technologies**"* and states *"**NSF does not fund straightforward engineering or incremental product development tasks**."* An LLM wrapper generating physics courseware is a hard sell — **especially now that both halves of the architecture are published on arXiv.**
- **Timeline: ~9–11 months to first dollar at 10–20% odds.**

### ⚠️ Fairness caveats the agent flagged itself
- **Congress rejected the FY2026 cut.** P.L. 119-74 appropriated **$8.75B (−0.9%)**, with Research & Related Activities held **exactly flat**.
- **The Dec 2025 pitch pause was an authorization lapse and it is fixed** — P.L. 119-83 reauthorized SBIR/STTR **through FY2031**; pitches reopened 2 June 2026.
- **Grant terminations were not the mechanism** — only 9 SBIR/STTR awards terminated ($8.79M) against a ~$640M portfolio.

> **Honest framing: timing, authorization and eligibility risk — not program cancellation.** But award volume fell 288 (2019) → 196 (2024) → **120 (2025)**, and the FY2027 request re-proposes the ~55% cut with the funding rate projected 19% → 8%.

---

## 🟢 The one thing it could not break

**Crouch, Fagen, Callan & Mazur (2004): passive observers learn *nothing* over students who never saw the demo, while predictors "display significantly greater understanding."**

The agent's own words: *"That instinct is correct and most edtech founders don't have it."*

⚠️ **But:** it is a 2004 published result **that a static HTML file on a university server already implements**, and the solo ceiling is roughly half the discussed version — **Lasry (2016): 3% / 10% / 21%** across conditions.

> **A feature worth building, and a company that cannot be defended.**

---

## What it recommends building instead

**Steps 1, 2 and 6 of the ILD protocol. Nothing else.**

- **8–12 hand-authored, verified simulations** with **explicit idealization toggles**
- **A hard written-prediction gate**
- **The learner's prediction shown beside the outcome**

**Explicitly NOT:** spec generation · misconception enum · diagnostic classifier.

**Why this specific cut:**
- **Buildable in 11 days.** (Its assessment of the full plan: **4–6 weeks, and it "dies on event detection."**)
- **Demos without breaking.**
- **Four independent evidentiary supports:** French & Cummings (abridged ILD matches the full protocol at half the time) · Miller 2013 (solo prediction, discussion forbidden, **+20–23% correct observation**) · VanLehn (everything past step-granularity is wasted) · Khan (don't generate).

---

## ⚠️ Where a defender has room to push back

The agent listed its own gaps, unprompted:
- Subject-level AP volumes came from a specialist secondary source, not College Board's own tables
- AIP intro-physics enrolment could not be retrieved
- Incumbent per-student pricing (Mastering Physics, WebAssign, Achieve, Expert TA) and market share **unverified**
- LTI 1.3 / SOC 2 / HECVAT specifics **unverified**
- **No solo-founder edtech base rates were obtained — do not let any figure on that appear anywhere without a source**

**None of those gaps touch the four ranked flaws.**

### My own reservations about this review
1. **The Google-shipped-19-Aug-2026 claim is load-bearing and single-sourced.** Verify it directly before acting on it.
2. **The Pivot prediction-gating claim needs a first-party check** — it substantially weakens Flaw 1 if wrong, and substantially strengthens it if right.
3. The agent was *instructed* to be hostile. Flaws 3 and 4 are the strongest because they are **constructive** — executed code and verbatim solicitation text. Flaws 1 and 2 are interpretive and depend on claims worth verifying.
