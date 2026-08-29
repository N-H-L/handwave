/**
 * The law of large numbers, with a streak inspector.
 *
 * Two beliefs get tested here, and the interesting thing is that they pull in
 * opposite directions and BOTH feel like "things even out".
 *
 *  1. The gambler's fallacy. After a run of heads, tails is "due". This sim
 *     does not argue with that — it MEASURES it. Every time the run contains
 *     k heads in a row, it records what came next, and reports the fraction.
 *     With ten thousand flips and k = 4 there are several hundred such
 *     occasions, which is enough to see that the answer is one half and stays
 *     one half. A student's own run refutes their own rule.
 *
 *  2. The one almost nobody has: the PROPORTION of heads converges to a half,
 *     while the COUNT DIFFERENCE between heads and tails grows without bound.
 *     Both are true at once. |H − T| drifts like √n; |H/n − ½| shrinks like
 *     1/√n. "Things even out" is right about the ratio and exactly backwards
 *     about the gap, and almost every intuitive account of the law of large
 *     numbers quietly assumes the second.
 *
 * PLAN §3 rule 8 is why this is a distribution and not a trajectory: a single
 * run of a random process teaches nothing. A student who predicts "tails is
 * due" and then sees tails has been REWARDED by the simulation for a false
 * belief, and no amount of explanation afterwards undoes a demonstration that
 * appeared to agree with them.
 */

import { makeRng } from "@/lib/rng";
import type {
  Frame,
  IdealizationDef,
  ParamControl,
  PredictionTarget,
  ResolvedIdealization,
  Simulator,
  Trace,
  ValidityRange,
} from "../types";

export type LawOfLargeParams = {
  flips: number;
  p_heads: number;
  streak_length: number;
  seed: number;
};

export const LAWOFLARGE_DEFAULTS: LawOfLargeParams = {
  flips: 10000,
  p_heads: 0.5,
  streak_length: 4,
  seed: 1,
};

const IDEALIZATIONS: IdealizationDef[] = [
  {
    key: "fair_coin",
    label: "Perfectly fair coin",
    whenOn: "Exactly even odds. The proportion converges on one half.",
    whenOff:
      "The coin is biased, at the probability set below. The proportion still converges — just not on a half. The law of large numbers is about convergence, not about fairness.",
    default: true,
  },
  {
    key: "independent_flips",
    label: "Independent flips",
    whenOn:
      "Each flip knows nothing about the ones before it. This is the assumption the gambler's fallacy denies, and the streak measurement below is what tests it.",
    whenOff:
      "Flips are made sticky: each one repeats the previous result more often than chance. This is what the world would have to be like for 'tails is due' to be wrong in the OTHER direction — and note that it makes streaks longer, not shorter.",
    default: true,
  },
];

const VALIDITY: ValidityRange = {
  summary:
    "Repeated independent trials of a fixed-probability event, tracked as the count grows.",
  breaksDownWhen: [
    "The trials are not independent or the probability drifts — cards dealt without replacement, a wearing machine, a person who is learning.",
    "You need to know about a specific short run. This says what happens in the limit; it says almost nothing about the next ten flips.",
    "The quantity has no finite mean — some distributions have no law of large numbers at all, and averaging them converges to nothing.",
  ],
};

const PREDICTIONS: PredictionTarget[] = [
  {
    key: "after_streak",
    kind: "choice",
    prompt:
      "A fair coin has just come up heads four times in a row. What are the chances the next flip is heads?",
    options: [
      { value: "less", label: "Less than half — tails is due" },
      { value: "half", label: "Exactly half — the coin has no memory" },
      { value: "more", label: "More than half — it is on a hot streak" },
    ],
    resolve: (trace) =>
      trace.idealizations.find((i) => i.key === "independent_flips")?.on ? "half" : "more",
  },
  {
    key: "gap_behaviour",
    kind: "choice",
    prompt:
      "As you keep flipping, what happens to the GAP between the number of heads and the number of tails — not the proportion, the raw count?",
    options: [
      { value: "shrinks", label: "It shrinks toward zero — they even out" },
      { value: "same", label: "It stays about the same size" },
      { value: "grows", label: "It gets bigger" },
    ],
    resolve: () => "grows",
  },
  {
    key: "longest_streak",
    kind: "numeric",
    prompt: "How long will the longest run of the same face be?",
    unit: "flips",
    // The longest run grows like log2(n) — about 13 at ten thousand flips and
    // about 18 at two hundred thousand — but it is heavy-tailed, and a single
    // run of 25 is entirely possible. A ceiling of 40 would sometimes exclude
    // the correct answer, which is the same defect the projectile had.
    range: [0, 60],
  },
];

const CONTROLS: ParamControl[] = [
  { key: "flips", label: "flips", unit: "", min: 500, max: 200000, step: 500 },
  { key: "p_heads", label: "P(heads)", unit: "", min: 0.05, max: 0.95, step: 0.01 },
  { key: "streak_length", label: "streak to watch", unit: "", min: 2, max: 8, step: 1 },
  { key: "seed", label: "seed", unit: "", min: 1, max: 999, step: 1 },
];

/** Probability the next flip is heads, given a stickiness parameter. */
function nextHeadProbability(q: number, sticky: boolean, lastWasHead: boolean | null): number {
  if (!sticky || lastWasHead === null) return q;
  // Weighted toward repeating. Deliberately strong so the contrast with the
  // independent case is unmistakable rather than a statistical squint.
  return lastWasHead ? Math.min(0.8, q + 0.3) : Math.max(0.2, q - 0.3);
}

