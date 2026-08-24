# Compliance, Privacy & Trust-and-Safety — key findings

**Not legal advice.** Engineering-oriented research. Get counsel in Colorado, New York and the EU before signing anything.

---

## 🔴 CORRECTION TO 02-infra-and-economics.md: Vertex AI has the SAME under-18 prohibition

**The earlier finding that Vertex AI is the compliant path is WRONG.**

Google Cloud Service Specific Terms (last modified **29 July 2026**), **§20 Generative AI Services, (d) Age Restrictions**, verbatim:

> "Customer will not, and will not allow End Users to, use a Generative AI Service as part of a website, Customer Application, or other online service that is **directed towards or is likely to be accessed by individuals under the age of 18**."

Source: https://cloud.google.com/terms/service-terms — full text downloaded and grepped. **There is exactly one under-18 clause and no education carve-out.** §20(f) adds that Google "may immediately suspend or terminate" for suspected violation. (Note: **Vertex AI has been renamed "Gemini Enterprise Agent Platform"** throughout these terms.)

**Both Google paths are closed.**

Making it worse:
- Google's **FERPA compliance commitment is scoped to Google Workspace for Education only**, not Google Cloud (https://cloud.google.com/security/compliance/ferpa).
- The Cloud Data Processing Addendum contains **zero** occurrences of FERPA, COPPA, "student," or "children" (full text grepped). **There is no student-data DPA for GCP.**

### What Vertex *would* have given us (and doesn't matter now)
- **§18:** "Google will not use Customer Data to train or fine-tune any AI/ML models without Customer's prior permission or instruction."
- **§20(h):** absent permission, prompts not stored outside the Customer's Account "longer than is reasonably necessary to create the Generated Output."
- **§16:** data-at-rest *and* ML processing configurable to a specific Multi-Region.

Genuinely strong — and irrelevant, because §20(d) forbids the use case outright.

