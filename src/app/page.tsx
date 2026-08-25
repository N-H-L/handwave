"use client";

/**
 * Day 3 harness: three simulators, one generic shell.
 *
 * Nothing in this file knows any physics. Controls, idealisation toggles,
 * readouts and axis labels are all read off the simulator's own declarations,
 * so adding sim four and five is a registry entry rather than a UI change —
 * and the LLM's parameter schema and the on-screen sliders cannot drift apart,
 * because they are the same declaration.
 *
 * The prediction gate (day 5) slots in at the marked seam.
 */

import { useMemo, useState } from "react";
import InvariantPlot from "@/components/InvariantPlot";
import SimCanvas from "@/components/SimCanvas";
import { REGISTRY, defaultIdealizations, runSpec, type SimId } from "@/lib/sim/registry";
import { FREEFALL_DEFAULTS } from "@/lib/sim/sims/freefall";
import { PENDULUM_DEFAULTS } from "@/lib/sim/sims/pendulum";
import { PROJECTILE_DEFAULTS } from "@/lib/sim/sims/projectile";

const SLOW = 0.35;
const FULL = 1;

type Params = Record<string, number>;

const DEFAULTS: Record<SimId, Params> = {
  projectile: { ...PROJECTILE_DEFAULTS, speed_m_s: 40 },
  freefall: { ...FREEFALL_DEFAULTS },
  pendulum: { ...PENDULUM_DEFAULTS },
};

const SIM_ORDER: SimId[] = ["projectile", "freefall", "pendulum"];

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
  };

/** `impact_speed_m_s` -> { label: "impact speed", unit: "m/s" }. */
const UNIT_SUFFIXES: [string, string][] = [
  ["_m_s2", "m/s²"],
  ["_m_s", "m/s"],
  ["_rad_s", "rad/s"],
  ["_deg", "°"],
  ["_pct", "%"],
  ["_ms", "ms"],
  ["_m2", "m²"],
  ["_kg", "kg"],
  ["_m", "m"],
  ["_s", "s"],
  ["_j", "J"],
];

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
  });
  const [runKey, setRunKey] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const [t, setT] = useState(0);

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
  const energy = trace.invariants.find((i) => i.key === "energy_j")!;
  const times = useMemo(() => trace.frames.map((f) => f.t), [trace]);

  const reset = () => {
    setHasRun(false);
    setRunKey((k) => k + 1);
  };

  const setParam = (key: string, value: number) => {
    setAllParams((p) => ({ ...p, [simId]: { ...p[simId], [key]: value } }));
    setHasRun(false);
  };

  const setIdeal = (key: string, value: boolean) => {
    setAllIdeal((p) => ({ ...p, [simId]: { ...p[simId], [key]: value } }));
    setHasRun(false);
  };

  const chooseSim = (id: SimId) => {
    setSimId(id);
    setHasRun(false);
    setRunKey((k) => k + 1);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Handwave</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          Hand-written, unit-tested simulators driven by a typed spec. The model never writes
          the physics — on day 8 it will choose one of these and fill in its parameters, and
          nothing else.
        </p>
      </header>

      <nav className="mb-6 flex flex-wrap gap-2" aria-label="Simulation">
        {SIM_ORDER.map((id) => (
          <button
            key={id}
            onClick={() => chooseSim(id)}
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

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section>
          <div className="h-[26rem] w-full rounded-lg border border-zinc-200 bg-white">
            <SimCanvas
              trace={trace}
              runKey={runKey}
              playbackRate={hasRun ? FULL : SLOW}
              onProgress={setT}
              onDone={() => setHasRun(true)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={reset}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Replay
            </button>
            <span className="font-mono text-xs tabular-nums text-zinc-500">
              t = {t.toFixed(2)} s
            </span>
            <span className="ml-auto text-xs text-zinc-400">
              {hasRun ? "full speed" : "first run plays slowly"}
            </span>
          </div>

          {/* ── seam: the day-5 prediction gate goes here. Until it exists, the
              outcome is revealed only after the run finishes, so the habit the
              gate enforces is already the default. ─────────────────────────── */}
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              What the simulator computed
            </h2>
            {hasRun ? (
              <>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  {Object.entries(trace.outcome)
                    .filter(([k]) => k !== "landed")
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
              </>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                Hidden until the run finishes. Reading the answer before you commit to one is
                the failure mode this whole product exists to prevent.
              </p>
            )}
          </div>

          <div className="mt-4">
            <InvariantPlot series={energy} times={times} playhead={t} unit="J" />
          </div>
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
                    reset();
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
