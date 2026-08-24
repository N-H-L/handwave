# Business Model, Unit Economics & Funding — key findings

All figures pulled from primary sources: SEC XBRL/EDGAR, NSF Awards API, ProPublica Nonprofit Explorer, direct page fetches. ⚠️ = estimate or unverified.

---

## 🔴 THE CENTRAL FINDING

Built bottom-up from real exam counts, the **entire US population of AP Physics (1, 2, C) + AP Statistics students is ~569,600/year.**

At the highest *verified* comparable price (**Pivot Interactives, $11.10/seat/semester = $22.20/student/year**), **owning 100% of that market is $12.6M of annual revenue.** At the $6 Gizmos anchor it is $3.4M.

> **That is the whole launch-domain business. It is not a venture-scale market.** Everything else follows from this arithmetic.

### What $100M of revenue would actually require
| Path | Requirement |
|---|---|
| Institutional @ $22.20 | **7.9× the entire US AP physics+stats population** |
| Institutional @ $12.00 | **53.7% of every US public high schooler, grades 9–12** |
| Consumer @ $81.66/sub | **13,354,305 MAU** at Duolingo's world-record 9.17% conversion |

**All three are implausible for Newtonian mechanics and elementary probability.** This is arithmetic, not opinion.

---

## 🟢 The second finding: caching is the wrong lever — REUSE is

**Output tokens are 95.5% of a cached generation call's cost.** Perfect caching gets 29% off generation. That is the ceiling of the caching lever.

The real lever is **R — the reuse factor**, students served per simulation generated:

| R | Cost/session | | R | Cost/session |
|---|---|---|---|---|
| 1 (bespoke per student) | $0.0665 | | **20** | **$0.0106** |
| 2 | $0.0371 | | 50 | $0.0088 |
| 5 | $0.0194 | | 100 | $0.0082 |
| 10 | $0.0135 | | ∞ (diagnosis only) | $0.0077 |

> **Reuse from R=1 to R=20 cuts cost 6.3×. Caching cuts it 1.3×. Reuse is ~5× more powerful, and they compound.**

**Design implication:** *"generates simulations on demand"* should mean it **feels** on-demand, not that it **is** per-student-bespoke. Generate against a canonical spec, cache the artifact, vary the **parameters client-side (free)** rather than regenerating (expensive). The genuinely per-student, genuinely LLM-shaped work is the **diagnosis** — $0.00255 a shot. **That is also the part that is defensible.**

### 🔴 Gross margin at the $6 Gizmos anchor — the table that decides the business

| Sessions/yr | R=1 | R=5 | R=20 | R=100 |
|---|---|---|---|---|
| 30 | 66.7% | 90.3% | 94.7% | 95.9% |
| 100 | **−10.9%** | 67.6% | 82.3% | 86.3% |
| 250 | **−177.2%** | 19.1% | 55.9% | 65.7% |

**At $6/student/year with bespoke generation and an engaged student, gross margin is negative.** ASSISTments' free $0 floor + the Gizmos $6 anchor + R=1 is an unbuildable business.

At **$12** (recommended), 30 sessions, R=20 → **97.4% GM**. At $22.20 → 98.6%.

**Freemium at a realistic 1% conversion: R=1 → −1.0% GM. R=20 → 83.9% GM.** Same product, same price; reuse alone is the difference between a business and a subsidy.

---

## 🟡 Third finding: frontier model prices are going UP, not down

From Google's own current price card:

| Transition | Input | Output |
|---|---|---|
| Gemini 2.5 Flash → 3.5 Flash | **+400% (5.0×)** | **+260% (3.6×)** |
| Gemini 3.7 Flash promo → post-2027-01-01 | **+100%** | **+100%** |

The famous 10×/year deflation (a16z LLMflation; Stanford HAI measured 280× over 23 months for GPT-3.5-level performance) applies **only at constant capability.** The one place it appears on this card: **Gemini 3.5 Flash-Lite is priced at $0.30/$2.50 — exactly the old Gemini 2.5 Flash price, for a better model.**

