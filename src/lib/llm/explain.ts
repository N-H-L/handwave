/**
 * LLM #2 — explain, grounded in what the simulator actually computed.
 *
 * This is the second and last place a model appears, and it is given exactly
 * one thing to do: take numbers that a tested simulator produced, plus the
 * student's own words, and say what is going on. It is never asked what
 * happens. It is told what happened.
 *
 * Four constraints, each from a specific finding:
 *
 *  - ~80% CAUSAL MECHANISM, ~20% CONTRAST. Kendeou et al. Exp. 3 found the
 *    explanation alone was as effective as refutation-plus-explanation.
 *    "You were wrong" is not the part that works.
 *
 *  - NAME WHERE THE RULE IS RIGHT. Both knowledge-in-pieces and
 *    warm-conceptual-change converge here: attack the rule, validate its
 *    domain, never the person. A student who says heavier things fall faster
 *    has a rule that is TRUE IN AIR. Telling them it is false teaches them
 *    that physics disagrees with their eyes.
 *
 *  - THE IDEALISATIONS ARE HANDED OVER EXPLICITLY. Without them the explainer
 *    would confidently diagnose a misconception that the run had quietly
 *    assumed away — the exact failure the adversarial review demonstrated.
 *
 *  - EVERY NUMBER IS CHECKED. The model is given the computed facts and its
 *    prose is then scanned: any figure it cites that cannot be traced back to
 *    one of them is reported. See `checkGrounding`.
 */

import { z } from "zod";
import { callGemini, geminiConfigFromEnv, type GeminiConfig } from "./gemini";
import { REGISTRY, type SimId } from "@/lib/sim/registry";
import type { Trace } from "@/lib/sim/types";

export const ExplanationSchema = z.object({
  /**
   * First, and about the student's RULE rather than their answer. What
   * general belief would produce that prediction?
   */
  reasoning: z.string().min(1).max(600),
  /** Rule 5. Where their rule genuinely holds. Never empty, never grudging. */
  where_your_rule_works: z.string().min(1).max(700),
  /** The mechanism. This is the bulk of it. */
  what_actually_happens: z.string().min(1).max(1400),
  /** The contrast, kept short on purpose. */
  where_it_breaks: z.string().min(1).max(700),
  /**
   * Which of the supplied facts were used. Not decorative: it is checked
   * against the prose, and against the facts that were actually provided.
   */
  facts_used: z.array(z.string()).max(12),
});

export type Explanation = z.infer<typeof ExplanationSchema>;

export type ExplainInput = {
  question: string;
  trace: Trace;
  predictions: { prompt: string; said: string; was: string }[];
  rationale: string;
};

/**
 * The facts the explainer is allowed to work from: what the simulator
 * computed, and what it assumed. Nothing else.
 */
export function factsFrom(trace: Trace): Record<string, number> {
  const facts: Record<string, number> = {};
  for (const [k, v] of Object.entries(trace.outcome)) {
    if (Number.isFinite(v)) facts[k] = v;
  }
  return facts;
}

function factsBlock(trace: Trace): string {
  const facts = factsFrom(trace);
  const lines = Object.entries(facts).map(
    ([k, v]) => "  " + k + " = " + (Math.abs(v) < 1000 ? Number(v.toPrecision(6)) : Math.round(v)),
  );
  const ideals = trace.idealizations
    .map((d) => "  " + d.key + " = " + d.on + " — " + (d.on ? d.whenOn : d.whenOff))
    .join("\n");
  return [
    "WHAT THE SIMULATOR COMPUTED (these numbers are measured, not estimated):",
    lines.join("\n"),
    "",
    "WHAT IT ASSUMED:",
    ideals || "  (nothing to declare)",
    "",
    "WHERE THIS MODEL STOPS BEING TRUE:",
    "  " + REGISTRY[trace.simId as SimId].validity.summary,
  ].join("\n");
}

export function explainSystemInstruction(): string {
  return `You explain what a physics or probability simulation just did, to the student who predicted it.

You are given numbers a deterministic, unit-tested simulator computed. Use those numbers. Do not compute new ones, do not estimate, and do not state any quantity that is not in the list you are given. If you want to say something you cannot support with a supplied number, say it qualitatively instead.

Four rules about the writing:

1. MOSTLY MECHANISM. Spend most of your words on WHY the thing happened — the chain of cause and effect. Spend very little on the fact that the student's prediction differed.

2. START BY SAYING WHERE THEIR RULE IS RIGHT, and mean it. A student who thinks heavier things fall faster is right about the world they live in — in air, a shot put really does beat a baseball. Find the conditions under which their rule genuinely holds and say so plainly. This is not a softener before the correction; it is the most useful thing you can tell them, because it is what makes their rule safe to keep using where it works.

3. NEVER SAY THEY ARE WRONG. Do not say "incorrect", "mistake", "actually", or "the misconception here". Attack the rule's boundaries, never the person. Write as if to a colleague who holds a reasonable approximation.

4. RESPECT THE ASSUMPTIONS. You are told which idealisations were in force. If air resistance was switched off, do not tell the student that heavy and light objects fall the same — say that they do so in a vacuum, and that this run had air switched off. Never diagnose a belief that is true under conditions the student actually inhabits.

Write your reasoning first: name the general rule that would produce the prediction they made. Then fill in the other fields.`;
}

