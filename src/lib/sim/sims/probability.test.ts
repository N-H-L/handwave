/**
 * The probability sims, asserted against exact combinatorics.
 *
 * Statistical tests are the easiest place in a codebase to write something
 * that passes for the wrong reason, so these follow two rules:
 *
 *  - Every assertion runs on a fixed seed, so nothing here can flake.
 *  - Where a tolerance is needed it is stated as a multiple of the standard
 *    error, computed from n, rather than picked until the test went green.
 */

import { describe, expect, it } from "vitest";
import { COIN_DEFAULTS, KONOLD_SEQUENCES, binomialCoefficient, coin } from "./coin";
import { LAWOFLARGE_DEFAULTS, lawOfLarge } from "./lawoflarge";
import { MONTYHALL_DEFAULTS, montyHall } from "./montyhall";
import { runSpec } from "../registry";

/** Three standard errors for a proportion p over n trials. */
const se3 = (p: number, n: number) => 3 * Math.sqrt((p * (1 - p)) / n);

describe("binomial coefficients", () => {
  it("matches Pascal's triangle", () => {
    expect([0, 1, 2, 3, 4, 5].map((k) => binomialCoefficient(5, k))).toEqual([1, 5, 10, 10, 5, 1]);
    expect(binomialCoefficient(12, 6)).toBe(924);
    expect(binomialCoefficient(5, 6)).toBe(0);
  });
});

