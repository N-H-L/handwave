# GTM & Distribution — key findings

**[V]** verified against a page fetched this session · **[U]** unverified, treat as a lead

---

## 🟢 THE FINDING: our "risky" mechanic is a 40-year-old validated method

**PhysPort — Interactive Lecture Demonstrations** — https://www.physport.org/methods/method.cfm?G=Interactive_Lecture_Demonstrations **[V]**

The catalogued method: instructor presents a worksheet describing a demonstration → students **commit written predictions before observing** → small-group discussion → observation → compare predictions with results and explain discrepancies.

PhysPort states the written prediction *"makes student thinking visible"* and the prediction–observation contrast *"helps students confront misconceptions directly."* **Bronze research-validation status.** PhysPort is run by AAPT and funded by NSF.

> **Handwave's supposedly-risky core mechanic — the aversive, effort-adding, commit-then-be-corrected loop — is not a new pedagogy we have to sell. It is a research-validated, AAPT-catalogued method that physics faculty already believe in and mostly fail to implement because it is logistically painful.**

**We are not selling a belief change. We are selling automation of a method they already endorse.**

This is the single most important GTM finding. It converts the hardest objection ("students hate being told they're wrong") into the easiest pitch: *"this is ILDs, but you don't have to build the apparatus, and you get the prediction data back."*

→ **Reposition the entire pitch as "automated Interactive Lecture Demonstrations." Use PhysPort's exact language.** Free to do, and do it before the hackathon.

---

## The beachhead: US higher-ed introductory physics

Large coordinated multi-section algebra- and calculus-based mechanics courses, sold instructor-by-instructor, free at first.

**Four reasons, in order of weight:**

1. **The mechanic is pre-validated in this market and nowhere else.** In K-12 and D2C we'd be selling an unpleasant novelty; here we sell logistical relief for something faculty already wish they did more of.
2. **One person can say yes.** No procurement, no ESSA tier, no NDPA, no state adoption cycle, no 11-month budget lag.
3. **Corpus density is 5–10× K-12.** One coordinator = 800–2,000 students/term vs a high-school teacher's 100–150. **Since the corpus is the asset, this ratio decides the strategy.**
4. **Price anchor is 10–40× better.** Perusall's verified $5–25/student/**term** **[V]** vs ~$6/student/**year** in K-12 where a free ESSA-Tier-I nonprofit sets the floor.

**Secondary beachhead, same motion: intro statistics/probability** — larger enrolment base than physics **[U — verify]**, identical instructor-adopts channel.

### The reframe that should drive every decision
The defensible asset is not the prediction *mechanic* — a competitor adds a text box in a week. It is **the corpus**: a longitudinal, labelled record of what learners believe *before* they see the answer, in free text, tied to a parameterised simulation. Eedi's maths equivalent is *multiple-choice distractor* data — cheap to collect, low-resolution. Free-text predictions against a simulation are richer and harder to collect. **A moat made of collection difficulty, not code.**

→ **The right beachhead is not the one with the highest year-one revenue. It is the one that produces the most labelled predictions per dollar of CAC.** That test resolves the strategy against both D2C and K-12.

---

## Why NOT K-12 first

**Michael Horn, Christensen Institute, 21 Jul 2026** — https://www.christenseninstitute.org/blog/why-school-districts-cant-disrupt-themselves-they-are-the-business-model/ **[V]**
*"The district itself is the business model."* Districts can execute sustaining innovation but structurally cannot execute disruptive innovation; change comes from *"autonomous organizations built outside the incumbent district structure."*

→ A district is exactly the wrong first customer for a product whose value proposition is *"your students are wrong and here's proof"* — a threatening message delivered through a nine-month procurement cycle.

**The floor is $0 and it has better evidence than we will have for three years.** ASSISTments: free, 501(c)(3) at WPI, 200,000+ standards-aligned problems, 1M+ students since 2019, **ESSA Tier I Strong Evidence** **[V]** https://www.assistments.org/
→ **Do not launch probability into US K-12.**

**Seasonality is a timing tax, not a shortcut.** Teacher discovers you Oct 2026 → earliest district dollar is FY starting 1 Jul 2027 → PO lands Aug–Sep 2027. **11–14 months of runway a solo student founder does not have.**

