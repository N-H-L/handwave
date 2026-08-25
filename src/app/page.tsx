"use client";

/**
 * Day 1 harness: a projectile rendered from a plain spec object.
 *
 * No model is involved. The spec below is exactly the shape LLM #1 will emit
 * on day 8 — building the consumer first means the generator has a fixed,
 * already-working target to hit rather than the other way round.
 *
 * The prediction gate (day 5) slots in at the marked seam.
 */

import { useMemo, useState } from "react";
import InvariantPlot from "@/components/InvariantPlot";
import SimCanvas from "@/components/SimCanvas";
import { getSimulator, runSpec } from "@/lib/sim/registry";
import { PROJECTILE_DEFAULTS } from "@/lib/sim/sims/projectile";
import type { ProjectileParams } from "@/lib/sim/sims/projectile";

const SLOW = 0.35;
const FULL = 1;

type Preset = { label: string; params: Partial<ProjectileParams>; air: boolean };

const PRESETS: Preset[] = [
  { label: "Baseball, 45°", params: { speed_m_s: 40, angle_deg: 45 }, air: true },
  { label: "Same throw, no air", params: { speed_m_s: 40, angle_deg: 45 }, air: false },
  { label: "Shot put, 40°", params: { speed_m_s: 14, angle_deg: 40, mass_kg: 7.26, area_m2: 0.0113 }, air: true },
  { label: "Horizontal off a cliff", params: { speed_m_s: 15, angle_deg: 0, launch_height_m: 25 }, air: true },
  { label: "On the Moon", params: { speed_m_s: 20, angle_deg: 45, gravity_m_s2: 1.62 }, air: false },
];

export default function Home() {
  const [params, setParams] = useState<ProjectileParams>({
    ...PROJECTILE_DEFAULTS,
    speed_m_s: 40,
  });
  const [air, setAir] = useState(true);
  const [runKey, setRunKey] = useState(0);
  const [hasRun, setHasRun] = useState(false);
  const [t, setT] = useState(0);

  const sim = getSimulator("projectile");

  const spec = useMemo(
    () => ({
      sim_id: "projectile" as const,
      params,
      idealizations: { air_resistance: air },
    }),
    [params, air],
  );

  const trace = useMemo(() => runSpec(spec), [spec]);
  const closed = sim.closedForm(params, { air_resistance: air });
  const energy = trace.invariants.find((i) => i.key === "energy_j")!;
  const times = useMemo(() => trace.frames.map((f) => f.t), [trace]);

  const set = (k: keyof ProjectileParams) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams((p) => ({ ...p, [k]: Number(e.target.value) }));
    setHasRun(false);
  };

  const applyPreset = (p: Preset) => {
    setParams({ ...PROJECTILE_DEFAULTS, ...p.params });
    setAir(p.air);
    setHasRun(false);
    setRunKey((k) => k + 1);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Handwave</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-600">
          A hand-written, unit-tested simulator driven by a typed spec. The model never writes
          the physics — on day 8 it will choose this simulator and fill these parameters, and
          nothing else.
        </p>
      </header>

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
              onClick={() => setRunKey((k) => k + 1)}
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

          {/* ── seam: the day-5 prediction gate goes here. Until it exists,
              the outcome is revealed only after the run finishes, so the
              habit the gate enforces is already the default. ────────────── */}
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              What the simulator computed
            </h2>
            {hasRun ? (
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                <Readout label="range" value={trace.outcome.range_m} unit="m" />
                <Readout label="flight time" value={trace.outcome.flight_time_s} unit="s" />
                <Readout label="apex" value={trace.outcome.apex_m} unit="m" />
                <Readout label="impact angle" value={trace.outcome.impact_angle_deg} unit="°" />
              </dl>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">
                Hidden until the run finishes. Reading the answer before you commit to one is
                the failure mode this whole product exists to prevent.
              </p>
            )}

            {hasRun && closed && (
              <p className="mt-3 border-t border-zinc-200 pt-3 font-mono text-xs tabular-nums text-zinc-500">
                closed form (vacuum): range {closed.range_m.toFixed(3)} m · integrator error{" "}
                {(
                  (Math.abs(trace.outcome.range_m - closed.range_m) / closed.range_m) *
                  100
                ).toExponential(1)}
                %
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
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Parameters">
            <Slider label="speed" unit="m/s" min={1} max={100} step={1} value={params.speed_m_s} onChange={set("speed_m_s")} />
            <Slider label="angle" unit="°" min={-80} max={89} step={1} value={params.angle_deg} onChange={set("angle_deg")} />
            <Slider label="launch height" unit="m" min={0} max={100} step={1} value={params.launch_height_m} onChange={set("launch_height_m")} />
            <Slider label="mass" unit="kg" min={0.01} max={10} step={0.01} value={params.mass_kg} onChange={set("mass_kg")} />
            <Slider label="gravity" unit="m/s²" min={0.5} max={25} step={0.01} value={params.gravity_m_s2} onChange={set("gravity_m_s2")} />
          </Panel>

          <Panel title="Idealisations">
            {sim.idealizations.map((d) => (
              <div key={d.key}>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={air}
                    onChange={(e) => {
                      setAir(e.target.checked);
                      setHasRun(false);
                    }}
                    className="h-4 w-4"
                  />
                  {d.label}
                </label>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
                  {air ? d.whenOn : d.whenOff}
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

function Readout({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="font-mono tabular-nums">
        {value.toFixed(2)}
        <span className="ml-0.5 text-xs text-zinc-400">{unit}</span>
      </dd>
    </div>
  );
}

function Slider({
  label,
  unit,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-xs">
        <span className="text-zinc-600">{label}</span>
        <span className="font-mono tabular-nums text-zinc-900">
          {value}
          <span className="ml-0.5 text-zinc-400">{unit}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="mt-1 w-full accent-zinc-900"
      />
    </label>
  );
}
