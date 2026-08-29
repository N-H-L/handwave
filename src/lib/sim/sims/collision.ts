/**
 * A one-dimensional collision between two bodies, through a finite contact.
 *
 * The misconception this exists for is the most heavily documented one in
 * introductory mechanics: in a truck-hits-car collision, students say
 * overwhelmingly that the truck exerts the greater force. It does not. The
 * forces are equal and opposite at every instant; what differs is the
 * ACCELERATION, because the masses differ. A three-tonne truck and a
 * one-tonne car feel identical forces, and the car's velocity changes three
 * times as much.
 *
 * That is why this models a finite contact — a spring and a dashpot — rather
 * than an instantaneous impulse. An impulse model can only report a total; a
 * contact model reports a force at every instant, and the two force histories
 * are exact mirror images of each other. The point is unarguable when you can
 * watch it.
 *
 * The contact is a damped harmonic oscillator in the overlap coordinate, with
 * reduced mass μ = m₁m₂/(m₁+m₂). For a linear spring-dashpot the coefficient
 * of restitution follows in closed form,
 *
 *     e = exp(−ζπ / √(1−ζ²)),   ζ = c / (2√(kμ))
 *
 * so a target restitution is inverted to a damping constant, and the measured
 * restitution is asserted against it in tests.
 */

import type {
  Frame,
  IdealizationDef,
  ParamControl,
  PredictionTarget,
  ResolvedIdealization,
  RunOptions,
  Simulator,
  Trace,
  ValidityRange,
} from "../types";

export type CollisionParams = {
  mass_1_kg: number;
  velocity_1_m_s: number;
  mass_2_kg: number;
  velocity_2_m_s: number;
  restitution: number;
  contact_stiffness_n_m: number;
  radius_m: number;
};

/** A truck at 20 m/s meeting a car at 10 m/s head-on. */
export const COLLISION_DEFAULTS: CollisionParams = {
  mass_1_kg: 3000,
  velocity_1_m_s: 20,
  mass_2_kg: 1000,
  velocity_2_m_s: -10,
  restitution: 0.2,
  contact_stiffness_n_m: 2e6,
  radius_m: 1.2,
};

const IDEALIZATIONS: IdealizationDef[] = [
  {
    key: "perfectly_elastic",
    label: "Perfectly elastic",
    whenOn:
      "No energy is lost in the contact: the bodies bounce apart with exactly the kinetic energy they arrived with. Nothing macroscopic is perfectly elastic — real collisions heat, deform and make noise — but it is the case every textbook formula assumes.",
    whenOff:
      "The contact dissipates, at the coefficient of restitution set below. Kinetic energy falls; momentum does not. That difference is the whole point: momentum is conserved in EVERY collision, kinetic energy only in an elastic one.",
    default: false,
  },
];

const VALIDITY: ValidityRange = {
  summary:
    "Two bodies on a frictionless line, meeting head-on through a linear spring-and-dashpot contact.",
  breaksDownWhen: [
    "The collision is off-centre, or the bodies spin. Nothing here models angular momentum, and a real crash is almost never head-on.",
    "You read the PEAK FORCE as a property of the collision. It is a property of the contact stiffness, which is a modelling choice. The impulse — the area under the force curve — is what the collision actually determines, and it does not depend on the stiffness at all.",
    "The bodies deform permanently. A linear spring returns to its original shape; a crumple zone does not.",
    "Very near separation the linear dashpot pulls very slightly inward. That is an artefact of the model, not of the world. It is part of the exact solution this restitution is derived from, so it costs no accuracy — but it is not something a real contact does.",
  ],
};

const PREDICTIONS: PredictionTarget[] = [
  {
    key: "which_force",
    kind: "choice",
    prompt: "During the collision, which body feels the greater force?",
    options: [
      { value: "heavier", label: "The heavier one" },
      { value: "lighter", label: "The lighter one" },
      { value: "equal", label: "They feel exactly the same force" },
    ],
    // Newton's third law is not a parameter. Every frame of every run in the
    // test suite asserts force_on_1 === -force_on_2 to twelve decimal places.
    resolve: () => "equal",
  },
  {
    key: "velocity_2_after_m_s",
    kind: "numeric",
    prompt: "How fast is the lighter body moving afterwards, and in which direction?",
    unit: "m/s",
    range: [-60, 60],
  },
];

