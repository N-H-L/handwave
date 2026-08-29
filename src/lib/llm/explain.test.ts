/**
 * Tests for the explainer, and in particular for the grounding check.
 *
 * The grounding check is the novel piece of this architecture, so it is tested
 * adversarially: the interesting cases are a plausible explanation that quotes
 * a number the simulator never produced, and a correct explanation that must
 * NOT be flagged for using ordinary prose numbers.
 */

import { describe, expect, it, vi } from "vitest";
import {
  ExplanationSchema,
  buildExplainPrompt,
  checkGrounding,
  explainRun,
  explainSystemInstruction,
  factsFrom,
} from "./explain";
import type { GeminiConfig, GeminiRequest, GeminiResult } from "./gemini";
import { FREEFALL_DEFAULTS, freefall } from "@/lib/sim/sims/freefall";
import { PENDULUM_DEFAULTS, pendulum } from "@/lib/sim/sims/pendulum";

const CONFIG = { apiKey: "k", model: "m" };

const TRACE = freefall.run(FREEFALL_DEFAULTS, { air_resistance: true });

const INPUT = {
  question: "do heavy things fall faster?",
  trace: TRACE,
  predictions: [{ prompt: "Which lands first?", said: "The heavier one", was: "The heavier one" }],
  rationale: "heavier things are pulled down harder so they should get there sooner",
};

const GOOD_EXPLANATION = {
  reasoning: "They are using 'more weight means more pull means faster', which is about force.",
  where_your_rule_works: "In air this is genuinely true, and this run shows it.",
  what_actually_happens:
    "Both objects are pulled down and both are pushed back by the air. The heavier one carries far more weight for the same frontal area, so the same push slows it much less.",
  where_it_breaks: "Take the air away and the two land together, because mass cancels out.",
  facts_used: ["gap_ms", "t_heavy_s"],
};

function modelReturning(json: unknown) {
  return vi.fn(
    async (_c: GeminiConfig, _r: GeminiRequest): Promise<GeminiResult> => {
      void _c;
      void _r;
      return { ok: true, json, raw: JSON.stringify(json) };
    },
  );
}

describe("the facts handed to the explainer", () => {
  it("are exactly what the simulator computed, and only finite ones", () => {
    const facts = factsFrom(TRACE);
    expect(facts.gap_ms).toBeCloseTo(TRACE.outcome.gap_ms, 10);
    for (const v of Object.values(facts)) expect(Number.isFinite(v)).toBe(true);
  });

  it("drops Infinity rather than shipping it as a number", () => {
    const vacuum = freefall.run(FREEFALL_DEFAULTS, { air_resistance: false });
    expect(vacuum.outcome.terminal_heavy_m_s).toBe(Infinity);
    expect(factsFrom(vacuum).terminal_heavy_m_s).toBeUndefined();
  });
});

describe("the prompt", () => {
  const prompt = buildExplainPrompt(INPUT);

  it("carries the computed numbers", () => {
    expect(prompt).toContain("gap_ms");
    expect(prompt).toContain("WHAT THE SIMULATOR COMPUTED");
  });

  it("carries the idealisations, on or off, in words", () => {
    // Without this the explainer would diagnose a belief the run had quietly
    // assumed away, which is the failure the adversarial review demonstrated.
    expect(prompt).toContain("air_resistance = true");
    expect(prompt).toMatch(/quadratic drag/i);
  });

  it("carries where the model stops being true", () => {
    expect(prompt).toContain("WHERE THIS MODEL STOPS BEING TRUE");
    expect(prompt).toContain("dropped from rest");
  });

  it("carries the student's own words", () => {
    expect(prompt).toContain("pulled down harder");
  });

  it("changes with the idealisation, so the explainer cannot conflate the two runs", () => {
    const vacuum = buildExplainPrompt({
      ...INPUT,
      trace: freefall.run(FREEFALL_DEFAULTS, { air_resistance: false }),
    });
    expect(vacuum).toContain("air_resistance = false");
    expect(vacuum).toMatch(/vacuum/i);
  });
});

describe("the system instruction", () => {
  const system = explainSystemInstruction();

  it("forbids computing new numbers", () => {
    expect(system).toMatch(/do not compute new ones/i);
  });

  it("requires naming where the rule is right", () => {
    expect(system).toMatch(/where their rule is right/i);
  });

  it("forbids the words that turn an explanation into a verdict", () => {
    expect(system).toMatch(/never say they are wrong/i);
    expect(system).toMatch(/incorrect/i);
  });
});

