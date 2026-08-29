/**
 * A simple pendulum, with the small-angle approximation as an explicit toggle.
 *
 * This is the second counterexample from the adversarial review, built to the
 * correction. A sim that silently linearises to θ'' = −(g/L)·θ conserves energy
 * exactly, passes every dimensional check, and produces the period the textbook
 * formula predicts — and then tells a student who correctly says "the period
 * depends on how far you pull it back" that they are WRONG. At 90° the real
 * period is about 18% longer than 2π√(L/g). The student is right and the sim
 * is lying.
 *
 * So the linearisation is a labelled idealisation, default OFF, and the exact
 * period is asserted in tests against the elliptic-integral solution
 *
 *     T = 4·√(L/g)·K(sin²(θ₀/2))
 *
 * computed by AGM. The small-angle period is a special case of it, not a
 * separate truth.
 *
 * The energy expression differs between the two modes and both are exact for
 * their own equation of motion. Using the true potential mgL(1−cos θ) while
 * integrating the linearised equation would show a false energy drift and make
 * a correct run look broken.
 */

import { DEFAULT_DT, ellipticK, initVerlet1D, verletStep1D } from "../integrate";
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

export type PendulumParams = {
  length_m: number;
  release_angle_deg: number;
  mass_kg: number;
  gravity_m_s2: number;
};

export const PENDULUM_DEFAULTS: PendulumParams = {
  length_m: 1,
  release_angle_deg: 80,
  mass_kg: 0.5,
  gravity_m_s2: 9.81,
};

const IDEALIZATIONS: IdealizationDef[] = [
  {
    key: "small_angle",
    label: "Small-angle approximation",
    whenOn:
      "sin θ is replaced by θ, so the period becomes exactly 2π√(L/g) and does not depend on the release angle at all. Accurate to better than 1% below about 20°, and increasingly wrong above that.",
    whenOff:
      "The full equation, θ'' = −(g/L)·sin θ. The period grows with the release angle: +1.7% at 30°, +7.3% at 60°, +18.0% at 90°. If you thought pulling it back further changes the period, this is the case where you are right.",
    default: false,
  },
];

const VALIDITY: ValidityRange = {
  summary:
    "A point mass on a massless, rigid, frictionless rod, swinging in a plane under uniform gravity.",
  breaksDownWhen: [
    "The bob is large or the rod is heavy — a real pendulum is a physical pendulum, and its period depends on its moment of inertia, not just its length.",
    "There is friction at the pivot or drag on the bob. Nothing here damps, so this swings forever.",
    "The release angle reaches 180°, where the period diverges: balanced exactly upside down, it never comes back.",
    "The support moves, or the swing leaves the plane and becomes a spherical pendulum.",
  ],
};

const PREDICTIONS: PredictionTarget[] = [
  {
    key: "period_vs_angle",
    kind: "choice",
    prompt: "If you release it from a much larger angle, what happens to the time for one full swing?",
    options: [
      { value: "longer", label: "It takes longer" },
      { value: "shorter", label: "It takes less time" },
      { value: "same", label: "It stays the same" },
    ],
    // The question is counterfactual — "if you released it from further back"
    // — so it turns on which equation is being integrated, not on this run's
    // numbers. Under the small-angle approximation the period provably does
    // not depend on amplitude; under the real equation it always does.
    resolve: (trace) =>
      trace.idealizations.find((i) => i.key === "small_angle")?.on ? "same" : "longer",
  },
  {
    key: "period_s",
    kind: "numeric",
    prompt: "How long is one full swing, out and back?",
    unit: "s",
    range: [0, 8],
  },
];

const CONTROLS: ParamControl[] = [
  { key: "length_m", label: "length", unit: "m", min: 0.1, max: 5, step: 0.05 },
  { key: "release_angle_deg", label: "release angle", unit: "°", min: 1, max: 170, step: 1 },
  { key: "mass_kg", label: "bob mass", unit: "kg", min: 0.05, max: 10, step: 0.05 },
  { key: "gravity_m_s2", label: "gravity", unit: "m/s²", min: 0.5, max: 25, step: 0.01 },
];

/**
 * Exact period of a simple pendulum released from rest at θ₀.
 *
 * T = 4√(L/g)·K(m) with m = sin²(θ₀/2). Reduces to 2π√(L/g) as θ₀ → 0, since
 * K(0) = π/2.
 */
export function exactPeriod(lengthM: number, releaseAngleRad: number, g: number): number {
  const m = Math.pow(Math.sin(Math.abs(releaseAngleRad) / 2), 2);
  return 4 * Math.sqrt(lengthM / g) * ellipticK(m);
}

export function smallAnglePeriod(lengthM: number, g: number): number {
  return 2 * Math.PI * Math.sqrt(lengthM / g);
}

