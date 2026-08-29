/**
 * POST /api/explain
 *
 * Takes the SPEC rather than the trace. The simulators are deterministic, so
 * the server reproduces the identical run from the same spec — which means the
 * explanation is grounded in numbers the server computed itself, not in
 * numbers a browser sent it. A client that lied about what happened would be
 * explained the truth instead.
 */

import { NextResponse } from "next/server";
import { explainRun } from "@/lib/llm/explain";
import { runSpec } from "@/lib/sim/registry";

export const runtime = "nodejs";

type Body = {
  spec?: unknown;
  question?: string;
  rationale?: string;
  predictions?: { prompt: string; said: string; was: string }[];
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Expected a JSON body." }, { status: 400 });
  }

  let trace;
  try {
    trace = runSpec(body.spec);
  } catch {
    return NextResponse.json(
      { ok: false, error: "That is not a spec any simulator accepts." },
      { status: 400 },
    );
  }

  const outcome = await explainRun({
    question: typeof body.question === "string" ? body.question.slice(0, 600) : "",
    trace,
    predictions: Array.isArray(body.predictions) ? body.predictions.slice(0, 6) : [],
    rationale: typeof body.rationale === "string" ? body.rationale.slice(0, 1200) : "",
  });

  return NextResponse.json(outcome, { status: 200 });
}
