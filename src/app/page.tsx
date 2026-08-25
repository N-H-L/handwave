"use client";

/**
 * Day 5 harness: five simulators behind a prediction gate.
 *
 * Nothing in this file knows any physics. Controls, idealisation toggles,
 * readouts, invariant plots, prediction prompts and axis labels are all read
 * off the simulator's own declarations — so the LLM's parameter schema and the
 * on-screen sliders cannot drift apart, because they are the same declaration.
 *
 * The state machine is deliberately small and deliberately one-way:
 *
 *   predict  --commit-->  ready  --run-->  running  --finish-->  revealed
 *      ^                                                             |
 *      +-------------- any change to the setup ----------------------+
 *
 * There is no transition into `revealed` that does not pass through `commit`.
 * That is the entire mechanic, and it is enforced by the ABSENCE OF AN EDGE
 * rather than by a check somewhere that could be forgotten.
 */

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import InvariantPlot from "@/components/InvariantPlot";
import PredictionGate, { type Commitment, wordCount } from "@/components/PredictionGate";
import SimCanvas from "@/components/SimCanvas";
import {
  getServerSnapshot,
  getSnapshot,
  logPrediction,
  subscribe,
  summarise,
} from "@/lib/predictionLog";
import { REGISTRY, defaultIdealizations, runSpec, type SimId } from "@/lib/sim/registry";
import { COLLISION_DEFAULTS } from "@/lib/sim/sims/collision";
import { FREEFALL_DEFAULTS } from "@/lib/sim/sims/freefall";
import { INCLINE_DEFAULTS } from "@/lib/sim/sims/incline";
import { PENDULUM_DEFAULTS } from "@/lib/sim/sims/pendulum";
import { PROJECTILE_DEFAULTS } from "@/lib/sim/sims/projectile";

const SLOW = 0.35;
const FULL = 1;

type Params = Record<string, number>;

const DEFAULTS: Record<SimId, Params> = {
  projectile: { ...PROJECTILE_DEFAULTS, speed_m_s: 40 },
  freefall: { ...FREEFALL_DEFAULTS },
  pendulum: { ...PENDULUM_DEFAULTS },
  collision: { ...COLLISION_DEFAULTS },
  incline: { ...INCLINE_DEFAULTS },
};

const SIM_ORDER: SimId[] = ["projectile", "freefall", "pendulum", "collision", "incline"];

/** Presets exist to put the interesting case one click away on camera. */
const PRESETS: Record<SimId, { label: string; params?: Params; ideal?: Record<string, boolean> }[]> =
  {
    projectile: [
      { label: "Baseball, 45°", params: { speed_m_s: 40, angle_deg: 45 }, ideal: { air_resistance: true } },
      { label: "Same throw, vacuum", params: { speed_m_s: 40, angle_deg: 45 }, ideal: { air_resistance: false } },
      { label: "Off a cliff", params: { speed_m_s: 15, angle_deg: 0, launch_height_m: 25 } },
      { label: "On the Moon", params: { speed_m_s: 20, angle_deg: 45, gravity_m_s2: 1.62 }, ideal: { air_resistance: false } },
    ],
    freefall: [
      { label: "Shot put vs baseball", ideal: { air_resistance: true } },
      { label: "The same drop, vacuum", ideal: { air_resistance: false } },
      { label: "From 100 m", params: { drop_height_m: 100 }, ideal: { air_resistance: true } },
      { label: "Two identical balls", params: { mass_b_kg: 7.26, area_b_m2: 0.0113 } },
    ],
    pendulum: [
      { label: "Pulled back 10°", params: { release_angle_deg: 10 } },
      { label: "Pulled back 90°", params: { release_angle_deg: 90 } },
      { label: "90°, small-angle formula", params: { release_angle_deg: 90 }, ideal: { small_angle: true } },
      { label: "Nearly inverted, 170°", params: { release_angle_deg: 170 } },
    ],
    collision: [
      { label: "Truck hits car", ideal: { perfectly_elastic: false } },
      { label: "Same crash, elastic", ideal: { perfectly_elastic: true } },
      { label: "Equal masses", params: { mass_1_kg: 1000, velocity_1_m_s: 15, mass_2_kg: 1000, velocity_2_m_s: -15 }, ideal: { perfectly_elastic: true } },
      { label: "Stiffer contact", params: { contact_stiffness_n_m: 8e6 } },
      { label: "Nearly sticking", params: { restitution: 0.02 } },
    ],
    incline: [
      { label: "2 kg block, 30°", params: { mass_kg: 2 } },
      { label: "20 kg block, 30°", params: { mass_kg: 20 } },
      { label: "Too shallow to move, 15°", params: { incline_angle_deg: 15 } },
      { label: "Frictionless", ideal: { friction: false } },
    ],
  };