const CONTROLS: ParamControl[] = [
  { key: "mass_1_kg", label: "mass 1", unit: "kg", min: 1, max: 5000, step: 1 },
  { key: "velocity_1_m_s", label: "velocity 1", unit: "m/s", min: -50, max: 50, step: 0.5 },
  { key: "mass_2_kg", label: "mass 2", unit: "kg", min: 1, max: 5000, step: 1 },
  { key: "velocity_2_m_s", label: "velocity 2", unit: "m/s", min: -50, max: 50, step: 0.5 },
  { key: "restitution", label: "restitution", unit: "", min: 0.01, max: 1, step: 0.01 },
  {
    key: "contact_stiffness_n_m",
    label: "contact stiffness",
    unit: "N/m",
    min: 1e5,
    max: 1e7,
    step: 1e5,
  },
];

/**
 * Damping ratio giving a target coefficient of restitution, by inverting
 * e = exp(−ζπ/√(1−ζ²)).
 */
export function dampingRatioFor(restitution: number): number {
  const e = Math.min(Math.max(restitution, 1e-6), 1);
  if (e >= 1) return 0;
  const lnE = Math.log(e);
  return -lnE / Math.sqrt(Math.PI * Math.PI + lnE * lnE);
}

/** Closed-form final velocities for a 1-D collision at coefficient of restitution e. */
export function finalVelocities(
  m1: number,
  u1: number,
  m2: number,
  u2: number,
  e: number,
): [number, number] {
  const total = m1 + m2;
  const v1 = (m1 * u1 + m2 * u2 + m2 * e * (u2 - u1)) / total;
  const v2 = (m1 * u1 + m2 * u2 + m1 * e * (u1 - u2)) / total;
  return [v1, v2];
}