**Texas IMRA is closed for this cycle** — Form A closed 31 Oct 2025, Form B 12 Dec 2025 **[V]**. IMRA is also built for comprehensive TEKS-covering programs, not supplements. **Texas is a 2028+ question.**

---

## ⚠️ Accessibility is a hard, dated gate

**DOJ ADA Title II rule** — https://www.ada.gov/resources/2024-03-08-web-rule/ **[V]**
State and local government web content and mobile apps must meet **WCAG 2.1 Level AA**:
- **26 April 2027** — entities in jurisdictions of 50,000+ population
- **26 April 2028** — smaller entities and special districts

**This binds public universities and large districts — i.e. our beachhead.** A canvas-based interactive simulation with a text-prediction box is *precisely* the artefact that fails WCAG.

→ **Build keyboard navigation, screen-reader description of simulation state, and non-colour-dependent encoding from day one.** A VPAT we can hand over is a genuine differentiator against every AI-generated-artifact competitor, none of which will have one.

---

## Integrations — ranked by when we actually need them

| Integration | Verdict |
|---|---|
| **Nothing (URL + share link)** | Ship this first. Gradescope and Perusall both grew before deep integration |
| **LTI 1.3 + AGS + Deep Linking** | Table stakes for higher-ed by month 6 — instructors won't adopt without grade passback. ~**2–4 focused weeks** with a library (`ltijs`, `pylti1p3`). 1EdTech membership **not** explicitly required to certify **[V]**; pricing not publicly disclosed **[V]** |
| **Clever** | Only if K-12. **111,000+ schools, 95 of the largest 100 districts, 60% of US students log in monthly** **[V]** — the most concentrated K-12 distribution point in existence, and therefore a solved problem we'd be buying into, not a moat |
| **Google Classroom add-on** | **Deprioritise.** Requires the institution to hold **Teaching & Learning or Plus** Workspace licences — the *paid* upgrades **[V]**. Silently excludes most cash-poor districts |
| **Canvas/Schoology app centres, OneRoster, xAPI/Caliper** | Year 2+ |

**LTI 1.3 with AGS and Deep Linking is the only integration worth building in the first six months, and only after instructors ask for grade passback.**

---

## Curriculum alignment

**NGSS HS-PS2-1**, verbatim **[V]**: *"**Analyze data to support the claim** that Newton's second law of motion describes the mathematical relationship among the net force on a macroscopic object, its mass, and its acceleration."*

→ It **begins with a Science and Engineering Practice, not content recall.** Handwave's mechanic (commit a claim → generate data → reconcile) maps onto that PE **more literally than a textbook does**. That is an unusually strong alignment story. Say it in exactly those words to a science coordinator.

**AP Physics 1 is almost entirely our launch domain** **[V]**: Kinematics 10–15% · Force & Translational Dynamics 18–23% · Work/Energy/Power 18–23% · Linear Momentum 10–15% · Torque & Rotational 10–15% · Rotational Energy & Momentum 5–8% · Oscillations 5–8% · Fluids 10–15%. Science Practices (Creating Representations, Mathematical Routines, Scientific Questioning & Argumentation) carry **20–45% of free-response weight**. Exam revised again for **May 2027**.

Scale: **1.3M+ students in the class of 2025 took 4.8M+ AP exams; 37.0% of public high-school graduates** **[V]**.

> **Alignment is a disqualifier removal, not a purchase driver.** Nobody buys because you're NGSS-aligned; everybody refuses if you aren't. Tag every sim with PE and AP-LO codes — a week of metadata, removes the objection permanently.

**The alignment that actually matters is different.** PhysPort catalogues **121 research-based assessments** and **64 research-based instructional methods** **[V]**. **Mapping our diagnoses to FCI and FMCE items is worth more than any curriculum tag**, because it gives a shared validated outcome currency the whole physics-teaching world already trusts.

---

## Channels, ranked

