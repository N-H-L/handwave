# Learning Science — key findings, and the strongest attacks on our design

This is the most important research file. It both validates the mechanic and identifies three ways our current design is wrong.

---

## 🟢 The anchor citation — in our launch domain, against the obvious alternative

**delMas, Garfield & Chance (1999)**, *Journal of Statistics Education* 7(3) — [10.1080/10691898.1999.12131279](https://doi.org/10.1080/10691898.1999.12131279). Abstract, verbatim:

> **"An activity that asked students to test their predictions and confront their misconceptions was found to be more effective than one based on guided discovery. Our findings demonstrate that while software can provide the means for a rich classroom experience, computer simulations alone do not guarantee conceptual change."**

**This is Handwave's mechanic, tested against the obvious alternative, in probability, and it won.** Better than POE, better than anything in the PhET corpus, because it isolates exactly our differentiator: prediction-and-confrontation vs guided exploration **of the same simulation**.

✅ **DISCREPANCY RESOLVED** (re-verified by the researching agent): **prediction-and-confront 16% → 72%; guided discovery 22% → 49%** (pre → post, correct-or-good reasoning). An earlier reading of "16% vs 36%" was wrong. Still worth pulling the PDF before this goes in a demo video, but this is now the figure to use.

### Two more verified supports for the gate

**Crouch, Fagen, Callan & Mazur (2004)** — *fully verified*: **passive demo observation produces no significant gain in explanation quality over never seeing the demo at all (24% vs 22%, p = 0.64). Predicting first does.** This is the single cleanest refutation of "just show them the simulation."

**Brod et al. (2022)** — the asymmetry that justifies the gate: **without a prior prediction, memory for outcomes *decreases* as they get more surprising.** Surprise only helps if you committed first. Without the gate, the most striking sims are the least remembered.

**Wisniewski, Zierer & Hattie (2019)** — feedback *type* carries the largest effect in this corpus: **high-information d = 0.99** vs corrective **0.46** vs reinforcement **0.24**. Combined with Kendeou below: the high-information content must be the causal mechanism, not the verdict.

### Balance it honestly — the null results exist
Khazanov & Prado (2010), [ERIC EJ1068215](https://files.eric.ed.gov/fulltext/EJ1068215.pdf), catalogues them: Konold's own computer-modelling intervention gave *"mixed results"*; Garfield & delMas (1989) Coin Toss, *"mixed results"*; Snee (1993) held computer simulations *"may not be helpful in changing misconceptions about probability in some students"*; **Hirsch & O'Donnell (2001) found cognitive-conflict interventions *"did not reach the level of statistical significance."*** And delMas, Garfield & Chance (2002) found gains were **"short lived"** for some students.

---

## 🔴 R3 — Our outcome-comparison diagnostic is MATHEMATICALLY BROKEN for probability

**The clearest attack on the design.**

> A learner with the gambler's fallacy who predicts *"tails is due"* and sees tails **has just been rewarded by our simulation.** Any finite run can confirm a wrong belief.

Compounding it: **Chi (2005)** classifies randomness and sampling distributions as **emergent** processes misread as **direct** ones. **A sim that animates individual dice rolls one at a time visually affirms the direct-process reading** — each roll an event with a cause — which is the exact schema that generates the gambler's fallacy and Konold's "outcome approach."

**This is a concrete mechanism by which Handwave could make probability learning *worse*.** And there are two independent demonstrations that instruction already does exactly that:
- **Morsanyi, Primi, Chiesi & Handley (2009)**, [ERIC EJ847631](https://eric.ed.gov/?id=EJ847631), verbatim: ***"we found that the equiprobability bias increased with statistics education, and it was negatively correlated with students' cognitive abilities."***
- CAOS Table 9 data (same direction).

**Fixes, all mandatory:**
1. **Diagnose from the *rationale*, never from outcome match.**
2. **Default to n ≥ 1,000 and show the distribution, not the trajectory.**
3. **Prime the emergent-process category first** (see Rule 16).

---

## 🔴 R4 — Synthetic-model formation, which our diagnostic scores as a SUCCESS

**Vosniadou (1992)**, [ERIC ED404098](https://files.eric.ed.gov/fulltext/ED404098.pdf), verbatim:

> *"only **2 out of 60 children** changed from incorrect explanations in the pretest to correct explanations in the posttest. Most children simply **added the information that the earth moves (in an unspecified way) to their existing model, or created a synthetic model**."*

**2 out of 60. Use that number.**

**The predictable Handwave failure:** *"in the **simulation** the feather and hammer land together, because the computer turns off air; in **real life** heavy things fall faster."* That learner now predicts correctly **within the sim** while retaining the misconception outside it — **and our prediction-vs-outcome comparison scores them as fixed.**

A simulation is a higher-authority, more vivid input than a textbook paragraph **and makes no claim about its own scope.** Vosniadou also documents instructional materials *manufacturing* synthetic models — a chapter whose wording *"reinforces the dual-earth mental model."* **Our generated sims will do this too unless someone checks.**

**Fix: the post-sim probe must be a transfer item in a non-simulated, real-world framing — never a re-run of the sim.**

---

## 🔴 R2 — Writing a rationale may STRENGTHEN the misconception

**Chan, Jones, Hall Jamieson & Albarracín (2017)**, *Psychological Science* 28(11) — [10.1177/0956797617714579](https://doi.org/10.1177/0956797617714579). **Meta-analysis, k = 52, N = 6,878.** Verbatim:

> Debunking **d = 1.14–1.33**; persistence of misinformation despite debunking **d = 0.75–1.06**. ***"Persistence was stronger and the debunking effect was weaker when audiences generated reasons in support of the initial misinformation."*** And: ***"Surprisingly, however, a detailed debunking message also correlated positively with the misinformation-persistence effect."***

**Our premium feature — make them write down *why* — is precisely the moderator this meta-analysis identifies as making corrections less effective.**

The knowledge-in-pieces camp agrees independently. Athanasopoulos (2023), [arXiv:2308.15601](https://arxiv.org/abs/2308.15601), verbatim: *"the intention is to teach and practise the correct idea **without forcing the students to commit**… we would like to **avoid activating the wrong p-prim, which might naturally happen if you force them to commit to an answer**."*

**And then he tested it, and the KiP-motivated design lost.** N=87, Year 8/9 top sets, Newton's First Law: cognitive-dissonance-first vs explain-misconceptions-at-the-end. **Year 8 whole test d = 0.92, 95% CI [0.23, 1.61]** (65% vs 48%). Verbatim: *"**inducing cognitive dissonance at the beginning of a learning sequence seems to be superior to explaining common misconceptions at the end**… It is likely that it creates a 'desirable difficulty'."*
⚠️ But on **high-discriminator (deep conceptual) items: d = −0.14, CI [−0.75, 0.47]** — no advantage either way. N=87, unblinded, single teacher, two lessons.

Pulling the other way: **Swire-Thompson et al. (2021)** — correction format was largely irrelevant *"as long as the key ingredients of a correction were presented,"* with one exception: ***"with a delayed retention interval, the myth-first format was more effective at myth correction than the fact-first format."*** **Myth-first is Handwave's ordering.**

> 🎯 **This is genuinely unresolved and it is our single highest-value experiment.** Run **prediction-with-rationale vs prediction-without-rationale vs no-prediction** as a first-class arm. **Do not assume the rationale helps.**

---

## 🔴 R1 — There may be no coherent belief to diagnose, and our elicitation will manufacture one

Theory: diSessa 1993 / diSessa & Sherin 1998 / diSessa 2013 ("A bird's-eye view of the 'pieces' vs 'coherence' controversy," pp. 43–60).

Empirically, four studies find coherent "mental models" appear **only under Vosniadou-style open questions, drawings, and coding scheme** and dissolve under forced-choice — verbatim, *"largely methodological artifacts,"* knowledge *"incoherent and fragmented"*: Nobes, Martin & Panagiotaki (2005) N=62+31 · Panagiotaki et al. (2006) N=59 · Panagiotaki et al. (2009) N=127 · Frede et al. (2011) N=178.

**And it is demonstrated inside our launch domain.** **Konold, Pollatsek, Well, Lohmeier & Lipson (1993)**, *JRME* 24(5) — five coin flips, choose the **most likely** of four sequences: ***"the majority of subjects (72%) correctly answered that the sequences are equally likely."*** Asked for the **least likely**: ***"Only half the subjects who had answered correctly responded again that the sequences were equally likely."***

> **Read what that does to a single-prediction diagnostic engine. The same student, on the same item, is "understands independence" or "representativeness bias" depending purely on which phrasing we happened to ship.**

**Fix (Rule 18): probe each concept at least twice with inverted framing, and treat inconsistency as the primary signal rather than noise.** Never diagnose from one prediction. Express uncertainty. Report inconsistency as a finding rather than resolving it into a label.

---

## 🟡 Correction — the active ingredient is the EXPLANATION, not the refutation

**Kendeou, Walsh, Smith & O'Brien (2014)**, *Discourse Processes* 51(5–6) — [10.1080/0163853X.2014.913961](https://doi.org/10.1080/0163853X.2014.913961). Four experiments:
- Exp 1 (n=36): refutation-plus-explanation *"was sufficient to significantly reduce disruption during reading"*
- Exp 2 (n=36): ***"the refutation alone reduced but did not eliminate the disruption"***
- Exp 3 (n=36): ***"the explanation alone was as effective as the refutation-plus-explanation"***
- Exp 4 (n=73): refutation-plus-explanation *"also produced long-term learning outcomes"*

> **Saying "you were wrong" is not what does the work. The causal-mechanism explanation is.**

→ The post-sim moment should be **≳80% mechanism** (*"here is what actually governs this, and where your rule *is* correct"*) and **≲20% contrast marking.**

Guzzetti (2000) from the other direction: *"refutational text is **not sufficient** to produce conceptual change"*; *"discussion of refutational text must be **teacher-guided and text-supported**"*; but *"**only refutational text shows long-term effects**."*

### The KReC mechanism — two hard product consequences
Butterfuss & Kendeou, [ERIC ED612635](https://files.eric.ed.gov/fulltext/ED612635.pdf), five principles. Verbatim highlights: information in long-term memory *"cannot simply be erased or replaced"*; **coactivation** is *"necessary for knowledge revision because **both the new information and misconception from prior knowledge must be simultaneously activated**"*; **competing activation** — *"as the amount of newly encoded information increases, the causal network of that information will begin to **dominate and draw activation… away from the misconception**."*

**(a) The correction screen must re-display the learner's own prediction text alongside the outcome and the explanation. Never navigate away first — that breaks coactivation, which is the necessary condition.**
**(b) One sim is one encoding event.** Competing activation is a *volume* mechanism. **A single dramatic reveal is theoretically insufficient by this framework's own terms.**

---

## 🎯 The encodable physics taxonomy already exists, fully specified

**Hestenes, Wells & Swackhamer (1992)**, *The Physics Teacher* 30(3), 141–158 — [10.1119/1.2343497](https://doi.org/10.1119/1.2343497). Full text: [davidhestenes.net/modeling/R&E/FCI.PDF](https://davidhestenes.net/modeling/R&E/FCI.PDF).

> **Table II is titled "A Taxonomy of Misconceptions Probed by the Inventory." It lists 28 distinct misconceptions in six commonsense categories, each mapped to the exact FCI item numbers and distractor letters that diagnose it.**

**That is a ready-made structured dataset.** Six categories:
- **K. Kinematics (3)** — position/velocity undiscriminated; velocity/acceleration undiscriminated; nonvectorial velocity composition
- **I. Impetus (5)** — impetus supplied by "hit"; loss/recovery; dissipation; gradual build-up; circular impetus. Verbatim gloss: *"Every object is (like) a **container** that can store a supply of impetus, like a car stores gas, a kind of 'go power'."* Circular impetus is justified by a *"**training metaphor**… objects tend to do what they have been 'trained' to do."*
- **AF. Active Force (7)** — only active agents exert forces; motion implies active force; no motion implies no force; velocity ∝ applied force; acceleration implies increasing force; force causes acceleration to terminal velocity; active force wears out. Their syllogism: *"Every effect has a cause. Motion is an effect. Therefore, motion has a cause."*
- **AR. Action/Reaction (2)** — greater mass implies greater force; most active agent produces greatest force. Students see interaction as a *"**struggle between opposing forces**… **victory belongs to the stronger**."*
- **CI. Concatenation of Influences (3)** — largest force determines motion; force compromise; last force to act
- **Plus Obstacles, Resistance (3), Gravity (5), Centrifugal force.** ⚠️ Verbatim caveat from the paper: the FCI *"**does not contain any items designed specifically to probe** for the centrifugal force misconception."*

Second, more granular layer: **Halloun & Hestenes (1985)**, *AJP* 53(11) — [10.1119/1.14031](https://doi.org/10.1119/1.14031), with verbatim entries like *"A constant force produces a constant velocity, sometimes expressed as **F = mv**"*; *"The force **wears out**"*; *"**Inertia (weight or mass) is an intrinsic resistance of an object to motion**"*; and *"**heavier objects fall faster. This belief is so common that it deserves to be examined carefully.**"*

✅ **Resolves the FCI item-count discrepancy:** original **1992 = 29 questions**; **v95 (1995) = 30 questions**. Both sources were right about different versions.

**Item architecture, from AAAS Project 2061** — Herrmann-Abell & DeBoer (NARST 2015), [ERIC ED560007](https://files.eric.ed.gov/fulltext/ED560007.pdf): *"**distractor-driven, multiple-choice items**… **Common student misconceptions are included as incorrect answer choices (distractors) so that the items can be used to diagnose why students are not selecting the correct answer.**"* N=3,037, grades 4–12, Rasch modelling.

> **The finding that should shape our engine: *"specific misconceptions appear and disappear in sequence as students become more knowledgeable."*** → **Diagnosis must be conditioned on estimated proficiency, not a flat lookup table.**

⚠️ `assessment.aaas.org` was **unreachable** (connection refused); `aaas.org/programs/project-2061/science-assessment` returns 404. **Verify it still exists before citing it as an available resource.**

**Duit's bibliography — live URL:** [https://archiv.leibniz-ipn.de/stcse/](https://archiv.leibniz-ipn.de/stcse/) — **~8,400 entries, "New and Final Version," March 2009. Frozen — do not present it as current.**

---

## Probability: surface features cue the model

**Lecoutre (1992)**, via Khazanov & Prado, verbatim: *"The specific activation of a particular model was found to be linked to the '**surface features**' of the situation,"* and she *"succeeded in activating an appropriate combinatorial model by **masking the random aspect** of the situation."*

Same story as the p-prim "closer means stronger" — right for candles, wrong for seasons.
→ **Generate 3–5 surface-distinct sims per target concept and check transfer. Never declare victory on one.**

**SRA scales:** citable secondary source is Tempelaar, Gijselaers & van der Loeff (2006), *JSE* 14(1) — [jse.amstat.org/v14n1/tempelaar.html](https://jse.amstat.org/v14n1/tempelaar.html). 8 correct-reasoning + 8 misconception scales; reliability **aggregate α = .29/.11**, test–retest .70/.75. ⚠️ Those alphas are very low — treat sub-scale scores with caution.

---

## Design rules 15–18

**15. Two-layer misconception schema: surface belief → underlying constraint/p-prim, with the explanation aimed at the lower layer.**
Vosniadou, verbatim: *"**misconceptions will not be replaced… if the entrenched belief(s) that underlie them are not removed**… **Otherwise, one misconception will be followed with another and students will remain confused.**"* And: *"a very small number of entrenched beliefs, acting as constraints… **can lie at the root of a very large number of misconceptions**."*

> **A data model of `{misconception → correction}` is exactly the architecture she says produces "one misconception followed with another."**

For force/motion the constraint set is small and known: *motion-requires-cause · dominance-in-interaction · gravity-as-intrinsic-downward-tendency · impetus-as-container.*

The p-prim framing gives us the copy. Athanasopoulos on the Hammer/Sadler example, verbatim: *"**The p-prim itself is not wrong**… **It is the application of the p-prim to this particular phenomenon that is wrong.**"*
→ **Attack the rule, validate where it works, never attack the person.** Knowledge-in-pieces and warm conceptual change converge on the same UI instruction here.

**16. For emergent-process concepts, run an ontology-priming sim BEFORE the concept sim.**
Chi (2005), *JLS* 14(2) — misconceptions are robust when the target is an *emergent* process misread as a *direct* one. Named exemplars: **electric current, heat/temperature, diffusion, evolution** — and by the same criterion, **randomness and sampling distributions**. Slotta & Chi (2006) showed ontology training delivered *before* physics instruction produced deeper understanding of electric current in a controlled comparison.
→ Prime the category (*many independent agents, no controller, pattern only in aggregate*) before teaching the concept.

**17. Condition the diagnosis on estimated proficiency.** (AAAS Rasch result above.) A flat misconception lookup will **misdiagnose systematically at both ends of the ability range.**

**18. Probe each concept twice with inverted framing; treat inconsistency as the signal.**
Konold et al. (1993). **A single forced prediction with a small answer set is structurally a coding scheme that assigns a coherent label to fragmentary reasoning.**

---

## Two more risks

**R5 — "Telling fails, therefore simulating works" is a non-sequitur, and Handwave removes the mediating variable.**
Hake's ⟨g⟩ = 0.48 comes from **peer-discussion-heavy classroom methods**, not solo software. Guzzetti: *"discussion of refutational text must be **teacher-guided and text-supported**."* Two POE/conceptual-change meta-analyses find computer-mediated delivery carries **no** advantage (Koyunlu Ünlü 2024: 0.875 vs 1.019; Pacaci et al. 2024: hands-on > text > computer-based).

> **Handwave has no peer, no instructor, and no discussion. The burden of proof is on the product, and the study should be designed to carry it rather than assume it.**

**R6 — Metacognitive aversion + AI offloading.** Deslauriers et al. 2019; Bastani et al. 2025 (**−17%**); Fan et al. 2024. **Gregoire's CAMCC (2003)** adds the mechanism: an automatic **"implicates self" threat appraisal fires *before* the learner evaluates message content**; threat → defensive/heuristic processing and no change; challenge → systematic processing and change.

---

## Posner et al. (1982) prescribed Handwave

Verbatim, pp. 225–226:
> *"Develop lectures, demonstrations, problems, and labs which can be used to **create cognitive conflicts** in students"*
> *"Organize instruction so that teachers can spend a substantial portion of their time in **diagnosing errors in student thinking and identifying defensive moves used by students to resist accommodation**."*

Their warning, verbatim: be an adversary *"with regard to conceptions"* while *"avoid[ing] establishing an adversarial role with regard to students as persons."*

And the expectation-setter, p. 220: *"Accommodation, particularly for the novice, is best thought of as a **gradual adjustment**… **what may initially appear as an accommodation may turn out to be something less than that.**"*

---

## Citation corrections
- **CAMCC is Gregoire (2003)**, *Educational Psychology Review* 15(2), 147–179 — **not Sinatra**. Sinatra's model is the **CRKM** with Dole (1998), *Educational Psychologist* 33(2–3), 109–128.
- **There is no diSessa 2018 Handbook chapter.** Editions are 2008 and **2013**; diSessa's chapter is 2013, pp. 43–60.
- The diSessa (1993) DOI carrying a "1985" fragment is a Taylor & Francis legacy artifact, not the year.
- Direct reply in the same issue: **Chi & Slotta (1993)**, "The ontological coherence of intuitive physics," *Cognition and Instruction* 10(2–3), 249–260.

---

## The study, final form

**Three changes from the naive design:**

1. **Change the primary contrast.** Not "Handwave vs LLM text." Make it **prediction-and-confront vs guided exploration of the identical sim** — the delMas/Garfield/Chance contrast. It isolates our actual differentiator, has a published precedent with a large effect, and is the comparison a skeptical reviewer will demand. Keep an LLM-text arm as the market baseline.
2. **Add the rationale arm.** Prediction-with-written-rationale vs prediction-only. Chan et al. predicts it *hurts*; delMas and Athanasopoulos predict it helps. **Nobody has run it. This is the arm most likely to produce a publishable finding**, and it settles a real product question.
3. **The Day-7 outcome must include a real-world-framed transfer item, not a sim re-run** — the only instrument that detects R4's synthetic model.

**Powering:** target **g ≈ 0.49** (D'Angelo et al.'s enhanced-vs-unenhanced-sim estimate) → **64/arm**. Interpret against **Kraft's benchmarks (≥0.20 = Large)**, disclosing that a narrow researcher-aligned measure at N ≈ 260 sits where Kraft shows inflation (0.17 narrow vs 0.10 broad; 0.24 at N ≤ 100).

---

## Net position

The core mechanic has **better** empirical support than initially credited — delMas, Garfield & Chance (1999) is a direct, on-domain validation.

**The three things most likely to be wrong in the current design, in order:**
1. **Diagnosing from a single prediction when the belief may not be coherent**
2. **The outcome-match comparison being mathematically invalid in probability**
3. **A synthetic model that our own diagnostic scores as a success**


---

## Instrument availability — a practical blocker

- **Every PhysPort physics instrument (FCI, FMCE, CSEM) is faculty-gated.** Confirmed independently by two agents. A student founder cannot simply download the FCI.
- **The CAOS/ARTIST distribution site is dead.**
- ✅ **The SRA (Garfield 2003) is ungated** — 20 items, 8 misconception scales that map onto our taxonomy. See `08-learner-modeling.md`.

→ **For the first study, use the SRA and build our own transfer items. Treat FCI access as something to obtain through a PER faculty partner (see `04-gtm-and-distribution.md`, partnership #3), not as a resource we have.**
