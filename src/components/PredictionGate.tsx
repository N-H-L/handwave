"use client";

/**
 * The prediction gate — the product, not a feature of it.
 *
 * Crouch, Fagen, Callan & Mazur (2004) is the one result in the whole research
 * corpus that survived an adversarial review intact: students who WATCHED a
 * demonstration scored no better than students who never saw it at all (24%
 * vs 22%, p = 0.64), while students who committed a prediction first showed
 * significantly greater understanding. delMas, Garfield & Chance (1999) put
 * the same effect at 16% → 72% for predict-and-confront against 22% → 49% for
 * guided discovery.
 *
 * Two consequences are load-bearing and neither is negotiable:
 *
 *  1. THE GATE CANNOT BE SKIPPED. There is no path to the outcome that does
 *     not go through a commitment. Not a nag, not a default, not a dismissible
 *     modal — the run does not exist until the student has said what they
 *     think will happen.
 *
 *  2. CHANGING THE SETUP VOIDS THE PREDICTION. A prediction is about a
 *     specific configuration. Move the launch angle after committing and the
 *     old commitment is no longer a claim about what is on screen, so it is
 *     discarded and the gate closes again. Letting it stand would quietly
 *     convert the mechanic into a scoreboard.
 *
 * What this component deliberately does NOT do is grade. It shows the
 * prediction beside the outcome and stops. No "incorrect", no red cross, no
 * score. Kendeou et al. Exp. 3 found the explanation alone was as effective as
 * refutation-plus-explanation, and PLAN §3 rule 5 is to attack the rule and
 * name where it works — which is day 9's job, with the real numbers in hand.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { OKABE_ITO } from "@/lib/palette";
import type { PredictionTarget, Trace } from "@/lib/sim/types";

export type Commitment = {
  values: Record<string, string | number>;
  rationale: string;
  /** Wall-clock ms spent between opening the gate and committing. */
  thinkingMs: number;
};

type Props = {
  targets: PredictionTarget[];
  /** Identity of the current setup. Changing it voids an existing commitment. */
  setupKey: string;
  committed: Commitment | null;
  onCommit: (c: Commitment) => void;
  /** The finished run, once it has been watched. Null while still animating. */
  trace: Trace | null;
  revealed: boolean;
};

/** The bar Gate 1 measures against: >8 words is "substantive". */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const MIN_WORDS = 3;

