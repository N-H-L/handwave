/**
 * Every statistical assertion here runs on a fixed seed, so the suite is
 * deterministic. A flaky test in the layer whose entire job is reproducibility
 * would be its own refutation.
 */

import { describe, expect, it } from "vitest";
import { Welford, makeRng, sfc32, xmur3 } from "./rng";

describe("reproducibility", () => {
  it("gives the identical sequence for the same seed", () => {
    const a = makeRng("konold-1995");
    const b = makeRng("konold-1995");
    const seqA = Array.from({ length: 200 }, () => a.uint32());
    const seqB = Array.from({ length: 200 }, () => b.uint32());
    expect(seqA).toEqual(seqB);
  });

  it("diverges for different seeds", () => {
    const ra = makeRng("seed-a");
    const rb = makeRng("seed-b");
    const a = Array.from({ length: 50 }, () => ra.uint32());
    const b = Array.from({ length: 50 }, () => rb.uint32());
    expect(a).not.toEqual(b);
  });

  it("does not collide on near-identical seed strings", () => {
    const seeds = ["1", "01", "10", "seed", "seeds", "Seed"];
    const firsts = seeds.map((s) => makeRng(s).uint32());
    expect(new Set(firsts).size).toBe(seeds.length);
  });

  it("xmur3 mixes: one flipped character changes the hash", () => {
    expect(xmur3("abcdefgh")()).not.toBe(xmur3("abcdefgi")());
  });
});

