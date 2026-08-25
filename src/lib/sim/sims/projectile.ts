/**
 * Projectile launched from a height, with air resistance as an explicit,
 * student-visible idealization toggle.
 *
 * Hand-written and unit-tested against the closed-form vacuum solution
 * (see projectile.test.ts). The model never writes any of this.
 */

import {
  DEFAULT_DT,
  DEFAULT_MAX_STEPS,
  crossingFraction,
  initVerlet,
  verletStep,
} from "../integrate";
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
  Vec2,
} from "../types";

export type ProjectileParams = {
  speed_m_s: number;
  angle_deg: number;
  launch_height_m: number;
  mass_kg: number;
  /** Cross-sectional area presented to the flow. */
  area_m2: number;
  drag_coefficient: number;
  gravity_m_s2: number;
};

export const PROJECTILE_DEFAULTS: ProjectileParams = {
  speed_m_s: 20,
  angle_deg: 45,
  launch_height_m: 0,
  mass_kg: 0.145, // a baseball
  area_m2: 0.00426,
  drag_coefficient: 0.35,
  gravity_m_s2: 9.81,
};

const AIR_DENSITY_KG_M3 = 1.225; // sea level, 15 °C

const IDEALIZATIONS: IdealizationDef[] = [
  {
    key: "air_resistance",
    label: "Air resistance",
    whenOn:
      "Quadratic drag acts opposite the velocity. Range is shorter than the textbook formula and the path is asymmetric — it falls more steeply than it rose.",
    whenOff:
      "The projectile flies in a vacuum. This is the case every textbook formula describes, and it is the case in which a heavy ball and a light ball of the same size behave identically — which is not what happens outside.",
    // Defaults to ON, matching freefall: the student's world has air, and a
    // sim that quietly runs in a vacuum invites us to diagnose beliefs that
    // are true where they actually live (PLAN §3 rule 2).
    default: true,
  },
];

const VALIDITY: ValidityRange = {
  summary:
    "Point mass, flat ground, uniform gravity, still air. Honest for a thrown or kicked object over tens of metres.",
  breaksDownWhen: [
    "The object spins — a real baseball or football curves, and nothing here models the Magnus force.",
    "Speeds approach the speed of sound, where the drag coefficient stops being constant.",
    "Ranges reach hundreds of kilometres, where the Earth's curvature and rotation matter.",
    "The object is light and large enough that it never reaches terminal velocity in a straight line — a feather, a sheet of paper.",
  ],
};

const PREDICTIONS: PredictionTarget[] = [
  {
    key: "range_m",
    kind: "numeric",
    prompt: "How far from the launch point will it land?",
    unit: "m",
    // Wide enough to contain the vacuum answer too, since the student can
    // switch air resistance off. A range that excludes the correct answer
    // makes the prediction unanswerable, which the structural tests now catch.
    range: [0, 250],
    ghostAxis: "x",
  },
  {
    key: "path_shape",
    kind: "choice",
    prompt: "What will the path look like on the way up compared with the way down?",
    options: [
      { value: "symmetric", label: "A symmetric arch — the two halves mirror each other" },
      { value: "steeper_down", label: "It falls more steeply than it rose" },
      { value: "steeper_up", label: "It rises more steeply than it falls" },
    ],
    resolve: (trace) => {
      // Measured, not inferred from the toggle: launching from a height makes
      // the descent steeper even in a vacuum, so reading this off the air
      // resistance flag would be wrong for half the parameter space.
      const diff = trace.outcome.impact_angle_deg - trace.outcome.launch_angle_deg;
      if (diff > 0.5) return "steeper_down";
      if (diff < -0.5) return "steeper_up";
      return "symmetric";
    },
  },
];

