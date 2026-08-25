import { describe, expect, it } from "vitest";
import { FREEFALL_DEFAULTS, fallTimeWithDrag, freefall, terminalVelocity } from "./freefall";
import type { FreeFallParams } from "./freefall";
import { invariantHolds, relativeDrift } from "../integrate";
import { runSpec } from "../registry";

const vacuum = { air_resistance: false };
const air = { air_resistance: true };

function withParams(over: Partial<FreeFallParams> = {}): FreeFallParams {
  return { ...FREEFALL_DEFAULTS, ...over };
}

describe("vacuum — the case Galileo argued", () => {
  it("lands both objects at exactly the same instant regardless of mass", () => {
    const trace = freefall.run(withParams({ mass_a_kg: 50, mass_b_kg: 0.01 }), vacuum);
    expect(trace.outcome.gap_ms).toBeCloseTo(0, 6);
    expect(trace.outcome.t_heavy_s).toBeCloseTo(trace.outcome.t_light_s, 9);
  });

  it("matches t = sqrt(2h/g) and v = sqrt(2gh)", () => {
    for (const h of [5, 20, 100]) {
      const p = withParams({ drop_height_m: h });
      const closed = freefall.closedForm(p, vacuum)!;
      const trace = freefall.run(p, vacuum);
      expect(closed.t_heavy_s).toBeCloseTo(Math.sqrt((2 * h) / p.gravity_m_s2), 12);
      expect(trace.outcome.t_heavy_s).toBeCloseTo(closed.t_heavy_s, 6);
      expect(trace.outcome.v_heavy_m_s).toBeCloseTo(closed.v_heavy_m_s, 5);
    }
  });

  it("conserves energy", () => {
    const trace = freefall.run(withParams(), vacuum);
    const e = trace.invariants[0];
    expect(e.law).toBe("conserved");
    expect(relativeDrift(e.values)).toBeLessThan(1e-9);
    expect(invariantHolds(e)).toBe(true);
  });

  it("reports no terminal velocity, because there is none", () => {
    const trace = freefall.run(withParams(), vacuum);
    expect(trace.outcome.terminal_heavy_m_s).toBe(Infinity);
  });
});