**Tier 1 — do these**
1. **PER community via PhysPort / AAPT.** AAPT student membership **$54/yr** + PER Topical Group **$5/yr** **[V]**. **$59 buys standing in the community that decides what counts as good physics pedagogy in North America.** Est. CAC $20–60/instructor, each carrying 100–800 students/term. Nothing else comes close.
2. **AAPT Winter Meeting 2027 — 9–11 Jan 2027, Hilton New Orleans Riverside** **[V]**. Billed as **the final AAPT Winter Meeting ever** — draws an unusually senior, sentimental, well-attended crowd. **Submit a contributed talk.** Check the abstract deadline immediately; it falls inside our 90 days.
3. **PERC.** PERC 2026 was themed *"Potentials and Perils from AI in Physics Teaching and Learning"* **[V]** — the most on-target venue in the world for this product, and it has just passed, which tells us the community is arguing about our exact category right now. Next: AAPT Summer 2027, **31 Jul – 4 Aug 2027, Washington DC** **[V]**. Target a **PERC 2027 paper as the 12-month credibility milestone.**
4. **NSTA National Conference — Indianapolis, 4–7 Nov 2026** **[V]**. Ten weeks out. **Attend, don't exhibit.** 40 hallway interviews. ~$600–1,200 all-in.

**Tier 2** — AAPT regional section meetings (cheapest speaking slot in physics education) · publishing an open misconception benchmark · Bluesky/r/PhysicsTeaching (30 min/week)