describe("the grounding check", () => {
  const facts = { gap_ms: 54.4, t_heavy_s: 2.0223, t_light_s: 2.0767, drop_height_m: 20 };

  it("passes an explanation that only cites supplied numbers", () => {
    const text = "The shot put lands after 2.0223 s and the baseball after 2.0767 s, a gap of 54.4 ms.";
    expect(checkGrounding(text, facts).ok).toBe(true);
  });

  it("CATCHES a number the simulator never produced", () => {
    // The dangerous case: fluent, plausible, and quoting a figure from
    // nowhere. This is precisely what the architecture exists to prevent, so
    // it is what the check is pointed at.
    const text = "The shot put lands 18.8 ms before the baseball.";
    const result = checkGrounding(text, facts);
    expect(result.ok).toBe(false);
    expect(result.untraceable).toContain("18.8");
  });

  it("allows small whole numbers, which are prose and not measurements", () => {
    const text = "Both objects fall, and the two of them differ by a factor of about 3.";
    expect(checkGrounding(text, facts).ok).toBe(true);
  });

  it("allows a ratio between two supplied facts", () => {
    // 2.0767 / 2.0223 = 1.0269. A model doing arithmetic the student can check
    // is not inventing a measurement.
    const text = "The lighter one takes 1.027 times as long.";
    expect(checkGrounding(text, facts).ok).toBe(true);
  });

  it("allows a rate written as a percentage", () => {
    expect(checkGrounding("It wins 66.67% of the time.", { rate: 0.6667 }).ok).toBe(true);
  });

  it("catches a plausible-looking wrong percentage", () => {
    expect(checkGrounding("It wins 75.2% of the time.", { rate: 0.6667 }).ok).toBe(false);
  });

  it("reports each bad number once, not once per mention", () => {
    const text = "It was 18.8 ms, definitely 18.8 ms.";
    expect(checkGrounding(text, facts).untraceable).toEqual(["18.8"]);
  });

  it("copes with thousands separators", () => {
    expect(checkGrounding("Over 20,000 trials.", { trials: 20000 }).ok).toBe(true);
  });

  it("passes on prose with no numbers at all", () => {
    expect(checkGrounding("Heavier objects are slowed less by the same push.", facts).ok).toBe(true);
  });
});

describe("running the explainer", () => {
  it("returns a validated explanation and a grounding verdict", async () => {
    const out = await explainRun(INPUT, {
      config: CONFIG,
      call: modelReturning(GOOD_EXPLANATION) as never,
    });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    expect(out.explanation.where_your_rule_works).toMatch(/genuinely true/);
    expect(out.grounding.ok).toBe(true);
  });

  it("flags an explanation that quotes an unsupported number", async () => {
    const bad = {
      ...GOOD_EXPLANATION,
      what_actually_happens: "The shot put arrives 18.8 ms sooner than the baseball.",
    };
    const out = await explainRun(INPUT, { config: CONFIG, call: modelReturning(bad) as never });
    expect(out.ok).toBe(true);
    if (!out.ok) return;
    // Returned, not suppressed: the student sees the explanation AND the note
    // that one of its figures could not be traced to the run.
    expect(out.grounding.ok).toBe(false);
    expect(out.grounding.untraceable).toContain("18.8");
  });

  it("rejects an explanation that does not match its schema", async () => {
    const out = await explainRun(INPUT, {
      config: CONFIG,
      call: modelReturning({ reasoning: "hi" }) as never,
    });
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toMatch(/schema/i);
  });

  it("says plainly that there is no explanation when no key is set", async () => {
    const out = await explainRun(INPUT, { config: null });
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toMatch(/GEMINI_API_KEY/);
    // And it is explicit that the simulation is unaffected — the numbers on
    // screen do not depend on the model existing.
    expect(out.error).toMatch(/unaffected/);
  });

  it("passes the model's transport error through rather than inventing prose", async () => {
    const failing = vi.fn(
      async (): Promise<GeminiResult> => ({ ok: false, error: "503 unavailable" }),
    );
    const out = await explainRun(INPUT, { config: CONFIG, call: failing as never });
    expect(out.ok).toBe(false);
    if (out.ok) return;
    expect(out.error).toContain("503");
  });
});

describe("the explanation schema", () => {
  it("puts reasoning first", () => {
    expect(Object.keys(ExplanationSchema.shape)[0]).toBe("reasoning");
  });

  it("requires the where-your-rule-works field — it is not optional", () => {
    const without = { ...GOOD_EXPLANATION, where_your_rule_works: "" };
    expect(ExplanationSchema.safeParse(without).success).toBe(false);
  });

  it("caps the contrast shorter than the mechanism", () => {
    // 80/20 mechanism-to-contrast, enforced by the field limits rather than
    // left to the prompt to remember.
    const shape = ExplanationSchema.shape;
    const maxOf = (k: keyof typeof shape) =>
      (shape[k] as unknown as { _zod: { bag: { maximum: number } } })._zod.bag.maximum;
    expect(maxOf("what_actually_happens")).toBeGreaterThan(maxOf("where_it_breaks"));
  });
});

describe("a second simulator, to prove none of this is freefall-specific", () => {
  it("builds a pendulum prompt with the small-angle assumption named", () => {
    const trace = pendulum.run(PENDULUM_DEFAULTS, { small_angle: true });
    const prompt = buildExplainPrompt({
      question: "does pulling it back further change the period?",
      trace,
      predictions: [{ prompt: "Longer or shorter?", said: "Longer", was: "Same" }],
      rationale: "further to travel so it takes longer",
    });
    expect(prompt).toContain("small_angle = true");
    expect(prompt).toMatch(/does not depend on the release angle/i);
    // The explainer is therefore told, in words, that this run assumed the
    // very thing the student is asking about.
    expect(prompt).toContain("period_s");
  });
});