export default function PredictionGate({
  targets,
  setupKey,
  committed,
  onCommit,
  trace,
  revealed,
}: Props) {
  const [values, setValues] = useState<Record<string, string | number>>({});
  const [rationale, setRationale] = useState("");
  const [seenSetup, setSeenSetup] = useState(setupKey);

  // When this setup appeared on screen. A ref written from an effect, not
  // state computed during render: Date.now() is impure, and a render that
  // React discards and retries would silently restart the clock.
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, [setupKey]);

  // A new setup is a new question, so the draft is cleared with it.
  //
  // Adjusted during render rather than in an effect. React's own guidance:
  // an effect that calls setState renders once with the stale draft and again
  // with the cleared one, and for one frame the student sees their previous
  // answer attached to a question that is no longer on screen.
  if (setupKey !== seenSetup) {
    setSeenSetup(setupKey);
    setValues({});
    setRationale("");
  }

  const missing = targets.filter((t) => values[t.key] === undefined || values[t.key] === "");
  const words = wordCount(rationale);
  const ready = missing.length === 0 && words >= MIN_WORDS;

  const resolved = useMemo(() => {
    if (!trace) return null;
    const out: Record<string, string | number> = {};
    for (const t of targets) {
      out[t.key] = t.kind === "choice" ? t.resolve(trace) : trace.outcome[t.key];
    }
    return out;
  }, [trace, targets]);

  // ── after the run: prediction and outcome, side by side, staying put ──────
  if (committed && revealed && resolved) {
    return (
      <section className="rounded-lg border-2 border-zinc-300 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          What you said, and what happened
        </h2>

        <div className="mt-3 space-y-4">
          {targets.map((t) => {
            const said = committed.values[t.key];
            const was = resolved[t.key];
            return (
              <div key={t.key}>
                <p className="text-sm text-zinc-700">{t.prompt}</p>
                <div className="mt-1.5 grid grid-cols-2 gap-3">
                  <Cell
                    label="you said"
                    color={OKABE_ITO.orange}
                    text={display(t, said)}
                  />
                  <Cell label="it was" color={OKABE_ITO.blue} text={display(t, was)} />
                </div>
                {t.kind === "numeric" && typeof said === "number" && Number.isFinite(was as number) && (
                  <p className="mt-1 font-mono text-[11px] tabular-nums text-zinc-500">
                    {gapSentence(said, was as number, t.unit)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t border-zinc-200 pt-3">
          <p className="text-xs font-medium text-zinc-500">Your reasoning, as you wrote it</p>
          <p className="mt-1 whitespace-pre-wrap text-sm italic text-zinc-700">
            {committed.rationale}
          </p>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-zinc-400">
          Nothing here is marked right or wrong. Naming which rule produced that
          prediction, and where that rule genuinely holds, is the explainer&apos;s job — and it
          gets the numbers above to work from, not its own guess at the physics.
        </p>
      </section>
    );
  }

  // ── before the run: the gate ─────────────────────────────────────────────
  if (committed) {
    return (
      <section className="rounded-lg border-2 border-zinc-900 bg-zinc-900 p-4 text-white">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Prediction committed
        </h2>
        <p className="mt-2 text-sm">Run it and see.</p>
        <p className="mt-2 text-[11px] leading-relaxed text-zinc-400">
          Your prediction stays on screen next to the outcome. Changing any setting
          discards it — a prediction is about one specific setup.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border-2 border-zinc-900 bg-white p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-900">
        Before you can run it
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600">
        Watching a demonstration without committing to a prediction first measurably
        teaches nothing. So the button is locked until you say what you think will happen.
      </p>

      <div className="mt-4 space-y-5">
        {targets.map((t) => (
          <div key={t.key}>
            <label
              className="block text-sm font-medium text-zinc-800"
              htmlFor={"pred-" + t.key}
            >
              {t.prompt}
            </label>

            {t.kind === "numeric" ? (
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  id={"pred-" + t.key}
                  type="number"
                  inputMode="decimal"
                  value={values[t.key] === undefined ? "" : String(values[t.key])}
                  min={t.range[0]}
                  max={t.range[1]}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [t.key]: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className="w-32 rounded border border-zinc-300 px-2 py-1.5 font-mono text-sm tabular-nums"
                  placeholder="—"
                />
                <span className="text-sm text-zinc-500">{t.unit}</span>
                <span className="ml-auto font-mono text-[11px] text-zinc-400">
                  anywhere from {t.range[0]} to {t.range[1]}
                </span>
              </div>
            ) : (
              <div className="mt-1.5 space-y-1.5">
                {t.options.map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-start gap-2 text-sm text-zinc-700"
                  >
                    <input
                      type="radio"
                      name={t.key}
                      value={o.value}
                      checked={values[t.key] === o.value}
                      onChange={() => setValues((v) => ({ ...v, [t.key]: o.value }))}
                      className="mt-0.5"
                    />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-zinc-800" htmlFor="pred-rationale">
            Why? What is going on, in your own words.
          </label>
          <textarea
            id="pred-rationale"
            rows={3}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className="mt-1.5 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm"
            placeholder="Because..."
          />
          <p className="mt-1 font-mono text-[11px] tabular-nums text-zinc-400">
            {words} {words === 1 ? "word" : "words"}
            {words > 0 && words < MIN_WORDS ? " · a few more" : ""}
          </p>
        </div>
      </div>

      <button
        disabled={!ready}
        onClick={() =>
          onCommit({
            values,
            rationale: rationale.trim(),
            thinkingMs: openedAt.current === 0 ? 0 : Date.now() - openedAt.current,
          })
        }
        className={
          "mt-4 w-full rounded-md px-4 py-2.5 text-sm font-medium " +
          (ready
            ? "bg-zinc-900 text-white hover:bg-zinc-700"
            : "cursor-not-allowed bg-zinc-200 text-zinc-400")
        }
      >
        {ready ? "Commit prediction" : "Answer everything above to continue"}
      </button>
    </section>
  );
}

function Cell({ label, color, text }: { label: string; color: string; text: string }) {
  return (
    <div className="rounded border-l-4 bg-zinc-50 px-3 py-2" style={{ borderLeftColor: color }}>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-zinc-900">{text}</p>
    </div>
  );
}

function display(t: PredictionTarget, v: string | number | undefined): string {
  if (v === undefined) return "—";
  if (t.kind === "choice") {
    return t.options.find((o) => o.value === v)?.label ?? String(v);
  }
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(Math.abs(n) < 10 ? 2 : 1) + " " + t.unit;
}

/**
 * The size of the gap, stated as a fact rather than a verdict. "You were 36%
 * low" is information; "wrong" is a judgement, and the research says the
 * judgement is the part that does not help.
 */
function gapSentence(said: number, was: number, unit: string): string {
  const diff = was - said;
  if (was === 0) return "off by " + Math.abs(diff).toPrecision(3) + " " + unit;
  const pct = Math.abs(diff / was) * 100;
  if (pct < 2) return "within 2% of it";
  const dir = diff > 0 ? "low" : "high";
  return "off by " + Math.abs(diff).toPrecision(3) + " " + unit + " — " + pct.toFixed(0) + "% " + dir;
}