export const lawOfLarge: Simulator<LawOfLargeParams> = {
  id: "lawoflarge",
  title: "Long runs of a coin",
  question: "After a long run of heads, is tails more likely than usual?",
  validity: VALIDITY,
  idealizations: IDEALIZATIONS,
  predictions: PREDICTIONS,
  controls: CONTROLS,

  closedForm(p, ideal) {
    const q = ideal.fair_coin !== false ? 0.5 : p.p_heads;
    const independent = ideal.independent_flips !== false;
    const n = p.flips;

    // Expected longest run of either face, to the standard approximation
    // log(n(1-q)) / log(1/q) for the more likely face. Only meaningful for
    // independent flips.
    const longest = independent
      ? Math.log(n * (1 - q)) / Math.log(1 / q)
      : Number.NaN;

    return {
      // The whole point: unchanged by what came before.
      after_streak_heads_rate: independent ? q : nextHeadProbability(q, true, true),
      proportion_heads: q,
      // E|H - T| for a fair coin, to the usual sqrt(2n/pi) approximation.
      expected_gap: q === 0.5 ? Math.sqrt((2 * n) / Math.PI) : Math.abs(2 * q - 1) * n,
      longest_streak: longest,
    };
  },

  // No RunOptions: these sims have no timestep to vary. Their resolution is
  // the trial count, which is a parameter the student can see and change.
  run(p, ideal): Trace {
    const fair = ideal.fair_coin !== false;
    const independent = ideal.independent_flips !== false;
    const q = fair ? 0.5 : p.p_heads;
    const flips = Math.max(2, Math.floor(p.flips));
    const streakLength = Math.max(1, Math.floor(p.streak_length));

    const rng = makeRng(
      "lln/" + p.seed + "/" + q + "/" + flips + "/" + streakLength + "/" + independent,
    );

    let heads = 0;
    let currentRun = 0;
    let longestRun = 0;
    let lastWasHead: boolean | null = null;

    // The streak measurement: every time we have just seen `streakLength`
    // heads in a row, record what the NEXT flip turned out to be.
    let afterStreakOpportunities = 0;
    let afterStreakHeads = 0;
    let headRun = 0;

    const FRAMES = 80;
    const batch = Math.max(1, Math.ceil(flips / FRAMES));
    const frames: Frame[] = [];

    const snapshot = (done: number) => {
      const proportion = done === 0 ? q : heads / done;
      frames.push({
        t: done,
        bodies: [],
        scalars: {
          trials_done: done,
          proportion_heads: proportion,
          gap: Math.abs(2 * heads - done),
          sqrt_n: Math.sqrt(done),
          longest_streak: longestRun,
          after_streak_heads_rate:
            afterStreakOpportunities === 0 ? q : afterStreakHeads / afterStreakOpportunities,
          after_streak_opportunities: afterStreakOpportunities,
        },
      });
    };

    snapshot(0);

    let done = 0;
    while (done < flips) {
      const upto = Math.min(done + batch, flips);
      for (; done < upto; done++) {
        const armed = headRun >= streakLength;
        const isHead = rng.bool(nextHeadProbability(q, !independent, lastWasHead));

        if (armed) {
          afterStreakOpportunities++;
          if (isHead) afterStreakHeads++;
        }

        if (isHead) heads++;
        headRun = isHead ? headRun + 1 : 0;

        if (lastWasHead === null || isHead === lastWasHead) currentRun++;
        else currentRun = 1;
        if (currentRun > longestRun) longestRun = currentRun;
        lastWasHead = isHead;
      }
      snapshot(done);
    }

    const resolved: ResolvedIdealization[] = IDEALIZATIONS.map((d) => ({
      ...d,
      on: ideal[d.key] !== false,
    }));

    return {
      simId: "lawoflarge",
      dt: 1 / FRAMES,
      frames,
      domain: { x: [0, flips], y: [0, 1] },
      view: {
        kind: "series",
        seriesX: { key: "trials_done", label: "flips so far" },
        series: [
          {
            key: "proportion_heads",
            label: "Proportion of heads",
            unit: "",
            reference: q,
            referenceLabel: q.toFixed(2),
            // Fixed, so the convergence is visible as convergence rather than
            // being rescaled away into a permanently wiggly line.
            domain: [0, 1],
          },
          {
            key: "gap",
            label: "Gap between heads and tails",
            unit: "flips",
            companion: { key: "sqrt_n", label: "√n" },
          },
          {
            key: "after_streak_heads_rate",
            label:
              "Heads on the flip AFTER " + streakLength + " heads in a row",
            unit: "",
            reference: q,
            referenceLabel: q.toFixed(2),
            domain: [0, 1],
          },
        ],
        xLabel: "flips so far",
        yLabel: "",
        xAxis: true,
        ground: null,
        links: [],
        segments: [],
        trail: false,
      },
      invariants: [],
      outcome: {
        proportion_heads: heads / flips,
        gap: Math.abs(2 * heads - flips),
        longest_streak: longestRun,
        after_streak_heads_rate:
          afterStreakOpportunities === 0 ? Number.NaN : afterStreakHeads / afterStreakOpportunities,
        after_streak_opportunities: afterStreakOpportunities,
        flips_run: flips,
      },
      idealizations: resolved,
    };
  },
};
