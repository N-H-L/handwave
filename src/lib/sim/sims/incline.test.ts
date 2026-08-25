import { describe, expect, it } from "vitest";
import { INCLINE_DEFAULTS, angleOfRepose, incline } from "./incline";
import type { InclineParams } from "./incline";
import { invariantHolds, relativeDrift } from "../integrate";
import { runSpec } from "../registry";

const rough = { friction: true };
const smooth = { friction: false };

function withParams(over: Partial<InclineParams> = {}): InclineParams {
  return { ...INCLINE_DEFAULTS, ...over };
}

describe("THE POINT: mass does not appear in the answer", () => {
  it("gives identical motion for a 0.5 kg block and a 50 kg block", () => {
    const light = incline.run(withParams({ mass_kg: 0.5 }), rough).outcome;
    const heavy = incline.run(withParams({ mass_kg: 50 }), rough).outcome;
    expect(heavy.time_to_bottom_s).toBeCloseTo(light.time_to_bottom_s, 12);
    expect(heavy.speed_at_bottom_m_s).toBeCloseTo(light.speed_at_bottom_m_s, 12);
    expect(heavy.acceleration_m_s2).toBeCloseTo(light.acceleration_m_s2, 12);
  });

  it("holds without friction too", () => {
    const light = incline.run(withParams({ mass_kg: 0.5 }), smooth).outcome;
    const heavy = incline.run(withParams({ mass_kg: 50 }), smooth).outcome;
    expect(heavy.time_to_bottom_s).toBeCloseTo(light.time_to_bottom_s, 12);
  });

  it("scales the forces with mass even though the motion does not change", () => {
    const light = incline.run(withParams({ mass_kg: 2 }), rough).outcome;
    const heavy = incline.run(withParams({ mass_kg: 20 }), rough).outcome;
    // Both the driving component of gravity and the friction grow by 10x, and
    // they cancel. THAT is why the mass drops out — not because forces are equal.
    expect(heavy.normal_force_n / light.normal_force_n).toBeCloseTo(10, 9);
    expect(heavy.friction_force_n / light.friction_force_n).toBeCloseTo(10, 9);
  });
});

describe("sliding matches a = g(sin - mu*cos)", () => {
  const cases: [string, Partial<InclineParams>, typeof rough][] = [
    ["30 degrees, rough", { incline_angle_deg: 30 }, rough],
    ["45 degrees, rough", { incline_angle_deg: 45 }, rough],
    ["70 degrees, rough", { incline_angle_deg: 70 }, rough],
    ["10 degrees, frictionless", { incline_angle_deg: 10 }, smooth],
    ["long ramp", { incline_angle_deg: 40, length_m: 25 }, rough],
    ["low gravity", { incline_angle_deg: 40, gravity_m_s2: 1.62 }, rough],
  ];

  for (const [name, over, ideal] of cases) {
    it(name, () => {
      const p = withParams(over);
      const closed = incline.closedForm(p, ideal)!;
      const trace = incline.run(p, ideal);
      expect(trace.outcome.moved).toBe(1);
      for (const key of ["acceleration_m_s2", "time_to_bottom_s", "speed_at_bottom_m_s"]) {
        const rel = Math.abs(trace.outcome[key] - closed[key]) / Math.abs(closed[key]);
        expect(rel, key).toBeLessThan(1e-6);
      }
    });
  }

  it("reproduces v = sqrt(2aL)", () => {
    const p = withParams({ incline_angle_deg: 40 });
    const trace = incline.run(p, rough);
    const expected = Math.sqrt(2 * trace.outcome.acceleration_m_s2 * p.length_m);
    expect(trace.outcome.speed_at_bottom_m_s).toBeCloseTo(expected, 6);
  });

  it("is slower with friction than without", () => {
    const p = withParams({ incline_angle_deg: 40 });
    expect(incline.run(p, rough).outcome.time_to_bottom_s).toBeGreaterThan(
      incline.run(p, smooth).outcome.time_to_bottom_s,
    );
  });

  it("puts the normal force below the weight, by cos(theta)", () => {
    const p = withParams({ incline_angle_deg: 60 });
    const trace = incline.run(p, rough);
    expect(trace.outcome.normal_force_n).toBeLessThan(trace.outcome.weight_n);
    expect(trace.outcome.normal_force_n / trace.outcome.weight_n).toBeCloseTo(Math.cos(Math.PI / 3), 9);
  });
});

