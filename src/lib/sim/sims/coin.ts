/**
 * Konold's two-part coin item.
 *
 * This is sim #1 in the plan, and the reason is that it demolishes the thing
 * the whole product is built to catch, in about thirty seconds.
 *
 * Konold, Pollatsek, Well, Lohmeier & Lipson (1993) put four five-flip
 * sequences in front of students and asked which was MOST likely. About 70%
 * correctly said they were all equally likely. Then the same students were
 * asked which was LEAST likely — and over half of the ones who had just
 * answered correctly changed their answer.
 *
 * The multiple-choice answer was right and the belief underneath it was
 * wrong, and NOTHING BUT ASKING TWICE REVEALS IT. That is the entire product
 * thesis: a single correct answer is not evidence of understanding, and a
 * tutor that grades the first question and moves on has learned nothing.
 *
 * The resolution is the second histogram. Every specific five-flip sequence
 * has probability 1/32. The NUMBER of heads does not: three heads happens ten
 * times as often as five heads, because ten different sequences produce it.
 * Students who feel that THTHT is "more random" than HHHHH are tracking a real
 * fact about counts and misapplying it to sequences.
 */

import { makeRng } from "@/lib/rng";
import type {
  Frame,
  Histogram,
  IdealizationDef,
  ParamControl,
  PredictionTarget,
  ResolvedIdealization,
  Simulator,
  Trace,
  ValidityRange,
} from "../types";

export type CoinParams = {
  trials: number;
  p_heads: number;
  seed: number;
};

export const COIN_DEFAULTS: CoinParams = {
  trials: 1000,
  p_heads: 0.5,
  seed: 1,
};

/** The four sequences from the published item, in its order. */
export const KONOLD_SEQUENCES = ["HHHTT", "THHTH", "THTTT", "HTHTH"] as const;

const FLIPS = 5;

const IDEALIZATIONS: IdealizationDef[] = [
  {
    key: "fair_coin",
    label: "Perfectly fair coin",
    whenOn:
      "Heads and tails are exactly equally likely, and every flip is independent of the ones before it. A tossed coin is very close to this; a SPUN coin is not, and can land one way 60% of the time.",
    whenOff:
      "The coin is biased, at the probability set below. The four sequences are then no longer equally likely — and which one wins tells you which way it is weighted.",
    default: true,
  },
];

const VALIDITY: ValidityRange = {
  summary:
    "Independent flips of a two-sided coin with a fixed probability, counted over many repetitions.",
  breaksDownWhen: [
    "Flips are not independent — a coin caught and re-tossed the same way, or a shuffled deck, carries information from one trial to the next.",
    "You read a single run as evidence. Any particular set of a thousand trials wanders; the claim is about what happens as the count grows, not about this run.",
    "The coin can land on its edge, which for a real coin happens roughly once in six thousand tosses.",
  ],
};

const PREDICTIONS: PredictionTarget[] = [
  {
    key: "most_likely",
    kind: "choice",
    prompt: "Flip a fair coin five times. Which of these is MOST likely to come out?",
    options: [
      { value: "HHHTT", label: "H H H T T" },
      { value: "THHTH", label: "T H H T H" },
      { value: "THTTT", label: "T H T T T" },
      { value: "HTHTH", label: "H T H T H" },
      { value: "equal", label: "All four are equally likely" },
    ],
    resolve: () => "equal",
  },
  {
    key: "least_likely",
    kind: "choice",
    prompt: "Now: which of those same four is LEAST likely?",
    options: [
      { value: "HHHTT", label: "H H H T T" },
      { value: "THHTH", label: "T H H T H" },
      { value: "THTTT", label: "T H T T T" },
      { value: "HTHTH", label: "H T H T H" },
      { value: "equal", label: "All four are equally likely" },
    ],
    resolve: () => "equal",
  },
  {
    key: "exactly_3_heads_count",
    kind: "numeric",
    prompt: "Out of a thousand sets of five flips, how many will contain exactly three heads?",
    unit: "sets",
    range: [0, 1000],
  },
];

const CONTROLS: ParamControl[] = [
  { key: "trials", label: "sets of five flips", unit: "", min: 100, max: 20000, step: 100 },
  { key: "p_heads", label: "P(heads)", unit: "", min: 0.05, max: 0.95, step: 0.01 },
  { key: "seed", label: "seed", unit: "", min: 1, max: 999, step: 1 },
];