### The alternatives permit it, with conditions
| Provider | Position |
|---|---|
| **Anthropic** | ✅ Commercial terms contain **no age restriction**. The AUP requires products serving minors to follow the [minors guidelines](https://support.anthropic.com/en/articles/9307344): age verification, content moderation, monitoring/reporting, educational resources, the child-safety system prompt where offered, **public statement of COPPA compliance**, AI disclosure. Anthropic "will periodically audit organizations for compliance." |
| **OpenAI** | ✅ Services Agreement §3.3(c) restricts only minors using it **"without consent from their parent or guardian."** Permitted with consent. ⚠️ Usage Policies prohibit inferring emotions in educational settings. |
| **AWS Bedrock** | ✅ Full AWS Service Terms grepped: **no blanket under-18 prohibition.** COPPA-aware handling is Amazon Lex-specific. Anthropic models via Bedrock is viable. |

> **P0 architecture decision, not a legal footnote. On Gemini today we are in breach of the provider's terms and one enforcement sweep from losing the model.**

---

## Four more corrections to earlier premises

### COPPA dates were inverted — and the deadline has already passed
90 FR 16918, verbatim: *"Effective date: The amended Rule is effective **June 23, 2025**. Compliance date: … regulated entities have until **April 22, 2026** to comply."*
**Full compliance was due 22 April 2026. This is overdue, not upcoming.**

And the ed-tech exception was **never codified**, for a sharper reason than "declined." Verbatim from the preamble: *"To avoid making amendments to the COPPA Rule that may conflict with potential amendments to DOE's FERPA regulations, the Commission is not finalizing the proposed amendments … related to ed tech."* **The predicate never materialised** — a Federal Register sweep shows no proposed or final amendment to 34 CFR Part 99. So the school-consent pathway rests entirely on **FTC staff FAQ Section N (July 2020)** and the 2022 Ed Tech Policy Statement. **Guidance, not regulation** — materially weaker footing than most edtech compliance decks assume.

### The contextual-advertising claim was overstated — but the real rule is worse for us
16 CFR 312.2 *includes* contextual advertising within "support for internal operations." What the FTC actually says (FAQ N.5) is narrower and aimed straight at our business model:

> *"does it use the students' personal information … **building user profiles for commercial purposes not related to the provision of the online service? If so, the school cannot consent on behalf of the parent.**"*
> *"Does the operator enable the school to review and have deleted the personal information collected from their students? **If not, the school cannot consent on behalf of the parent.**"*

Plus FAQ N.1: *"operators should not state in Terms of Service or anywhere else that the school is responsible for complying with COPPA."*

Precedent: *United States v. Edmodo, LLC* (N.D. Cal. 2023) — sanctioned for using student data for advertising **and for "unlawfully outsourcing its COPPA compliance responsibilities to schools."**

### EU AI Act Annex III now applies from **2 December 2027**, not 2 Aug 2026
Verified at the European Commission: the AI Omnibus (adopted 19 Nov 2025, political agreement 7 May 2026, **in force 27 July 2026**, reported as Reg. (EU) 2026/1744) extends Annex III to **2 Dec 2027** and Annex I to **2 Aug 2028**. ⚠️ EUR-Lex blocks automated fetching — confirm the CELEX text before citing in a filing.

### ADA Title II moved — and school districts are on the EARLIER date
DOJ Interim Final Rule, **91 FR 20902, effective 20 April 2026**: **26 April 2027** for entities with population ≥50,000; **26 April 2028** for smaller entities or **special district governments**.

> ada.gov, verbatim: *"**A school district is not a special district government.**"* §35.104 confirms special districts exclude "an independent school district."

**So essentially every mid-size and large district is on 26 April 2027.** Standard is **WCAG 2.1 AA** (not 2.2).

---

## 🔴 EU AI Act: we are high-risk, and profiling is precisely what closes the escape hatch

**Annex III point 3(b)**, verbatim: systems *"intended to be used to **evaluate learning outcomes**, including when those outcomes are used to steer the learning process of natural persons in educational and vocational training institutions at all levels."*

Handwave lands squarely in 3(b). **Formative purpose is not a defence — the clause covers it explicitly.**

The Art 6(3) derogation looks available (a "preparatory task"), until the override:

> ***"Notwithstanding the first subparagraph, an AI system referred to in Annex III shall always be considered to be high-risk where the AI system performs profiling of natural persons."***

> **This is the single most consequential sentence in the analysis. The longitudinal belief model is exactly what forecloses the derogation.** A *stateless* Handwave (diagnose, respond, forget) would have a real argument; the stateful version does not. Art 6(4): even a provider who self-assesses out must document it and register under Art 49(2). **There is no silent exit.**

✅ **Good news — Art 43:** *"For high-risk AI systems referred to in points 2 to 8 of Annex III, providers shall follow the conformity assessment procedure based on internal control … which does not provide for the involvement of a notified body."* **Self-assessment. No notified body for education.** The cost is documentation discipline, not a third-party audit gate.

**Art 9(9)** expressly requires considering adverse impact on under-18s. **Art 27 FRIA applies** (the carve-out is Annex III point 2 only).
→ **Ship a pre-populated FRIA + DPIA pack as a product artefact. Every school customer needs one and none can write it. Converts a compliance cost into a sales asset.**

### ⚑ Art 5 landmine on the obvious roadmap
Art 5(1) bans inferring emotions "in the areas of workplace and education institutions." We infer **cognitive** state, not affective — not caught as designed. **But detecting frustration/confusion/disengagement to modulate difficulty walks straight into a prohibited practice at the top penalty tier (€35m or 7%), live since 2 Feb 2025.**
→ **Architectural prohibition. No emotion inference from typing cadence, dwell time, webcam or sentiment. Rule it out at architecture level, not at review.**

---

## 🔴 The three compliance issues most likely to kill a school deal

### 1. The LLM vendor's terms — two independent deal-killers in one dependency
**Age clause:** above. A district legal review that reads the upstream terms finds we're in breach of our own model provider. That is a no-bid, not a negotiation.

**Data clause:** a standard commercial API TOS reserving "we may use inputs to improve our services" fails simultaneously under **COPPA §312.2** (makes the vendor a "third party" → separate verifiable parental consent per child → commercially fatal), **SOPIPA §22584(b)(4)(E)(i)** on its face, **Tex. Educ. Code §32.153(d)**, **C.R.S. §22-16-109(3)(b)**, **8 NYCRR 121.9**, **105 ILCS 85/15(6)**, **NY GBL §899-gg**, **NDPA 2.2 Art 2.3**, and **GDPR Art 28**.

The ICO caught this exact failure at audit — a sub-processor *"stating they would keep a copy of children's information to train their AI,"* discovered only when auditors looked.

Every district AI checklist now leads with this. [CITE's Technical Checklist for AI](https://assets.noviams.com/novi-file-uploads/cite/AI_Resources_Microsite/CITE_TECHNICALCHECKLISTAI-b6513946.pdf) asks it verbatim, covering *"user prompts, supplied data, **generated output**"* — **our free-text predictions and our generated simulations are both in scope.**

→ **Zero-retention, no-training, no-human-review, in writing, with §312.8(c) security assurances — or the structure collapses.**

### 2. "Do you train on our students' data?" — and our stated ambition answers it wrong
Four unrelated legal systems converge:

- **FTC FAQ N.5** + **Kurbo's remedy is model destruction**: *"delete or destroy any **Affected Work Product**"* = *"any models or algorithms developed in whole or in part using Personal Information Collected from Children"*, 90 days, **sworn under penalty of perjury**, plus $1.5M penalty.
- **8 NYCRR 121.1(c):** using student data to *"develop, improve or market products or services to students"* is a prohibited commercial purpose — **the only flat ban in the fifty states — and consent does not cure it** (NYAG/NYSED Assurance 24-004). **College Board precedent: $750,000 + permanent commercial-use ban** for licensing school-derived student data.
- **India DPDP s.9(3):** *"A Data Fiduciary shall not undertake tracking or behavioural monitoring of children."* Flat prohibition, no harm threshold, **no consent cure**, up to **₹150 crore**. The Fourth Schedule exemption belongs to the *educational institution*, not to us. **As a Data Fiduciary in our own right, that business line is simply not lawful in India.**
- **ICO "Edtech examined" (24 June 2026, 28 providers audited, 596 recommendations):** *"almost **70% of providers were found to be the controller** for some of their uses"* — by repurposing for product development, anonymisation, and **training AI functionality**. One provider *"had previously used children's information to create anonymised pupil profiles to sell to third parties."*

Plus **California's NDPA AI Addendum §4.8** already bans developing *"synthetic and/or inferred data"* from Student Data, and **AB 1159** (Active, Senate floor, amended 21 Aug 2026 — **not chaptered**) would add a **private right of action at $500/plaintiff/violation**.

> **Fix is architectural, not contractual: split the data planes, default `training_eligible` to false, gate by state, never let NY-sourced data touch a training or evaluation corpus. Then say so unprompted, in writing, in Exhibit B and the AI disclosure page.**
> **License the architecture and methodology to publishers and AI labs — never the data, and never a model trained on it.**

### 3. The misconception model itself, once district counsel reads what it is
A longitudinal per-student record of what a child wrongly believes is simultaneously:
- **COPPA personal information** by definition — §312.2(11): info about the child collected online and combined with an identifier
- **NDPA "Student Data"** — expressly including data *"**inferred** by Provider"*: LEA property, deletable on request, covered by the §4.7 profiling limit
- **CCPA personal information** — §1798.140(v)(1)(K): *"Inferences drawn … reflecting the consumer's … **intelligence, abilities, and aptitudes**"*
- **Colorado student PII** by definition (*"collected, maintained, generated, or **inferred**"*), needing a purpose the district **specifically authorised** (§22-16-109(2)(c))
- **A named CPPA risk-assessment trigger** — §7150(b)(4): *"infer or extrapolate a consumer's **intelligence, ability, aptitude** … based upon **systematic observation** … as a … **student**"*
- **GDPR profiling** (Art 4(4)), with rectification/erasure running to the profile itself, mandatory DPIA, and Art 22 exposure via SCHUFA
- **EU AI Act Annex III(3)(b) high-risk**, derogation foreclosed *because* it is profiling
- **ICO Children's Code Std 12** (profiling off by default absent compelling reason, **unbundled per purpose**) and **Std 5 detrimental use**

---

## 🔴 SCHUFA — our biggest doctrinal exposure

**C-634/21, *SCHUFA Holding (Scoring)*, 7 Dec 2023.** CURIA Press Release 186/23:

> *"the Court holds that [scoring] **must be regarded as an 'automated individual decision' prohibited in principle by the GDPR, in so far as SCHUFA's clients, such as banks, attribute to it a determining role**."*

**The intermediate score is itself the Art 22 decision when the downstream human treats it as determinative.** SCHUFA never decided anything about anyone; a bank did.

Map it: **Handwave → misconception model → teacher → grouping / intervention / placement.** If teachers treat the label as determinative — **and the entire value proposition is that they should** — Handwave is the Art 22 controller. **The B2B/API framing offers no protection; SCHUFA *was* the B2B data layer.**

**And the teacher is not automatically a shield.** WP251: *"**The controller cannot avoid the Article 22 provisions by fabricating human involvement**… oversight must be **meaningful, rather than just a token gesture** … carried out by someone who has the **authority and competence to change the decision**."*

> **Whether we are in Art 22 is an empirical question about our UI and our customers' workflows, not a legal question about our architecture diagram.**
> **→ Instrument teacher response to every surfaced label: shown → viewed → agreed/overridden/ignored → action taken. If override rates approach zero we are not decision support, we are the decision-maker. Set an internal threshold; treat a collapse as a product emergency.**

### Dun & Bradstreet — counterfactual explanation is now a product requirement
**C-203/22, 27 Feb 2025:** the controller must *"describe the procedure and principles **actually applied**"* so the subject understands *"**which** of his or her personal data have been used, and **how**"*; *"it could in particular be appropriate to inform the data subject of **the extent to which a variation in the personal data taken into account would have led to a different result**. By contrast, **the mere communication of an algorithm does not constitute a sufficiently concise and intelligible explanation.**"* Trade secrets are not a refusal — only a redirection to the DPA or court.

→ **We must be able to answer: which span of the student's text drove this label, and what would they have had to write differently?** Real feature, real cost, design it in now.

### Children: WP251 cuts against us
Recital 71 closes: **"Such measure should not concern a child."** WP251: *"**controllers should not rely upon the exceptions in Article 22(2)**"* for children, and *"solely automated decision making which **influences a child's choices and behaviour** could potentially have a legal or similarly significant effect."*

> **Our stated purpose is to influence a child's choices and behaviour (conceptual change). In this framing that is not a defence; it is the risk factor.** We must stay *out* of Art 22 by keeping a genuine human in the loop — architecture, not paperwork.

**Minnesota is the strongest right in the country — build to it and you've built for everyone.** §325M.14 subd.1(g): the right to question the result, be told the reason, review the data used, and where inaccurate data was relied on, **have it corrected and the profiling decision re-evaluated.** A re-run-the-model obligation.

---

## 🔴 The equity problem IS the technical problem

> **A student who understands the physics but writes haltingly — an English learner, a dyslexic student, a dialect speaker — will be labelled as holding a misconception they do not hold.**

In psychometrics that is **construct-irrelevant variance**. In law it is **algorithmic discrimination on the basis of limited English proficiency** — expressly protected under Colorado's old definition **with disparate impact sufficient** — plus national origin and disability. Where it routes a child to thinner content, a plausible **§504/FAPE** problem. If the output is ever used as a disability signal, we have created **Art 9 health data by inference**.

**Measure it: diagnostic accuracy by ELL status, IEP/504 status, and response length/fluency, against human-expert labels. Specifically test whether the model finds more "misconceptions" in shorter or less fluent responses that human raters judge conceptually correct.**

> That single metric is simultaneously the legal defence, the FTC substantiation, and the thing that makes the product actually good.

---

## Hallucinated science: the empirical premise is against us

**arXiv 2309.03087, "Unreflected Acceptance"** — students *with a physics background*: **"nearly half of the solutions provided with the support of ChatGPT were mistakenly assumed to be correct by the students, indicating that they overly trusted ChatGPT even in their field of expertise."** 42% copy-paste vs 4% in the search group.

> **That is the base rate for domain experts. Our users are novices, and the product actively instructs them to suppress the skepticism that was already insufficient.**

**NIST AI 600-1** names three of twelve risks after us: **#2 Confabulation**, **#7 Human-AI Configuration** (automation bias), **#8 Information Integrity**. **The "trust the simulation" copy is a deliberate automation-bias amplifier. Under any NIST-aligned review, that is the finding.**

### Liability: educational malpractice is dead, but not for reasons that protect a vendor
*Peter W.* (1976) and *Donohue* (1979) barred the tort on two rationales — no workable standard of care for diffuse classroom methodology, and deference to **school administrative agencies**. **Both are institution-specific and neither shields a vendor.** A claim that *"your simulation asserted momentum is not conserved in this collision, and it is"* has a **crisp, testable standard — physics.** Our own product claim supplies the benchmark.

**Live exceptions: fraud, negligent misrepresentation, breach of contract, breach of express warranty.** Exposure is not "you taught badly" — it is **"you told schools your feedback correctly identifies misconceptions, and you had no evidence for that."**

**Winter v. Putnam (9th Cir. 1991)** drew the line and put us on the product side: a mushroom encyclopedia is not a product, **but** *"**Computer software that fails to yield the result for which it was designed may be another.**"*

⚑ ***Aetna v. Jeppesen* (9th Cir. 1981) is the nightmare, already litigated.** The chart's **data was entirely accurate**: *"The defect, if any, is in the **graphic presentation** of that information."* Plan view 15 miles, profile view 3 miles, drawn the same size. Held defective.
> **A Handwave simulation can be numerically correct and still defective because the visualization invites a false mental model — for a product whose whole purpose is to install mental models, that is the exact failure mode, and it is a recognised defect theory.**

***Brocklesby* (9th Cir. 1985):** strict liability applies **even though the defect originated upstream** — **"the foundation model produced it" is not a defence.**

**Garcia v. Character Technologies** (M.D. Fla., Doc. 115, 21 May 2025) — three corrections to common reporting: **§230 is not in the order at all** (grep returns zero hits); the First Amendment holding is narrow (*"not prepared to hold that Character A.I.'s output is speech"*); and the product-liability holding adopted a content/design split — a product *"so far as Plaintiff's claims arise from **defects in the app rather than ideas or expressions within** the app."*

> **Plaintiffs will not plead "the sim said the wrong thing" (content). They will plead design defect — no verification harness, no uncertainty surfacing, no expert review, and an interface that affirmatively instructs children to override their own correct reasoning. Under Garcia's own framework, the "trust the simulation" rhetoric is a design choice. Our riskiest asset is not the model; it is the copy.**

**FTC DoNotPay is the mirror:** *"did not conduct testing to determine whether its AI chatbot's output was equal to the level of a human lawyer."* Swap the nouns: **did we test whether our output equals a qualified physics teacher's? Do we employ physicists or curriculum experts?**

---

## Safety configuration and crisis handling

⚑ **Gemini safety filters default to OFF.** Verbatim: *"Due to the model's inherent safety, additional filters are **Off by default**"* and *"the default block threshold is **Off for Gemini 2.5 and 3 models**."* **A team that "just calls the API" ships a K-12 product with the four adjustable filters disabled. Set them explicitly and assert it in CI.**

**CIPA does not require what people think.** 47 U.S.C. §254(h)/(l) and 47 CFR §54.520 mandate blocking/filtering of **visual depictions**. "Monitoring the online activities of minors" appears as an element of the *school's policy*, undefined — **not a mandate for automated content analysis. It binds the E-Rate recipient, not vendors. Handwave has no CIPA obligation of its own.** Schools will nonetheless ask; get this right in sales conversations.

**Three routes create a duty where none exists by default:** (1) **voluntary undertaking** — *"If Handwave markets crisis detection, it owns crisis detection — including the false negatives"*; (2) contract/DPA SLAs; (3) ⚠️ **mandated-reporter status, NOT VERIFIED per state — must be checked by counsel.**

⚑ **The counterintuitive design lesson.** CDT, *"Hidden Harms"* (2022): *"Monitoring is used for discipline more often than for student safety"*; *"**LGBTQ+ students are disproportionately targeted**… resulting in the nonconsensual disclosure of students' sexual orientation and gender identity"*; students report *"avoiding expressing their thoughts and feelings online."*

> **Aggressive monitoring suppresses disclosure — which degrades our *pedagogical* signal too, since the entire product depends on students candidly stating wrong predictions. Surveillance and our core mechanic are in direct tension.**

**Pattern:** detect narrowly on input with a classifier **separate from the tutoring path**; **precision over recall for notification, recall for showing resources**; **the product must never counsel**; route to a human; 988 + a school-designated trusted adult; notification is **district-configured**; **tell students in advance, in plain language, what is and isn't monitored**. **Route self-harm-adjacent chemistry questions to the crisis path, not the science path** — the single most important routing rule in the product.

---

## ✅ Accessibility: the reframe that changes which standard applies

> **Handwave is an authoring tool, not just a website.**

**ATAG 2.0 Part A** — the tool's own UI must be accessible. **Part B** — the tool must support production of accessible content. **Guideline B.1 is literally titled "Fully automatic processes produce accessible content."**
- **B.1.1.2** auto-generated content must be accessible, or the author prompted, or automated checking performed
- **B.2.3.2 Automating Repair of Text Alternatives (Level A)** — auto-repair must **avoid generic strings**, and authors must review before insertion. **This is the criterion for AI-generated descriptions.**

Mirrored in Revised 508 §§504.2–504.4 and in the **DOJ v. edX** consent decree: *"Ensure that the CMS **enables the creation and presentation of content that conforms** with WCAG 2.0 AA."*

**None of the Title II exceptions help.** "Conventional electronic documents" covers **only** PDF, word processor, presentation and spreadsheet formats. And DOJ **deliberately removed** the two proposed education exceptions for password-protected course content (89 FR 31371-74): *"password-protected course content will be treated like any other content."* **Putting a sim behind an LMS login provides zero shelter.**

⚑ **DOJ's own stated rationale for the 2026 delay is about our category:** *"Advanced technology, such as generative AI, **does not yet reliably automate the remediation of inaccessible content at scale**."* **Simultaneously a market opportunity and a credibility burden.**

### The architecture decision is the same one we already made
**Do not let the model emit free-form HTML/JS/canvas.** Constrain generation to a **typed intermediate representation over a fixed, hand-audited component library**. The model emits a spec; a deterministic runtime compiles it into the visual view, the **PDOM** view, and the sound view.

> **Accessibility becomes a property of the runtime, tested once, rather than a property of each generation, which cannot be tested.**
> **This is the same decision that solves hallucinated physics and generated-code sandboxing. One architecture, three problems. Highest-leverage decision in the report.**

### PhET's accessibility work is MIT-licensed and directly usable
`scenery`, `scenery-phet`, `tambo`, `utterance-queue`, `joist`, `sun`, `axon`, `dot` — **all MIT**, packaged as **SceneryStack** (`npm install scenerystack`, v3.0.0).
⚠️ **Three traps: the simulations are GPL-3.0; `tappi` (haptics) is GPL-3.0 and is in the bundled repo list — audit it out; and every audio and image asset is all-rights-reserved.** `tambo/sounds/license.json` reads `"license": "contact phethelp@colorado.edu"` for all 50 sounds. **The sonification code is MIT; the sound files are not.**

**The Parallel DOM:** an invisible, live HTML tree derived from the scene graph, handed to the accessibility tree. Paper: Smith, Greenberg, Reid & Moore, W4A '18, [doi:10.1145/3192714.3192817](https://doi.org/10.1145/3192714.3192817).

**Prose conventions to put verbatim in the generation prompt:**
| Field | Style | Example |
|---|---|---|
| `accessibleName` | Title case, no punctuation | "Detector Probe" |
| `accessibleHelpText` | Full sentence, **verb-initial** | "Move probe or jump to useful positions with keyboard shortcut." |
| `accessibleObjectResponse` | **Phrase fragment**, no final punctuation | "1.07 centimeters" |
| `accessibleContextResponse` | Sentence case, punctuated | "In light source path, centered in cuvette. Transmittance is 52.69 percent." |

**Enforceable rule:** *"Expose numeric values at the same precision in the PDOM as on-screen. **Use the same formatter for both.**"*

**Keyboard for analog interaction:** prefer `AccessibleSlider` over free dragging (*"much more accessible"*) · 2-D → `GrabDragInteraction` with `role="application"` · **`dragDelta` not `dragSpeed`** (*"many screen-reader/OS combinations do not recognize press-and-hold"*) · activate on `click`, not Enter/Space · **alert on end-drag** (*"most screen readers won't alert while a user has keys pressed"*).

⚑ **The single best idea to steal:** `responseCollector` makes the four response categories **user-toggleable**, composed into one utterance via a pattern table. **Verbosity becomes a user preference rather than a hard-coded design choice — exactly what you need when you cannot tune verbosity by hand per sim.**

**SC 2.5.7 Dragging Movements (AA) is close to fatal for naive AI-generated sims.** "Essential" is narrow — a physics sim's drag is almost never essential. **Reject any spec whose only affordance is a pointer drag.**
**SC 2.5.8 target size trap:** 24 **CSS** px ≠ 24 **model** units. Validate in screen space at every layout bound.

**Build to WCAG 2.2 AA** — superset of 508's 2.0, Title II's 2.1, and EN 301 549 v3.2.1's 2.1.

**Reality check on cost:** PhET's manifests show **142 active sims, ~80 with interactive description, only 7 with Voicing.**

---

## Trust signals — cost and effort

| Signal | Cost | Time |
|---|---|---|
| **A4L / SDPC vendor membership** (unlocks NDPA + Registry + badges) | **$1,300/yr** (published, <$1M revenue) | days |
| **GESS assessment** (education-specific, **AI-profiling-aware**, NDPA Exhibit F-recognised) | **$8,000–$10,000** member — expect **L3–4**, escalating to L4 for *"persistent profiles with predictive scoring"* | weeks |
| **Digital Promise "Responsibly Designed AI"** | not published ("modest fee") | ~28 days, valid 2 years |
| **Common Sense Privacy** | **$0 — and unsolicited. They rate you whether you engage or not.** | n/a |
| **SOC 2 Type II** | ~$25k–$45k all-in year one + 100–300 internal hours | **6–9 months** |
| ISO 27001 / ISO 42001 | $15k–$40k+ | **Skip / defer** — US districts ask for SOC 2 |

> **$1,300 for A4L membership is the cheapest high-leverage spend in the entire research corpus.**
> **Two things you cannot buy: a Common Sense privacy rating and a Youth AI Safety Institute AI risk assessment. Both are done *to* you, on published methodologies. Build against them now.**

**NDPA v2.2** (published 19 Nov 2025) defines **"Student Data" to include data *"inferred by Provider"*** — our misconception model *is* Student Data under the DPA the whole country signs. **Grepping the full v2.2 text returns zero hits for "artificial intelligence," "machine learning," "training," or "automated decision."** An SDPC AI addendum is **announced, not published** (AI Policy Project Team launched May 2026). **States are filling the vacuum ahead of SDPC — California already ships one. This is our window to shape our own disclosure language.**

---

## Staged compliance roadmap

### (a) Hackathon demo — next week
**Goal: demo without creating a legal artifact.** All of this is a day of work.
- ☐ **No real students. No real student data. Synthetic personas only.** Moots COPPA, FERPA, PPRA, every state act, and the DPIA questions in one decision.
- ☐ ⚑ **Get off Gemini, or use it only with adult judges and say so.** A public demo of a K-12 product is exactly what §20(d) prohibits.
- ☐ If using Gemini anyway, **set all four adjustable safety thresholds explicitly** — they default to Off.
- ☐ **Sandbox generated code now** — separate origin, `sandbox="allow-scripts"` only, `connect-src 'none'`. An afternoon, and unrecoverable later.
- ☐ ⚑ **Fix the copy.** Replace *"trust the simulation over your intuition"* with *"here's what the model predicts — check it against what you already know."* Per *Garcia* that copy is a **design choice**; per *Winter* it is a **voluntarily assumed duty**. Free now, expensive after it's in a deck and a demo video.
- ☐ Basic keyboard operability + an AI-generated disclosure line. Judges notice.

### (b) Public beta
- ☐ ⚑ Decide the model-provider question and paper it: zero-retention, no-training, no-human-review, with **§312.8(c) written security assurances**.
- ☐ Publish before launch: specific privacy policy · **written retention policy with an actual deletion timeframe, in the §312.4(d) notice** · AI transparency page naming the LLM subprocessor · public COPPA compliance statement (Anthropic requires it).
- ☐ Written children's information security program, all five §312.8(b) elements.
- ☐ Age posture: school-gated with roster provisioning, **or apply child protections to all users**. **Do not open a general-audience consumer tier.**
- ☐ Crisis path + AI disclosure at session start + break reminder for minors.
- ☐ Verification harness (conservation + dimensional analysis), **fail closed**. Start the golden-set accuracy metric — **it becomes the FTC substantiation file.**
- ☐ Start SOC 2 Type I clock. Join A4L ($1,300).

### (c) First school pilot
- ☐ **NDPA v2.2 with an originating LEA, Exhibit E enabled. Start in a non-CA state** until AB 1159 and the CA AI Addendum §4.8 "inferred data" question resolve.
- ☐ Build the four DSR workflows at the tightest number — **21 days** (NY) — reaching **the derived model, embeddings and fine-tuning artifacts**.
- ☐ **Single 7-calendar-day-from-discovery breach SLA globally** (satisfies NY's 7-day rule, beats IL's 30 and CO's).
- ☐ **Teacher-override UI with documented authority and training** — keeps us out of CPPA Article 11 and supports "meaningful human involvement" under WP251, UK Art 22C and Colorado.
- ☐ District-configurable parental-consent gate (Texas §32.1021(2)).
- ☐ **First bias evaluation by ELL status, IEP/504 status and response fluency. Publish the method.**
- ☐ VPAT 2.5Rev INT ACR, honest about generated content.

### (d) District contract
- ☐ SOC 2 Type II · **NIST CSF 2.0 mapping mandatory for NY by 1 September 2026** (GV.SC carries the LLM-subprocessor story).
- ☐ The **ED "Exhibit A" pack** from the 12 May 2026 SPPO letter to Instructure — infosec policy, risk register, vendor risk management, IRP, pen tests, **and "AI Usage Policies: Documentation covering the risks associated with Artificial Intelligence adoption."** **Treat that as the de facto ED vendor checklist and assemble it before a district asks.**
- ☐ **One combined assessment** satisfying Texas §541.105, Colorado §6-1-1309/§6-1-1309.5, CPPA §7152, and the GDPR/Children's Code DPIA. **Colorado's minors DPA must be done before 31 December 2026**, when the 60-day cure right is repealed.
- ☐ ⚑ **NIST AI RMF + documented adversarial/red-team testing + internal review** — an **affirmative defence in Colorado §6-1-1706(3)** and a **liability shield in Texas §552.105(e)(2)(D)**. **Build once, claim twice.**
- ☐ **Published AUP prohibiting Handwave outputs in any consequential decision**, mirrored contractually, with **every export and API response labelled "formative only — not for placement, grading, or eligibility."**

---

## Engineering checklist — the P0 items

☐ ⚑ **The misconception state must be a first-class, user-visible, mutable record** — not opaque model internals, not an unindexed embedding. Each label carries: stable ID, timestamp, **the evidence span that triggered it**, confidence, model/prompt version, status (`active`/`disputed`/`retracted`/`superseded`). **If the model exists only as weights, we cannot comply with any of these at any price.**
☐ **Separate the factual record from the inferred label.** Colorado §6-1-1705(1)(c) shields *"opinions, predictions, scores, or protected evaluations"* from correction — **only if the factual layer is cleanly separable.**
☐ **Abstention as a first-class output.** Forcing a label on every response is the accuracy-suppressing objective divergence the **FTC's July 2026 statement** targets, and the mechanism by which writing difficulty becomes a fake misconception.
☐ **Hard architectural block on special-category inference** — no disability/SEN/ELL/health/affect field, derived or stored. **Build-failing test if such a field appears in the schema.**
☐ ⚑ **Split the data planes.** School-instructed processing on one side; model-improvement and third-party API on the other. **Different stores, different keys, different contracts, schools able to decline the second without losing the product.** Resolves the ICO controller finding, the EU analysis, India s.9(3), and NY 121.1(c) simultaneously.
☐ **Provenance ledger per record** with **`training_eligible` defaulting false.** Must be able to rebuild a clean model without any given cohort — *Kurbo "Affected Work Product."*
☐ **Counterfactual explanation endpoint** (evidence span + what a different answer would have produced). Dumping the prompt is **expressly not an explanation**.
☐ **Contest flow** → `disputed` → teacher → resolution recorded → **profile re-evaluated** (Minnesota requires the re-run).
☐ **Delete + re-derive, not just delete** — erasure removes input text *and* every derived label *and* recomputes aggregates. Must reach **embeddings, vector stores, caches, logs, backups, and fine-tuned artifacts.**
☐ **Never infer emotion.** Architectural prohibition. EU AI Act Art 5, top penalty tier.
☐ **Separate legal entities** for the K-12 school business and any general-audience/API business. Every protective carve-out turns on the same word — *"primarily provides education services"* / *"used by and under the direction of an educational entity"* / *"accessible to the general public"* / *"provided to consumers."* **One consumer SKU can cost you all seven.**

---

## ⚠️ Unverified — check before relying
1. ⚑ Whether the **original Colorado SB 24-205 obligations are operative 30 Jun – 31 Dec 2026** (SB 26-189 §5 suggests yes; the AG's page is silent). **Highest-value open question.**
2. Any **2025–26 amendments to Illinois SOPPA** — ilga.gov unreachable; text stamped 1 Jan 2025.
3. Verbatim **8 NYCRR Part 121** and the Feb 2026 CSF 2.0 amendment text (Westlaw-hosted).
4. Whether **TEA adopted the Texas §32.1021 standards** governing parental consent.
5. Whether **CPPA "education enrollment or opportunities" reaches course placement/tracking** — pivotal for whether Article 11 attaches.
6. **Reg. (EU) 2026/1744 CELEX text** confirming 2 Dec 2027.
7. **DUAA 2025 commencement of s.80 / Arts 22A–22D.**
8. **C-634/21 SCHUFA operative paragraph verbatim** (press release verified; CURIA blocked).
9. **Mandated-reporter status of software vendors, per state.**
10. **Current official safe-messaging guidelines** (988/SAMHSA blocked) — obtain and have a clinician review every string in the crisis path.
11. Whether the **two 2026 accessibility IFRs have been finalised** — both are *interim*, and DOJ signals a possible further deregulatory NPRM.

**Method caveat:** the search budget was exhausted at the outset, so this was gathered almost entirely by direct fetch of primary sources — statutes, regulations, agency documents, court opinions, vendor terms. Citations are strong; **no secondary-source sweep was possible, which is exactly where a very recent development would surface first. Run a law-firm-alert sweep on items 1, 2 and 5 before this reaches counsel or a customer.**
