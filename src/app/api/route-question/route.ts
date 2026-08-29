/**
 * POST /api/route-question
 *
 * Server-side only, because the API key must never reach the browser. The
 * client sends a question and gets back a validated spec or a refusal — never
 * anything the model wrote about physics, because the model is never asked.
 */

import { NextResponse } from "next/server";
import { routeQuestion } from "@/lib/llm/route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let question = "";
  try {
    const body = (await request.json()) as { question?: unknown };
    question = typeof body.question === "string" ? body.question : "";
  } catch {
    return NextResponse.json({ ok: false, error: "Expected a JSON body." }, { status: 400 });
  }

  const outcome = await routeQuestion(question);
  // 200 even for a refusal: abstention is a first-class result, not an error,
  // and treating it as one would push the UI toward hiding it.
  return NextResponse.json(outcome, { status: outcome.ok ? 200 : 400 });
}
