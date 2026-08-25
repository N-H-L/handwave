import { describe, expect, it } from "vitest";
import { PENDULUM_DEFAULTS, exactPeriod, pendulum, smallAnglePeriod } from "./pendulum";
import type { PendulumParams } from "./pendulum";
import { ellipticK, invariantHolds, relativeDrift } from "../integrate";
import { runSpec } from "../registry";

const exact = { small_angle: false };
const linear = { small_angle: true };

function withParams(over: Partial<PendulumParams> = {}): PendulumParams {
  return { ...PENDULUM_DEFAULTS, ...over };
}

const deg = (d: number) => (d * Math.PI) / 180;

describe("the elliptic integral itself", () => {
  it("K(0) = pi/2", () => {
    expect(ellipticK(0)).toBeCloseTo(Math.PI / 2, 14);
  });

  it("matches published values", () => {
    expect(ellipticK(0.25)).toBeCloseTo(1.6857503548, 9);
    expect(ellipticK(0.5)).toBeCloseTo(1.8540746773, 9);
    expect(ellipticK(0.75)).toBeCloseTo(2.1565156475, 9);
  });

  it("refuses m outside [0, 1)", () => {
    expect(() => ellipticK(1)).toThrow();
    expect(() => ellipticK(-0.1)).toThrow();
  });
});

describe("exact period — the integrator against the elliptic solution", () => {
  for (const angle of [5, 20, 45, 80, 120, 170]) {
    it("matches at " + angle + " degrees", () => {
      const p = withParams({ release_angle_deg: angle });
      const closed = exactPeriod(p.length_m, deg(angle), p.gravity_m_s2);
      const measured = pendulum.run(p, exact).outcome.period_s;
      expect(Math.abs(measured - closed) / closed).toBeLessThan(1e-5);
    });
  }

  it("approaches 2*pi*sqrt(L/g) from above as theta0^2/16", () => {
    // The first correction term is exactly theta0^2/16. At 0.1 degrees the
    // exact period is still 1.9e-7 longer than the small-angle one -- real
    // physics, not rounding, and worth asserting as the ratio rather than
    // demanding the two agree.
    const p = withParams({ release_angle_deg: 0.1 });
    const theta0 = deg(0.1);
    const excess =
      exactPeriod(p.length_m, theta0, p.gravity_m_s2) /
        smallAnglePeriod(p.length_m, p.gravity_m_s2) -
      1;
    expect(excess).toBeGreaterThan(0);
    expect(excess / ((theta0 * theta0) / 16)).toBeCloseTo(1, 3);
  });

  it("scales as sqrt(L) and is independent of mass", () => {
    const base = pendulum.run(withParams({ length_m: 1 }), exact).outcome.period_s;
    const quad = pendulum.run(withParams({ length_m: 4 }), exact).outcome.period_s;
    expect(quad / base).toBeCloseTo(2, 4);

    const heavy = pendulum.run(withParams({ mass_kg: 9 }), exact).outcome.period_s;
    expect(heavy).toBeCloseTo(base === 0 ? heavy : pendulum.run(withParams(), exact).outcome.period_s, 12);
  });
});

describe("THE COUNTEREXAMPLE: the period does depend on amplitude", () => {
  it("grows monotonically with release angle", () => {
    const periods = [10, 30, 60, 90, 120].map(
      (a) => pendulum.run(withParams({ release_angle_deg: a }), exact).outcome.period_s,
    );
    for (let i = 1; i < periods.length; i++) {
      expect(periods[i]).toBeGreaterThan(periods[i - 1]);
    }
  });

  it("matches the excess figures shown to the student, to one decimal place", () => {
    // These three numbers appear verbatim in the idealisation text on screen.
    // Asserting them here is what stops the copy and the physics drifting apart.
    const excess = (a: number) =>
      pendulum.run(withParams({ release_angle_deg: a }), exact).outcome.period_excess_pct;
    expect(excess(30)).toBeCloseTo(1.7, 1);
    expect(excess(60)).toBeCloseTo(7.3, 1);
    expect(excess(90)).toBeCloseTo(18.0, 1);
  });

  it("is what the small-angle mode hides: same period at 10 and 90 degrees", () => {
    const small10 = pendulum.run(withParams({ release_angle_deg: 10 }), linear).outcome.period_s;
    const small90 = pendulum.run(withParams({ release_angle_deg: 90 }), linear).outcome.period_s;
    expect(small90).toBeCloseTo(small10, 6);

    // And the truth it is hiding.
    const true90 = pendulum.run(withParams({ release_angle_deg: 90 }), exact).outcome.period_s;
    expect(true90 / small90 - 1).toBeGreaterThan(0.17);
  });
});

