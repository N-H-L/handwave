/**
 * Seeded, deterministic pseudo-random numbers.
 *
 * WHY NOT `Math.random()`: it is unseedable, so a run cannot be reproduced,
 * shared by URL, or asserted in a test. Every probability sim here has to be
 * replayable from a seed printed on screen — a student who says "that streak
 * was rigged" needs to be able to watch the identical run again.
 *
 * WHY sfc32 AND NOT mulberry32: mulberry32 is the one everyone copies off
 * Stack Overflow, and it holds 32 bits of state — so its period is at most
 * 2^32, and its output mixer is not a bijection, meaning some 32-bit values
 * are produced more than once per period and others never. sfc32 carries 128
 * bits of state and costs the same fifteen lines. For a histogram of ten
 * thousand coin flips that is not academic: a structural bias in the
 * generator lands squarely in the thing we are asking the student to reason
 * about.
 *
 * (The specific claim about mulberry32's output distribution follows from its
 * construction, not from a measurement of ours. If it ever matters to an
 * argument rather than to a choice of default, measure it.)
 *
 * Vendored rather than depended on: it is fifteen lines, it must never change
 * underneath a saved seed, and a supply-chain update that silently altered the
 * sequence would invalidate every stored prediction.
 */

/** Hash an arbitrary string seed into well-mixed 32-bit integers. */
export function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** sfc32 — Small Fast Counting generator, 128 bits of state. */
export function sfc32(a: number, b: number, c: number, d: number): () => number {
  return function () {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return t >>> 0;
  };
}

export interface Rng {
  readonly seed: string;
  /** Raw 32-bit output. */
  uint32(): number;
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform integer in [0, n). Rejection-sampled, so genuinely unbiased. */
  int(n: number): number;
  /** True with probability p. */
  bool(p?: number): boolean;
  normal(mean?: number, sd?: number): number;
  /** Fisher-Yates, in place, returns the same array. */
  shuffle<T>(items: T[]): T[];
  pick<T>(items: readonly T[]): T;
}

export function makeRng(seed: string): Rng {
  const h = xmur3(seed);
  const core = sfc32(h(), h(), h(), h());

  // Discard the first few outputs: sfc32's state needs a little mixing before
  // the low bits behave, and the cost is nothing.
  for (let i = 0; i < 12; i++) core();

  let spare: number | null = null;

  const rng: Rng = {
    seed,
    uint32: core,
    next: () => core() / 4294967296,
    int(n: number) {
      if (!Number.isInteger(n) || n <= 0) throw new RangeError("int(n) needs a positive integer");
      // Naive `core() % n` over-represents the low residues whenever n does
      // not divide 2^32. Reject the ragged tail instead.
      const limit = Math.floor(4294967296 / n) * n;
      let v = core();
      while (v >= limit) v = core();
      return v % n;
    },
    bool(p = 0.5) {
      return rng.next() < p;
    },
    normal(mean = 0, sd = 1) {
      // Box-Muller, keeping the second variate rather than throwing it away.
      if (spare !== null) {
        const v = spare;
        spare = null;
        return mean + sd * v;
      }
      let u = 0;
      let v = 0;
      let s = 0;
      do {
        u = rng.next() * 2 - 1;
        v = rng.next() * 2 - 1;
        s = u * u + v * v;
      } while (s === 0 || s >= 1);
      const f = Math.sqrt((-2 * Math.log(s)) / s);
      spare = v * f;
      return mean + sd * (u * f);
    },
    shuffle<T>(items: T[]): T[] {
      for (let i = items.length - 1; i > 0; i--) {
        const j = rng.int(i + 1);
        const t = items[i];
        items[i] = items[j];
        items[j] = t;
      }
      return items;
    },
    pick<T>(items: readonly T[]): T {
      return items[rng.int(items.length)];
    },
  };

  return rng;
}

/**
 * Welford's online algorithm.
 *
 * The textbook shortcut — accumulate sum and sum-of-squares, then subtract —
 * cancels catastrophically when the mean is large relative to the spread, and
 * can hand back a negative variance. Welford is one pass, numerically stable,
 * and needs no array, which matters when a law-of-large-numbers sim runs a
 * million trials and we refuse to keep them all in memory.
 */
export class Welford {
  n = 0;
  mean = 0;
  private m2 = 0;
  min = Infinity;
  max = -Infinity;

  push(x: number): void {
    this.n += 1;
    const delta = x - this.mean;
    this.mean += delta / this.n;
    this.m2 += delta * (x - this.mean);
    if (x < this.min) this.min = x;
    if (x > this.max) this.max = x;
  }

  /** Sample variance (n-1). NaN with fewer than two observations. */
  get variance(): number {
    return this.n < 2 ? NaN : this.m2 / (this.n - 1);
  }

  get sd(): number {
    return Math.sqrt(this.variance);
  }

  /** Standard error of the mean — what a "is this converged yet?" readout needs. */
  get sem(): number {
    return this.n < 2 ? NaN : this.sd / Math.sqrt(this.n);
  }
}