/** `impact_speed_m_s` -> { label: "impact speed", unit: "m/s" }. */
const UNIT_SUFFIXES: [string, string][] = [
  ["_m_s2", "m/s²"],
  ["_m_s", "m/s"],
  ["_rad_s", "rad/s"],
  ["_deg", "°"],
  ["_pct", "%"],
  ["_ms", "ms"],
  ["_ns", "N·s"],
  ["_n", "N"],
  ["_m2", "m²"],
  ["_kg", "kg"],
  ["_m", "m"],
  ["_s", "s"],
  ["_j", "J"],
];

/** Internal flags and inputs echoed back; not results the student asked for. */
const HIDDEN_OUTCOMES = ["landed", "touched", "moved", "launch_angle_deg", "release_angle_deg"];

function splitKey(key: string): { label: string; unit: string } {
  for (const [suffix, unit] of UNIT_SUFFIXES) {
    if (key.endsWith(suffix)) {
      return { label: key.slice(0, -suffix.length).replace(/_/g, " "), unit };
    }
  }
  return { label: key.replace(/_/g, " "), unit: "" };
}

function fmt(v: number): string {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  if (abs !== 0 && (abs < 0.01 || abs >= 1e5)) return v.toExponential(2);
  return v.toFixed(abs < 10 ? 3 : 2);
}