> **Operating rule: pin to a capability tier, not to the newest model.** Ship on Flash-Lite-class and let deflation carry you down the price card. Newtonian mechanics is a **capability-saturated task** — it was solved at GPT-4-class quality. There is no reason to buy frontier tokens for it. A team that reflexively upgrades will pay 3.6–5× more for a product whose customers cannot tell the difference.

**Sensitivity:** even the worst *verified* case — a 5× price increase — leaves **61.3% gross margin** on Year-3 numbers. **COGS is not what kills this business. Market size is.**

---

## Duolingo: the only unambiguous edtech success, from its actual 10-K

| $000s | 2023 | 2024 | 2025 |
|---|---|---|---|
| Revenue | 531,109 | 748,024 | **1,037,589** |
| **Gross margin** | **73.24%** | 72.78% | **72.23%** |
| Operating income | (13,259) | 62,595 | 135,570 |
| Net income | 16,067 | 88,574 | 414,065 |

Q4 2025: **133.1M MAU · 52.7M DAU · 12.2M paid subs**

**Derived unit economics:** Revenue/MAU/yr **$7.80** · COGS/MAU/yr **$2.165** · Bookings/paid sub/yr **$81.66** · **Conversion 9.17%** · DAU/MAU **39.6%**

> **9.17% is the world-record consumer-edtech conversion rate. Model nothing above it.**

### The AI-margin question, answered with primary data
Duolingo's 10-K, verbatim:
> *"Total gross margin decreased to 72.2% from 72.8%… primarily attributable to… a decline in subscription gross margin, **reflecting increased AI costs used in features like Video Call**."*
> R&D: *"an increase of GenAI costs of $3.6 million."*

**The best-run edtech company in the world took a 60bp gross-margin hit and named AI as the cause.** Its margin peaked in 2023 — before heavy genAI deployment — and has declined every year since.

**Chegg, updated through FY2025:** revenue **$776M (2021) → $377M (2025), −51.4%**; gross margin **74.26% (2022) → 59.63% (2025)**, −1,463bp; operating income −$737M (2024), −$117M (2025).

---

## Pricing anchors

| Anchor | Price | Status |
|---|---|---|
| **Pivot Interactives** | **$11.10/seat/semester = $22.20/student/yr** (same across institutional-PO, student-pay, and course-code channels) | ✅ **Verified** |
| Labster | *"Annual engagements typically begin at $5,000 USD"*, quote-only | ✅ Verified |
| ExploreLearning Gizmos | ~$6/student/yr | ⚠️ Quote-only, not re-verified |
| ASSISTments | $0 | Federally/philanthropically funded |
| **IRS educator expense deduction** | **$300/educator ($600 MFJ, max $300 each)** | ✅ **Verified** — irs.gov/taxtopics/tc458 |
| Duolingo realized consumer ARPU | $81.66/paid sub/yr | ✅ Derived from 10-K |

> **The $300 IRS deduction is the most actionable pricing fact in this report.** It is a legislated ceiling on frictionless teacher-personal purchase. A SKU at **$149/section/year** sits at 50% of the cap, is fully deductible, and **converts a 6–18 month enterprise sales cycle into a credit-card transaction.** It is the only realistic GTM for a student founder with no sales team.

---

## Recommended model: two SKUs + a free tier

| Tier | Price | Rationale |
|---|---|---|
| **Free — teacher** | $0 | Unlimited sim *use*, capped bespoke generation. Costs $0.106/student/yr at 10 sessions, R=20. Matches ASSISTments' floor without competing on it. |
| **Teacher section** | **$149/section/yr**, ≤35 students | 50% of the IRS cap — deductible, credit-card, no procurement. = $4.26/student. **92.5% GM.** This is the entire GTM for years 1–2. |
| **District / department** | **$12/student/yr**, 100-student min | Between the ~$6 Gizmos anchor and the verified $22.20 Pivot price, justified by AI-native diagnosis neither offers. **97.4% GM.** |