describe("small-angle mode is honest about being an approximation", () => {
  it("gives exactly 2*pi*sqrt(L/g) regardless of angle", () => {
    for (const angle of [5, 45, 120]) {
      const p = withParams({ release_angle_deg: angle });
      const measured = pendulum.run(p, linear).outcome.period_s;
      expect(measured).toBeCloseTo(smallAnglePeriod(p.length_m, p.gravity_m_s2), 4);
    }
  });

  it("agrees with the exact period below 20 degrees, to better than 1%", () => {
    const p = withParams({ release_angle_deg: 20 });
    const a = pendulum.run(p, exact).outcome.period_s;
    const b = pendulum.run(p, linear).outcome.period_s;
    expect(Math.abs(a - b) / a).toBeLessThan(0.01);
  });

  it("labels the invariant differently, because it is a different energy", () => {
    expect(pendulum.run(withParams(), linear).invariants[0].label).toContain("linearised");
    expect(pendulum.run(withParams(), exact).invariants[0].label).not.toContain("linearised");
  });
});

describe("invariants", () => {
  it("holds the declared energy tolerance in both modes, at a hard angle", () => {
    for (const mode of [exact, linear]) {
      const e = pendulum.run(withParams({ release_angle_deg: 150 }), mode).invariants[0];
      expect(e.law).toBe("conserved");
      expect(invariantHolds(e)).toBe(true);
    }
  });

  it("has energy error that is BOUNDED, not drifting", () => {
    // The symplectic property, which is the whole reason for choosing
    // velocity-Verlet over RK4. If the error were secular, the second half of
    // the run would be visibly worse than the first.
    const e = pendulum.run(withParams({ release_angle_deg: 150 }), exact).invariants[0].values;
    const firstHalf = relativeDrift(e.slice(0, Math.floor(e.length / 2)));
    const whole = relativeDrift(e);
    expect(whole).toBeLessThan(firstHalf * 1.2);
  });

  it("has energy error that is second-order in dt", () => {
    // Halving the timestep must quarter the error. This is what distinguishes
    // "discretisation, understood and controlled" from "a bug".
    const p = withParams({ release_angle_deg: 150 });
    const drift = (dt: number) =>
      relativeDrift(pendulum.run(p, exact, { dt }).invariants[0].values);
    const coarse = drift(1 / 240);
    const fine = drift(1 / 480);
    const finer = drift(1 / 960);
    expect(coarse / fine).toBeCloseTo(4, 1);
    expect(fine / finer).toBeCloseTo(4, 1);
  });

  it("keeps the bob on the rod — length is constant to machine precision", () => {
    const trace = pendulum.run(withParams({ release_angle_deg: 140 }), exact);
    for (const f of trace.frames) {
      const r = Math.hypot(f.bodies[0].pos.x, f.bodies[0].pos.y);
      expect(r).toBeCloseTo(PENDULUM_DEFAULTS.length_m, 12);
    }
  });

  it("never swings past its release angle", () => {
    const angle = 100;
    const trace = pendulum.run(withParams({ release_angle_deg: angle }), exact);
    for (const f of trace.frames) {
      expect(Math.abs(f.scalars.angle_deg)).toBeLessThanOrEqual(angle + 1e-6);
    }
  });

  it("reaches max speed at the bottom, matching sqrt(2gL(1-cos t0))", () => {
    const p = withParams({ release_angle_deg: 90 });
    const trace = pendulum.run(p, exact);
    const expected = Math.sqrt(
      2 * p.gravity_m_s2 * p.length_m * (1 - Math.cos(deg(90))),
    );
    // Sampled at frame boundaries, and the true maximum falls between two of
    // them, so this is limited by dt rather than by the integrator.
    expect(Math.abs(trace.outcome.max_speed_m_s - expected) / expected).toBeLessThan(1e-4);
    expect(trace.outcome.max_speed_m_s).toBeLessThanOrEqual(expected);
  });
});

describe("view and spec", () => {
  it("draws a rod to a fixed pivot and leaves no trail", () => {
    const view = pendulum.run(withParams(), exact).view;
    expect(view.links).toEqual([{ from: { x: 0, y: 0 }, toBody: 0 }]);
    expect(view.trail).toBe(false);
    expect(view.ground).toBeNull();
  });

  it("runs from a plain spec object", () => {
    const trace = runSpec({ sim_id: "pendulum", params: PENDULUM_DEFAULTS });
    expect(trace.simId).toBe("pendulum");
    expect(trace.idealizations[0].on).toBe(false);
  });

  it("refuses a release angle at or past the inverted position", () => {
    expect(() =>
      runSpec({ sim_id: "pendulum", params: { ...PENDULUM_DEFAULTS, release_angle_deg: 180 } }),
    ).toThrow();
  });

  it("is byte-identical across runs", () => {
    expect(JSON.stringify(pendulum.run(withParams(), exact))).toBe(
      JSON.stringify(pendulum.run(withParams(), exact)),
    );
  });
});