describe("Konold's coin item", () => {
  const fair = { fair_coin: true };

  it("makes all four named sequences equally likely, to within noise", () => {
    const trials = 20000;
    const trace = coin.run({ ...COIN_DEFAULTS, trials }, fair);
    const counts = KONOLD_SEQUENCES.map((s) => trace.outcome["count_" + s]);
    const expected = trials / 32;
    // Every specific five-flip sequence has probability 1/32. This is the
    // answer to BOTH halves of the published item.
    for (const c of counts) {
      expect(Math.abs(c - expected) / trials).toBeLessThan(se3(1 / 32, trials));
    }
  });

  it("keeps the spread between the four sequences small next to their size", () => {
    const trials = 20000;
    const trace = coin.run({ ...COIN_DEFAULTS, trials }, fair);
    expect(trace.outcome.sequence_spread).toBeLessThan(trials / 32);
  });

  it("does NOT make the number of heads uniform — which is the resolution", () => {
    const trials = 20000;
    const trace = coin.run({ ...COIN_DEFAULTS, trials }, fair);
    const three = trace.outcome.exactly_3_heads_count;
    const five = trace.outcome.exactly_5_heads_count;
    // Ten sequences give three heads and one gives five, so three heads must
    // come up about ten times as often. Specific sequences are equally likely;
    // counts of them are not, and conflating the two is the misconception.
    expect(three / five).toBeGreaterThan(6);
    expect(three / five).toBeLessThan(16);
  });

  it("matches the exact binomial for every number of heads", () => {
    const trials = 20000;
    const trace = coin.run({ ...COIN_DEFAULTS, trials }, fair);
    const hist = trace.frames[trace.frames.length - 1].histograms![1];
    for (let k = 0; k <= 5; k++) {
      const p = binomialCoefficient(5, k) / 32;
      expect(Math.abs(hist.counts[k] / trials - p)).toBeLessThan(se3(p, trials));
    }
  });

  it("counts every trial exactly once across the heads histogram", () => {
    const trace = coin.run({ ...COIN_DEFAULTS, trials: 3000 }, fair);
    const hist = trace.frames[trace.frames.length - 1].histograms![1];
    expect(hist.counts.reduce((a, b) => a + b, 0)).toBe(3000);
  });

  it("breaks the equality when the coin is weighted", () => {
    // THTTT has four tails; with p(heads)=0.8 it should be far rarer than
    // HHHTT. The four sequences are equally likely ONLY for a fair coin.
    const trace = coin.run({ ...COIN_DEFAULTS, trials: 20000, p_heads: 0.8 }, { fair_coin: false });
    expect(trace.outcome.count_HHHTT).toBeGreaterThan(trace.outcome.count_THTTT * 5);
  });

  it("agrees with its own closed form", () => {
    const params = { ...COIN_DEFAULTS, trials: 20000 };
    const closed = coin.closedForm(params, fair)!;
    const trace = coin.run(params, fair);
    expect(Math.abs(trace.outcome.exactly_3_heads_count - closed.exactly_3_heads_count)).toBeLessThan(
      3 * Math.sqrt(20000 * (10 / 32) * (22 / 32)),
    );
  });

  it("is byte-identical for the same seed and different for another", () => {
    const a = JSON.stringify(coin.run(COIN_DEFAULTS, fair).outcome);
    const b = JSON.stringify(coin.run(COIN_DEFAULTS, fair).outcome);
    const c = JSON.stringify(coin.run({ ...COIN_DEFAULTS, seed: 2 }, fair).outcome);
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});

describe("law of large numbers", () => {
  const clean = { fair_coin: true, independent_flips: true };

  it("converges the PROPORTION toward one half", () => {
    const trace = lawOfLarge.run({ ...LAWOFLARGE_DEFAULTS, flips: 200000 }, clean);
    expect(Math.abs(trace.outcome.proportion_heads - 0.5)).toBeLessThan(se3(0.5, 200000));
  });

  it("grows the GAP between heads and tails as the count rises", () => {
    // The half that nobody has. Averaged over seeds because a single run of a
    // random walk can wander anywhere.
    const gapAt = (flips: number) => {
      let total = 0;
      for (let seed = 1; seed <= 12; seed++) {
        total += lawOfLarge.run({ ...LAWOFLARGE_DEFAULTS, flips, seed }, clean).outcome.gap;
      }
      return total / 12;
    };
    const small = gapAt(2000);
    const large = gapAt(200000);
    expect(large).toBeGreaterThan(small * 3);
  });

  it("has a gap that tracks sqrt(n), not n", () => {
    const mean = (flips: number) => {
      let total = 0;
      for (let seed = 1; seed <= 16; seed++) {
        total += lawOfLarge.run({ ...LAWOFLARGE_DEFAULTS, flips, seed }, clean).outcome.gap;
      }
      return total / 16;
    };
    // E|H-T| = sqrt(2n/pi) for a fair coin. A hundredfold rise in n should
    // multiply the gap by ten, not by a hundred.
    const ratio = mean(200000) / mean(2000);
    expect(ratio).toBeGreaterThan(6);
    expect(ratio).toBeLessThan(16);
  });

  it("THE GAMBLER'S FALLACY: the flip after a streak is still a coin flip", () => {
    let opportunities = 0;
    let heads = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const o = lawOfLarge.run({ ...LAWOFLARGE_DEFAULTS, flips: 50000, seed }, clean).outcome;
      opportunities += o.after_streak_opportunities;
      heads += o.after_streak_heads_rate * o.after_streak_opportunities;
    }
    expect(opportunities).toBeGreaterThan(20000);
    const rate = heads / opportunities;
    // Overlapping windows make these samples correlated, so the effective n is
    // smaller than the raw count. Six standard errors, generously.
    expect(Math.abs(rate - 0.5)).toBeLessThan(6 * Math.sqrt(0.25 / opportunities));
  });

  it("has a longest run that tracks log2(n), matching the closed form", () => {
    const meanLongest = (flips: number) => {
      let total = 0;
      for (let seed = 1; seed <= 16; seed++) {
        total += lawOfLarge.run({ ...LAWOFLARGE_DEFAULTS, flips, seed }, clean).outcome.longest_streak;
      }
      return total / 16;
    };
    const measured = meanLongest(10000);
    const predicted = lawOfLarge.closedForm({ ...LAWOFLARGE_DEFAULTS, flips: 10000 }, clean)!
      .longest_streak;
    expect(Math.abs(measured - predicted)).toBeLessThan(2);
    // Ten times the flips buys about three and a bit more consecutive heads,
    // because the run length is logarithmic in the count.
    expect(meanLongest(100000) - measured).toBeGreaterThan(1.5);
    expect(meanLongest(100000) - measured).toBeLessThan(6);
  });

  it("makes streaks LONGER when the flips are sticky, not shorter", () => {
    const independent = lawOfLarge.run(LAWOFLARGE_DEFAULTS, clean).outcome.longest_streak;
    const sticky = lawOfLarge.run(LAWOFLARGE_DEFAULTS, {
      fair_coin: true,
      independent_flips: false,
    }).outcome;
    expect(sticky.longest_streak).toBeGreaterThan(independent);
    // And the flip after a streak really is biased in that world — which is
    // what makes it a fair test of the belief rather than a rigged one.
    expect(sticky.after_streak_heads_rate).toBeGreaterThan(0.6);
  });

  it("converges on the bias when the coin is weighted", () => {
    const trace = lawOfLarge.run(
      { ...LAWOFLARGE_DEFAULTS, flips: 100000, p_heads: 0.3 },
      { fair_coin: false, independent_flips: true },
    );
    expect(Math.abs(trace.outcome.proportion_heads - 0.3)).toBeLessThan(se3(0.3, 100000));
  });
});

describe("Monty Hall", () => {
  const knows = { host_knows: true };
  const guessing = { host_knows: false };

  it("wins two thirds of the time by switching, at three doors", () => {
    const trials = 20000;
    const o = montyHall.run({ ...MONTYHALL_DEFAULTS, trials }, knows).outcome;
    expect(Math.abs(o.switch_win_rate_pct / 100 - 2 / 3)).toBeLessThan(se3(2 / 3, trials));
    expect(Math.abs(o.stay_win_rate_pct / 100 - 1 / 3)).toBeLessThan(se3(1 / 3, trials));
    expect(o.games_discarded).toBe(0);
  });

  it("wins (N-1)/N by switching, for several N", () => {
    for (const doors of [3, 5, 10, 50]) {
      const trials = 20000;
      const o = montyHall.run({ ...MONTYHALL_DEFAULTS, doors, trials }, knows).outcome;
      const expected = (doors - 1) / doors;
      expect(Math.abs(o.switch_win_rate_pct / 100 - expected), "doors=" + doors).toBeLessThan(
        se3(expected, trials),
      );
    }
  });

  it("THE SUBTLETY: an ignorant host makes it exactly fifty-fifty", () => {
    for (const doors of [3, 5, 10]) {
      const o = montyHall.run({ ...MONTYHALL_DEFAULTS, doors, trials: 20000 }, guessing).outcome;
      expect(o.games_used).toBeGreaterThan(100);
      expect(Math.abs(o.switch_win_rate_pct / 100 - 0.5), "doors=" + doors).toBeLessThan(
        se3(0.5, o.games_used),
      );
      expect(Math.abs(o.stay_win_rate_pct / 100 - 0.5), "doors=" + doors).toBeLessThan(
        se3(0.5, o.games_used),
      );
    }
  });

  it("keeps 2/N of games when the host is guessing, and says so", () => {
    // Pooled across seeds rather than run once. A 3-sigma bound on a single
    // draw fails about three times in a thousand BY CONSTRUCTION, and this
    // checks three door counts — so the single-seed version was a test that
    // would eventually fail for no reason. Pooling tests the same claim with
    // more power and stays deterministic.
    const trials = 5000;
    const seeds = 10;
    for (const doors of [3, 5, 10]) {
      let used = 0;
      let discarded = 0;
      for (let seed = 1; seed <= seeds; seed++) {
        const o = montyHall.run({ ...MONTYHALL_DEFAULTS, doors, trials, seed }, guessing).outcome;
        expect(o.games_used + o.games_discarded).toBe(trials);
        used += o.games_used;
        discarded += o.games_discarded;
      }
      const total = trials * seeds;
      expect(used + discarded).toBe(total);
      expect(
        Math.abs(used / total - 2 / doors),
        "doors=" + doors,
      ).toBeLessThan(se3(2 / doors, total));
    }
  });

  it("has stay and switch as the only two outcomes, summing to one", () => {
    const o = montyHall.run({ ...MONTYHALL_DEFAULTS, trials: 20000 }, knows).outcome;
    expect(o.stay_win_rate_pct + o.switch_win_rate_pct).toBeCloseTo(100, 6);
  });

  it("agrees with its own closed form under both hosts", () => {
    for (const [ideal, name] of [
      [knows, "knowing"],
      [guessing, "guessing"],
    ] as const) {
      const params = { ...MONTYHALL_DEFAULTS, trials: 20000 };
      const closed = montyHall.closedForm(params, ideal)!;
      const o = montyHall.run(params, ideal).outcome;
      expect(
        Math.abs(o.switch_win_rate_pct - closed.switch_win_rate_pct),
        name,
      ).toBeLessThan(3);
    }
  });

  it("is deterministic for a seed", () => {
    const a = JSON.stringify(montyHall.run(MONTYHALL_DEFAULTS, knows).outcome);
    const b = JSON.stringify(montyHall.run(MONTYHALL_DEFAULTS, knows).outcome);
    expect(a).toBe(b);
  });
});

describe("the spec gate accepts all three", () => {
  it("runs each from a plain spec object", () => {
    expect(runSpec({ sim_id: "coin", params: COIN_DEFAULTS }).simId).toBe("coin");
    expect(runSpec({ sim_id: "lawoflarge", params: LAWOFLARGE_DEFAULTS }).simId).toBe("lawoflarge");
    expect(runSpec({ sim_id: "montyhall", params: MONTYHALL_DEFAULTS }).simId).toBe("montyhall");
  });

  it("refuses fewer than three doors", () => {
    expect(() =>
      runSpec({ sim_id: "montyhall", params: { ...MONTYHALL_DEFAULTS, doors: 2 } }),
    ).toThrow();
  });

  it("refuses a certain coin", () => {
    expect(() => runSpec({ sim_id: "coin", params: { ...COIN_DEFAULTS, p_heads: 1 } })).toThrow();
  });
});
