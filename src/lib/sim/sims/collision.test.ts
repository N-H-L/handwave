import { describe, expect, it } from "vitest";
import {
  COLLISION_DEFAULTS,
  collision,
  dampingRatioFor,
  finalVelocities,
} from "./collision";
import type { CollisionParams } from "./collision";
import { driftOf, invariantHolds } from "../integrate";
import { runSpec } from "../registry";

const inelastic = { perfectly_elastic: false };
const elastic = { perfectly_elastic: true };

function withParams(over: Partial<CollisionParams> = {}): CollisionParams {
  return { ...COLLISION_DEFAULTS, ...over };
}

const inv = (t: ReturnType<typeof collision.run>, key: string) =>
  t.invariants.find((i) => i.key === key)!;

describe("momentum is conserved in every collision", () => {
  for (const [name, ideal] of [
    ["elastic", elastic],
    ["inelastic", inelastic],
  ] as const) {
    it("holds to machine precision — " + name, () => {
      const trace = collision.run(withParams(), ideal);
      const p = inv(trace, "momentum_kg_m_s");
      expect(p.law).toBe("conserved");
      expect(invariantHolds(p)).toBe(true);
      // Equal and opposite accelerations are applied from the SAME force, so
      // the momentum change per step cancels exactly rather than approximately.
      expect(driftOf(p)).toBeLessThan(1e-12);
    });
  }

  it("holds even when the two momenta nearly cancel", () => {
    // Total momentum ~0 here, which is why the invariant declares a scale.
    const trace = collision.run(
      withParams({ mass_1_kg: 1000, velocity_1_m_s: 10, mass_2_kg: 1000, velocity_2_m_s: -10 }),
      inelastic,
    );
    const p = inv(trace, "momentum_kg_m_s");
    expect(Math.abs(p.values[0])).toBeLessThan(1e-9);
    expect(invariantHolds(p)).toBe(true);
  });
});

describe("kinetic energy behaves differently, which is the point", () => {
  it("is conserved when the collision is elastic", () => {
    const trace = collision.run(withParams(), elastic);
    const me = inv(trace, "mechanical_energy_j");
    expect(me.law).toBe("conserved");
    expect(invariantHolds(me)).toBe(true);
    expect(trace.outcome.kinetic_energy_lost_j / me.values[0]).toBeLessThan(1e-5);
  });

  it("falls when it is not", () => {
    const trace = collision.run(withParams({ restitution: 0.2 }), inelastic);
    const me = inv(trace, "mechanical_energy_j");
    expect(me.law).toBe("non_increasing");
    expect(invariantHolds(me)).toBe(true);
    expect(trace.outcome.kinetic_energy_lost_j).toBeGreaterThan(0);
  });

  it("KINETIC energy alone is NOT monotonic through the contact", () => {
    // It dips into the spring during compression and comes back out. Declaring
    // kinetic energy non-increasing would have been wrong, and asserting it is
    // what caught the mistake.
    const trace = collision.run(withParams(), inelastic);
    const ke = trace.frames.map((f) => f.scalars.kinetic_energy_j);
    const dipped = Math.min(...ke);
    expect(dipped).toBeLessThan(ke[ke.length - 1]);
  });

  it("stores and returns the spring energy, ending with none of it", () => {
    const trace = collision.run(withParams(), elastic);
    const spring = trace.frames.map((f) => f.scalars.spring_energy_j);
    expect(Math.max(...spring)).toBeGreaterThan(0);
    expect(spring[0]).toBe(0);
    expect(spring[spring.length - 1]).toBe(0);
  });

  it("loses more energy the lower the restitution", () => {
    const lost = (e: number) =>
      collision.run(withParams({ restitution: e }), inelastic).outcome.kinetic_energy_lost_j;
    expect(lost(0.1)).toBeGreaterThan(lost(0.5));
    expect(lost(0.5)).toBeGreaterThan(lost(0.9));
  });
});

describe("final velocities match the closed form", () => {
  const cases: [string, Partial<CollisionParams>, typeof elastic][] = [
    ["truck meets car, inelastic", {}, inelastic],
    ["truck meets car, elastic", {}, elastic],
    ["equal masses, elastic", { mass_1_kg: 1, mass_2_kg: 1, velocity_1_m_s: 5, velocity_2_m_s: -5 }, elastic],
    ["light hits heavy at rest", { mass_1_kg: 1, velocity_1_m_s: 10, mass_2_kg: 50, velocity_2_m_s: 0 }, elastic],
    ["catching up from behind", { velocity_1_m_s: 20, velocity_2_m_s: 5 }, inelastic],
  ];

  for (const [name, over, ideal] of cases) {
    it(name, () => {
      const p = withParams(over);
      const closed = collision.closedForm(p, ideal)!;
      const trace = collision.run(p, ideal);
      expect(trace.outcome.touched).toBe(1);
      expect(trace.outcome.velocity_1_after_m_s).toBeCloseTo(closed.velocity_1_after_m_s, 3);
      expect(trace.outcome.velocity_2_after_m_s).toBeCloseTo(closed.velocity_2_after_m_s, 3);
    });
  }

  it("swaps the velocities of two equal masses in an elastic head-on", () => {
    const trace = collision.run(
      withParams({ mass_1_kg: 1, mass_2_kg: 1, velocity_1_m_s: 5, velocity_2_m_s: -5, radius_m: 0.2 }),
      elastic,
    );
    expect(trace.outcome.velocity_1_after_m_s).toBeCloseTo(-5, 3);
    expect(trace.outcome.velocity_2_after_m_s).toBeCloseTo(5, 3);
  });

  it("reproduces the requested coefficient of restitution", () => {
    for (const e of [0.1, 0.35, 0.6, 0.9]) {
      const trace = collision.run(withParams({ restitution: e }), inelastic);
      expect(trace.outcome.restitution_measured, "e=" + e).toBeCloseTo(e, 2);
    }
  });
});

