/**
 * The deterministic router: keyword matching, no model.
 *
 * This exists so the app is honest in three situations that will all actually
 * happen — no API key configured, the API unreachable, and the model returning
 * something the validator rejects twice. In every one of them the alternative
 * is a blank screen, and a blank screen teaches nobody anything.
 *
 * It is NOT a hedge against the model being wrong about physics. That failure
 * mode does not exist here: the model picks from this same closed set of eight
 * simulators and fills the same validated parameters. What degrades when this
 * runs is only the QUALITY OF THE MATCH — "why does my car crumple more than
 * the truck" routes to the collision sim by understanding on the model path
 * and by the word "crumple" not appearing in any keyword list on this one.
 *
 * The UI says which path ran. A fallback that pretends to be the real thing is
 * worse than no fallback.
 */

import { REGISTRY, defaultIdealizations, type SimId } from "@/lib/sim/registry";
import { COIN_DEFAULTS } from "@/lib/sim/sims/coin";
import { COLLISION_DEFAULTS } from "@/lib/sim/sims/collision";
import { FREEFALL_DEFAULTS } from "@/lib/sim/sims/freefall";
import { INCLINE_DEFAULTS } from "@/lib/sim/sims/incline";
import { LAWOFLARGE_DEFAULTS } from "@/lib/sim/sims/lawoflarge";
import { MONTYHALL_DEFAULTS } from "@/lib/sim/sims/montyhall";
import { PENDULUM_DEFAULTS } from "@/lib/sim/sims/pendulum";
import { PROJECTILE_DEFAULTS } from "@/lib/sim/sims/projectile";
import { SimSpecSchema, type RouteEnvelope } from "@/lib/sim/spec";

const DEFAULT_PARAMS: Record<SimId, Record<string, number>> = {
  projectile: { ...PROJECTILE_DEFAULTS, speed_m_s: 40 },
  freefall: { ...FREEFALL_DEFAULTS },
  pendulum: { ...PENDULUM_DEFAULTS },
  collision: { ...COLLISION_DEFAULTS },
  incline: { ...INCLINE_DEFAULTS },
  coin: { ...COIN_DEFAULTS },
  lawoflarge: { ...LAWOFLARGE_DEFAULTS },
  montyhall: { ...MONTYHALL_DEFAULTS },
};

/**
 * Weighted keywords. Longer, more specific phrases score higher, so "monty
 * hall" beats a stray "door" and "air resistance" beats a stray "fall".
 */
const KEYWORDS: Record<SimId, [string, number][]> = {
  montyhall: [
    ["monty", 10],
    ["three doors", 8],
    ["switch door", 8],
    ["game show", 6],
    ["goat", 6],
    ["door", 3],
    ["switch", 2],
  ],
  coin: [
    ["sequence", 6],
    ["hhh", 6],
    ["five flips", 8],
    ["more random", 6],
    ["pattern", 4],
    ["coin", 3],
    ["flip", 2],
  ],
  lawoflarge: [
    ["gambler", 10],
    ["due", 6],
    ["streak", 8],
    ["law of large", 10],
    ["in a row", 7],
    ["even out", 8],
    ["average out", 8],
    ["long run", 6],
    ["hot hand", 8],
    ["coin", 2],
  ],
  freefall: [
    ["heavier fall", 10],
    ["fall faster", 10],
    ["drop", 6],
    ["feather", 7],
    ["hammer", 6],
    ["terminal velocity", 9],
    ["air resistance", 6],
    ["gravity", 3],
    ["fall", 3],
  ],
  projectile: [
    ["throw", 6],
    ["thrown", 6],
    ["launch", 6],
    ["projectile", 9],
    ["cannon", 7],
    ["arc", 5],
    ["trajectory", 7],
    ["45 degrees", 6],
    ["kick", 5],
    ["range", 3],
  ],
  pendulum: [
    ["pendulum", 10],
    ["swing", 7],
    ["period", 5],
    ["amplitude", 6],
    ["grandfather clock", 8],
    ["bob", 4],
  ],
  collision: [
    ["collision", 9],
    ["collide", 9],
    ["crash", 8],
    ["truck", 7],
    ["hits", 5],
    ["momentum", 7],
    ["newton's third", 10],
    ["bounce", 5],
    ["elastic", 6],
    ["impact", 5],
  ],
  incline: [
    ["ramp", 9],
    ["incline", 9],
    ["slope", 8],
    ["slide", 7],
    ["friction", 7],
    ["block", 4],
    ["hill", 5],
  ],
};

/** Below this, nothing matched well enough to be worth running. */
const MIN_SCORE = 4;

export function scoreQuestion(question: string): { simId: SimId; score: number }[] {
  const text = " " + question.toLowerCase().replace(/[^a-z0-9\s']/g, " ") + " ";
  return (Object.keys(KEYWORDS) as SimId[])
    .map((simId) => {
      let score = 0;
      for (const [word, weight] of KEYWORDS[simId]) {
        if (text.includes(word)) score += weight;
      }
      return { simId, score };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Route by keyword. Abstains rather than guessing when nothing scores — the
 * same first-class refusal the model path has, for the same reason: a
 * confident wrong demo is unrecoverable and a graceful decline is not.
 */
export function keywordRoute(question: string): RouteEnvelope {
  const ranked = scoreQuestion(question);
  const best = ranked[0];

  if (!best || best.score < MIN_SCORE) {
    return {
      reasoning:
        "Matched by keyword, with no model available. Nothing in the catalogue scored high enough on this question to be worth running.",
      decision: "abstain",
      why_not:
        "I could not tell which of my simulations would answer that. I only cover mechanics — projectiles, falling, pendulums, collisions, ramps — and elementary probability.",
      suggested_instead: [
        REGISTRY.freefall.question,
        REGISTRY.collision.question,
        REGISTRY.coin.question,
      ],
    };
  }

  const simId = best.simId;
  const spec = SimSpecSchema.parse({
    sim_id: simId,
    params: DEFAULT_PARAMS[simId],
    idealizations: defaultIdealizations(simId),
  });

  return {
    reasoning:
      "Matched by keyword rather than by the model. The strongest signal was for " +
      REGISTRY[simId].title.toLowerCase() +
      ", at a score of " +
      best.score +
      ".",
    decision: "simulate",
    student_question_restated: question,
    spec,
  };
}