**Do not build:** consumer subscription (needs 13.4M MAU for $100M) · marketplace (no liquidity) · publisher B2B2C (no leverage as a student founder).

### Three non-negotiable product constraints from the economics
1. **Engineer for reuse (R ≥ 20).** Below R=5 the business is gross-margin negative at institutional prices.
2. **Pin to a capability tier (Flash-Lite class), never the newest flagship.**
3. **Capture every prediction/outcome/misconception triple from day one.** It is the only asset that appreciates.

---

## Three-year sketch — and the row that matters

| | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| **Revenue** | $62,700 | $394,800 | **$1,257,000** |
| Gross margin | 87.2% | 91.1% | **92.3%** |
| Operating income | +$44,649 | −$30,159 | +$99,802 |
| **Implied share of US AP physics+stats** | 2.1% | 10.5% | **🔴 30.3%** |

**A $1.26M business requires 30.3% of the entire US AP Physics + Statistics population. That is not achievable.** No incumbent, Gizmos included, holds 30% share of a single subject.

At credible share, Year 3: **2% → $137k–$253k · 5% → $342k–$632k · 10% → $684k–$1.26M**, all at ~97% GM.

> **The realistic year-3 outcome is $340k–$1.26M of revenue at ~97% gross margin. Total capital required: under $700k — fully coverable by NSF SBIR with zero dilution.**

---

## Funding path — real deadlines, real award records

### Non-dilutive, sequenced
| # | Programme | Amount | Timing | Notes |
|---|---|---|---|---|
| 1 | **Z Fellows** | $10,000 | **Rolling, no deadline — apply this week** | SAFE at a **$1B cap**; explicitly *"from high school students to employed professionals"*; 1 week, mostly virtual |
| 2 | **Emergent Ventures** (Mercatus) | not published | **Rolling** | Non-dilutive, **minimum age 13**, zero downside |
| 3 | **Credit stack** | **~$350,882** | Immediate | AWS Activate up to $200k · Microsoft Founders Hub up to $150k · GitHub Student Pack ~$882 itemised · Gemini free tier |
| 4 | **NAIRR Pilot** | federal compute, 12-mo | Rolling — submit by the 15th, decision end of following month | ⚠️ **Requires institutional email — gmail rejected**; grad students need a faculty support letter |
| 5 | 🎯 **NSF SBIR/STTR Phase I** | **$305,000** | **New solicitations opened Tuesday 2 June 2026**; pitch response in 1–2 months | The highest-value non-dilutive item |
| 6 | **NSF I-Corps** | $50,000 | Rolling | Customer-discovery funding; strengthens the SBIR application |
| 7 | **NSF SBIR Phase II** | **~$1.0–1.2M** | ~2–3 yrs after Phase I | |
| 8 | **Thiel Fellowship** | $250,000 / 2 yrs | Portal | Only if leaving school — but it solves the SBIR PI problem outright |
| 9 | **Y Combinator** | $500k for ~7% | Rolling | **Only after the three numbers clear. Do not raise into a $12.6M TAM.** |
| ✗ | ~~Anthropic Startup Program~~ | — | — | 🔴 **Blocked — requires prior institutional equity funding** |
| ✗ | ~~ED/IES SBIR~~ | — | — | 🔴 **Treat as unavailable** — IES publishes no SBIR solicitation and is not accepting unsolicited prospectuses |

**Total sequenced non-dilutive: $1,826,080 + $350,882 in credits, zero equity.** Against Year-3 COGS of ~$97k, **the credits alone cover all three years of cost of goods.**

### 🎯 PrairieLearn is the exact template
From the NSF Awards API — actual obligated amounts:
- **SBIR Phase I, PrairieLearn Inc. (2023): $274,981**
- **SBIR Phase II, PrairieLearn Inc. (2026): $1,211,080** — *"An online learning and assessment platform for sophisticated STEM"*
- **$1,486,061 of non-dilutive capital, zero equity, for a STEM assessment platform.**