describe("air — the case the student actually lives in", () => {
  it("matches the exact quadratic-drag solution for both objects", () => {
    for (const h of [10, 20, 60, 150]) {
      const p = withParams({ drop_height_m: h });
      const closed = freefall.closedForm(p, air)!;
      const trace = freefall.run(p, air);
      const relHeavy = Math.abs(trace.outcome.t_heavy_s - closed.t_heavy_s) / closed.t_heavy_s;
      const relLight = Math.abs(trace.outcome.t_light_s - closed.t_light_s) / closed.t_light_s;
      expect(relHeavy, "heavy at h=" + h).toBeLessThan(1e-5);
      expect(relLight, "light at h=" + h).toBeLessThan(1e-5);
    }
  });

  it("matches the closed-form impact speeds", () => {
    const p = withParams({ drop_height_m: 60 });
    const closed = freefall.closedForm(p, air)!;
    const trace = freefall.run(p, air);
    expect(trace.outcome.v_heavy_m_s).toBeCloseTo(closed.v_heavy_m_s, 3);
    expect(trace.outcome.v_light_m_s).toBeCloseTo(closed.v_light_m_s, 3);
  });

  it("THE POINT: the shot put beats the baseball, by a measurable margin", () => {
    const trace = freefall.run(withParams(), air);
    expect(trace.outcome.t_heavy_s).toBeLessThan(trace.outcome.t_light_s);
    // From 20 m the gap is tens of milliseconds — small, but not nothing, and
    // "heavier things fall faster" is a true statement about this run.
    expect(trace.outcome.gap_ms).toBeGreaterThan(20);
    expect(trace.outcome.gap_ms).toBeLessThan(200);
  });

  it("has the denser object with the higher terminal velocity", () => {
    const trace = freefall.run(withParams(), air);
    expect(trace.outcome.terminal_heavy_m_s).toBeGreaterThan(trace.outcome.terminal_light_m_s);
  });

  it("makes both slower than they would be in vacuum", () => {
    const p = withParams({ drop_height_m: 100 });
    const inAir = freefall.run(p, air);
    const inVacuum = freefall.run(p, vacuum);
    expect(inAir.outcome.t_light_s).toBeGreaterThan(inVacuum.outcome.t_light_s);
    expect(inAir.outcome.t_heavy_s).toBeGreaterThan(inVacuum.outcome.t_heavy_s);
  });

  it("closes the gap as the two objects approach the same density", () => {
    const different = freefall.run(withParams(), air).outcome.gap_ms;
    const identical = freefall.run(
      withParams({ mass_b_kg: FREEFALL_DEFAULTS.mass_a_kg, area_b_m2: FREEFALL_DEFAULTS.area_a_m2 }),
      air,
    ).outcome.gap_ms;
    expect(Math.abs(identical)).toBeLessThan(1e-6);
    expect(different).toBeGreaterThan(Math.abs(identical));
  });

  it("dissipates energy", () => {
    const trace = freefall.run(withParams({ drop_height_m: 150 }), air);
    const e = trace.invariants[0];
    expect(e.law).toBe("non_increasing");
    expect(invariantHolds(e)).toBe(true);
    expect(e.values[e.values.length - 1]).toBeLessThan(e.values[0]);
  });

  it("never exceeds terminal velocity", () => {
    const trace = freefall.run(withParams({ drop_height_m: 2000 }), air);
    const vt = trace.outcome.terminal_light_m_s;
    for (const f of trace.frames) {
      expect(Math.abs(f.bodies[1].vel.y)).toBeLessThanOrEqual(vt * 1.0001);
    }
  });
});

describe("the closed-form helpers themselves", () => {
  it("terminalVelocity scales as sqrt(m/A)", () => {
    const v1 = terminalVelocity(1, 0.01, 0.47, 9.81, true);
    const v4 = terminalVelocity(4, 0.01, 0.47, 9.81, true);
    expect(v4 / v1).toBeCloseTo(2, 9);
  });

  it("fallTimeWithDrag approaches the vacuum time as drag vanishes", () => {
    const g = 9.81;
    const h = 20;
    const vacuumTime = Math.sqrt((2 * h) / g);
    // A huge terminal velocity is a near-vacuum.
    expect(fallTimeWithDrag(h, 1e6, g)).toBeCloseTo(vacuumTime, 6);
  });

  it("fallTimeWithDrag does not overflow on a long drop", () => {
    // exp(z) with z = h*g/vt^2 overflows here; the rearranged form must not.
    const t = fallTimeWithDrag(100_000, 5, 9.81);
    expect(Number.isFinite(t)).toBe(true);
    expect(t).toBeGreaterThan(100_000 / 5); // at least the terminal-velocity time
  });
});

describe("determinism and the spec gate", () => {
  it("is byte-identical across runs", () => {
    expect(JSON.stringify(freefall.run(withParams(), air))).toBe(
      JSON.stringify(freefall.run(withParams(), air)),
    );
  });

  it("runs from a plain spec object", () => {
    const trace = runSpec({
      sim_id: "freefall",
      params: FREEFALL_DEFAULTS,
      idealizations: { air_resistance: true },
    });
    expect(trace.simId).toBe("freefall");
    expect(trace.outcome.gap_ms).toBeGreaterThan(0);
  });

  it("defaults to air resistance on, because the student's world has air", () => {
    const trace = runSpec({ sim_id: "freefall", params: FREEFALL_DEFAULTS });
    expect(trace.idealizations[0].on).toBe(true);
    expect(trace.outcome.gap_ms).toBeGreaterThan(0);
  });
});
