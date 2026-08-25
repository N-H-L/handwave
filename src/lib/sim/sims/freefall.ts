/**
 * Two objects dropped from rest at the same instant.
 *
 * This is the sim the adversarial review used to break the earlier design, so
 * it is built to the correction rather than around it. "Heavier objects fall
 * faster" is a MISCONCEPTION IN VACUUM AND A FACT IN AIR: a shot put really
 * does beat a baseball from 20 m, by about a twentieth of a second. A sim that
 * quietly runs in vacuum and then tells the student their belief is wrong is
 * teaching a falsehood about the world they live in.
 *
 * So air resistance defaults to ON here — the student's world has air — and
 * the idealisation is named on screen either way.
 *
 * Unusually, the drag case has an exact closed form too. One-dimensional
 * quadratic drag from rest integrates to
 *
 *     v(t) = v_t · tanh(g·t / v_t)
 *     y(t) = h − (v_t²/g) · ln cosh(g·t / v_t)
 *
 * with terminal velocity v_t = √(2mg / ρ·C_d·A), so the tests assert the
 * integrator against analysis in BOTH idealisations rather than only the easy
 * one.
 */

import { DEFAULT_DT, DEFAULT_MAX_STEPS, initVerlet1D, verletStep1D } from "../integrate";
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

export type FreeFallParams = {
  drop_height_m: number;
  mass_a_kg: number;
  area_a_m2: number;
  mass_b_kg: number;
  area_b_m2: number;
  drag_coefficient: number;
  gravity_m_s2: number;
};

/** A shot put and a baseball, the classic pairing. */
export const FREEFALL_DEFAULTS: FreeFallParams = {
  drop_height_m: 20,
  mass_a_kg: 7.26,
  area_a_m2: 0.0113,
  mass_b_kg: 0.145,
  area_b_m2: 0.00426,
  drag_coefficient: 0.47, // sphere
  gravity_m_s2: 9.81,
};

const AIR_DENSITY_KG_M3 = 1.225;

const IDEALIZATIONS: IdealizationDef[] = [
  {
    key: "air_resistance",
    label: "Air resistance",
    whenOn:
      "Both objects feel quadratic drag. The denser one wins, because it carries more weight per unit of frontal area — which is exactly why heavier things really do fall faster in the world you live in.",
    whenOff:
      "A vacuum. Both objects land at the same instant regardless of mass. This is the case Galileo's argument and every textbook formula describe, and it is NOT the case outside a vacuum chamber.",
    default: true,
  },
];

const VALIDITY: ValidityRange = {
  summary:
    "Two spheres, dropped from rest, falling straight down through still air at a constant drag coefficient.",
  breaksDownWhen: [
    "The object is not roughly spherical or tumbles — the drag coefficient stops being a constant.",
    "The object is light and broad enough to flutter rather than fall: a feather, a sheet of paper, a leaf. Nothing here models that.",
    "Buoyancy matters — a balloon or anything near the density of air. Only drag is modelled, not the displaced air's weight.",
    "The drop is long enough for air density to change appreciably with altitude.",
  ],
};

const PREDICTIONS: PredictionTarget[] = [
  {
    key: "which_first",
    kind: "choice",
    prompt: "Which one hits the ground first?",
    options: [
      { value: "heavier", label: "The heavier one" },
      { value: "lighter", label: "The lighter one" },
      { value: "same", label: "They land at the same instant" },
    ],
  },
  {
    key: "gap_ms",
    kind: "numeric",
    prompt: "If there is a gap between them, how big is it?",
    unit: "ms",
    range: [0, 500],
  },
];

const CONTROLS: ParamControl[] = [
  { key: "drop_height_m", label: "drop height", unit: "m", min: 1, max: 200, step: 1 },
  { key: "mass_a_kg", label: "mass (heavy)", unit: "kg", min: 0.01, max: 20, step: 0.01 },
  { key: "area_a_m2", label: "frontal area (heavy)", unit: "m²", min: 0.001, max: 0.5, step: 0.0001 },
  { key: "mass_b_kg", label: "mass (light)", unit: "kg", min: 0.01, max: 20, step: 0.01 },
  { key: "area_b_m2", label: "frontal area (light)", unit: "m²", min: 0.001, max: 0.5, step: 0.0001 },
  { key: "gravity_m_s2", label: "gravity", unit: "m/s²", min: 0.5, max: 25, step: 0.01 },
];