describe("THE MISCONCEPTION: which one feels the bigger force", () => {
  it("applies equal and opposite forces at every single instant", () => {
    const trace = collision.run(withParams(), inelastic);
    for (const f of trace.frames) {
      expect(f.scalars.force_on_1_n).toBeCloseTo(-f.scalars.force_on_2_n, 12);
    }
  });

  it("delivers equal and opposite impulses despite a 3:1 mass ratio", () => {
    const trace = collision.run(withParams(), inelastic);
    expect(trace.outcome.impulse_1_ns).toBeCloseTo(-trace.outcome.impulse_2_ns, 3);
  });

  it("changes the light body's velocity by the mass ratio more", () => {
    const p = withParams();
    const trace = collision.run(p, inelastic);
    const dv1 = Math.abs(trace.outcome.velocity_1_after_m_s - p.velocity_1_m_s);
    const dv2 = Math.abs(trace.outcome.velocity_2_after_m_s - p.velocity_2_m_s);
    // Equal forces, unequal masses: the ratio of velocity changes is exactly
    // the inverse ratio of the masses. This is the sentence the sim exists for.
    expect(dv2 / dv1).toBeCloseTo(p.mass_1_kg / p.mass_2_kg, 2);
  });
});

describe("peak force is a modelling choice; impulse is not", () => {
  it("scales the peak force with the contact stiffness while the impulse holds", () => {
    const soft = collision.run(withParams({ contact_stiffness_n_m: 5e5 }), inelastic).outcome;
    const hard = collision.run(withParams({ contact_stiffness_n_m: 8e6 }), inelastic).outcome;

    expect(hard.peak_force_n).toBeGreaterThan(soft.peak_force_n * 2);
    const impulseDiff =
      Math.abs(hard.impulse_1_ns - soft.impulse_1_ns) / Math.abs(soft.impulse_1_ns);
    expect(impulseDiff).toBeLessThan(1e-3);
  });

  it("shortens the contact as the stiffness rises", () => {
    const soft = collision.run(withParams({ contact_stiffness_n_m: 5e5 }), inelastic).outcome;
    const hard = collision.run(withParams({ contact_stiffness_n_m: 8e6 }), inelastic).outcome;
    expect(hard.contact_duration_ms).toBeLessThan(soft.contact_duration_ms);
  });

  it("matches the impulse the closed form predicts", () => {
    const p = withParams();
    const closed = collision.closedForm(p, inelastic)!;
    const trace = collision.run(p, inelastic);
    expect(trace.outcome.impulse_1_ns).toBeCloseTo(closed.impulse_1_ns, 1);
  });
});

describe("the restitution-to-damping inversion", () => {
  it("gives zero damping for a perfectly elastic contact", () => {
    expect(dampingRatioFor(1)).toBe(0);
  });

  it("round-trips: zeta back through exp(-zeta*pi/sqrt(1-zeta^2)) returns e", () => {
    for (const e of [0.05, 0.2, 0.5, 0.8, 0.99]) {
      const z = dampingRatioFor(e);
      const back = Math.exp((-z * Math.PI) / Math.sqrt(1 - z * z));
      expect(back).toBeCloseTo(e, 10);
    }
  });

  it("is monotone: less bouncy means more damped", () => {
    expect(dampingRatioFor(0.1)).toBeGreaterThan(dampingRatioFor(0.9));
  });
});

describe("the closed form itself", () => {
  it("conserves momentum for any restitution", () => {
    for (const e of [0.01, 0.5, 1]) {
      const [v1, v2] = finalVelocities(3, 4, 7, -2, e);
      expect(3 * v1 + 7 * v2).toBeCloseTo(3 * 4 + 7 * -2, 10);
    }
  });

  it("gives a common velocity as restitution approaches zero", () => {
    const [v1, v2] = finalVelocities(3, 4, 7, -2, 0);
    expect(v1).toBeCloseTo(v2, 12);
    expect(v1).toBeCloseTo((3 * 4 + 7 * -2) / 10, 12);
  });
});

describe("determinism and the spec gate", () => {
  it("is byte-identical across runs", () => {
    expect(JSON.stringify(collision.run(withParams(), inelastic))).toBe(
      JSON.stringify(collision.run(withParams(), inelastic)),
    );
  });

  it("runs from a plain spec object", () => {
    const trace = runSpec({ sim_id: "collision", params: COLLISION_DEFAULTS });
    expect(trace.simId).toBe("collision");
    expect(trace.outcome.touched).toBe(1);
  });

  it("refuses a perfectly inelastic restitution, which this model cannot represent", () => {
    expect(() =>
      runSpec({ sim_id: "collision", params: { ...COLLISION_DEFAULTS, restitution: 0 } }),
    ).toThrow();
  });
});