describe("a block that does not move is a correct answer", () => {
  it("stays put below the angle of repose", () => {
    // mu_s = 0.4 -> breaks away at 21.8 degrees.
    const trace = incline.run(withParams({ incline_angle_deg: 15, mu_static: 0.4 }), rough);
    expect(trace.outcome.moved).toBe(0);
    expect(trace.outcome.time_to_bottom_s).toBe(Infinity);
    expect(trace.outcome.speed_at_bottom_m_s).toBe(0);
    for (const f of trace.frames) expect(f.scalars.distance_m).toBe(0);
  });

  it("breaks away just past tan(theta) = mu_s", () => {
    const mu = 0.4;
    const breakaway = angleOfRepose(mu);
    expect(breakaway).toBeCloseTo(21.801, 3);
    expect(incline.run(withParams({ incline_angle_deg: breakaway - 0.5, mu_static: mu }), rough).outcome.moved).toBe(0);
    expect(incline.run(withParams({ incline_angle_deg: breakaway + 0.5, mu_static: mu }), rough).outcome.moved).toBe(1);
  });

  it("reports the static friction as matching the pull down the slope", () => {
    const p = withParams({ incline_angle_deg: 15, mu_static: 0.4 });
    const trace = incline.run(p, rough);
    const alongSlope = p.mass_kg * p.gravity_m_s2 * Math.sin((15 * Math.PI) / 180);
    expect(trace.outcome.friction_force_n).toBeCloseTo(alongSlope, 9);
  });

  it("always slides on a frictionless ramp, however shallow", () => {
    expect(incline.run(withParams({ incline_angle_deg: 1 }), smooth).outcome.moved).toBe(1);
  });
});

describe("invariants", () => {
  it("conserves energy on a frictionless ramp", () => {
    const trace = incline.run(withParams({ incline_angle_deg: 40 }), smooth);
    const e = trace.invariants[0];
    expect(e.law).toBe("conserved");
    expect(relativeDrift(e.values)).toBeLessThan(1e-9);
    expect(invariantHolds(e)).toBe(true);
  });

  it("dissipates energy when there is friction", () => {
    const trace = incline.run(withParams({ incline_angle_deg: 40 }), rough);
    const e = trace.invariants[0];
    expect(e.law).toBe("non_increasing");
    expect(invariantHolds(e)).toBe(true);
    expect(e.values[e.values.length - 1]).toBeLessThan(e.values[0]);
  });

  it("loses exactly the friction force times the distance", () => {
    const p = withParams({ incline_angle_deg: 40 });
    const trace = incline.run(p, rough);
    const e = trace.invariants[0];
    const lost = e.values[0] - e.values[e.values.length - 1];
    const work = trace.outcome.friction_force_n * p.length_m;
    expect(lost).toBeCloseTo(work, 6);
  });

  it("keeps the block on the ramp surface", () => {
    const p = withParams({ incline_angle_deg: 35 });
    const trace = incline.run(p, rough);
    const seg = trace.view.segments[0];
    for (const f of trace.frames) {
      const { x, y } = f.bodies[0].pos;
      // Cross product against the ramp direction: zero means exactly on the line.
      const cross = (seg.to.x - seg.from.x) * (y - seg.from.y) - (seg.to.y - seg.from.y) * (x - seg.from.x);
      expect(Math.abs(cross)).toBeLessThan(1e-9);
    }
  });
});

describe("kinetic friction cannot exceed static", () => {
  it("clamps an unphysical mu_k rather than accelerating uphill", () => {
    const p = withParams({ incline_angle_deg: 40, mu_static: 0.3, mu_kinetic: 2.0 });
    const trace = incline.run(p, rough);
    const clamped = incline.run(withParams({ ...p, mu_kinetic: 0.3 }), rough);
    expect(trace.outcome.acceleration_m_s2).toBeCloseTo(clamped.outcome.acceleration_m_s2, 12);
    expect(trace.outcome.acceleration_m_s2).toBeGreaterThan(0);
  });
});

describe("determinism and the spec gate", () => {
  it("is byte-identical across runs", () => {
    expect(JSON.stringify(incline.run(withParams(), rough))).toBe(
      JSON.stringify(incline.run(withParams(), rough)),
    );
  });

  it("runs from a plain spec object and defaults to having friction", () => {
    const trace = runSpec({ sim_id: "incline", params: INCLINE_DEFAULTS });
    expect(trace.simId).toBe("incline");
    expect(trace.idealizations[0].on).toBe(true);
  });

  it("refuses a vertical or overhanging slope", () => {
    expect(() =>
      runSpec({ sim_id: "incline", params: { ...INCLINE_DEFAULTS, incline_angle_deg: 90 } }),
    ).toThrow();
  });

  it("draws the ramp it is simulating", () => {
    const p = withParams({ incline_angle_deg: 30, length_m: 5 });
    const seg = incline.run(p, rough).view.segments[0];
    expect(Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y)).toBeCloseTo(p.length_m, 9);
  });
});