Also: **AALMV Inc. SBIR Phase II $1,025,369** — *"A Physics-Based Competitive Machine Learning Framework,"* explicitly targeting **AP Physics** outcomes. Prisms of Reality: $249,974 → $944,532.

⚠️ **The binding constraint:** the SBIR **PI must be "legally employed at least 20 hours a week by the company"** and commit ≥173 hours per 6 months. **A full-time student cannot casually satisfy this.** Plan a leave term, a gap year, or a co-founder who takes the PI role.

---

## The nonprofit path, from actual Form 990s

| Organisation | FY | Revenue | % from contributions | Top officer comp |
|---|---|---|---|---|
| **Khan Academy** | 2025 | **$117,488,956** | — | **Sal Khan $871,261** |
| **Concord Consortium** | 2023 | $9,509,051 | **91.9%** | **$540,222** |
| **ASSISTments Foundation** | 2023 | $4,136,957 | **91.3%** | **$534,787** |
| Scratch Foundation | 2023 | $8,770,345 | 97.3% | $1,632,449 |

**Personal-outcome read:** running a $4–10M grant-funded edtech nonprofit pays **$534k–$540k**. The $117M category leader pays **$871k**. Excellent, durable, salaried — and *bounded*. No equity, no exit, no multiple.

### 🔴 But the funding base is being dismantled
Concord Consortium states publicly that its NSF grant was terminated, one of **"over 1,400 NSF awards terminated in massive batches across four successive Fridays in April and May 2025."** Concord's own 990 shows the fragility: 91.9% grant-dependent, FY2023 expenses ($10.19M) already exceeding revenue ($9.51M).

**PhET works — but PhET is inside a research university**, which supplies the PI, the indirect-cost machinery, and institutional continuity. **A student founder with no faculty appointment cannot replicate PhET's structure.** This is the most under-appreciated fact about the nonprofit path.

NSF DRK-12 awards in the last year: **median $1,270,503** — to Miami, U Washington, SUNY Binghamton, Oregon State, EDC, Kentucky, AIR. **Not to startups.**

---

## 💡 The option worth more than the product

Handwave's mechanism produces two assets its edtech P&L does not capture:

1. **A generator of interactive simulations with ground-truth, verifiable outcomes.** A Newtonian mechanics sim is structurally **an RL environment with a programmatic reward signal.** An on-demand factory for verifiable-reward environments is a component of the frontier training stack, not a $6/student/year classroom tool.
2. **A labelled corpus of (prediction → outcome → diagnosed misconception) triples** — human reasoning-error data with ground-truth adjudication, exactly the shape used for reasoning evals and process supervision. **It does not exist at scale anywhere**, and PhET/Gizmos/ASSISTments don't collect it because they never force a prediction first.

> **The forced prediction is the moat, not the simulation.** The generator will be commoditized by the next model release. The prediction-gap dataset compounds and **cannot be back-filled.**

⚠️ No dollar figure attached — RL-environment and eval-dataset licensing rates could not be verified. But the instruction costs nothing: **instrument and retain every prediction/outcome/diagnosis triple from day one, with clean provenance and consent.** Building the product without capturing that data would be the single most expensive mistake available.

---

## 🔴 The three numbers that decide business vs. project

| # | Number | Threshold | Why it decides | Measure in week 1 |
|---|---|---|---|---|
| **1** | **R — students served per sim generated** | **≥5 to survive, ≥20 to be a business** | At R=1, $6/student and 100 sessions = **−10.9% GM**; freemium at 1% = −1.0%. At R=20 the same are 82.3% and 83.9%. **This one number moves gross margin by 200 points.** | Log `sims_generated` vs `sim_sessions_served` |
| **2** | **Realized ARPU/student/year** | **≥$12; below $6 there is no company** | $6 × 569,600 = $3.4M TAM. $22.20 × 569,600 = $12.6M. The gap between the Gizmos and Pivot anchors is the gap between a hobby and a small business. | First 10 paid conversations. **Do not discount to close.** |
| **3** | **Addressable population** | **569,600 (AP only) vs 15,528,000 (all US public HS 9–12) — a 27× difference** | At 569,600 there's no venture case at any price under $175/student. At 15.5M there's a $186M SAM at $12. **Everything depends on whether Handwave generalizes past mechanics and probability.** | **Ship a third and fourth domain within 6 months.** If generation quality collapses outside mechanics, the answer is 569,600 and the answer is "project." |