/** n choose k, exactly, for the small n this sim uses. */
export function binomialCoefficient(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let result = 1;
  for (let i = 0; i < k; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

export const coin: Simulator<CoinParams> = {
  id: "coin",
  title: "Five coin flips",
  question: "Is one particular run of heads and tails more likely than another?",
  validity: VALIDITY,
  idealizations: IDEALIZATIONS,
  predictions: PREDICTIONS,
  controls: CONTROLS,

  closedForm(p, ideal) {
    const q = ideal.fair_coin ? 0.5 : p.p_heads;
    // Each named sequence has probability q^heads * (1-q)^tails, which is the
    // same 1/32 for all four ONLY when the coin is fair. That is the whole
    // dependency the toggle exposes.
    const seqProb = (seq: string) => {
      let prob = 1;
      for (const c of seq) prob *= c === "H" ? q : 1 - q;
      return prob;
    };
    const three = binomialCoefficient(FLIPS, 3) * Math.pow(q, 3) * Math.pow(1 - q, 2);
    const out: Record<string, number> = {
      exactly_3_heads_count: three * p.trials,
      exactly_5_heads_count:
        binomialCoefficient(FLIPS, 5) * Math.pow(q, 5) * p.trials,
      sequence_probability_pct: seqProb(KONOLD_SEQUENCES[0]) * 100,
    };
    for (const seq of KONOLD_SEQUENCES) {
      out["count_" + seq] = seqProb(seq) * p.trials;
    }
    return out;
  },

  // No RunOptions: these sims have no timestep to vary. Their resolution is
  // the trial count, which is a parameter the student can see and change.
  run(p, ideal): Trace {
    const fair = ideal.fair_coin !== false;
    const q = fair ? 0.5 : p.p_heads;
    const trials = Math.max(1, Math.floor(p.trials));
    const rng = makeRng("konold-coin/" + p.seed + "/" + q + "/" + trials);

    // Uint32Array, not a plain object: the counting loop is the hot path at
    // twenty thousand trials and this keeps it in one flat allocation.
    const sequenceCounts = new Uint32Array(KONOLD_SEQUENCES.length);
    const headsCounts = new Uint32Array(FLIPS + 1);

    const FRAMES = 60;
    const batch = Math.max(1, Math.ceil(trials / FRAMES));
    const frames: Frame[] = [];

    const snapshot = (t: number, done: number): void => {
      const seqHist: Histogram = {
        label: "How often each of the four sequences came up",
        binLabels: KONOLD_SEQUENCES.map((s) => s.split("").join(" ")),
        counts: Array.from(sequenceCounts),
        // Every specific five-flip sequence has the same probability under a
        // fair coin. This reference line is the answer to question one.
        expected: KONOLD_SEQUENCES.map((seq) => {
          let prob = 1;
          for (const c of seq) prob *= c === "H" ? q : 1 - q;
          return prob * done;
        }),
      };
      const headsHist: Histogram = {
        label: "How many heads each set of five produced",
        binLabels: Array.from({ length: FLIPS + 1 }, (_, k) => String(k)),
        counts: Array.from(headsCounts),
        expected: Array.from(
          { length: FLIPS + 1 },
          (_, k) =>
            binomialCoefficient(FLIPS, k) *
            Math.pow(q, k) *
            Math.pow(1 - q, FLIPS - k) *
            done,
        ),
        emphasis: [3],
      };
      frames.push({
        t,
        bodies: [],
        scalars: {
          trials_done: done,
          exactly_3_heads_count: headsCounts[3],
          exactly_5_heads_count: headsCounts[5],
        },
        histograms: [seqHist, headsHist],
      });
    };

    snapshot(0, 0);

    let done = 0;
    while (done < trials) {
      const upto = Math.min(done + batch, trials);
      for (; done < upto; done++) {
        let seq = "";
        let heads = 0;
        for (let f = 0; f < FLIPS; f++) {
          const isHead = rng.bool(q);
          if (isHead) heads++;
          seq += isHead ? "H" : "T";
        }
        headsCounts[heads]++;
        const idx = KONOLD_SEQUENCES.indexOf(seq as (typeof KONOLD_SEQUENCES)[number]);
        if (idx >= 0) sequenceCounts[idx]++;
      }
      snapshot(done / trials, done);
    }

    const resolved: ResolvedIdealization[] = IDEALIZATIONS.map((d) => ({
      ...d,
      on: ideal[d.key] !== false,
    }));

    const outcome: Record<string, number> = {
      exactly_3_heads_count: headsCounts[3],
      exactly_5_heads_count: headsCounts[5],
      trials_run: trials,
    };
    KONOLD_SEQUENCES.forEach((seq, i) => {
      outcome["count_" + seq] = sequenceCounts[i];
    });
    // The spread between the four named sequences, which is the number that
    // answers both questions at once: it is small, and it is noise.
    const counts = Array.from(sequenceCounts);
    outcome.sequence_spread = Math.max(...counts) - Math.min(...counts);

    return {
      simId: "coin",
      dt: 1 / FRAMES,
      frames,
      domain: { x: [0, 1], y: [0, 1] },
      view: {
        kind: "histogram",
        xLabel: "",
        yLabel: "times seen",
        xAxis: false,
        ground: null,
        links: [],
        segments: [],
        trail: false,
      },
      invariants: [],
      outcome,
      idealizations: resolved,
    };
  },
};