const CONTROLS: ParamControl[] = [
  { key: "speed_m_s", label: "launch speed", unit: "m/s", min: 1, max: 100, step: 1 },
  { key: "angle_deg", label: "launch angle", unit: "°", min: -80, max: 89, step: 1 },
  { key: "launch_height_m", label: "launch height", unit: "m", min: 0, max: 100, step: 1 },
  { key: "mass_kg", label: "mass", unit: "kg", min: 0.01, max: 10, step: 0.01 },
  { key: "area_m2", label: "frontal area", unit: "m²", min: 0.001, max: 0.2, step: 0.001 },
  { key: "gravity_m_s2", label: "gravity", unit: "m/s²", min: 0.5, max: 25, step: 0.01 },
];

function accelFactory(p: ProjectileParams, drag: boolean) {
  const g = p.gravity_m_s2;
  if (!drag) {
    return (): Vec2 => ({ x: 0, y: -g });
  }
  // F_drag = -½·ρ·Cd·A·|v|·v  =>  a_drag = -k·|v|·v,  k = ½ρCdA/m
  const k = (0.5 * AIR_DENSITY_KG_M3 * p.drag_coefficient * p.area_m2) / p.mass_kg;
  return (_pos: Vec2, vel: Vec2): Vec2 => {
    const speed = Math.hypot(vel.x, vel.y);
    return { x: -k * speed * vel.x, y: -g - k * speed * vel.y };
  };
}

function niceBound(v: number): number {
  if (v <= 0) return 0;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / (mag / 2)) * (mag / 2);
}

