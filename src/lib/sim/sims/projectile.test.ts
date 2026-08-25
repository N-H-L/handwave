/**
 * The integrator is asserted against analysis, not against itself.
 *
 * These are the checks CI runs before anything renders. PLAN §4 day 3-4:
 * "npm test asserts each sim against its closed-form solution."
 */

import { describe, expect, it } from "vitest";
import { PROJECTILE_DEFAULTS, projectile, type ProjectileParams } from "./projectile";
import { invariantHolds, relativeDrift } from "../integrate";
import { runSpec } from "../registry";
import { SimSpecSchema } from "../spec";

const vacuum = { air_resistance: false };
const air = { air_resistance: true };

function withParams(over: Partial<ProjectileParams>): ProjectileParams {
  return { ...PROJECTILE_DEFAULTS, ...over };
}

describe("projectile — vacuum matches the closed form", () => {
  const cases: [string, Partial<ProjectileParams>][] = [
    ["45 degrees from the ground", { speed_m_s: 20, angle_deg: 45, launch_height_m: 0 }],
    ["30 degrees from the ground", { speed_m_s: 25, angle_deg: 30, launch_height_m: 0 }],
    ["60 degrees from the ground", { speed_m_s: 25, angle_deg: 60, launch_height_m: 0 }],
    ["horizontal off a cliff", { speed_m_s: 15, angle_deg: 0, launch_height_m: 20 }],
    ["downward off a cliff", { speed_m_s: 12, angle_deg: -20, launch_height_m: 30 }],
    ["lunar gravity", { speed_m_s: 20, angle_deg: 45, gravity_m_s2: 1.62 }],
  ];

  for (const [name, over] of cases) {
    it(name, () => {
      const p = withParams(over);
      const closed = projectile.closedForm(p, vacuum)!;
      const trace = projectile.run(p, vacuum);
      expect(trace.outcome.landed).toBe(1);
      for (const key of ["range_m", "flight_time_s", "apex_m", "impact_speed_m_s"]) {
        const rel = Math.abs(trace.outcome[key] - closed[key]) / Math.abs(closed[key]);
        expect(rel, `${key}: got ${trace.outcome[key]}, expected ${closed[key]}`).toBeLessThan(1e-3);
      }
    });
  }

  it("reproduces the textbook range formula v^2 sin(2θ)/g", () => {
    const p = withParams({ speed_m_s: 20, angle_deg: 45, launch_height_m: 0 });
    const expected =
      (p.speed_m_s ** 2 * Math.sin((2 * p.angle_deg * Math.PI) / 180)) / p.gravity_m_s2;
    expect(projectile.run(p, vacuum).outcome.range_m).toBeCloseTo(expected, 2);
  });

  it("is symmetric: apex sits at half the flight time", () => {
    const p = withParams({ speed_m_s: 20, angle_deg: 50, launch_height_m: 0 });
    const trace = projectile.run(p, vacuum);
    const apexFrame = trace.frames.reduce((a, b) => (b.bodies[0].pos.y > a.bodies[0].pos.y ? b : a));
    expect(apexFrame.t / trace.outcome.flight_time_s).toBeCloseTo(0.5, 2);
  });
});

describe("invariants", () => {
  it("conserves energy to machine precision with drag off", () => {
    const trace = projectile.run(withParams({ angle_deg: 55 }), vacuum);
    const energy = trace.invariants.find((i) => i.key === "energy_j")!;
    expect(energy.law).toBe("conserved");
    expect(relativeDrift(energy.values)).toBeLessThan(1e-6);
    expect(invariantHolds(energy)).toBe(true);
  });

  it("declares energy non-increasing — and dissipating — with drag on", () => {
    const trace = projectile.run(withParams({ speed_m_s: 60, angle_deg: 45 }), air);
    const energy = trace.invariants.find((i) => i.key === "energy_j")!;
    expect(energy.law).toBe("non_increasing");
    expect(invariantHolds(energy)).toBe(true);
    expect(energy.values.at(-1)!).toBeLessThan(energy.values[0]);
  });
});

describe("air resistance is a real physical difference, not a label", () => {
  it("shortens the range", () => {
    const p = withParams({ speed_m_s: 45, angle_deg: 45 });
    expect(projectile.run(p, air).outcome.range_m).toBeLessThan(
      projectile.run(p, vacuum).outcome.range_m,
    );
  });

  it("makes the descent steeper than the ascent", () => {
    const p = withParams({ speed_m_s: 60, angle_deg: 45 });
    expect(projectile.run(p, air).outcome.impact_angle_deg).toBeGreaterThan(p.angle_deg + 1);
    expect(projectile.run(p, vacuum).outcome.impact_angle_deg).toBeCloseTo(p.angle_deg, 1);
  });

  it("separates a heavy ball from a light one of the same size — the vacuum case cannot", () => {
    const heavy = withParams({ speed_m_s: 40, mass_kg: 7.26, area_m2: 0.0113 });
    const light = withParams({ speed_m_s: 40, mass_kg: 0.145, area_m2: 0.0113 });
    // In air the shot put outruns the baseball. This is why "heavier things
    // fall faster" must never be diagnosed as a misconception in air.
    expect(projectile.run(heavy, air).outcome.range_m).toBeGreaterThan(
      projectile.run(light, air).outcome.range_m + 1,
    );
    // In vacuum, mass is invisible.
    expect(projectile.run(heavy, vacuum).outcome.range_m).toBeCloseTo(
      projectile.run(light, vacuum).outcome.range_m,
      6,
    );
  });
});

describe("determinism", () => {
  it("produces byte-identical traces across runs", () => {
    const p = withParams({ speed_m_s: 33, angle_deg: 37, launch_height_m: 12 });
    expect(JSON.stringify(projectile.run(p, air))).toBe(JSON.stringify(projectile.run(p, air)));
  });

  it("holds the axis domain to round numbers so small edits do not rescale", () => {
    const a = projectile.run(withParams({ speed_m_s: 20, angle_deg: 45 }), vacuum);
    const b = projectile.run(withParams({ speed_m_s: 20.1, angle_deg: 45 }), vacuum);
    expect(a.domain).toEqual(b.domain);
  });
});

describe("the spec gate", () => {
  it("runs from a plain spec object", () => {
    const trace = runSpec({
      sim_id: "projectile",
      params: PROJECTILE_DEFAULTS,
      idealizations: { air_resistance: false },
    });
    expect(trace.outcome.range_m).toBeGreaterThan(40);
  });

  it("rejects an unknown sim_id", () => {
    expect(() => runSpec({ sim_id: "warp_drive", params: {} })).toThrow();
  });

  it("rejects physically out-of-range parameters", () => {
    const bad = SimSpecSchema.safeParse({
      sim_id: "projectile",
      params: { ...PROJECTILE_DEFAULTS, angle_deg: 91 },
    });
    expect(bad.success).toBe(false);
  });
});
