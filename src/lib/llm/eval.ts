/**
 * The routing eval set.
 *
 * The plan's acceptance criterion for the routing layer is that twenty
 * phrasings of ten questions route correctly. This is that set — ten
 * phenomena, several phrasings each, plus a block of questions that MUST be
 * refused.
 *
 * It lives in `src/` rather than in a test file because two things consume it:
 * a deterministic test that runs the keyword fallback in CI on every push, and
 * `npm run eval:routing`, which sends the same set through the model. The
 * second costs money and needs a key, so it is not in CI — but it grades
 * against exactly the same expectations, which is the point of sharing the set.
 *
 * The phrasings are deliberately uneven. Some name the phenomenon outright;
 * some describe it the way a confused student would, with no technical
 * vocabulary at all. A router that only handles the first kind is a keyword
 * matcher with extra steps, and the gap between the two columns is the honest
 * measure of what the model is adding.
 *
 * ONE CAVEAT, AND IT MATTERS. The keyword router scores 30/32 on this set,
 * which sounds like the model has nothing to add. It does not mean that. The
 * same person wrote the keyword lists and these questions, so the vocabulary
 * overlaps far more than it would with questions from actual students. Read
 * the keyword number as "the floor on questions the author anticipated", which
 * is a much weaker claim, and expect it to fall sharply on anything unseen —
 * the two it already misses are both phrasings that describe the situation
 * without using any of its words.
 */

import type { SimId } from "@/lib/sim/registry";

export type EvalCase = {
  question: string;
  /** null means the router should refuse. */
  expect: SimId | null;
  /** Whether the phrasing names the phenomenon, or only describes it. */
  style: "named" | "described";
};

export const ROUTING_EVAL: EvalCase[] = [
  // 1 — Newton's third law in a collision
  { question: "when a truck hits a car, which one feels the bigger force?", expect: "collision", style: "named" },
  { question: "in a crash between a lorry and a bike, who gets pushed harder?", expect: "collision", style: "named" },
  { question: "my car crumpled way more than the other guy's, so it hit me harder right?", expect: "collision", style: "described" },
  { question: "is momentum still conserved if the two things stick together?", expect: "collision", style: "named" },

  // 2 — mass and falling
  { question: "do heavier things fall faster?", expect: "freefall", style: "named" },
  { question: "if I drop a bowling ball and a tennis ball off a roof which lands first?", expect: "freefall", style: "described" },
  { question: "why does a feather fall so slowly", expect: "freefall", style: "described" },
  { question: "what is terminal velocity", expect: "freefall", style: "named" },

  // 3 — pendulum amplitude
  { question: "does a pendulum swing slower if you pull it back further?", expect: "pendulum", style: "named" },
  { question: "does the period of a pendulum depend on amplitude?", expect: "pendulum", style: "named" },
  { question: "my grandfather clock runs fast, does the swing size matter?", expect: "pendulum", style: "described" },

  // 4 — projectile
  { question: "what angle should I throw a ball at for maximum range?", expect: "projectile", style: "named" },
  { question: "why does a thrown ball come down steeper than it went up", expect: "projectile", style: "described" },
  { question: "how far will a cannon fire at 45 degrees", expect: "projectile", style: "named" },

  // 5 — friction on a ramp
  { question: "does a heavier block slide down a ramp faster?", expect: "incline", style: "named" },
  { question: "how steep does a slope have to be before something starts to slide?", expect: "incline", style: "described" },
  { question: "why doesn't the box on the hill move", expect: "incline", style: "described" },

  // 6 — sequences vs counts
  { question: "is HHHHH less likely than HTHTH when you flip five coins?", expect: "coin", style: "named" },
  { question: "which pattern of heads and tails is more random", expect: "coin", style: "described" },

  // 7 — the gambler's fallacy
  { question: "I got five heads in a row, is tails due now?", expect: "lawoflarge", style: "described" },
  { question: "what is the gambler's fallacy", expect: "lawoflarge", style: "named" },
  { question: "do heads and tails even out in the long run?", expect: "lawoflarge", style: "described" },
  { question: "how long a streak should I expect in a thousand flips", expect: "lawoflarge", style: "named" },

  // 8 — Monty Hall
  { question: "should I switch doors in the monty hall problem?", expect: "montyhall", style: "named" },
  { question: "the game show host opened a door with a goat behind it, now what", expect: "montyhall", style: "described" },
  { question: "does it matter if the host knew where the prize was?", expect: "montyhall", style: "named" },

  // 9 — questions that must be refused
  { question: "why do like charges repel?", expect: null, style: "named" },
  { question: "explain quantum entanglement", expect: null, style: "named" },
  { question: "what is the capital of France?", expect: null, style: "named" },
  { question: "write me an essay about the industrial revolution", expect: null, style: "named" },
  { question: "how do I balance a chemical equation", expect: null, style: "named" },
  { question: "what's the derivative of sin x", expect: null, style: "named" },
];

export type EvalResult = {
  total: number;
  correct: number;
  byStyle: Record<"named" | "described", { total: number; correct: number }>;
  refusals: { total: number; correct: number };
  failures: { question: string; expected: SimId | null; got: SimId | null }[];
};

export function scoreEval(
  results: { c: EvalCase; got: SimId | null }[],
): EvalResult {
  const out: EvalResult = {
    total: results.length,
    correct: 0,
    byStyle: { named: { total: 0, correct: 0 }, described: { total: 0, correct: 0 } },
    refusals: { total: 0, correct: 0 },
    failures: [],
  };

  for (const { c, got } of results) {
    const ok = got === c.expect;
    if (ok) out.correct++;
    else out.failures.push({ question: c.question, expected: c.expect, got });

    out.byStyle[c.style].total++;
    if (ok) out.byStyle[c.style].correct++;

    if (c.expect === null) {
      out.refusals.total++;
      if (ok) out.refusals.correct++;
    }
  }
  return out;
}