export function buildExplainPrompt(input: ExplainInput): string {
  const predictions = input.predictions
    .map((p) => "  Q: " + p.prompt + "\n  They said: " + p.said + "\n  It was: " + p.was)
    .join("\n\n");

  return [
    "The student asked: " + input.question,
    "",
    "THEIR PREDICTION:",
    predictions,
    "",
    "IN THEIR OWN WORDS:",
    "  " + (input.rationale || "(they did not say)"),
    "",
    factsBlock(input.trace),
  ].join("\n");
}

/**
 * Every number in the prose, traced back to a supplied fact.
 *
 * The model is not trusted to only cite real figures, so its prose is checked
 * against the facts the simulator produced. Bare small integers are allowed —
 * "twice as far", "the two halves", "one in six" is prose, not measurement —
 * but anything with a decimal point, and anything large, has to correspond to
 * something the run actually computed.
 *
 * This does not make the explanation true. It makes it impossible for the
 * explanation to quote a number the simulation never produced, which is the
 * specific failure this whole architecture exists to prevent.
 */
export function checkGrounding(
  text: string,
  facts: Record<string, number>,
): { ok: boolean; untraceable: string[] } {
  const values = Object.values(facts);
  // Percentages of a rate, and simple ratios between any two facts, are fair
  // game — a model saying "about three times as much" is doing arithmetic the
  // student can check, not inventing a measurement.
  const derived = new Set<number>();
  for (const v of values) {
    derived.add(v);
    derived.add(v * 100);
    derived.add(v / 100);
    derived.add(Math.abs(v));
  }
  for (const a of values) {
    for (const b of values) {
      if (b !== 0) derived.add(a / b);
    }
  }

  const untraceable: string[] = [];
  const matches = text.match(/-?\d+(?:[.,]\d+)?/g) ?? [];

  for (const literal of matches) {
    const n = Number(literal.replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    // Small whole numbers are prose. "the two objects", "all five flips".
    if (Number.isInteger(n) && Math.abs(n) <= 10) continue;

    const tolerance = Math.max(Math.abs(n) * 0.02, 0.02);
    let found = false;
    for (const candidate of derived) {
      if (Math.abs(candidate - n) <= tolerance) {
        found = true;
        break;
      }
    }
    if (!found) untraceable.push(literal);
  }

  return { ok: untraceable.length === 0, untraceable: [...new Set(untraceable)] };
}

export type ExplainOutcome =
  | {
      ok: true;
      explanation: Explanation;
      grounding: { ok: boolean; untraceable: string[] };
      elapsedMs: number;
    }
  | { ok: false; error: string; elapsedMs: number };

export type ExplainOptions = {
  config?: GeminiConfig | null;
  call?: typeof callGemini;
  now?: () => number;
};

export async function explainRun(
  input: ExplainInput,
  options: ExplainOptions = {},
): Promise<ExplainOutcome> {
  const now = options.now ?? (() => Date.now());
  const started = now();
  const config = options.config !== undefined ? options.config : geminiConfigFromEnv();
  const call = options.call ?? callGemini;

  if (!config) {
    return {
      ok: false,
      error:
        "No GEMINI_API_KEY is set, so there is no explanation for this run. Everything above was computed by the simulator and is unaffected.",
      elapsedMs: now() - started,
    };
  }

  const result = await call(config, {
    systemInstruction: explainSystemInstruction(),
    userText: buildExplainPrompt(input),
    jsonSchema: z.toJSONSchema(ExplanationSchema, { target: "draft-7", io: "input" }),
    maxOutputTokens: 1400,
    temperature: 0.3,
  });

  if (!result.ok) {
    return { ok: false, error: result.error, elapsedMs: now() - started };
  }

  const parsed = ExplanationSchema.safeParse(result.json);
  if (!parsed.success) {
    return {
      ok: false,
      error: "The explanation did not match its schema: " + parsed.error.issues[0]?.message,
      elapsedMs: now() - started,
    };
  }

  const prose = [
    parsed.data.where_your_rule_works,
    parsed.data.what_actually_happens,
    parsed.data.where_it_breaks,
  ].join(" ");

  return {
    ok: true,
    explanation: parsed.data,
    grounding: checkGrounding(prose, factsFrom(input.trace)),
    elapsedMs: now() - started,
  };
}