**Tier 3 — deprioritise** — TeachersPayTeachers (sells *downloadable artefacts* at $3–8; a hosted product with per-student state doesn't fit the transaction model) · ISTE/SXSW EDU/FETC/TCEA (reach buyers, not physics teachers; booth economics hostile to a solo founder)

---

## D2C: no

**Brilliant** — the closest successful effort-*adding* consumer learning product — claims **"10 million+ learners"** after roughly a decade **[V]**, and has pivoted to a conversational AI tutor ("Koji"), i.e. *away* from pure effortful problem-solving toward something more accommodating. **Both facts argue against the D2C thesis.**

> Consumers buy relief, status, or identity. Handwave sells *the experience of being caught being wrong*. No consumer wakes up wanting that. Institutions buy exactly that on learners' behalf — which is why ILDs live in lecture halls and not in the App Store.

**The caveat, which is real:** a **free, non-monetised** consumer motion is strategically valuable — public "prediction challenges," one shareable sim where most adults confidently predict wrong. It is (a) excellent top-of-funnel for teachers, (b) a corpus-generation machine at zero CAC, (c) exactly what wins hackathon demos. **Run it as marketing and data acquisition, never as a revenue line.**

---

## Infrastructure: right destination, wrong starting line

**Eedi verified detail** **[V]** https://eedi.com/about — four teams (Product, Impact & Evidence, Learning Science, Data Science), three lines (BUILD/TEACH/LEARN); "the world's most accurate diagnostic engine for maths," system-agnostic; **Eedi School explicitly a *testbed***; Constrained AI Tutor for US middle schools; **"Eedi Inside"** API to publishers, LLM providers, learning platforms; **MCP integration with Claude**. Partners: UMass Amherst, Vanderbilt, Cornell, Cambridge, MIT. Funders: **Chan Zuckerberg Initiative, Google.org**. Evidence: **EduEvidence Gold Certificate, 2-year RCT — d = 0.46 at 18 months, d = 0.30 at 24 months.**

**The honest read, not the flattering one.** Eedi had CZI and Google.org money, a decade of data, a knowledge graph, university partners, and a gold-certificate RCT with a strong effect size — **and still moved to selling infrastructure.** Two interpretations, both partly true: (a) infrastructure is where the margin is as the app layer commoditises; (b) the app couldn't monetise at the scale the cap table required and "we are the intelligence layer" is a fundable narrative.

Note the **effect-size decay from 0.46 to 0.30** — real, durable, but fading. And note they **did not abandon the app; they demoted it to a data-collection instrument.** That is the correct model and the one to copy.

**Who would actually pay for a misconception-diagnosis API?**
- Publishers — plausible, but they *acquire* rather than license; 12–24 month cycles. Not a year-one line.
- **AI labs — they don't buy diagnosis APIs. They buy evals and datasets.** This is the realistic door.
- Assessment vendors (Cambium, which owns Gizmos; Curriculum Associates; NWEA; Renaissance) — plausible, slow, and they'll try to build it.
- LMS vendors — no. They sell plumbing, not pedagogy.

> 🔴 **We cannot sell the infrastructure before we own the corpus.** Eedi could pivot because they had years of response data. Handwave has zero. **Infrastructure is the destination, not the beachhead. Anyone advising us to start there is advising us to sell an empty warehouse.**

**But there is a 90-day version:** publish an **open misconception-diagnosis benchmark** — public (simulated scenario, free-text prediction, ground-truth misconception label) triples plus a leaderboard for *"can your model name the wrong belief?"* The Eedi/Kaggle playbook at student scale. Costs compute and a weekend; buys PER credibility, an artefact AI labs will actually read, a reason for researchers to send us data, and a defensible claim to owning the problem definition. **Highest-leverage single action after the beachhead choice.**

---

## International

**India: the correct play is supply-side, not demand-side.** Physics Wallah: 15M students on the app, 3.5M registered, 7.8M+ YouTube subscribers, listed company **[V]**.

> **JEE/NEET is a rank market, not an understanding market.** The purchase decision is a parent optimising percentile per rupee. "Your child holds a specific wrong belief about normal force" loses to "10,000 previous-year questions with video solutions." **Willingness to pay for a foreign solo founder's diagnostic layer: effectively zero.**

→ Frame India and SE Asia as **where the data comes from** (free access, near-zero CAC corpus generation; affordable expert misconception labelling by physics graduates), not where revenue comes from.

**Africa:** the buyer is a funder, not a school. The funder set for this category is visible in PhET's sponsors — Mastercard Foundation, Moore, NSF, Hewlett, Yidan **[V]**. Grant motion, available only after evidence. Year 3.

---

## Partnerships — who takes the call

1. **PhysPort / AAPT — very high.** Pitch: *"ILDs, automated, with the prediction data returned to the instructor. Can Handwave be catalogued as a method implementation?"* **Getting listed alongside ILD and Peer Instruction is worth more than any marketing spend we could make.**
2. **PhET — high.** Academic group with a mission, not a company defending margin. Pitch: *"You have the simulations and no prediction layer. We have the prediction layer. Let's test it on three of your mechanics sims."* ⚠️ Licence terms and Studio pricing could not be retrieved (404s) — **verify before building on their sims.**
3. **Individual PER faculty — very high, and the real leverage.** Eedi's partners (UMass Amherst, Vanderbilt, Cornell, MIT, Cambridge) demonstrate university learning-science labs do partner with small companies. A physics-ed researcher who gets co-authorship on a PERC paper plus a novel free-text prediction dataset has a genuinely good deal.
4. **OpenStax — medium.** Expert TA builds on OpenStax content **[V]**, so the ally route is demonstrably open to small vendors.
5. **Tools Competition — high, and time-critical.** Run by The Learning Agency / Renaissance Philanthropy; sponsors include Walton, Griffin Catalyst, Axim, CZI, Moore. Tracks include **Datasets for Education Innovation**. Prizes: **Catalyst $50,000 · Growth $150,000 · Transform $300,000**. **The 2027 competition will be announced in September 2026** **[V]** — i.e. now. The Datasets track is a near-perfect fit for the corpus thesis.
6. **ED/IES SBIR — medium, high value.** **Phase I $250,000 / 8 months; Phase II $1,000,000 / 2 years** **[V]**. Annual solicitation, ~60-day window, awards within 90 days. 258 Phase I and 99 Phase II awards since 2002. Requires a US small business entity. Non-dilutive, and an IES award is itself an evidence signal to schools.
7. Publishers and Khan Academy — low until ~50,000 predictions collected.

---

## 90-day plan (25 Aug → 25 Nov 2026)

| # | Action | Effort |
|---|---|---|
| 1 | **Reposition everything as "automated Interactive Lecture Demonstrations."** Landing page, hackathon demo, every email, in PhysPort's language. **Do this before the hackathon.** | 1 day |
| 2 | **Join AAPT ($54) + PER Topical Group ($5).** Absurd ROI. | 1 hour |
| 3 | **Recruit 5 intro-physics instructors for a Fall 2026 free pilot.** Target coordinators of large multi-section courses. Offer: free forever, in exchange for prediction data + a pre/post FCI. **This is the whole company in one move** — corpus, evidence, and case studies simultaneously. | 3 weeks |
| 4 | **Watch for the Tools Competition 2027 launch in September; apply to the Datasets track.** $50k–$300k non-dilutive, exact thesis fit, deadline inside this window. | 3 days |
| 5 | **Publish the open misconception-diagnosis benchmark.** | 1 week |
| 6 | **Submit an abstract to AAPT Winter Meeting 2027** (final one ever). Check the deadline immediately. | 2 days |
| 7 | **Attend NSTA Indianapolis 4–7 Nov as an attendee.** 40 structured interviews, zero deals. Buys the K-12 objection map without committing to K-12. | 1 week + ~$1k |
| 8 | **Build WCAG 2.1 AA and write a VPAT.** | 2 weeks |
| 9 | **Tag every sim with NGSS PE and AP Physics 1 LO codes.** | 3 days |
| 10 | **LTI 1.3 + AGS + Deep Linking** — only after instructors ask. | 2–4 weeks |

**Explicitly NOT in the 90 days:** Clever, Google Classroom add-on, TPT, ISTE, IMRA, any district conversation, any D2C pricing page.

## 12-month plan
- **Months 4–6** — LTI 1.3 + AGS. WCAG 2.1 AA + VPAT. Pre/post FCI in pilots; normalised gain vs comparison sections. 20–30 instructor pilots. **Target 250,000+ captured predictions.**
- **Months 6–9** — Perusall-style instructor-set student pricing at **$10/student/term** with hardship exemptions. Convert 5–8 pilots to paid (~$30k–80k; proof of willingness, not a business). Submit a PERC 2027 paper. Formalise one PER lab partnership. File ESSA **Tier IV** logic model; begin the Tier III correlational study.
- **Months 9–12** — Incorporate a US small business; file **ED/IES SBIR Phase I ($250k)**. Release v2 of the benchmark with real student data. **Only now** open infrastructure conversations — pitch being *"we have the only free-text prediction corpus in physics,"* not *"we have an API."* Begin AP Physics 1 K-12 as a **pull** motion from NSTA/AAPT-sourced teachers, priced per-teacher not per-district.

---

## 🔴 The three assumptions that would kill this — and the cheap test for each

**1. Instructors want the diagnosis, not just the simulation.** If faculty see "nice sims" and ignore the misconception report, we're a commodity generator competing with Google AI Mode, with no moat.
> **Test (2 weeks, $0):** ship two variants to 10 instructors — A = simulations only, B = simulations + weekly class misconception report. Measure week-4 return rate, and critically whether anyone in A *asks for* the report. **If B's retention isn't at least double A's, the diagnosis is not the product.**

**2. Students will type a real prediction rather than gaming the gate.** The entire corpus depends on genuine effort. "idk" or copying the on-screen answer gives us a large database of noise and the asset evaporates.
> **Test (1 week, $0):** instrument the pilots. Measure the share of predictions that are (i) >8 words, (ii) mechanistically specific, (iii) not trivially retrievable from on-screen text. Hand-classify 200. **If under 40% are substantive, the mechanic fails and no GTM saves it. RUN THIS TEST FIRST — it is prior to everything else.**

**3. There is a paying customer for the diagnostic layer before we have a decade of data.** Eedi pivoted to infrastructure *after* CZI/Google.org funding, a knowledge graph, and a 2-year RCT.
> **Test (3 weeks, $0):** publish the benchmark, then 10 discovery calls — 4 publishers, 3 assessment vendors, 3 AI-lab/tutoring-platform teams. One question: *"If this existed at 10× scale, would you pay for it, and who would sign?"* **If we can't get a named budget-holder and a rough number from 2 of 10, treat infrastructure as a year-3 option and price the app to be self-sustaining.**

---

## Verify before relying on
AIP intro-physics and CBMS intro-statistics enrolment counts · EdWeek Market Brief sales-cycle data · LearnPlatform EdTech Top 40 tool count · **PhET licence terms and Studio pricing** · **exact AAPT Winter 2027 abstract deadline** · Tools Competition 2027 dates once announced