export const pendulum: Simulator<PendulumParams> = {
  id: "pendulum",
  title: "Simple pendulum",
  question: "Does how far you pull a pendulum back change how long its swing takes?",
  validity: VALIDITY,
  idealizations: IDEALIZATIONS,
  predictions: PREDICTIONS,
  controls: CONTROLS,

  closedForm(p, ideal) {
    const g = p.gravity_m_s2;
    const theta0 = (p.release_angle_deg * Math.PI) / 180;
    const period = ideal.small_angle
      ? smallAnglePeriod(p.length_m, g)
      : exactPeriod(p.length_m, theta0, g);

    // Max speed comes from energy, and the potential differs between the two
    // equations of motion, so the speed does too.
    const maxSpeed = ideal.small_angle
      ? Math.abs(theta0) * Math.sqrt(g * p.length_m)
      : Math.sqrt(2 * g * p.length_m * (1 - Math.cos(theta0)));

    return {
      period_s: period,
      max_speed_m_s: maxSpeed,
      small_angle_period_s: smallAnglePeriod(p.length_m, g),
      period_excess_pct: (period / smallAnglePeriod(p.length_m, g) - 1) * 100,
    };
  },

  run(p, ideal, opts: RunOptions = {}): Trace {
    const dt = opts.dt ?? DEFAULT_DT;
    const linear = ideal.small_angle === true;
    const g = p.gravity_m_s2;
    const L = p.length_m;
    const theta0 = (p.release_angle_deg * Math.PI) / 180;

    const accel = linear
      ? (theta: number) => -(g / L) * theta
      : (theta: number) => -(g / L) * Math.sin(theta);

    // Energy for the equation actually being integrated. The linearised system
    // conserves the harmonic energy ½mL²ω² + ½mgLθ², not the true one — and
    // asserting the true one against it would flag a correct run as broken.
    const energyOf = linear
      ? (theta: number, omega: number) =>
          0.5 * p.mass_kg * L * L * omega * omega + 0.5 * p.mass_kg * g * L * theta * theta
      : (theta: number, omega: number) =>
          0.5 * p.mass_kg * L * L * omega * omega + p.mass_kg * g * L * (1 - Math.cos(theta));

    // Run two full periods so the animation shows the swing repeating.
    const period = linear ? smallAnglePeriod(L, g) : exactPeriod(L, theta0, g);
    const steps = Math.ceil((2.05 * period) / dt);

    let s = initVerlet1D(theta0, 0, accel);
    let t = 0;

    const frames: Frame[] = [];
    const energy: number[] = [];

    // Quarter period measured from the first crossing of θ = 0, interpolated
    // rather than snapped to a frame boundary — at dt = 1/240 s, quantising it
    // would put a ~0.2% error straight into the number the student predicted.
    let firstZeroCrossing: number | null = null;
    let maxSpeed = 0;

    const record = (time: number, theta: number, omega: number) => {
      const e = energyOf(theta, omega);
      const speed = Math.abs(omega) * L;
      if (speed > maxSpeed) maxSpeed = speed;
      frames.push({
        t: time,
        bodies: [
          {
            id: "bob",
            // Pivot at the origin, bob hanging below it.
            pos: { x: L * Math.sin(theta), y: -L * Math.cos(theta) },
            vel: { x: omega * L * Math.cos(theta), y: omega * L * Math.sin(theta) },
          },
        ],
        scalars: {
          angle_deg: (theta * 180) / Math.PI,
          angular_velocity_rad_s: omega,
          speed_m_s: speed,
          energy_j: e,
        },
      });
      energy.push(e);
    };

    record(0, s.x, s.v);

    for (let i = 0; i < steps; i++) {
      const prev = s;
      const prevT = t;
      s = verletStep1D(s, dt, accel, t);
      t += dt;

      if (firstZeroCrossing === null && prev.x !== 0 && Math.sign(s.x) !== Math.sign(prev.x)) {
        const f = prev.x / (prev.x - s.x);
        firstZeroCrossing = prevT + dt * f;
      }

      record(t, s.x, s.v);
    }

    const measuredPeriod = firstZeroCrossing !== null ? 4 * firstZeroCrossing : NaN;

    const resolved: ResolvedIdealization[] = IDEALIZATIONS.map((d) => ({
      ...d,
      on: ideal[d.key] === true,
    }));

    const reach = L * 1.15;

    return {
      simId: "pendulum",
      dt,
      frames,
      domain: { x: [-reach, reach], y: [-reach, L * 0.15] },
      view: {
        kind: "world",
        xLabel: "",
        yLabel: "",
        xAxis: false,
        ground: null,
        links: [{ from: { x: 0, y: 0 }, toBody: 0 }],
        segments: [],
        // An oscillator retraces its own arc; a trail would just paint over it.
        trail: false,
      },
      invariants: [
        {
          key: "energy_j",
          label: linear ? "Harmonic energy (linearised)" : "Total mechanical energy",
          unit: "J",
          law: "conserved",
          values: energy,
          // Velocity-Verlet is symplectic but only second-order, so a
          // large-amplitude swing shows a BOUNDED energy oscillation of about
          // 3.4e-5 at dt = 1/240 s. It does not grow with time, and it falls
          // by exactly 4x each time dt is halved — both asserted in the tests.
          // Declaring 1e-6 here would fail a numerically correct run.
          tolerance: 1e-4,
          active: true,
        },
      ],
      outcome: {
        period_s: measuredPeriod,
        max_speed_m_s: maxSpeed,
        small_angle_period_s: smallAnglePeriod(L, g),
        period_excess_pct: (measuredPeriod / smallAnglePeriod(L, g) - 1) * 100,
        release_angle_deg: p.release_angle_deg,
      },
      idealizations: resolved,
    };
  },
};