describe("output range", () => {
  it("produces 32-bit unsigned integers only", () => {
    const r = makeRng("range");
    for (let i = 0; i < 5000; i++) {
      const v = r.uint32();
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(4294967295);
    }
  });

  it("reaches both ends of the range", () => {
    const r = makeRng("ends");
    let low = 0;
    let high = 0;
    for (let i = 0; i < 20000; i++) {
      const v = r.uint32();
      if (v < 4294967296 / 8) low++;
      if (v > (4294967296 * 7) / 8) high++;
    }
    // Expect about 2500 each. Anything near zero means a hole in the output.
    expect(low).toBeGreaterThan(2000);
    expect(high).toBeGreaterThan(2000);
  });

  it("next() stays inside [0, 1)", () => {
    const r = makeRng("unit");
    for (let i = 0; i < 20000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("sfc32 raw is deterministic from its four words", () => {
    const f = sfc32(1, 2, 3, 4);
    const g = sfc32(1, 2, 3, 4);
    expect([f(), f(), f()]).toEqual([g(), g(), g()]);
  });
});

describe("uniformity", () => {
  it("next() has mean 0.5 and variance 1/12", () => {
    const r = makeRng("uniform-moments");
    const w = new Welford();
    for (let i = 0; i < 200000; i++) w.push(r.next());
    expect(w.mean).toBeCloseTo(0.5, 2);
    expect(w.variance).toBeCloseTo(1 / 12, 3);
  });

  it("int(6) is uniform - chi-square under the 1% critical value", () => {
    const r = makeRng("d6");
    const n = 60000;
    const counts = new Array(6).fill(0);
    for (let i = 0; i < n; i++) {
      const v = r.int(6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
      counts[v]++;
    }
    const expected = n / 6;
    const chi2 = counts.reduce((acc, c) => acc + Math.pow(c - expected, 2) / expected, 0);
    expect(chi2).toBeLessThan(15.09); // df = 5, p = 0.01
  });

  it("int(n) is uniform for an n that does not divide 2^32", () => {
    // Naive modulo would over-represent the low residues here.
    const r = makeRng("d7");
    const n = 70000;
    const counts = new Array(7).fill(0);
    for (let i = 0; i < n; i++) counts[r.int(7)]++;
    const expected = n / 7;
    const chi2 = counts.reduce((acc, c) => acc + Math.pow(c - expected, 2) / expected, 0);
    expect(chi2).toBeLessThan(16.81); // df = 6, p = 0.01
  });

  it("rejects a non-positive or fractional bound", () => {
    const r = makeRng("bounds");
    expect(() => r.int(0)).toThrow();
    expect(() => r.int(-3)).toThrow();
    expect(() => r.int(2.5)).toThrow();
  });

  it("bool(p) fires at about rate p", () => {
    const r = makeRng("bernoulli");
    let hits = 0;
    for (let i = 0; i < 100000; i++) if (r.bool(0.3)) hits++;
    expect(hits / 100000).toBeCloseTo(0.3, 2);
  });

  it("bool() defaults to a fair coin", () => {
    const r = makeRng("fair");
    let heads = 0;
    for (let i = 0; i < 100000; i++) if (r.bool()) heads++;
    expect(heads / 100000).toBeCloseTo(0.5, 2);
  });
});

describe("normal", () => {
  it("has the requested mean and standard deviation", () => {
    const r = makeRng("gauss");
    const w = new Welford();
    for (let i = 0; i < 200000; i++) w.push(r.normal(10, 2));
    expect(w.mean).toBeCloseTo(10, 1);
    expect(w.sd).toBeCloseTo(2, 1);
  });

  it("is symmetric about the mean", () => {
    const r = makeRng("gauss-sym");
    let above = 0;
    for (let i = 0; i < 100000; i++) if (r.normal() > 0) above++;
    expect(above / 100000).toBeCloseTo(0.5, 2);
  });
});

describe("shuffle", () => {
  it("returns a permutation, not a subset", () => {
    const r = makeRng("shuffle");
    const src = Array.from({ length: 100 }, (_, i) => i);
    const out = r.shuffle([...src]);
    expect([...out].sort((a, b) => a - b)).toEqual(src);
  });

  it("is deterministic per seed", () => {
    const src = Array.from({ length: 20 }, (_, i) => i);
    expect(makeRng("s").shuffle([...src])).toEqual(makeRng("s").shuffle([...src]));
  });

  it("actually moves things", () => {
    const src = Array.from({ length: 50 }, (_, i) => i);
    const out = makeRng("moves").shuffle([...src]);
    expect(out).not.toEqual(src);
  });

  it("puts each element in each position at roughly equal rates", () => {
    // Fisher-Yates done wrong (looping j over the full range) biases this.
    const positionsOfZero = new Array(4).fill(0);
    const trials = 24000;
    for (let t = 0; t < trials; t++) {
      const out = makeRng("fy-" + t).shuffle([0, 1, 2, 3]);
      positionsOfZero[out.indexOf(0)]++;
    }
    const expected = trials / 4;
    const chi2 = positionsOfZero.reduce((a, c) => a + Math.pow(c - expected, 2) / expected, 0);
    expect(chi2).toBeLessThan(11.34); // df = 3, p = 0.01
  });
});

describe("Welford", () => {
  it("matches a naive two-pass computation on well-conditioned data", () => {
    const xs = [2, 4, 4, 4, 5, 5, 7, 9];
    const w = new Welford();
    xs.forEach((x) => w.push(x));
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const varr = xs.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (xs.length - 1);
    expect(w.mean).toBeCloseTo(mean, 12);
    expect(w.variance).toBeCloseTo(varr, 12);
    expect(w.n).toBe(8);
    expect(w.min).toBe(2);
    expect(w.max).toBe(9);
  });

  it("survives the case where sum-of-squares cancels catastrophically", () => {
    // Mean 1e9, spread 1. The textbook (sum(x^2) - n*mean^2)/(n-1) loses every
    // significant digit here and can even return a negative variance.
    const xs = [1e9, 1e9 + 1, 1e9 + 2, 1e9 + 3, 1e9 + 4];
    const w = new Welford();
    xs.forEach((x) => w.push(x));

    const sum = xs.reduce((a, b) => a + b, 0);
    const sumSq = xs.reduce((a, b) => a + b * b, 0);
    const naive = (sumSq - (sum * sum) / xs.length) / (xs.length - 1);

    expect(w.variance).toBeCloseTo(2.5, 10);
    expect(Math.abs(naive - 2.5)).toBeGreaterThan(0.1); // the naive form is wrong here
  });

  it("reports NaN rather than a fake zero for a single observation", () => {
    const w = new Welford();
    w.push(42);
    expect(w.mean).toBe(42);
    expect(w.variance).toBeNaN();
    expect(w.sem).toBeNaN();
  });

  it("has a standard error that shrinks like 1/sqrt(n)", () => {
    const r = makeRng("sem");
    const small = new Welford();
    const large = new Welford();
    for (let i = 0; i < 1000; i++) small.push(r.normal());
    for (let i = 0; i < 100000; i++) large.push(r.normal());
    expect(large.sem).toBeLessThan(small.sem / 5);
  });
});
