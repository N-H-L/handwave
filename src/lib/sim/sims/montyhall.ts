/**
 * Monty Hall, with any number of doors and — the part that matters — a host
 * who can be made ignorant.
 *
 * The famous answer is that you should switch, and that switching wins
 * (N−1)/N of the time. That is correct, and it is also the half of the problem
 * everyone repeats. The half that gets left out is WHY, and the toggle here is
 * the cleanest way to show it:
 *
 *   Host knows where the prize is  →  switching wins 2/3 (at three doors)
 *   Host opens a door at random,
 *   and it happens to be a goat    →  switching wins 1/2. Exactly 1/2.
 *
 * Same doors, same reveal, same thing visible on screen — and a different
 * answer, because the information came from somewhere else. A knowing host's
 * choice is constrained by the prize, so his door-opening carries information
 * about it. An ignorant host's does not.
 *
 * This is PLAN §3 rule 5 in its strongest form. A student who says "it makes no
 * difference, it's fifty-fifty now" is not simply wrong. They are RIGHT about
 * a game that is one toggle away, and describing the wrong game. Telling them
 * they are wrong teaches nothing; showing them which game they are describing
 * is the whole lesson.
 *
 * Conditioning matters and is reported, not hidden: with an ignorant host,
 * trials where he reveals the prize are discarded, because the question is
 * about what to do when you are LOOKING at a goat. The discard count is on
 * screen — that conditioning is the subtlety, so burying it would be a lie of
 * omission.
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

export type MontyHallParams = {
  doors: number;
  trials: number;
  seed: number;
};

export const MONTYHALL_DEFAULTS: MontyHallParams = {
  doors: 3,
  trials: 1000,
  seed: 1,
};

const IDEALIZATIONS: IdealizationDef[] = [
  {
    key: "host_knows",
    label: "The host knows where the prize is",
    whenOn:
      "He always opens goats, and never your door. His choice is constrained by where the prize is, so opening a door tells you something about it. Switching wins (N−1)/N of the time.",
    whenOff:
      "He opens doors at random and got lucky. Games where he revealed the prize are thrown out, because the question is what to do while you are looking at a goat. Switching now wins exactly half the time — the reveal carried no information, because nothing about it depended on the prize.",
    default: true,
  },
];

const VALIDITY: ValidityRange = {
  summary:
    "The host always opens doors and always offers the swap, the prize is placed uniformly at random, and you pick your first door without any information.",
  breaksDownWhen: [
    "The host only offers the swap sometimes — if he offers it just when you picked right, switching becomes the worst possible move. The puzzle is about the host's ALGORITHM, not the doors.",
    "The prize is not placed uniformly, or the host's choice among goats is predictable in a way you can read.",
    "You had information when you chose your first door. The whole result rests on that first pick being uninformed.",
  ],
};

const PREDICTIONS: PredictionTarget[] = [
  {
    key: "should_switch",
    kind: "choice",
    prompt:
      "The host has opened a door showing a goat, and offers you the swap. What should you do?",
    options: [
      { value: "switch", label: "Switch — it is better than staying" },
      { value: "stay", label: "Stay — switching is worse" },
      { value: "no_difference", label: "It makes no difference either way" },
    ],
    // The correct answer genuinely changes with the toggle. That is the point
    // of the sim, and it is why this reads the trace instead of returning a
    // constant.
    resolve: (trace) =>
      trace.idealizations.find((i) => i.key === "host_knows")?.on ? "switch" : "no_difference",
  },
  {
    key: "switch_win_rate_pct",
    kind: "numeric",
    prompt: "Out of a hundred games where you switch, how many do you win?",
    unit: "%",
    range: [0, 100],
  },
];

const CONTROLS: ParamControl[] = [
  { key: "doors", label: "doors", unit: "", min: 3, max: 100, step: 1 },
  { key: "trials", label: "games", unit: "", min: 100, max: 20000, step: 100 },
  { key: "seed", label: "seed", unit: "", min: 1, max: 999, step: 1 },
];

export const montyHall: Simulator<MontyHallParams> = {
  id: "montyhall",
  title: "Monty Hall",
  question: "The host opens a door showing a goat. Should you switch?",
  validity: VALIDITY,
  idealizations: IDEALIZATIONS,
  predictions: PREDICTIONS,
  controls: CONTROLS,

  closedForm(p, ideal) {
    const n = Math.max(3, Math.floor(p.doors));
    const knows = ideal.host_knows !== false;

    // With an ignorant host, conditioning on "he happened to reveal a goat"
    // makes the two remaining doors symmetric: P(first pick was right | goat
    // revealed) = (1/n) / (2/n) = 1/2, for any number of doors.
    const stay = knows ? 1 / n : 0.5;
    const switchRate = knows ? (n - 1) / n : 0.5;

    return {
      stay_win_rate_pct: stay * 100,
      switch_win_rate_pct: switchRate * 100,
      // Fraction of games an ignorant host does not spoil: 2/n.
      games_kept_pct: knows ? 100 : (2 / n) * 100,
    };
  },

  // No RunOptions: these sims have no timestep to vary. Their resolution is
  // the trial count, which is a parameter the student can see and change.
  run(p, ideal): Trace {
    const knows = ideal.host_knows !== false;
    const n = Math.max(3, Math.floor(p.doors));
    const trials = Math.max(1, Math.floor(p.trials));
    const rng = makeRng("monty/" + p.seed + "/" + n + "/" + trials + "/" + knows);

    let stayWins = 0;
    let switchWins = 0;
    let used = 0;
    let discarded = 0;

    const FRAMES = 60;
    const batch = Math.max(1, Math.ceil(trials / FRAMES));
    const frames: Frame[] = [];

    const snapshot = (played: number) => {
      const stayRate = used === 0 ? 0 : (stayWins / used) * 100;
      const switchRate = used === 0 ? 0 : (switchWins / used) * 100;
      const hist: Histogram = {
        label: "Win rate over " + used + " games where a goat was revealed",
        binLabels: ["Stay", "Switch"],
        counts: [stayRate, switchRate],
        expected: [
          (knows ? (1 / n) * 100 : 50),
          (knows ? ((n - 1) / n) * 100 : 50),
        ],
        emphasis: [1],
      };
      frames.push({
        t: played,
        bodies: [],
        scalars: {
          trials_done: played,
          stay_win_rate_pct: stayRate,
          switch_win_rate_pct: switchRate,
          games_used: used,
          games_discarded: discarded,
        },
        histograms: [hist],
      });
    };

    snapshot(0);

    let played = 0;
    while (played < trials) {
      const upto = Math.min(played + batch, trials);
      for (; played < upto; played++) {
        const prize = rng.int(n);
        const pick = rng.int(n);

        // Which single door is left unopened besides yours.
        let remaining: number;

        if (knows) {
          // He opens every door except yours and one. If you picked wrong, the
          // one he must leave shut is the prize; if you picked right, he leaves
          // any other door.
          if (pick === prize) {
            let other = rng.int(n - 1);
            if (other >= pick) other++;
            remaining = other;
          } else {
            remaining = prize;
          }
        } else {
          // He opens n-2 of the other doors at random. Equivalently: shuffle
          // the other doors and keep the first one shut.
          const others: number[] = [];
          for (let d = 0; d < n; d++) if (d !== pick) others.push(d);
          rng.shuffle(others);
          remaining = others[0];
          const revealedPrize = others.slice(1).includes(prize);
          if (revealedPrize) {
            // He showed the car. There is no goat in front of us and no
            // decision to make, so this game is not part of the question.
            discarded++;
            continue;
          }
        }

        used++;
        if (pick === prize) stayWins++;
        if (remaining === prize) switchWins++;
      }
      snapshot(played);
    }

    const resolved: ResolvedIdealization[] = IDEALIZATIONS.map((d) => ({
      ...d,
      on: ideal[d.key] !== false,
    }));

    return {
      simId: "montyhall",
      dt: 1 / FRAMES,
      frames,
      domain: { x: [0, 1], y: [0, 100] },
      view: {
        kind: "histogram",
        xLabel: "",
        yLabel: "win rate (%)",
        xAxis: false,
        ground: null,
        links: [],
        segments: [],
        trail: false,
      },
      invariants: [],
      outcome: {
        stay_win_rate_pct: used === 0 ? Number.NaN : (stayWins / used) * 100,
        switch_win_rate_pct: used === 0 ? Number.NaN : (switchWins / used) * 100,
        games_played: trials,
        games_used: used,
        games_discarded: discarded,
        doors: n,
      },
      idealizations: resolved,
    };
  },
};
