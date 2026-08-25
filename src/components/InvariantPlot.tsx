"use client";

/**
 * The invariant trace, drawn at two scales.
 *
 * ABSOLUTE is the honest default: y runs from zero to a little above the
 * starting value, so a conserved quantity reads as a genuinely flat line and a
 * dissipating one reads as a visible decay. Autoscaling to the data would
 * magnify floating-point noise into a mountain range and make a perfect run
 * look broken — the same failure mode as rescaling the trajectory axes
 * mid-animation, one level down.
 *
 * TOLERANCE zooms to the pass/fail band so you can see how much headroom the
 * integrator actually has. It is the interesting view precisely because you
 * have to opt into it: the number under the chart is the claim, and this is
 * where you go to check it.
 */

import { useEffect, useRef, useState } from "react";
import { INK, OKABE_ITO } from "@/lib/palette";
import { relativeDrift } from "@/lib/sim/integrate";
import type { InvariantSeries } from "@/lib/sim/types";

type Props = {
  series: InvariantSeries;
  times: number[];
  unit?: string;
  /** Sim-time of the playhead, so the chart advances with the animation. */
  playhead?: number;
};

const PAD = { left: 58, right: 12, top: 10, bottom: 22 };
const MONO = "10px ui-monospace, SFMono-Regular, Menlo, monospace";

export default function InvariantPlot({ series, times, unit = "J", playhead }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState<"absolute" | "tolerance">("absolute");

  const values = series.values;
  const first = values[0] ?? 0;
  const drift = relativeDrift(values);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const draw = () => {
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";

      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.font = MONO;
      ctx.textBaseline = "middle";

      const plotW = cssW - PAD.left - PAD.right;
      const plotH = cssH - PAD.top - PAD.bottom;

      let min: number;
      let max: number;
      if (zoom === "absolute") {
        const hi = Math.max(...values, 0);
        min = Math.min(0, ...values);
        max = hi * 1.12 || 1;
      } else {
        // Centre on the mean and show the pass/fail band, with a floor so a
        // machine-precision-flat series does not divide by zero.
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const band = Math.max(Math.abs(mean) * series.tolerance, 1e-12);
        const spread = Math.max(band, Math.max(...values) - Math.min(...values));
        min = mean - spread * 1.6;
        max = mean + spread * 1.6;
      }

      const tMax = times[times.length - 1] || 1;
      const toX = (t: number) => PAD.left + (t / tMax) * plotW;
      const toY = (v: number) => PAD.top + plotH - ((v - min) / (max - min || 1)) * plotH;

      // Tolerance band, only where it is wide enough to mean anything.
      if (series.law === "conserved") {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const band = Math.abs(mean) * series.tolerance;
        const yTop = toY(mean + band);
        const yBot = toY(mean - band);
        if (yBot - yTop > 1.5) {
          ctx.fillStyle = "rgba(0, 158, 115, 0.12)";
          ctx.fillRect(PAD.left, yTop, plotW, yBot - yTop);
        }
      }

      // Frame and y labels.
      ctx.strokeStyle = INK.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PAD.left, PAD.top);
      ctx.lineTo(PAD.left, PAD.top + plotH);
      ctx.lineTo(PAD.left + plotW, PAD.top + plotH);
      ctx.stroke();

      ctx.fillStyle = INK.label;
      ctx.textAlign = "right";
      const fmt = (v: number) =>
        zoom === "absolute" ? v.toFixed(1) : v.toPrecision(10).replace(/0+$/, "");
      ctx.fillText(fmt(max), PAD.left - 6, PAD.top + 4);
      ctx.fillText(fmt(min), PAD.left - 6, PAD.top + plotH - 4);

      ctx.textAlign = "left";
      ctx.fillText("t (s)", PAD.left, cssH - 8);
      ctx.textAlign = "right";
      ctx.fillText(tMax.toFixed(2), PAD.left + plotW, cssH - 8);

      // The series itself, up to the playhead.
      const cutoff = playhead ?? Infinity;
      ctx.strokeStyle = series.law === "conserved" ? OKABE_ITO.bluishGreen : OKABE_ITO.vermillion;
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < values.length; i++) {
        if (times[i] > cutoff) break;
        const x = toX(times[i]);
        const y = toY(values[i]);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [series, times, values, zoom, playhead, first]);

  const holds =
    series.law === "conserved"
      ? drift <= series.tolerance
      : values.every((v, i) => i === 0 || v <= values[i - 1] + series.tolerance * Math.abs(first));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {series.label} ({unit})
        </h2>
        <div className="flex items-center gap-1 text-[11px]">
          {(["absolute", "tolerance"] as const).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              aria-pressed={zoom === z}
              className={
                "rounded px-2 py-0.5 " +
                (zoom === z
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100")
              }
            >
              {z === "absolute" ? "absolute scale" : "zoom to tolerance"}
            </button>
          ))}
        </div>
      </div>

      <div ref={wrapRef} className="h-32 w-full">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={
            series.label +
            " over time. Declared " +
            series.law +
            ". Relative drift " +
            drift.toExponential(2) +
            " against a tolerance of " +
            series.tolerance.toExponential(0) +
            ". " +
            (holds ? "Holds." : "Violated.")
          }
        />
      </div>

      <p className="mt-2 font-mono text-[11px] tabular-nums text-zinc-500">
        law {series.law} · drift {drift.toExponential(2)} · tol{" "}
        {series.tolerance.toExponential(0)} ·{" "}
        <span className={holds ? "text-emerald-700" : "font-semibold text-red-700"}>
          {holds ? "holds" : "VIOLATED"}
        </span>
      </p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
        {series.law === "conserved"
          ? "Flat because velocity-Verlet is symplectic — its energy error stays bounded instead of drifting the way a Runge-Kutta integrator's does. Asserted here and in CI."
          : "Falling because drag is dissipative. The law changes with the idealisation; it is never switched off."}
      </p>
    </div>
  );
}
