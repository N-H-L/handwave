/**
 * Structural checks over every simulator's prediction targets.
 *
 * These are the ones that catch a whole class of mistake at once: a numeric
 * prompt whose key does not correspond to anything the simulator reports, a
 * resolver that returns a string not in its own option list, or a slider
 * helpfully centred on the right answer.
 */

import { describe, expect, it } from "vitest";
import { REGISTRY, defaultIdealizations, type SimId } from "./registry";
import { COLLISION_DEFAULTS } from "./sims/collision";
import { FREEFALL_DEFAULTS } from "./sims/freefall";
import { INCLINE_DEFAULTS } from "./sims/incline";
import { PENDULUM_DEFAULTS } from "./sims/pendulum";
import { PROJECTILE_DEFAULTS } from "./sims/projectile";

const DEFAULTS: Record<SimId, Record<string, number>> = {
  projectile: { ...PROJECTILE_DEFAULTS, speed_m_s: 40 },
  freefall: { ...FREEFALL_DEFAULTS },
  pendulum: { ...PENDULUM_DEFAULTS },
  collision: { ...COLLISION_DEFAULTS },
  incline: { ...INCLINE_DEFAULTS },
};

const IDS = Object.keys(REGISTRY) as SimId[];

/** Every idealisation switch position, so resolvers are exercised both ways. */
function idealisationCombos(id: SimId): Record<string, boolean>[] {
  const keys = REGISTRY[id].idealizations.map((d) => d.key);
  const combos: Record<string, boolean>[] = [];
  for (let mask = 0; mask < 1 << keys.length; mask++) {
    const c: Record<string, boolean> = {};
    keys.forEach((k, i) => (c[k] = Boolean(mask & (1 << i))));
    combos.push(c);
  }
  return combos;
}

const run = (id: SimId, ideal: Record<string, boolean>) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (REGISTRY[id] as any).run(DEFAULTS[id], ideal);

describe.each(IDS)("%s", (id) => {
  const sim = REGISTRY[id];

  it("asks the student something", () => {
    expect(sim.predictions.length).toBeGreaterThan(0);
    expect(sim.question.length).toBeGreaterThan(10);
  });

  it("uses a distinct key for each prompt", () => {
    const keys = sim.predictions.map((p) => p.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("names a quantity the simulator actually reports, for every numeric prompt", () => {
    const trace = run(id, defaultIdealizations(id));
    for (const p of sim.predictions) {
      if (p.kind !== "numeric") continue;
      expect(p.key in trace.outcome, p.key + " is not in the outcome").toBe(true);
    }
  });

  it("resolves every choice prompt to one of its own options, under every idealisation", () => {
    for (const ideal of idealisationCombos(id)) {
      const trace = run(id, ideal);
      for (const p of sim.predictions) {
        if (p.kind !== "choice") continue;
        const answer = p.resolve(trace);
        const allowed = p.options.map((o) => o.value);
        expect(allowed, p.key + " resolved to " + answer + " under " + JSON.stringify(ideal)).toContain(
          answer,
        );
      }
    }
  });

  it("offers at least two options on every choice prompt", () => {
    for (const p of sim.predictions) {
      if (p.kind !== "choice") continue;
      expect(p.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(p.options.map((o) => o.value)).size).toBe(p.options.length);
    }
  });

  it("does not centre a numeric range on the correct answer", () => {
    // A slider whose midpoint is the truth is a multiple-choice question with
    // the answer already selected, and it would quietly destroy the measurement
    // the whole product depends on.
    const trace = run(id, defaultIdealizations(id));
    for (const p of sim.predictions) {
      if (p.kind !== "numeric") continue;
      const answer = trace.outcome[p.key];
      if (!Number.isFinite(answer)) continue;
      const [lo, hi] = p.range;
      const offset = Math.abs(answer - (lo + hi) / 2) / (hi - lo);
      expect(offset, p.key + " sits " + offset.toFixed(3) + " from the midpoint").toBeGreaterThan(
        0.05,
      );
    }
  });

  it("keeps the correct answer inside the range it offers", () => {
    const trace = run(id, defaultIdealizations(id));
    for (const p of sim.predictions) {
      if (p.kind !== "numeric") continue;
      const answer = trace.outcome[p.key];
      if (!Number.isFinite(answer)) continue;
      expect(answer).toBeGreaterThanOrEqual(p.range[0]);
      expect(answer).toBeLessThanOrEqual(p.range[1]);
    }
  });

  it("declares a ghost axis only for a quantity that is a position", () => {
    for (const p of sim.predictions) {
      if (p.kind !== "numeric" || p.ghostAxis === undefined) continue;
      expect(p.unit).toBe("m");
    }
  });

  it("phrases every prompt as a question", () => {
    for (const p of sim.predictions) expect(p.prompt.trim().endsWith("?")).toBe(true);
  });
});

describe("the resolvers disagree with each other where the physics does", () => {
  it("pendulum: small-angle says the period is fixed, the real equation says it grows", () => {
    const target = REGISTRY.pendulum.predictions.find((p) => p.key === "period_vs_angle")!;
    if (target.kind !== "choice") throw new Error("expected a choice target");
    expect(target.resolve(run("pendulum", { small_angle: true }))).toBe("same");
    expect(target.resolve(run("pendulum", { small_angle: false }))).toBe("longer");
  });

  it("freefall: air says the heavier one lands first, vacuum says they tie", () => {
    const target = REGISTRY.freefall.predictions.find((p) => p.key === "which_first")!;
    if (target.kind !== "choice") throw new Error("expected a choice target");
    expect(target.resolve(run("freefall", { air_resistance: true }))).toBe("heavier");
    expect(target.resolve(run("freefall", { air_resistance: false }))).toBe("same");
  });

  it("projectile: drag makes the descent steeper, vacuum keeps it symmetric", () => {
    const target = REGISTRY.projectile.predictions.find((p) => p.key === "path_shape")!;
    if (target.kind !== "choice") throw new Error("expected a choice target");
    expect(target.resolve(run("projectile", { air_resistance: true }))).toBe("steeper_down");
    expect(target.resolve(run("projectile", { air_resistance: false }))).toBe("symmetric");
  });

  it("collision and incline give the same answer whatever you switch", () => {
    // Newton's third law and the cancellation of mass are not idealisations.
    for (const [id, key, expected] of [
      ["collision", "which_force", "equal"],
      ["incline", "mass_effect", "same"],
    ] as const) {
      const target = REGISTRY[id].predictions.find((p) => p.key === key)!;
      if (target.kind !== "choice") throw new Error("expected a choice target");
      for (const ideal of idealisationCombos(id)) {
        expect(target.resolve(run(id, ideal))).toBe(expected);
      }
    }
  });
});