/** Terminal velocity for quadratic drag. Infinite in vacuum. */
export function terminalVelocity(
  mass: number,
  area: number,
  cd: number,
  g: number,
  drag: boolean,
): number {
  if (!drag) return Infinity;
  return Math.sqrt((2 * mass * g) / (AIR_DENSITY_KG_M3 * cd * area));
}

/**
 * Exact fall time through quadratic drag, from rest.
 *
 * Inverting y(t) gives t = (v_t/g)·arccosh(e^z) with z = h·g/v_t². Written as
 * z + ln(1 + √(1 − e^(−2z))) rather than through arccosh(exp(z)) directly,
 * because exp(z) overflows for a long drop and the rearranged form does not.
 */
export function fallTimeWithDrag(h: number, vt: number, g: number): number {
  const z = (h * g) / (vt * vt);
  return (vt / g) * (z + Math.log(1 + Math.sqrt(1 - Math.exp(-2 * z))));
}

export const freefall: Simulator<FreeFallParams> = {
  id: "freefall",
  title: "Two objects dropped together",
  question: "Do a heavy object and a light one hit the ground at the same time?",
  validity: VALIDITY,
  idealizations: IDEALIZATIONS,
  predictions: PREDICTIONS,
  controls: CONTROLS,

  closedForm(p, ideal) {
    const g = p.gravity_m_s2;
    const h = p.drop_height_m;

    if (!ideal.air_resistance) {
      const t = Math.sqrt((2 * h) / g);
      const v = Math.sqrt(2 * g * h);
      return {
        t_heavy_s: t,
        t_light_s: t,
        gap_ms: 0,
        v_heavy_m_s: v,
        v_light_m_s: v,
        // Reported as Infinity, not omitted: in vacuum there is no terminal
        // velocity, and a missing key would read as "not computed".
        terminal_heavy_m_s: Infinity,
        terminal_light_m_s: Infinity,
      };
    }

    const vtA = terminalVelocity(p.mass_a_kg, p.area_a_m2, p.drag_coefficient, g, true);
    const vtB = terminalVelocity(p.mass_b_kg, p.area_b_m2, p.drag_coefficient, g, true);
    const tA = fallTimeWithDrag(h, vtA, g);
    const tB = fallTimeWithDrag(h, vtB, g);
    return {
      t_heavy_s: tA,
      t_light_s: tB,
      gap_ms: (tB - tA) * 1000,
      v_heavy_m_s: vtA * Math.tanh((g * tA) / vtA),
      v_light_m_s: vtB * Math.tanh((g * tB) / vtB),
      terminal_heavy_m_s: vtA,
      terminal_light_m_s: vtB,
    };
  },

  run(p, ideal, opts: RunOptions = {}): Trace {
    const dt = opts.dt ?? DEFAULT_DT;
    const maxSteps = opts.maxSteps ?? DEFAULT_MAX_STEPS;
    const drag = ideal.air_resistance === true;
    const g = p.gravity_m_s2;
    const h = p.drop_height_m;

    // k = ½ρC_dA/m. Zero in vacuum, which is the whole point: mass then
    // cancels out of the equation of motion entirely.
    const kOf = (mass: number, area: number) =>
      drag ? (0.5 * AIR_DENSITY_KG_M3 * p.drag_coefficient * area) / mass : 0;

    const bodies = [
      { id: "heavy", k: kOf(p.mass_a_kg, p.area_a_m2), mass: p.mass_a_kg, x: -h * 0.14 },
      { id: "light", k: kOf(p.mass_b_kg, p.area_b_m2), mass: p.mass_b_kg, x: h * 0.14 },
    ];

    // Falling, so velocity is negative and drag points up: a = -g + k·v².
    const accels = bodies.map((b) => (_x: number, v: number) => -g + b.k * v * v);
    let states = bodies.map((b, i) => initVerlet1D(h, 0, accels[i]));

    const landedAt: (number | null)[] = [null, null];
    const frames: Frame[] = [];
    const energy: number[] = [];

    const record = (t: number, ys: number[], vs: number[]) => {
      let e = 0;
      for (let i = 0; i < bodies.length; i++) {
        e += 0.5 * bodies[i].mass * vs[i] * vs[i] + bodies[i].mass * g * ys[i];
      }
      frames.push({
        t,
        bodies: bodies.map((b, i) => ({
          id: b.id,
          pos: { x: b.x, y: ys[i] },
          vel: { x: 0, y: vs[i] },
        })),
        scalars: {
          height_heavy_m: ys[0],
          height_light_m: ys[1],
          speed_heavy_m_s: Math.abs(vs[0]),
          speed_light_m_s: Math.abs(vs[1]),
          energy_j: e,
        },
      });
      energy.push(e);
    };

    record(0, [h, h], [0, 0]);

    let t = 0;
    let steps = 0;

    while (steps < maxSteps && landedAt.some((v) => v === null)) {
      const prev = states.map((s) => ({ ...s }));
      const prevT = t;

      states = states.map((s, i) => (landedAt[i] === null ? verletStep1D(s, dt, accels[i], t) : s));
      t += dt;
      steps++;

      // Land each body on its own sub-step, so neither one's recorded time is
      // quantised to the frame rate. The gap between them is the measurement
      // the student is being asked to predict; rounding it to 1/240 s would
      // put the answer inside the noise.
      for (let i = 0; i < states.length; i++) {
        if (landedAt[i] !== null) continue;
        if (prev[i].x >= 0 && states[i].x < 0) {
          let f = prev[i].x / (prev[i].x - states[i].x);
          let landing = verletStep1D(prev[i], dt * f, accels[i], prevT);
          const denom = prev[i].x - landing.x;
          if (denom !== 0) {
            const refined = Math.max(0, Math.min(1, f * (prev[i].x / denom)));
            if (Number.isFinite(refined) && refined > 0) {
              f = refined;
              landing = verletStep1D(prev[i], dt * f, accels[i], prevT);
            }
          }
          landedAt[i] = prevT + dt * f;
          states[i] = { x: 0, v: landing.v, a: landing.a };
        }
      }

      record(
        t,
        states.map((s, i) => (landedAt[i] !== null ? 0 : s.x)),
        states.map((s) => s.v),
      );
    }

    const tHeavy = landedAt[0] ?? t;
    const tLight = landedAt[1] ?? t;
    const finalV = frames[frames.length - 1].bodies.map((b) => Math.abs(b.vel.y));

    const resolved: ResolvedIdealization[] = IDEALIZATIONS.map((d) => ({
      ...d,
      on: ideal[d.key] === true,
    }));

    return {
      simId: "freefall",
      dt,
      frames,
      domain: { x: [-h * 0.35, h * 0.35], y: [0, h * 1.08] },
      view: {
        xLabel: "",
        yLabel: "height (m)",
        xAxis: false,
        ground: 0,
        links: [],
        trail: true,
      },
      invariants: [
        {
          key: "energy_j",
          label: "Total mechanical energy",
          law: drag ? "non_increasing" : "conserved",
          values: energy,
          tolerance: 1e-8,
          // A landed body is parked at y=0 carrying its impact speed, so its
          // energy stays on the books at exactly the mgh it started with. The
          // sum therefore remains a valid total after touchdown rather than
          // dropping a term, and the invariant holds across the whole trace.
          active: true,
        },
      ],
      outcome: {
        t_heavy_s: tHeavy,
        t_light_s: tLight,
        gap_ms: (tLight - tHeavy) * 1000,
        v_heavy_m_s: finalV[0],
        v_light_m_s: finalV[1],
        terminal_heavy_m_s: terminalVelocity(
          p.mass_a_kg,
          p.area_a_m2,
          p.drag_coefficient,
          g,
          drag,
        ),
        terminal_light_m_s: terminalVelocity(
          p.mass_b_kg,
          p.area_b_m2,
          p.drag_coefficient,
          g,
          drag,
        ),
      },
      idealizations: resolved,
    };
  },
};