export default function Home() {
  const [simId, setSimId] = useState<SimId>("projectile");
  const [allParams, setAllParams] = useState<Record<SimId, Params>>(DEFAULTS);
  const [allIdeal, setAllIdeal] = useState<Record<SimId, Record<string, boolean>>>({
    projectile: defaultIdealizations("projectile"),
    freefall: defaultIdealizations("freefall"),
    pendulum: defaultIdealizations("pendulum"),
    collision: defaultIdealizations("collision"),
    incline: defaultIdealizations("incline"),
  });

  const [committed, setCommitted] = useState<Commitment | null>(null);
  const [started, setStarted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [t, setT] = useState(0);
  const [seenSetup, setSeenSetup] = useState("");

  const log = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const sim = REGISTRY[simId];
  const params = allParams[simId];
  const ideal = allIdeal[simId];

  const spec = useMemo(
    () => ({ sim_id: simId, params, idealizations: ideal }),
    [simId, params, ideal],
  );
  const trace = useMemo(() => runSpec(spec), [spec]);
  const closed = useMemo(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => sim.closedForm(params as any, ideal),
    [sim, params, ideal],
  );
  const times = useMemo(() => trace.frames.map((f) => f.t), [trace]);

  /** Identity of the current setup. A prediction is a claim about exactly this. */
  const setupKey = useMemo(() => JSON.stringify(spec), [spec]);

  // Changing anything about the setup voids the commitment and re-closes the
  // gate. Deliberate: a prediction made about a 45-degree launch is not a
  // prediction about a 20-degree one, and letting it stand would quietly turn
  // the mechanic into a scoreboard.
  //
  // Adjusted during render, not in an effect: an effect would let one frame
  // through in which the outcome is on screen for a setup nobody predicted.
  // For this particular reset that frame is the entire bug.
  if (setupKey !== seenSetup) {
    setSeenSetup(setupKey);
    setCommitted(null);
    setStarted(false);
    setRevealed(false);
    setT(0);
  }

  // Log once per revealed run, not once per render.
  const loggedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!revealed || !committed) return;
    const stamp = setupKey + "#" + runKey;
    if (loggedFor.current === stamp) return;
    loggedFor.current = stamp;

    const resolved: Record<string, string | number> = {};
    for (const target of sim.predictions) {
      resolved[target.key] =
        target.kind === "choice" ? target.resolve(trace) : trace.outcome[target.key];
    }
    logPrediction({
      ts: Date.now(),
      simId,
      setupKey,
      values: committed.values,
      resolved,
      rationale: committed.rationale,
      words: wordCount(committed.rationale),
      thinkingMs: committed.thinkingMs,
    });
  }, [revealed, committed, setupKey, runKey, sim, simId, trace]);

  const ghostTarget = sim.predictions.find(
    (p) => p.kind === "numeric" && p.ghostAxis !== undefined,
  );
  const ghost =
    committed && ghostTarget && ghostTarget.kind === "numeric" && ghostTarget.ghostAxis
      ? {
          axis: ghostTarget.ghostAxis,
          value: Number(committed.values[ghostTarget.key]),
          label: "your prediction",
        }
      : null;

  const setParam = (key: string, value: number) =>
    setAllParams((p) => ({ ...p, [simId]: { ...p[simId], [key]: value } }));

  const setIdeal = (key: string, value: boolean) =>
    setAllIdeal((p) => ({ ...p, [simId]: { ...p[simId], [key]: value } }));

  const summary = summarise(log);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Handwave</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Hand-written, unit-tested simulators behind a prediction gate. The model never
          writes the physics — on day 8 it will choose one of these and fill in its
          parameters, and nothing else.
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Simulation">
        {SIM_ORDER.map((id) => (
          <button
            key={id}
            onClick={() => setSimId(id)}
            aria-current={id === simId ? "page" : undefined}
            className={
              "rounded-md px-3 py-1.5 text-sm " +
              (id === simId
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100")
            }
          >
            {REGISTRY[id].title}
          </button>
        ))}
      </nav>

      <p className="mb-4 text-base text-zinc-800">{sim.question}</p>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section>
          <div className="relative h-[26rem] w-full rounded-lg border border-zinc-200 bg-white">
            <SimCanvas
              trace={trace}
              runKey={runKey}
              playbackRate={revealed ? FULL : SLOW}
              frozen={!started}
              ghost={ghost}
              onProgress={setT}
              onDone={() => setRevealed(true)}
            />
            {!started && (
              <div className="pointer-events-none absolute left-3 top-3 rounded bg-zinc-900/85 px-2 py-1 text-[11px] font-medium text-white">
                {committed ? "ready to run" : "the setup — not running yet"}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              disabled={!committed}
              onClick={() => {
                setStarted(true);
                setRevealed(false);
                setT(0);
                setRunKey((k) => k + 1);
              }}
              className={
                "rounded-md px-4 py-2 text-sm font-medium " +
                (committed
                  ? "bg-zinc-900 text-white hover:bg-zinc-700"
                  : "cursor-not-allowed bg-zinc-200 text-zinc-400")
              }
            >
              {committed ? (revealed ? "Run again" : "Run it") : "Locked — predict first"}
            </button>
            <span className="font-mono text-xs tabular-nums text-zinc-500">
              t = {t.toFixed(2)} s
            </span>
            <span className="ml-auto text-xs text-zinc-400">
              {!started ? "held at the setup" : revealed ? "full speed" : "first run plays slowly"}
            </span>
          </div>

          <div className="mt-4">
            <PredictionGate
              targets={sim.predictions}
              setupKey={setupKey}
              committed={committed}
              onCommit={setCommitted}
              trace={trace}
              revealed={revealed}
            />
          </div>

          {revealed && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                What the simulator computed
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                {Object.entries(trace.outcome)
                  .filter(([k]) => !HIDDEN_OUTCOMES.includes(k))
                  .map(([k, v]) => {
                    const { label, unit } = splitKey(k);
                    return (
                      <div key={k}>
                        <dt className="text-xs text-zinc-500">{label}</dt>
                        <dd className="font-mono tabular-nums">
                          {fmt(v)}
                          <span className="ml-0.5 text-xs text-zinc-400">
                            {Number.isFinite(v) ? unit : ""}
                          </span>
                        </dd>
                      </div>
                    );
                  })}
              </dl>
              {closed && (
                <p className="mt-3 border-t border-zinc-200 pt-3 font-mono text-[11px] leading-relaxed tabular-nums text-zinc-500">
                  closed form:{" "}
                  {Object.entries(closed)
                    .filter(([k]) => k in trace.outcome && Number.isFinite(closed[k]))
                    .map(([k, v]) => {
                      const err =
                        v === 0
                          ? Math.abs(trace.outcome[k])
                          : Math.abs(trace.outcome[k] - v) / Math.abs(v);
                      return splitKey(k).label + " " + fmt(v) + " (err " + err.toExponential(1) + ")";
                    })
                    .join(" · ")}
                </p>
              )}
            </div>
          )}

          {revealed && (
            <div className="mt-4 space-y-4">
              {trace.invariants.map((series) => (
                <InvariantPlot key={series.key} series={series} times={times} playhead={t} />
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <Panel title="Presets">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS[simId].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    setAllParams((p) => ({
                      ...p,
                      [simId]: { ...DEFAULTS[simId], ...(preset.params ?? {}) },
                    }));
                    setAllIdeal((p) => ({
                      ...p,
                      [simId]: { ...defaultIdealizations(simId), ...(preset.ideal ?? {}) },
                    }));
                  }}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Parameters">
            {sim.controls.map((c) => (
              <label key={c.key} className="block">
                <span className="flex items-baseline justify-between text-xs">
                  <span className="text-zinc-600">{c.label}</span>
                  <span className="font-mono tabular-nums text-zinc-900">
                    {params[c.key]}
                    <span className="ml-0.5 text-zinc-400">{c.unit}</span>
                  </span>
                </span>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={params[c.key]}
                  onChange={(e) => setParam(c.key, Number(e.target.value))}
                  className="mt-1 w-full accent-zinc-900"
                />
              </label>
            ))}
          </Panel>

          <Panel title="Idealisations">
            {sim.idealizations.map((d) => (
              <div key={d.key}>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={ideal[d.key] === true}
                    onChange={(e) => setIdeal(d.key, e.target.checked)}
                    className="h-4 w-4"
                  />
                  {d.label}
                </label>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  {ideal[d.key] ? d.whenOn : d.whenOff}
                </p>
              </div>
            ))}
          </Panel>

          <Panel title="Where this model stops being true">
            <p className="text-xs leading-relaxed text-zinc-600">{sim.validity.summary}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-zinc-500">
              {sim.validity.breaksDownWhen.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </Panel>

          <Panel title="Gate 1 instrument">
            <p className="text-xs leading-relaxed text-zinc-500">
              Whether students write real predictions is the first thing that has to be
              true. Under 40% substantive and the mechanic fails. Stored in this browser
              only — nothing is sent anywhere.
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-xs tabular-nums">
              <dt className="text-zinc-500">logged</dt>
              <dd>{summary.total}</dd>
              <dt className="text-zinc-500">&gt;8 words</dt>
              <dd>
                {summary.substantive}
                {summary.total > 0 ? " (" + summary.substantivePct.toFixed(0) + "%)" : ""}
              </dd>
              <dt className="text-zinc-500">median words</dt>
              <dd>{summary.medianWords}</dd>
              <dt className="text-zinc-500">median think</dt>
              <dd>{summary.medianThinkingSec.toFixed(1)} s</dd>
            </dl>
          </Panel>

          <Panel title="The spec">
            <p className="mb-2 text-xs text-zinc-500">
              All a model is ever allowed to produce. Data, never code.
            </p>
            <pre className="overflow-x-auto rounded bg-zinc-900 p-3 font-mono text-[11px] leading-relaxed text-zinc-100">
              {JSON.stringify(spec, null, 2)}
            </pre>
          </Panel>
        </aside>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