export const collision: Simulator<CollisionParams> = {
  id: "collision",
  title: "Head-on collision",
  question: "When a heavy thing hits a light thing, which one feels the bigger force?",
  validity: VALIDITY,
  idealizations: IDEALIZATIONS,
  predictions: PREDICTIONS,
  controls: CONTROLS,

  closedForm(p, ideal) {
    const e = ideal.perfectly_elastic ? 1 : p.restitution;
    const [v1, v2] = finalVelocities(
      p.mass_1_kg,
      p.velocity_1_m_s,
      p.mass_2_kg,
      p.velocity_2_m_s,
      e,
    );
    const ke = (a: number, b: number) => 0.5 * p.mass_1_kg * a * a + 0.5 * p.mass_2_kg * b * b;
    // Impulse is what the collision determines; peak force is a property of the
    // contact stiffness, so there is deliberately no closed form for it.
    const impulse = p.mass_1_kg * (v1 - p.velocity_1_m_s);
    return {
      velocity_1_after_m_s: v1,
      velocity_2_after_m_s: v2,
      restitution_measured: e,
      impulse_1_ns: impulse,
      impulse_2_ns: -impulse,
      kinetic_energy_lost_j: ke(p.velocity_1_m_s, p.velocity_2_m_s) - ke(v1, v2),
    };
  },

  run(p, ideal, opts: RunOptions = {}): Trace {
    const elastic = ideal.perfectly_elastic === true;
    const e = elastic ? 1 : p.restitution;

    const m1 = p.mass_1_kg;
    const m2 = p.mass_2_kg;
    const k = p.contact_stiffness_n_m;
    const mu = (m1 * m2) / (m1 + m2);
    const zeta = dampingRatioFor(e);
    const c = 2 * zeta * Math.sqrt(k * mu);
    const gap = 2 * p.radius_m;

    let v1 = p.velocity_1_m_s;
    let v2 = p.velocity_2_m_s;
    const approachSpeed = v1 - v2;

    // Contact lasts half a period of the damped oscillator in the overlap
    // coordinate. Everything before and after it is free flight, which is
    // EXACTLY solvable — so the integrator is spent only where it is needed,
    // and the frame count stays bounded no matter how stiff the contact is.
    const contactPeriod = Math.PI * Math.sqrt(mu / k);
    const dt = opts.dt ?? contactPeriod / 8000;

    const lead = Math.max(Math.abs(approachSpeed) * 0.15, gap);
    const startX1 = -lead - p.radius_m;
    const startX2 = lead + p.radius_m;
    let x1 = startX1;
    let x2 = startX2;

    const frames: Frame[] = [];
    const momentum: number[] = [];
    const kinetic: number[] = [];
    const mechanical: number[] = [];

    const record = (t: number, force: number) => {
      const pTotal = m1 * v1 + m2 * v2;
      const keTotal = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      // Kinetic energy alone is NOT monotonic through a contact: it dips into
      // the spring during compression and comes back out during restitution.
      // The quantity that only ever falls is kinetic plus stored elastic
      // energy, and that is what the invariant has to assert.
      const overlapNow = Math.max(0, gap - (x2 - x1));
      const spring = 0.5 * k * overlapNow * overlapNow;
      frames.push({
        t,
        bodies: [
          { id: "1", pos: { x: x1, y: 0 }, vel: { x: v1, y: 0 } },
          { id: "2", pos: { x: x2, y: 0 }, vel: { x: v2, y: 0 } },
        ],
        scalars: {
          // Signed, so the two histories are visibly mirror images.
          force_on_1_n: -force,
          force_on_2_n: force,
          momentum_kg_m_s: pTotal,
          kinetic_energy_j: keTotal,
          spring_energy_j: spring,
          mechanical_energy_j: keTotal + spring,
        },
      });
      momentum.push(pTotal);
      kinetic.push(keTotal);
      mechanical.push(keTotal + spring);
    };

    /**
     * The contact law as it applies WHILE the bodies are touching, with no
     * cutoff. The linear dashpot term is discontinuous at both ends of the
     * contact — it is already c*v_approach at zero overlap on the way in, and
     * still c*v_separation at zero overlap on the way out. Evaluating the
     * cutoff version inside the integrator trapezoids straight across those
     * jumps and drags the whole scheme down to first order, so the integrator
     * uses this form and the loop decides separately when contact ends.
     */
    const forceInside = (a: number, b: number, va: number, vb: number): number =>
      k * (gap - (b - a)) + c * (va - vb);

    // What an observer sees is different: zero unless the bodies are actually
    // touching. That version is what gets recorded into the frames, and the
    // loop below sets it to zero the moment the contact ends.

    // ── phase 1: approach, exact ────────────────────────────────────────────
    const willTouch = approachSpeed > 0;
    const timeToContact = willTouch ? (startX2 - startX1 - gap) / approachSpeed : 0;
    const APPROACH_FRAMES = 40;
    const driftDuration = willTouch ? timeToContact : contactPeriod * 4;

    let t = 0;
    for (let i = 0; i <= APPROACH_FRAMES; i++) {
      t = (i / APPROACH_FRAMES) * driftDuration;
      x1 = startX1 + v1 * t;
      x2 = startX2 + v2 * t;
      record(t, 0);
    }

    // ── phase 2: contact, integrated ────────────────────────────────────────
    let peakForce = 0;
    let impulse = 0;
    let contactStart: number | null = null;
    let contactEnd: number | null = null;

    if (willTouch) {
      contactStart = t;
      const MAX_STEPS = 200_000;
      const TARGET_FRAMES = 300;
      const expectedSteps = Math.max(1, Math.round(contactPeriod / dt));
      const stride = Math.max(1, Math.floor(expectedSteps / TARGET_FRAMES));
      /** One iterated velocity-Verlet step of size h. Pure; returns the new state. */
      const advance = (h: number, f0: number) => {
        const a1 = -f0 / m1;
        const a2 = f0 / m2;
        const nx1 = x1 + v1 * h + 0.5 * a1 * h * h;
        const nx2 = x2 + v2 * h + 0.5 * a2 * h * h;
        let nv1 = v1 + a1 * h;
        let nv2 = v2 + a2 * h;
        let nf = 0;
        for (let iter = 0; iter < 3; iter++) {
          nf = forceInside(nx1, nx2, nv1, nv2);
          nv1 = v1 + 0.5 * (a1 - nf / m1) * h;
          nv2 = v2 + 0.5 * (a2 + nf / m2) * h;
        }
        return { nx1, nx2, nv1, nv2, nf };
      };

      // The linear dashpot makes the contact force DISCONTINUOUS at onset: at
      // zero overlap with a closing velocity it is already c*v_approach, not
      // zero. contactForce() reports zero at exactly zero overlap (it has to,
      // or the contact would never end), so the first step is seeded with the
      // one-sided limit from inside the contact instead. Without this the
      // scheme drops to first order and the error is the missed impulse of
      // that jump across one timestep.
      let force = c * approachSpeed;

      for (let step = 0; step < MAX_STEPS; step++) {
        const overlapBefore = gap - (x2 - x1);
        let h = dt;
        let r = advance(h, force);
        const overlapAfter = gap - (r.nx2 - r.nx1);

        // End the contact exactly where the overlap reaches zero, not at the
        // next frame boundary. The dashpot force is large and INWARD right at
        // separation, so overshooting by even one timestep puts a measurable
        // error into both the restitution and the impulse.
        let ending = false;
        if (overlapBefore > 0 && overlapAfter <= 0) {
          const frac = overlapBefore / (overlapBefore - overlapAfter);
          h = dt * Math.min(Math.max(frac, 1e-12), 1);
          r = advance(h, force);
          ending = true;
        }

        // Trapezoidal over the step actually taken. At separation the model's
        // force drops discontinuously to zero, and the trapezoid is the right
        // reading of that.
        // Trapezoidal over the step actually taken, using the inside-contact
        // force at both ends — including the final sub-step, which lands
        // exactly at zero overlap where the true force is still c*v_sep.
        impulse += 0.5 * (force + r.nf) * h;

        x1 = r.nx1;
        x2 = r.nx2;
        v1 = r.nv1;
        v2 = r.nv2;
        t += h;
        force = ending ? 0 : r.nf;

        if (Math.abs(force) > Math.abs(peakForce)) peakForce = force;
        contactEnd = t;

        if (ending) {
          record(t, 0);
          break;
        }
        if (step % stride === 0) record(t, force);
      }
    }

    // ── phase 3: separation, exact ──────────────────────────────────────────
    if (willTouch) {
      const SEPARATION_FRAMES = 50;
      const tailDuration = Math.max(timeToContact * 0.7, contactPeriod * 2);
      const xa = x1;
      const xb = x2;
      const t0 = t;
      for (let i = 1; i <= SEPARATION_FRAMES; i++) {
        const dtTail = (i / SEPARATION_FRAMES) * tailDuration;
        x1 = xa + v1 * dtTail;
        x2 = xb + v2 * dtTail;
        t = t0 + dtTail;
        record(t, 0);
      }
    }

    const resolved: ResolvedIdealization[] = IDEALIZATIONS.map((d) => ({
      ...d,
      on: ideal[d.key] === true,
    }));

    const xs = frames.flatMap((f) => f.bodies.map((b) => b.pos.x));
    const halfWidth = Math.max(Math.abs(Math.min(...xs)), Math.abs(Math.max(...xs))) + p.radius_m;

    const separationSpeed = v2 - v1;

    // The two momenta nearly cancel in a head-on meeting, so drift is measured
    // against the scale of the individual momenta rather than against their sum.
    const momentumScale = Math.max(
      Math.abs(m1 * p.velocity_1_m_s),
      Math.abs(m2 * p.velocity_2_m_s),
      1e-9,
    );

    return {
      simId: "collision",
      // Frames are NOT uniformly spaced: free flight is emitted analytically and
      // only the contact is integrated. This is the contact timestep.
      dt,
      frames,
      domain: {
        x: [-halfWidth * 1.05, halfWidth * 1.05],
        y: [-halfWidth * 0.28, halfWidth * 0.28],
      },
      view: {
        kind: "world",
        xLabel: "position (m)",
        yLabel: "",
        xAxis: true,
        ground: null,
        links: [],
        segments: [],
        trail: false,
      },
      invariants: [
        {
          key: "momentum_kg_m_s",
          label: "Total momentum",
          unit: "kg·m/s",
          // Conserved in EVERY collision, elastic or not. This is the one that
          // never changes law, and the one students trust least.
          law: "conserved",
          values: momentum,
          tolerance: 1e-9,
          scale: momentumScale,
          active: true,
        },
        {
          key: "mechanical_energy_j",
          label: "Kinetic + stored elastic energy",
          unit: "J",
          law: elastic ? "conserved" : "non_increasing",
          values: mechanical,
          tolerance: 1e-6,
          active: true,
        },
      ],
      outcome: {
        velocity_1_after_m_s: v1,
        velocity_2_after_m_s: v2,
        restitution_measured: willTouch ? separationSpeed / approachSpeed : 0,
        peak_force_n: Math.abs(peakForce),
        impulse_1_ns: -impulse,
        impulse_2_ns: impulse,
        contact_duration_ms:
          contactStart !== null && contactEnd !== null ? (contactEnd - contactStart) * 1000 : 0,
        kinetic_energy_lost_j: kinetic[0] - kinetic[kinetic.length - 1],
        touched: willTouch ? 1 : 0,
      },
      idealizations: resolved,
    };
  },
};
