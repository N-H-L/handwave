/**
 * Minimal Gemini client. Server-side only.
 *
 * Written against the REST API with fetch rather than pulling in an SDK: the
 * whole surface used here is one endpoint and four config fields, and a
 * dependency that can change its request shape underneath a pinned schema is a
 * liability in the one place the system must not drift.
 *
 * Two settings are load-bearing and neither is a preference:
 *
 *  - `responseJsonSchema` constrains the DECODER, so the model cannot emit a
 *    parameter name that does not exist rather than merely being asked not to.
 *    The schema is generated from the same Zod definitions that validate the
 *    result, so the two cannot disagree.
 *
 *  - The reasoning field comes FIRST in that schema, and Gemini emits
 *    properties in declaration order. Tam et al. measured what happens when a
 *    model answers before it reasons: Claude-3-Haiku on GSM8K fell from 86.5%
 *    to 23.4%. Reasoning placed after the answer is not reasoning, it is
 *    justification.
 */

export type GeminiConfig = {
  apiKey: string;
  model: string;
  /** Milliseconds before giving up on a call. */
  timeoutMs?: number;
};

export type GeminiRequest = {
  systemInstruction: string;
  userText: string;
  jsonSchema: unknown;
  maxOutputTokens?: number;
  temperature?: number;
};

export type GeminiResult =
  | { ok: true; json: unknown; raw: string; usage?: Record<string, number> }
  | { ok: false; error: string; status?: number; raw?: string };

const DEFAULT_MODEL = "gemini-3-flash";
const DEFAULT_TIMEOUT_MS = 20000;

/**
 * Reads configuration from the environment. Returns null when no key is set,
 * which is a supported state rather than an error — the app falls back to a
 * deterministic router and says so on screen.
 */
export function geminiConfigFromEnv(): GeminiConfig | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return {
    apiKey,
    // Configurable because model names move faster than deployments do.
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  };
}

export async function callGemini(
  config: GeminiConfig,
  request: GeminiRequest,
): Promise<GeminiResult> {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(config.model) +
    ":generateContent";

  const body = {
    systemInstruction: { parts: [{ text: request.systemInstruction }] },
    contents: [{ role: "user", parts: [{ text: request.userText }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: request.jsonSchema,
      // Capped deliberately. A runaway generation is the documented failure
      // mode for this family of models, and there is no answer this task can
      // produce that needs more room than this.
      maxOutputTokens: request.maxOutputTokens ?? 2000,
      temperature: request.temperature ?? 0,
      // Routing is a classification, not a creative task. Minimal thinking
      // keeps time-to-first-token near a second instead of near ten.
      thinkingConfig: { thinkingLevel: "minimal" },
    },
    // Set explicitly rather than left to the defaults, which are OFF on this
    // model family. Physics questions occasionally read as violent — "what
    // happens when a truck hits a car" — and silent blocking would look like
    // a bug rather than a policy decision.
    safetySettings: [
      "HARM_CATEGORY_HARASSMENT",
      "HARM_CATEGORY_HATE_SPEECH",
      "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      "HARM_CATEGORY_DANGEROUS_CONTENT",
    ].map((category) => ({ category, threshold: "BLOCK_ONLY_HIGH" })),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Header, not a query parameter: a key in a URL ends up in logs,
        // proxies and browser history.
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      return { ok: false, error: shortenError(text), status: res.status };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: "The API returned something that is not JSON.", raw: text };
    }

    const payload = parsed as {
      candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
      usageMetadata?: Record<string, number>;
      promptFeedback?: { blockReason?: string };
    };

    if (payload.promptFeedback?.blockReason) {
      return { ok: false, error: "Blocked: " + payload.promptFeedback.blockReason };
    }

    const candidate = payload.candidates?.[0];
    const out = candidate?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";

    if (candidate?.finishReason === "MAX_TOKENS") {
      // Truncated JSON parses as nothing useful, and pretending otherwise
      // would send a half-formed spec into the validator.
      return { ok: false, error: "The model hit its output cap before finishing.", raw: out };
    }
    if (!out) {
      return { ok: false, error: "The model returned an empty response.", raw: text };
    }

    try {
      return { ok: true, json: JSON.parse(out), raw: out, usage: payload.usageMetadata };
    } catch {
      return { ok: false, error: "The model's output was not valid JSON.", raw: out };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("abort")) {
      return { ok: false, error: "The model did not answer in time." };
    }
    return { ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

/** Trim an API error down to something worth putting in a log line. */
function shortenError(text: string): string {
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string; status?: string } };
    const message = parsed.error?.message;
    if (message) return message.slice(0, 300);
  } catch {
    /* fall through to the raw text */
  }
  return text.slice(0, 300);
}
