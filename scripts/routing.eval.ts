/**
 * The routing eval, run through the actual model.
 *
 *   GEMINI_API_KEY=... npm run eval:routing
 *
 * Grades against exactly the same expectations as the keyword-floor test that
 * runs in CI, which is why the eval set lives in src/ and is imported by both.
 * The comparison is the point: the floor says how far vocabulary alone gets
 * you, and this says what understanding adds.
 */

import { describe, expect, it } from "vitest";
import { ROUTING_EVAL, scoreEval } from "@/lib/llm/eval";
import { routeQuestion } from "@/lib/llm/route";
import type { SimId } from "@/lib/sim/registry";

const hasKey = Boolean(process.env.GEMINI_API_KEY);

describe.skipIf(!hasKey)("routing eval, model path", () => {
  it("routes the eval set", async () => {
    const results: { c: (typeof ROUTING_EVAL)[number]; got: SimId | null }[] = [];
    const sources = new Map<string, number>();

    for (const c of ROUTING_EVAL) {
      const out = await routeQuestion(c.question);
      const got: SimId | null =
        out.ok && out.envelope.decision === "simulate" ? out.envelope.spec.sim_id : null;
      results.push({ c, got });
      const source = out.ok ? out.source : "error";
      sources.set(source, (sources.get(source) ?? 0) + 1);
      console.log(
        (got === c.expect ? "ok   " : "MISS ") +
          String(c.expect ?? "refuse").padEnd(11) +
          " -> " +
          String(got ?? "refuse").padEnd(11) +
          " [" +
          source +
          "] " +
          c.question,
      );
    }

    const s = scoreEval(results);
    console.log("\n--- routing eval, model path ---");
    console.log("overall    " + s.correct + "/" + s.total);
    console.log("named      " + s.byStyle.named.correct + "/" + s.byStyle.named.total);
    console.log("described  " + s.byStyle.described.correct + "/" + s.byStyle.described.total);
    console.log("refusals   " + s.refusals.correct + "/" + s.refusals.total);
    console.log("sources    " + [...sources].map(([k, v]) => k + "=" + v).join(", "));
    for (const f of s.failures) {
      console.log("  miss: expected " + (f.expected ?? "refuse") + ", got " + (f.got ?? "refuse") + " — " + f.question);
    }

    // Every call must have reached the model. A run that quietly fell back to
    // keywords would report a score that says nothing about the model at all.
    expect(sources.get("keyword-fallback") ?? 0).toBe(0);
    expect(s.correct / s.total).toBeGreaterThan(0.85);
    expect(s.refusals.correct / s.refusals.total).toBeGreaterThanOrEqual(0.8);
  });
});
