"use client";

/**
 * The explanation, and the grounding verdict on it.
 *
 * Two things about the layout are deliberate.
 *
 * "Where your rule is right" comes FIRST and is not styled as a concession.
 * Both knowledge-in-pieces and warm-conceptual-change say the same thing: a
 * student's rule is usually a correct generalisation from a real domain, and
 * the useful move is to draw its boundary rather than to reject it. Putting it
 * after the correction, or in smaller type, turns it into a softener — which
 * is exactly what it must not be.
 *
 * The grounding verdict is shown whether it passes or fails. A check that is
 * only visible when it succeeds is marketing.
 */

import { OKABE_ITO } from "@/lib/palette";

export type ExplanationResponse = {
  ok: boolean;
  explanation?: {
    reasoning: string;
    where_your_rule_works: string;
    what_actually_happens: string;
    where_it_breaks: string;
    facts_used: string[];
  };
  grounding?: { ok: boolean; untraceable: string[] };
  error?: string;
  elapsedMs?: number;
};

export default function ExplanationPanel({
  state,
  onRequest,
}: {
  state: "idle" | "loading" | ExplanationResponse;
  onRequest: () => void;
}) {
  if (state === "idle") {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Explanation
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          The model has not seen this run yet. When it does, it gets the numbers the simulator
          computed and the assumptions it made — and nothing else. It is never asked what
          happens; it is told.
        </p>
        <button
          onClick={onRequest}
          className="mt-3 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Explain what just happened
        </button>
      </section>
    );
  }

  if (state === "loading") {
    return (
      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm text-zinc-500">Reading the numbers…</p>
      </section>
    );
  }

  if (!state.ok || !state.explanation) {
    return (
      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          No explanation
        </h2>
        <p className="mt-1.5 text-sm text-amber-900">{state.error}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-amber-800">
          Everything above still stands. The numbers came from a simulator that was tested
          against closed-form solutions before any model was involved.
        </p>
      </section>
    );
  }

  const e = state.explanation;
  const grounding = state.grounding;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Explanation
        </h2>
        <span className="font-mono text-[11px] text-zinc-400">{state.elapsedMs}ms</span>
      </div>

      <div
        className="mt-3 rounded border-l-4 bg-zinc-50 px-3 py-2.5"
        style={{ borderLeftColor: OKABE_ITO.bluishGreen }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Where your rule is right
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-800">{e.where_your_rule_works}</p>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-zinc-800">{e.what_actually_happens}</p>

      <div
        className="mt-4 rounded border-l-4 bg-zinc-50 px-3 py-2.5"
        style={{ borderLeftColor: OKABE_ITO.orange }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Where it stops holding
        </p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-800">{e.where_it_breaks}</p>
      </div>

      {grounding && (
        <div className="mt-4 border-t border-zinc-200 pt-3">
          <p className="font-mono text-[11px] tabular-nums text-zinc-500">
            grounding check ·{" "}
            {grounding.ok ? (
              <span className="text-emerald-700">
                every figure traced to the run
              </span>
            ) : (
              <span className="font-semibold text-red-700">
                {grounding.untraceable.length} figure
                {grounding.untraceable.length === 1 ? "" : "s"} could not be traced:{" "}
                {grounding.untraceable.join(", ")}
              </span>
            )}
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
            Every number in the text above is checked against what the simulator computed. This
            does not make the explanation true — it makes it impossible for the explanation to
            quote a number the simulation never produced.
          </p>
        </div>
      )}

      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-800">
          what the model was thinking, and which numbers it used
        </summary>
        <p className="mt-2 text-xs italic leading-relaxed text-zinc-600">{e.reasoning}</p>
        {e.facts_used.length > 0 && (
          <p className="mt-1.5 font-mono text-[11px] text-zinc-500">
            {e.facts_used.join(" · ")}
          </p>
        )}
      </details>
    </section>
  );
}
