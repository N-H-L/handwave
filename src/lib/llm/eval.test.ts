/**
 * The routing eval, run against the deterministic keyword router.
 *
 * This is the floor, not the target. The keyword router is the degraded path
 * — it has no idea what a question means — so what this test pins down is how
 * much of the eval set is answerable WITHOUT understanding. The gap between
 * this number and the model's is the honest measure of what the model adds,
 * and it can only be honest if this number is recorded rather than assumed.
 */

import { describe, expect, it } from "vitest";
import { ROUTING_EVAL, scoreEval } from "./eval";
import { keywordRoute } from "./fallback";
import type { SimId } from "@/lib/sim/registry";

const results = ROUTING_EVAL.map((c) => {
  const envelope = keywordRoute(c.question);
  const got: SimId | null = envelope.decision === "simulate" ? envelope.spec.sim_id : null;
  return { c, got };
});
const score = scoreEval(results);

describe("the eval set itself", () => {
  it("covers every simulator", () => {
    const covered = new Set(ROUTING_EVAL.map((c) => c.expect).filter(Boolean));
    expect(covered.size).toBe(8);
  });

  it("includes questions that must be refused", () => {
    expect(ROUTING_EVAL.filter((c) => c.expect === null).length).toBeGreaterThanOrEqual(6);
  });

  it("includes phrasings that never name the phenomenon", () => {
    expect(ROUTING_EVAL.filter((c) => c.style === "described").length).toBeGreaterThanOrEqual(10);
  });
});

describe("the keyword floor", () => {
  it("records where the deterministic router actually lands", () => {
    // Not a target. A regression below this means the fallback got worse;
    // a number near 100% would mean the eval set is too easy to be useful.
    expect(score.correct / score.total).toBeGreaterThan(0.6);
  });

  it("refuses almost everything it should refuse", () => {
    // Abstaining correctly is the one thing keyword matching is good at, and
    // it is also the thing that matters most: a confident wrong demo is
    // unrecoverable, a graceful decline is not.
    expect(score.refusals.correct / score.refusals.total).toBeGreaterThanOrEqual(0.8);
  });

  it("is worse at questions that do not name the phenomenon", () => {
    // A weak signal, and deliberately labelled as one. The keyword lists and
    // the eval questions have the same author, so the vocabulary overlaps far
    // more than it would with real students — see the caveat in eval.ts. The
    // gap is real but it understates the difficulty by a lot.
    const named = score.byStyle.named.correct / score.byStyle.named.total;
    const described = score.byStyle.described.correct / score.byStyle.described.total;
    expect(described).toBeLessThanOrEqual(named);
  });
});
