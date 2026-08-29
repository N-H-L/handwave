/**
 * LLM #1 — route and parameterise.
 *
 * The student types a question. This picks one of the eight hand-written
 * simulators and fills in its parameters, or refuses. It never says anything
 * about physics, because it has no field in which to say it: the output schema
 * has room for a sim_id, some numbers, some booleans and a sentence of
 * reasoning about the CHOICE, and nothing else.
 *
 * The pipeline, and why each stage is here:
 *
 *   question
 *     -> constrained decode against a JSON Schema generated from the Zod
 *        schema, so parameter names cannot be invented
 *     -> Zod validation, which is authoritative and would reject the output
 *        even if the decoder let something through
 *     -> ONE repair attempt with the validation error fed back verbatim
 *     -> the simulator, which is deterministic and tested
 *
 * The single repair attempt is deliberate and the shape of it matters. Every
 * measurement of self-correction says the same thing: EXTRINSIC repair works
 * and INTRINSIC repair does not. Handing a model a real error message from a
 * real validator fixes things; asking it to check its own work produces
 * confident revisions of correct answers. So the repair prompt contains the
 * validator's output and nothing else, and there is exactly one round.
 */

import { z } from "zod";
import { catalogToPrompt, systemInstruction } from "./catalog";
import { callGemini, geminiConfigFromEnv, type GeminiConfig } from "./gemini";
import { keywordRoute } from "./fallback";
import { RouteEnvelopeSchema, type RouteEnvelope } from "@/lib/sim/spec";

export type RouteSource = "model" | "model-repaired" | "keyword-fallback";

export type RouteOutcome =
  | {
      ok: true;
      envelope: RouteEnvelope;
      source: RouteSource;
      /** Everything the model actually returned, for the transparency panel. */
      raw?: string;
      attempts: number;
      elapsedMs: number;
      note?: string;
    }
  | { ok: false; error: string; source: RouteSource; attempts: number; elapsedMs: number };

/**
 * The JSON Schema handed to the decoder, generated from the Zod schema that
 * validates the result. One definition, two uses — they cannot drift apart.
 */
export function routeJsonSchema(): unknown {
  return z.toJSONSchema(RouteEnvelopeSchema, {
    target: "draft-7",
    io: "input",
    // Inline everything. The decoder gets one self-contained document rather
    // than a graph of $refs it has to resolve.
    reused: "inline",
  });
}

const MAX_QUESTION_CHARS = 600;

export type RouteOptions = {
  config?: GeminiConfig | null;
  /** Injected in tests. */
  call?: typeof callGemini;
  now?: () => number;
};

export async function routeQuestion(
  question: string,
  options: RouteOptions = {},
): Promise<RouteOutcome> {
  const now = options.now ?? (() => Date.now());
  const started = now();
  const config = options.config !== undefined ? options.config : geminiConfigFromEnv();
  const call = options.call ?? callGemini;

  // Truncated rather than rejected. A student who pastes an entire problem set
  // should get a routed answer to the first part of it, not an error.
  const trimmed = question.trim().slice(0, MAX_QUESTION_CHARS);

  if (trimmed.length === 0) {
    return {
      ok: false,
      error: "Ask a question first.",
      source: "keyword-fallback",
      attempts: 0,
      elapsedMs: 0,
    };
  }

  if (!config) {
    const envelope = keywordRoute(trimmed);
    return {
      ok: true,
      envelope,
      source: "keyword-fallback",
      attempts: 0,
      elapsedMs: now() - started,
      note: "No GEMINI_API_KEY is set, so this was matched by keyword rather than by the model. The simulation and its guarantees are identical either way — only the choice of which one to run is degraded.",
    };
  }

  const schema = routeJsonSchema();
  const system = systemInstruction();
  let attempts = 0;
  let validationError: string | null = null;

  for (let round = 0; round < 2; round++) {
    attempts++;
    const userText =
      round === 0
        ? "Student question: " + trimmed
        : [
            "Student question: " + trimmed,
            "",
            "Your previous answer was rejected by the schema validator with this error:",
            validationError ?? "(unknown)",
            "",
            "Here is the catalogue again. Return a corrected answer. Do not change anything the validator did not complain about.",
            "",
            catalogToPrompt(),
          ].join("\n");

    const result = await call(config, {
      systemInstruction: system,
      userText,
      jsonSchema: schema,
      maxOutputTokens: 2000,
      temperature: 0,
    });

    if (!result.ok) {
      // A transport or API failure is not something a second prompt fixes.
      const envelope = keywordRoute(trimmed);
      return {
        ok: true,
        envelope,
        source: "keyword-fallback",
        attempts,
        elapsedMs: now() - started,
        note: "The model could not be reached (" + result.error + "), so this was matched by keyword instead.",
      };
    }

    const parsed = RouteEnvelopeSchema.safeParse(result.json);
    if (parsed.success) {
      return {
        ok: true,
        envelope: parsed.data,
        source: round === 0 ? "model" : "model-repaired",
        raw: result.raw,
        attempts,
        elapsedMs: now() - started,
      };
    }

    // The validator's own words, not a paraphrase. This is the part that makes
    // repair work — the model is being told a fact about its output rather
    // than being asked to reconsider.
    validationError = parsed.error.issues
      .map((i) => i.path.join(".") + ": " + i.message)
      .join("\n")
      .slice(0, 800);
  }

  // Two rounds and still invalid. Rather than force something through, fall
  // back to the deterministic router and say what happened.
  const envelope = keywordRoute(trimmed);
  return {
    ok: true,
    envelope,
    source: "keyword-fallback",
    attempts,
    elapsedMs: now() - started,
    note:
      "The model's answer did not satisfy the schema after a repair attempt (" +
      (validationError ?? "unknown") +
      "), so this was matched by keyword instead.",
  };
}