---

## Honest recommendation: neither VC-track startup nor nonprofit — yet

**Why not VC.** §5.3 arithmetic is disqualifying. Edtech VC was ~$2.4B (2024) and ~$1.2B US (2025), concentrating in healthcare education, teacher-workload AI, and corporate upskilling — none of which is this. Taking YC's $500k for 7% against a $12.6M TAM starts a clock you cannot beat, and **the Knewton base rate ($180M+ raised → ~$19.9M) is precisely the shape of "smart inference layer without distribution," which is precisely Handwave's shape.**

**Why not (yet) nonprofit.** Ceiling is real but modest, the funding base is in active contraction (1,400+ NSF terminations; IES not accepting unsolicited prospectuses), PhET's structure isn't replicable from outside a university, and **501(c)(3) status forfeits the SBIR path** (which requires a small *business*).

### The sequenced answer

**Months 0–12 — prove the mechanism, take only free money.** Build in public, free to teachers. Z Fellows + Emergent Ventures (both rolling, both student-eligible). Live on the Gemini free tier + the $350,882 credit stack. Prove exactly two things: **(1) R ≥ 20 is achievable** without the product feeling canned, and **(2) the diagnosis actually identifies misconceptions** with a measurable pre/post effect — not engagement, not time-on-task, but **a documented shift in a named wrong belief.** That second proof is the only asset that survives the next model release, and it is what NSF reviewers, districts, and AI labs will all underwrite.

**Months 12–30 — incorporate a C-corp, take NSF money.** SBIR Project Pitch against the solicitation opened **2 June 2026**. Phase I $305k → Phase II ~$1.2M (PrairieLearn's exact path). Solve the 20-hr/week PI requirement deliberately. **$1.5M non-dilutive funds the entire three-year plan with room to spare.** A C-corp preserves every option; a 501(c)(3) closes most.

**Month 30 — decide with the three numbers in hand.** If R ≥ 20, ARPU ≥ $12, *and* the generator works outside mechanics such that the reachable population is millions — raise, because the market is no longer the one sized here. If any fails, run it as what it is: a **$1–3M revenue, ~95% GM, 3–8 person company** that Cambium/Amplify/Savvas buys at 3–5× revenue = **$5–15M to a founder who never diluted.** That beats the probability-weighted VC outcome in this category and beats the $534k–$540k nonprofit salary in NPV.

> **One sentence:** *Handwave should not be a venture-backed startup and should not be a nonprofit — it should be a non-dilutively funded small company that treats the misconception dataset as the asset and the simulations as the acquisition cost, with the decision to go bigger deferred 18 months and delegated to three measurable numbers.*

---

## ⚠️ Could NOT verify — do not assume
Brilliant.org pricing (JS-rendered) · Photomath pricing and Google acquisition price · Khanmigo pricing · **ExploreLearning Gizmos list price (quote-only — the ~$6 is carried, not re-verified)** · TeachersPayTeachers economics (403) · AdoptAClassroom/NCES teacher out-of-pocket figure (only the $300 IRS cap is verified) · **AIP US high-school and intro-university physics enrolment (JS-rendered)** · **IB and UK A-Level physics entries (403) — so the §5 sizing is US-only and is a FLOOR, not a ceiling** · PhET budget/staff/sim count · Google for Startups Cloud tier amounts · Bessemer/a16z published median SaaS and AI gross margins (substituted primary XBRL instead) · NSF EDU directorate budget totals (403)
