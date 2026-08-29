/**
 * A block on an inclined plane, with friction as an explicit toggle.
 *
 * This sim is here as the deliberate counterweight to `freefall`. There, in
 * air, a heavier object really does win — mass matters. Here, with friction,
 * it does not: the acceleration is
 *
 *     a = g·(sin θ − μ_k·cos θ)
 *
 * and the mass cancels out entirely. Double the block and nothing changes.
 *
 * Both results are true, and a student holding "heavier things go faster"
 * gets confirmed by one and contradicted by the other. That pairing is the
 * whole design rule 5 in miniature: the rule is right for X, and here is
 * exactly where it stops being right — because the reason mass helps in air
 * (more weight per unit of frontal area) has no counterpart on a ramp, where
 * both the driving force and the friction scale with mass together.
 *
 * The other thing this sim exists to show is that nothing moves at all until
 * tan θ exceeds μ_s. A block sitting still on a slope is a legitimate,
 * correct outcome, not a failed run.
 */

import { DEFAULT_DT, initVerlet1D, verletStep1D } from "../integrate";
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

export type InclineParams = {
  incline_angle_deg: number;
  length_m: number;
  mass_kg: number;
  mu_static: number;
  mu_kinetic: number;
  gravity_m_s2: number;
};

export const INCLINE_DEFAULTS: InclineParams = {
  incline_angle_deg: 30,
  length_m: 5,
  mass_kg: 2,
  mu_static: 0.4,
  mu_kinetic: 0.3,
  gravity_m_s2: 9.81,
};

const IDEALIZATIONS: IdealizationDef[] = [
  {
    key: "friction",
    label: "Friction",
    whenOn:
      "Coulomb friction, with separate static and kinetic coefficients. The block does not move at all until tan θ exceeds μ_s, and once it does, its acceleration still does not depend on its mass.",
    whenOff:
      "A frictionless ramp: a = g·sin θ, sliding from any angle above zero. This is the case every textbook problem describes and the case that does not exist — and note that the mass cancels here too, for a different reason.",
    default: true,
  },
];

const VALIDITY: ValidityRange = {
  summary:
    "A rigid block sliding in a straight line down a flat ramp, with a constant coefficient of friction and no air resistance.",
  breaksDownWhen: [
    "The object rolls instead of sliding. A rolling ball puts part of its energy into spin, and reaches the bottom slower than this predicts.",
    "The block tips over. Nothing here models torque, and a tall narrow block on a steep slope topples rather than slides.",
    "Speeds get high enough for air resistance to matter, or the surfaces heat enough to change the coefficient.",
    "The real coefficient is not constant — most surfaces vary with speed, load and contamination, and quoted values are rough at best.",
  ],
};

const PREDICTIONS: PredictionTarget[] = [
  {
    key: "mass_effect",
    kind: "choice",
    prompt: "If you doubled the mass of the block, what would happen to the time it takes to reach the bottom?",
    options: [
      { value: "shorter", label: "It would get there sooner" },
      { value: "longer", label: "It would take longer" },
      { value: "same", label: "Exactly the same time" },
    ],
    // Mass divides out of a = g(sin - mu*cos) entirely, with or without
    // friction. Asserted against a 100x mass range in the test suite.
    resolve: () => "same",
  },
  {
    key: "speed_at_bottom_m_s",
    kind: "numeric",
    prompt: "How fast is it moving when it reaches the bottom?",
    unit: "m/s",
    range: [0, 30],
  },
];

const CONTROLS: ParamControl[] = [
  { key: "incline_angle_deg", label: "slope angle", unit: "°", min: 1, max: 85, step: 1 },
  { key: "length_m", label: "slope length", unit: "m", min: 0.5, max: 30, step: 0.5 },
  { key: "mass_kg", label: "block mass", unit: "kg", min: 0.1, max: 100, step: 0.1 },
  { key: "mu_static", label: "μ static", unit: "", min: 0, max: 1.5, step: 0.01 },
  { key: "mu_kinetic", label: "μ kinetic", unit: "", min: 0, max: 1.5, step: 0.01 },
  { key: "gravity_m_s2", label: "gravity", unit: "m/s²", min: 0.5, max: 25, step: 0.01 },
];

/** The slope angle at which a block finally breaks loose: tan θ = μ_s. */
export function angleOfRepose(muStatic: number): number {
  return (Math.atan(muStatic) * 180) / Math.PI;
}

