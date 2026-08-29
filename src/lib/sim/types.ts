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
  /**
   * Counted outcomes so far, for kind "histogram". Plural because the point of
   * Konold's coin item is the CONTRAST between two distributions computed from
   * the same trials: specific five-flip sequences are equally likely, and the
   * number of heads is not.
   */
  histograms?: Histogram[];
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
/**
 * A counted distribution at one instant of a run.
 *
 * PLAN §3 rule 8: probability sims show the DISTRIBUTION, not the trajectory.
 * A single run of a random process teaches nothing and actively misleads — a
 * gambler's-fallacy student who predicts "tails is due" and then sees tails
 * has been rewarded by the simulation for a false belief. Only the shape over
 * many trials can be argued with.
 */
export type Histogram = {
  label: string;
  binLabels: string[];
  counts: number[];
  /** Theoretical expectation per bin, drawn as a reference line. */
  expected?: number[];
  /** Bars to draw in the highlight colour — the ones under discussion. */
  emphasis?: number[];
};

/** A named scalar tracked across a run, for the convergence plots. */
export type SeriesSpec = {
  key: string;
  label: string;
  unit: string;
  /** Horizontal reference line: the value being converged to, where there is one. */
  reference?: number;
  referenceLabel?: string;
  /** Force the y-domain rather than fitting it to the data. */
  domain?: [number, number];
  /**
   * A second scalar drawn in the same axes for comparison — how the count
   * difference between heads and tails tracks the square root of the number of
   * flips, for instance. One line is a measurement; two make an argument.
   */
  companion?: { key: string; label: string };
};

export type View = {
  /**
   * How to read this trace.
   *  world     — bodies in space; the mechanics sims.
   *  histogram — counted outcomes over many trials.
   *  series    — named scalars against trial number.
   */
  kind: "world" | "histogram" | "series";
  /** Only for kind "series". */
  series?: SeriesSpec[];
  /** Scalar to use as the x axis for kind "series". Defaults to trials_done. */
  seriesX?: { key: string; label: string };
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

/**
 * What the student must commit to before the Run button unlocks.
 *
 * PLAN §3 rule 3 and the one finding that survived every attack: Crouch,
 * Fagen, Callan & Mazur (2004) — passive observers of a demonstration learn
 * nothing over students who never saw it, while students who committed a
 * prediction first "display significantly greater understanding". The gate is
 * not a feature wrapped around the simulation. It is the reason the
 * simulation is worth showing.
 */
export type PredictionTarget =
  | {
      key: string;
      kind: "numeric";
      prompt: string;
      unit: string;
      /**
       * Entry bounds. Deliberately NOT centred on the correct answer — a
       * slider whose midpoint is the truth is a multiple-choice question with
       * the answer pre-selected.
       */
      range: [number, number];
      /**
       * Draw the committed value on the simulation canvas against this axis,
       * where the quantity is a position. Only some predictions are spatial;
       * the side-by-side comparison is what carries the rest.
       */
      ghostAxis?: "x" | "y";
    }
  | {
      key: string;
      kind: "choice";
      prompt: string;
      options: { value: string; label: string }[];
      /**
       * Which option the run actually bore out. Takes the whole trace, not
       * just the outcome, because some of these turn on which idealisations
       * were in force — a pendulum's period depends on amplitude unless the
       * small-angle approximation is switched on, and then it provably does not.
       */
      resolve: (trace: Trace) => string;
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
