"use client";

/**
 * The question box, and the routing transparency panel under it.
 *
 * The panel is not decoration. The single most useful thing this project can
 * show someone is exactly how much the model is trusted with, and the honest
 * way to show that is to print what it actually returned next to what the
 * simulator actually did. A claim that "the model never writes the physics" is
 * worth nothing if the only evidence is a sentence in a README.
 *
 * So: the model's reasoning, whether it was the model or the keyword fallback,
 * how long it took, and the raw JSON — which is a sim_id, some numbers and
 * some booleans, and demonstrably contains nothing else.
 */

import { useState } from "react";
import type { RouteEnvelope } from "@/lib/sim/spec";

export type RouteResponse = {
  ok: boolean;
  envelope?: RouteEnvelope;
  source?: string;
  raw?: string;
  attempts?: number;
  elapsedMs?: number;
  note?: string;
  error?: string;
};

type Props = {
  onRouted: (envelope: RouteEnvelope, question: string) => void;
  examples: string[];
};

const SOURCE_LABEL: Record<string, string> = {
  model: "routed by the model",
  "model-repaired": "routed by the model, after one schema repair",
  "keyword-fallback": "matched by keyword — no model in the loop",
};

export default function AskBox({ onRouted, examples }: Props) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState<RouteResponse | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setResponse(null);
    try {
      const res = await fetch("/api/route-question", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = (await res.json()) as RouteResponse;
      setResponse(data);
      if (data.ok && data.envelope?.decision === "simulate") {
        onRouted(data.envelope, trimmed);
      }
    } catch (err) {
      setResponse({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  const envelope = response?.envelope;

  return (
    <section className="mb-6 rounded-lg border border-zinc-300 bg-white p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(question);
        }}
      >
        <label htmlFor="ask" className="block text-sm font-medium text-zinc-800">
          What are you confused about?
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="ask"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. when a truck hits a car, which one feels the bigger force?"
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy || question.trim().length === 0}
            className={
              "rounded-md px-4 py-2 text-sm font-medium " +
              (busy || question.trim().length === 0
                ? "cursor-not-allowed bg-zinc-200 text-zinc-400"
                : "bg-zinc-900 text-white hover:bg-zinc-700")
            }
          >
            {busy ? "Choosing…" : "Find me a simulation"}
          </button>
        </div>
      </form>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setQuestion(ex);
              void ask(ex);
            }}
            className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-100"
          >
            {ex}
          </button>
        ))}
      </div>

      {response && (
        <div className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-3">
          {response.ok === false && (
            <p className="text-sm text-red-700">{response.error}</p>
          )}

          {envelope && (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {envelope.decision === "abstain" ? "It declined" : "How it chose"}
                </span>
                <span className="font-mono text-[11px] text-zinc-500">
                  {SOURCE_LABEL[response.source ?? ""] ?? response.source} ·{" "}
                  {response.elapsedMs}ms
                  {response.attempts && response.attempts > 1
                    ? " · " + response.attempts + " attempts"
                    : ""}
                </span>
              </div>

              <p className="mt-1.5 text-sm italic text-zinc-700">{envelope.reasoning}</p>

              {envelope.decision === "abstain" && (
                <div className="mt-2 rounded border-l-4 border-amber-500 bg-white px-3 py-2">
                  <p className="text-sm text-zinc-800">{envelope.why_not}</p>
                  {envelope.suggested_instead.length > 0 && (
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-xs text-zinc-600">
                      {envelope.suggested_instead.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
                    Refusing is a normal outcome here, not a failure. Running a projectile
                    simulation at someone asking about electric fields would leave them
                    thinking they had been answered.
                  </p>
                </div>
              )}

              {response.note && (
                <p className="mt-2 text-[11px] leading-relaxed text-amber-800">{response.note}</p>
              )}

              <button
                onClick={() => setShowRaw((s) => !s)}
                className="mt-2 text-[11px] text-zinc-500 underline hover:text-zinc-800"
              >
                {showRaw ? "hide" : "show"} everything the model returned
              </button>

              {showRaw && (
                <>
                  <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 font-mono text-[11px] leading-relaxed text-zinc-100">
                    {response.raw ?? JSON.stringify(envelope, null, 2)}
                  </pre>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
                    A simulator name from a fixed list of eight, some numbers inside ranges the
                    schema enforces, and some booleans. There is no field in this schema that a
                    physical claim could be written into — so there is nothing here for a prompt
                    injection to reach.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
