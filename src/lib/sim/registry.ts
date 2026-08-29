/**
 * The closed registry. `sim_id` -> hand-written simulator.
 *
 * Everything a model can trigger is enumerated in this file. Adding a
 * capability means writing and testing a simulator, not widening a prompt.
 *
 * `runSpec` dispatches with a switch on the discriminant rather than an index
 * lookup, deliberately: it keeps each simulator's parameter type intact end to
 * end (no `any` anywhere in the path from parse to run), and it turns "someone
 * added a sim to the schema but not to the dispatcher" into a compile error
 * instead of a runtime one.
 */

import { coin } from "./sims/coin";
import { collision } from "./sims/collision";
import { freefall } from "./sims/freefall";
import { incline } from "./sims/incline";
import { lawOfLarge } from "./sims/lawoflarge";
import { montyHall } from "./sims/montyhall";
import { pendulum } from "./sims/pendulum";
import { projectile } from "./sims/projectile";
import { SimSpecSchema, type SimSpec } from "./spec";
import type { Trace } from "./types";

export const REGISTRY = {
  projectile,
  freefall,
  pendulum,
  collision,
  incline,
  coin,
  lawoflarge: lawOfLarge,
  montyhall: montyHall,
} as const;

export type SimId = keyof typeof REGISTRY;

export function getSimulator<K extends SimId>(id: K): (typeof REGISTRY)[K] {
  return REGISTRY[id];
}

export function defaultIdealizations(id: SimId): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const d of REGISTRY[id].idealizations) out[d.key] = d.default;
  return out;
}

export function listSimulators() {
  return Object.values(REGISTRY);
}

/**
 * Validate, then run. The only entry point the UI or an API route may use —
 * it guarantees nothing unvalidated ever reaches a simulator.
 */
export function runSpec(input: unknown): Trace {
  const spec: SimSpec = SimSpecSchema.parse(input);
  const ideal = { ...defaultIdealizations(spec.sim_id), ...(spec.idealizations ?? {}) };

  switch (spec.sim_id) {
    case "projectile":
      return projectile.run(spec.params, ideal);
    case "freefall":
      return freefall.run(spec.params, ideal);
    case "pendulum":
      return pendulum.run(spec.params, ideal);
    case "collision":
      return collision.run(spec.params, ideal);
    case "incline":
      return incline.run(spec.params, ideal);
    case "coin":
      return coin.run(spec.params, ideal);
    case "lawoflarge":
      return lawOfLarge.run(spec.params, ideal);
    case "montyhall":
      return montyHall.run(spec.params, ideal);
    default: {
      // Exhaustiveness guard: adding a member to SimSpecSchema without adding
      // a case here will not compile.
      const unreachable: never = spec;
      throw new Error("No simulator registered for " + JSON.stringify(unreachable));
    }
  }
}