export const projectile: Simulator<ProjectileParams> = {
  id: "projectile",
  title: "Projectile launch",
  question: "Where does a thrown object land, and is its path symmetric?",
  validity: VALIDITY,
  idealizations: IDEALIZATIONS,
  predictions: PREDICTIONS,
  controls: CONTROLS,

  closedForm(p, ideal) {
    if (ideal.air_resistance) return null; // no elementary closed form with quadratic drag
    const g = p.gravity_m_s2;
    const theta = (p.angle_deg * Math.PI) / 180;
    const vx = p.speed_m_s * Math.cos(theta);
    const vy0 = p.speed_m_s * Math.sin(theta);
    const h = p.launch_height_m;
    const flight = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h)) / g;
    const impactSpeed = Math.sqrt(p.speed_m_s * p.speed_m_s + 2 * g * h);
    const vyImpact = -Math.sqrt(vy0 * vy0 + 2 * g * h);
    return {
      range_m: vx * flight,
      flight_time_s: flight,
      // Launched downward, the projectile never rises: the apex IS the
      // launch height. h + vy0^2/2g is only valid for vy0 >= 0.
      apex_m: vy0 > 0 ? h + (vy0 * vy0) / (2 * g) : h,
      impact_speed_m_s: impactSpeed,
      impact_angle_deg: (Math.atan2(-vyImpact, vx) * 180) / Math.PI,
    };
  },

  run(p, ideal, opts: RunOptions = {}): Trace {
    const dt = opts.dt ?? DEFAULT_DT;
    const maxSteps = opts.maxSteps ?? DEFAULT_MAX_STEPS;
    const drag = ideal.air_resistance === true;
    const accel = accelFactory(p, drag);

    const theta = (p.angle_deg * Math.PI) / 180;
    const pos0: Vec2 = { x: 0, y: p.launch_height_m };
    const vel0: Vec2 = {
      x: p.speed_m_s * Math.cos(theta),
      y: p.speed_m_s * Math.sin(theta),
    };

    let s = initVerlet(pos0, vel0, accel);
    let t = 0;

    const frames: Frame[] = [];
    const energy: number[] = [];

    const energyOf = (pos: Vec2, vel: Vec2) =>
      0.5 * p.mass_kg * (vel.x * vel.x + vel.y * vel.y) + p.mass_kg * p.gravity_m_s2 * pos.y;

    const push = (time: number, pos: Vec2, vel: Vec2) => {
      const e = energyOf(pos, vel);
      frames.push({
        t: time,
        bodies: [{ id: "projectile", pos: { ...pos }, vel: { ...vel } }],
        scalars: {
          speed_m_s: Math.hypot(vel.x, vel.y),
          height_m: pos.y,
          energy_j: e,
        },
      });
      energy.push(e);
    };

    push(t, s.pos, s.vel);

    let apex = pos0.y;
    let steps = 0;
    let landed = false;

    while (steps < maxSteps) {
      const prev = s;
      const prevT = t;
      s = verletStep(s, dt, accel, t);
      t += dt;
      steps++;

      if (s.pos.y > apex) apex = s.pos.y;

      // Ground crossing: y goes from >= 0 to < 0. Linear interpolation, not
      // bisection — see integrate.ts crossingFraction.
      if (prev.pos.y >= 0 && s.pos.y < 0) {
        // Land with one short Verlet sub-step of exactly the crossing
        // duration, rather than interpolating between the frames either side.
        //
        // Lerping is what this did first, and it put a 5.9e-8 relative energy
        // spike on the final frame -- six orders of magnitude above the
        // integrator's own 2.4e-14. Harmless numerically, but it drew a step
        // at the end of an otherwise flat invariant plot, which reads as a
        // defect in exactly the chart whose job is to show there isn't one.
        //
        // A single Newton refinement, not a bisection loop: PLAN §4 cuts
        // iterative event detection as the thing a longer build dies on.
        let f = crossingFraction(prev.pos.y, s.pos.y);
        let landing = verletStep(prev, dt * f, accel, prevT);
        const denom = prev.pos.y - landing.pos.y;
        if (denom !== 0) {
          const refined = Math.max(0, Math.min(1, f * (prev.pos.y / denom)));
          if (Number.isFinite(refined) && refined > 0) {
            f = refined;
            landing = verletStep(prev, dt * f, accel, prevT);
          }
        }
        const pos = { x: landing.pos.x, y: 0 };
        push(prevT + dt * f, pos, landing.vel);
        s = { pos, vel: landing.vel, acc: landing.acc };
        t = prevT + dt * f;
        landed = true;
        break;
      }

      push(t, s.pos, s.vel);
    }

    const last = frames[frames.length - 1];
    const lastPos = last.bodies[0].pos;
    const lastVel = last.bodies[0].vel;

    const maxX = Math.max(...frames.map((fr) => fr.bodies[0].pos.x));
    const domainX = niceBound(maxX * 1.08) || 1;
    const domainY = niceBound(Math.max(apex, p.launch_height_m) * 1.15) || 1;

    const resolved: ResolvedIdealization[] = IDEALIZATIONS.map((d) => ({
      ...d,
      on: ideal[d.key] === true,
    }));

    return {
      simId: "projectile",
      dt,
      frames,
      domain: { x: [0, domainX], y: [0, domainY] },
      view: {
        xLabel: "horizontal distance (m)",
        yLabel: "height (m)",
        xAxis: true,
        ground: 0,
        links: [],
        segments: [],
        trail: true,
      },
      invariants: [
        {
          key: "energy_j",
          label: "Total mechanical energy",
          unit: "J",
          // Drag is dissipative, so energy legitimately falls. The law we
          // assert changes with the idealization; it is never switched off.
          law: drag ? "non_increasing" : "conserved",
          values: energy,
          // Worst measured drift across the launch envelope is 1.5e-10, so
          // this band is ~60x headroom. Tight enough that a real regression
          // in the integrator or the landing step trips it.
          tolerance: 1e-8,
          active: true,
        },
      ],
      outcome: {
        range_m: lastPos.x,
        flight_time_s: last.t,
        apex_m: apex,
        impact_speed_m_s: Math.hypot(lastVel.x, lastVel.y),
        impact_angle_deg: (Math.atan2(-lastVel.y, lastVel.x) * 180) / Math.PI,
        launch_angle_deg: p.angle_deg,
        landed: landed ? 1 : 0,
      },
      idealizations: resolved,
    };
  },
};
