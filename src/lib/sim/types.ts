/**
 * Core contracts for the deterministic simulation layer.
 *
 * Nothing in this file is ever produced by a model. The LLM selects a
 * `sim_id` and fills typed parameters; every function below is hand-written
 * and unit-tested against a closed-form solution. See docs/PLAN.md §2.
 */

export type Vec2 = { x: number; y: number };

/** One body's state at one instant. */
export type BodyState = {
  id: string;
  pos: Vec2;
  vel: Vec2;
};

/** One sampled instant of a run. */
export type Frame = {
  t: number;
  bodies: BodyState[];
  /** Named scalars a sim wants plotted or read out (energy, speed, ...). */
  scalars: Record<string, number>;
};

/**
 * Axis domains computed once, at validation time, and then held for the whole
 * run. PLAN §3 rule 6 — Heer & Robertson: rescaling axes mid-animation makes
 * change estimation harder, which is the one thing we are asking the student
 * to do.
 */
export type Domain = {
  x: [number, number];
  y: [number, number];
};

/**
 * A conserved (or monotone) quantity asserted every run. Day 2 plots these;
 * CI asserts their drift stays under `tolerance`.
 */
export type InvariantSeries = {
  key: string;
  label: string;
  /** Physical unit, for the axis. Declared here so the UI never guesses it. */
  unit: string;
  /** 'conserved' -> |max-min|/|mean| <= tolerance. 'non_increasing' -> monotone. */
  law: "conserved" | "non_increasing";
  values: number[];
  tolerance: number;
  /**
   * Characteristic magnitude to measure drift against, when the conserved
   * quantity's own mean is a bad yardstick. Total momentum in a head-on
   * collision is near zero by construction, so dividing by it would turn a
   * perfect run into a division by almost nothing.
   */
  scale?: number;
  /** Set false by the run itself when an idealization legitimately breaks it. */
  active: boolean;
};

/**
 * What the renderer needs in order to draw this trace without knowing which
 * simulator produced it.
 *
 * A projectile wants a ground line and a trail; a pendulum wants a rod back to
 * its pivot and no trail at all, because an oscillator that leaves a trail just
 * paints over its own arc. Rather than branch on `simId` in the renderer — which
 * would put physics knowledge in the drawing layer and guarantee it rots — each
 * simulator declares how it should be read.
 */
export type View = {
  xLabel: string;
  yLabel: string;
  /**
   * Draw the x grid and tick labels. False for a straight vertical drop, where
   * the horizontal placement is only there to stop the two objects overlapping
   * and labelling it in metres would be inventing a measurement.
   */
  xAxis: boolean;
  /** World y at which to draw a ground line, or null for none. */
  ground: number | null;
  /** Rigid connections drawn every frame: a pendulum rod, a spring. */
  links: { from: Vec2; toBody: number }[];
  /** Static world geometry: the surface of an inclined plane, a wall. */
  segments: { from: Vec2; to: Vec2 }[];
  /** Leave the path behind the body. Wrong for anything that retraces itself. */
  trail: boolean;
};

/**
 * A parameter the student (or LLM #1) can set, declared once so the UI
 * controls and the schema bounds cannot drift apart.
 */
export type ParamControl = {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
};

/** The result of one deterministic run. Everything downstream reads only this. */
export type Trace = {
  simId: string;
  dt: number;
  frames: Frame[];
  invariants: InvariantSeries[];
  domain: Domain;
  view: View;
  /**
   * Named semantic outcomes — never re-derived by the renderer or the
   * explainer. LLM #2 is grounded in exactly these numbers (PLAN §2).
   */
  outcome: Record<string, number>;
  /** Which idealizations were in force, verbatim, for the explainer. */
  idealizations: ResolvedIdealization[];
};

/**
 * PLAN §3 rule 1 & 2: an idealization is a claim about the world, so it is
 * surfaced in the UI and handed to the explainer. A vacuum free-fall sim that
 * silently diagnoses "heavier things fall faster" is teaching a falsehood —
 * in air, a shot put really does beat a baseball.
 */
export type IdealizationDef = {
  key: string;
  label: string;
  /** What is true when the toggle is ON. */
  whenOn: string;
  /** What is true when the toggle is OFF, and who it misleads. */
  whenOff: string;
  default: boolean;
};

export type ResolvedIdealization = IdealizationDef & { on: boolean };

/**
 * PLAN §3 rule 2: the band of conditions inside which this sim's answers are
 * physically honest. Outside it, the sim must refuse rather than mislead.
 */
export type ValidityRange = {
  summary: string;
  /** Human-readable conditions under which this model stops being true. */
  breaksDownWhen: string[];
};

/** What the student must commit to before the Run button unlocks (day 5). */
export type PredictionTarget =
  | {
      key: string;
      kind: "numeric";
      prompt: string;
      unit: string;
      /** Slider/entry bounds. Never centred on the correct answer. */
      range: [number, number];
    }
  | {
      key: string;
      kind: "choice";
      prompt: string;
      options: { value: string; label: string }[];
    };

export type RunOptions = {
  /** Fixed timestep, seconds. */
  dt?: number;
  /** Hard cap so a bad parameter set cannot hang the tab. */
  maxSteps?: number;
};

/**
 * A simulator is a pure function of (params, idealizations) -> Trace.
 * Deterministic: same input, same bytes out. No Date.now(), no Math.random().
 */
export interface Simulator<P> {
  id: string;
  title: string;
  /** One sentence, student-facing. */
  question: string;
  validity: ValidityRange;
  idealizations: IdealizationDef[];
  predictions: PredictionTarget[];
  controls: ParamControl[];
  run(params: P, idealizations: Record<string, boolean>, opts?: RunOptions): Trace;
  /**
   * Closed-form answer for the idealized case. Exists so `npm test` can assert
   * the integrator against analysis rather than against itself.
   * Returns null when no closed form exists for these idealizations.
   */
  closedForm(params: P, idealizations: Record<string, boolean>): Record<string, number> | null;
}