export const incline: Simulator<InclineParams> = {
  id: "incline",
  title: "Block on a ramp",
  question: "Does a heavier block slide down a ramp faster?",
  validity: VALIDITY,
  idealizations: IDEALIZATIONS,
  predictions: PREDICTIONS,
  controls: CONTROLS,

  closedForm(p, ideal) {
    const g = p.gravity_m_s2;
    const theta = (p.incline_angle_deg * Math.PI) / 180;
    const withFriction = ideal.friction !== false;

    // Kinetic friction cannot exceed static: a surface that grips harder once
    // it is already sliding is not a thing. Clamped rather than rejected,
    // because a slider that silently refuses to move is worse than one that
    // quietly uses the physical value.
    const muS = withFriction ? p.mu_static : 0;
    const muK = withFriction ? Math.min(p.mu_kinetic, p.mu_static) : 0;

    const slides = Math.tan(theta) > muS;
    const a = g * (Math.sin(theta) - muK * Math.cos(theta));
    const normal = p.mass_kg * g * Math.cos(theta);

    if (!slides || a <= 0) {
      return {
        acceleration_m_s2: 0,
        time_to_bottom_s: Infinity,
        speed_at_bottom_m_s: 0,
        normal_force_n: normal,
        friction_force_n: p.mass_kg * g * Math.sin(theta), // static, matching gravity
        breakaway_angle_deg: angleOfRepose(muS),
      };
    }

    const time = Math.sqrt((2 * p.length_m) / a);
    return {
      acceleration_m_s2: a,
      time_to_bottom_s: time,
      speed_at_bottom_m_s: a * time,
      normal_force_n: normal,
      friction_force_n: muK * normal,
      breakaway_angle_deg: angleOfRepose(muS),
    };
  },

  run(p, ideal, opts: RunOptions = {}): Trace {
    const dt = opts.dt ?? DEFAULT_DT;
    const maxSteps = opts.maxSteps ?? 240 * 60;
    const withFriction = ideal.friction !== false;
    const g = p.gravity_m_s2;
    const theta = (p.incline_angle_deg * Math.PI) / 180;
    const L = p.length_m;
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);

    const muS = withFriction ? p.mu_static : 0;
    const muK = withFriction ? Math.min(p.mu_kinetic, p.mu_static) : 0;

    const slides = Math.tan(theta) > muS;
    // Note what is NOT here: mass. It divides out of the equation of motion
    // entirely, which is the answer to the question this sim asks.
    const accel = () => g * (sin - muK * cos);

    const normal = p.mass_kg * g * cos;
    const frames: Frame[] = [];
    const energy: number[] = [];

    // Distance measured down the slope from the top.
    const posOf = (s: number) => ({ x: s * cos, y: (L - s) * sin });

    const record = (t: number, s: number, v: number) => {
      const pos = posOf(s);
      const e = 0.5 * p.mass_kg * v * v + p.mass_kg * g * pos.y;
      frames.push({
        t,
        bodies: [{ id: "block", pos, vel: { x: v * cos, y: -v * sin } }],
        scalars: {
          distance_m: s,
          speed_m_s: v,
          height_m: pos.y,
          energy_j: e,
        },
      });
      energy.push(e);
    };

    let t = 0;
    let reachedBottom = false;

    if (!slides) {
      // A block that stays put is a correct answer, not a failed run. Hold it
      // there long enough to read, and say why in the outcome.
      const STILL_FRAMES = 60;
      for (let i = 0; i <= STILL_FRAMES; i++) {
        t = (i / STILL_FRAMES) * 1.5;
        record(t, 0, 0);
      }
    } else {
      let s = initVerlet1D(0, 0, accel);
      record(0, s.x, s.v);

      for (let step = 0; step < maxSteps; step++) {
        const prev = s;
        const prevT = t;
        s = verletStep1D(s, dt, accel, t);
        t += dt;

        if (prev.x <= L && s.x > L) {
          // Land exactly on the end of the ramp with one short sub-step, the
          // same way the projectile lands on the ground. The linear estimate
          // of the crossing fraction is taken on a quadratic trajectory, so it
          // needs the same single Newton refinement -- without it the snap to
          // x = L leaves a 2e-6 energy step on the final frame, which is
          // millions of times the integrator's own error and would draw a
          // visible kink at the end of the invariant plot.
          let f = (L - prev.x) / (s.x - prev.x);
          let end = verletStep1D(prev, dt * f, accel, prevT);
          const denom = end.x - prev.x;
          if (denom !== 0) {
            const refined = f * ((L - prev.x) / denom);
            if (Number.isFinite(refined) && refined > 0) {
              f = Math.min(Math.max(refined, 0), 1);
              end = verletStep1D(prev, dt * f, accel, prevT);
            }
          }
          t = prevT + dt * f;
          record(t, L, end.v);
          s = { x: L, v: end.v, a: end.a };
          reachedBottom = true;
          break;
        }

        record(t, s.x, s.v);
      }
    }

    const last = frames[frames.length - 1];
    const finalSpeed = last.scalars.speed_m_s;

    const resolved: ResolvedIdealization[] = IDEALIZATIONS.map((d) => ({
      ...d,
      on: ideal[d.key] !== false,
    }));

    const height = L * sin;
    const width = L * cos;

    return {
      simId: "incline",
      dt,
      frames,
      domain: {
        x: [-width * 0.06, width * 1.06],
        y: [-height * 0.08, Math.max(height * 1.12, L * 0.1)],
      },
      view: {
        kind: "world",
        xLabel: "horizontal distance (m)",
        yLabel: "height (m)",
        xAxis: true,
        ground: 0,
        links: [],
        // The ramp surface itself, from the top of the slope to its foot.
        segments: [{ from: { x: 0, y: height }, to: { x: width, y: 0 } }],
        trail: false,
      },
      invariants: [
        {
          key: "energy_j",
          label: "Total mechanical energy",
          unit: "J",
          law: withFriction && muK > 0 ? "non_increasing" : "conserved",
          values: energy,
          tolerance: 1e-8,
          active: true,
        },
      ],
      outcome: {
        acceleration_m_s2: slides ? accel() : 0,
        time_to_bottom_s: reachedBottom ? t : Infinity,
        speed_at_bottom_m_s: reachedBottom ? finalSpeed : 0,
        normal_force_n: normal,
        // Static friction matches the pull down the slope exactly; kinetic
        // friction is μ_k·N and does not care how hard gravity is pulling.
        friction_force_n: slides ? muK * normal : p.mass_kg * g * sin,
        weight_n: p.mass_kg * g,
        breakaway_angle_deg: angleOfRepose(muS),
        moved: slides ? 1 : 0,
      },
      idealizations: resolved,
    };
  },
};
