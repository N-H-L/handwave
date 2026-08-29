"use client";

/**
 * Renderer for the probability sims: counted outcomes, and scalars against
 * trial number.
 *
 * A separate component from SimCanvas on purpose. A trajectory and a
 * distribution are different claims about the world, and the thing that makes
 * a probability sim honest — PLAN §3 rule 8 — is that it shows the
 * DISTRIBUTION rather than a trajectory. A single run of a random process
 * teaches nothing and can actively reward a false belief. Sharing a renderer
 * between the two would have invited exactly the animated-single-run treatment
 * the rule forbids.
 *
 * Both modes keep the axis rules from the mechanics side: domains are computed
 * once for the whole run and held, so bars grow against a fixed ceiling and a
 * converging line converges instead of being permanently rescaled into a
 * wiggle.
 */

import { useEffect, useRef } from "react";
import { INK, OKABE_ITO } from "@/lib/palette";
import type { Trace } from "@/lib/sim/types";

type Props = {
  trace: Trace;
  runKey: number;
  playbackRate: number;
  frozen?: boolean;
  onProgress?: (t: number) => void;
  onDone?: () => void;
};

const MONO = "11px ui-monospace, SFMono-Regular, Menlo, monospace";

function niceCeiling(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 1.5, 2, 3, 5, 7.5, 10]) {
    if (v <= m * mag) return m * mag;
  }
  return 10 * mag;
}

export default function DistributionCanvas({
  trace,
  runKey,
  playbackRate,
  frozen = false,
  onProgress,
  onDone,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    let raf = 0;
    let start: number | null = null;

    const frames = trace.frames;
    const last = frames[frames.length - 1];
    const view = trace.view;

    // Domains computed ONCE, from the finished run, and held for the whole
    // animation. Fitting them to the current frame would make every bar look
    // the same height at every instant, which is the opposite of the point.
    const histCeilings = (last.histograms ?? []).map((h, i) =>
      niceCeiling(
        Math.max(
          ...frames.flatMap((f) => f.histograms?.[i]?.counts ?? [0]),
          ...(h.expected ?? [0]),
        ),
      ),
    );

    const seriesDomains = (view.series ?? []).map((s) => {
      if (s.domain) return s.domain;
      const vals = frames.flatMap((f) => {
        const out = [f.scalars[s.key]];
        if (s.companion) out.push(f.scalars[s.companion.key]);
        return out;
      });
      const finite = vals.filter((v) => Number.isFinite(v));
      const hi = niceCeiling(Math.max(...finite, 0));
      return [Math.min(0, ...finite), hi] as [number, number];
    });

    const xKey = view.seriesX?.key ?? "trials_done";
    const xMax = Math.max(...frames.map((f) => f.scalars[xKey] ?? 0), 1);

    const draw = (upTo: number) => {
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";

      const ctx = canvas.getContext("2d");
      // See SimCanvas: a missing 2D context is a real possibility, not a bug.
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.font = MONO;

      // Which frame the playhead is on.
      let idx = 0;
      for (let i = 0; i < frames.length; i++) {
        if (frames[i].t > upTo) break;
        idx = i;
      }
      const frame = frames[idx];
      onProgress?.(frame.t);

      if (view.kind === "histogram") {
        drawHistograms(ctx, cssW, cssH, frame, histCeilings, view.yLabel);
      } else {
        drawSeries(ctx, cssW, cssH, frames, idx, view, seriesDomains, xKey, xMax);
      }
    };

    const total = last.t;

    if (frozen) {
      draw(frames[0].t);
      const ro = new ResizeObserver(() => draw(frames[0].t));
      ro.observe(wrap);
      return () => ro.disconnect();
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      draw(total);
      onDone?.();
      const ro = new ResizeObserver(() => draw(total));
      ro.observe(wrap);
      return () => ro.disconnect();
    }

    // Trials accumulate over a fixed wall-clock span rather than in real time:
    // twenty thousand coin flips have no natural duration, and the only thing
    // the animation is for is showing the shape settling down.
    const SPAN_SECONDS = 3.5;
    let current = total;
    const tick = (now: number) => {
      if (start === null) start = now;
      const progress = ((now - start) / 1000 / SPAN_SECONDS) * playbackRate;
      current = Math.min(progress * total, total);
      draw(current);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else onDone?.();
    };
    raf = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => draw(current));
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace, runKey, playbackRate, frozen]);

  const label =
    trace.view.kind === "histogram"
      ? "Bar chart of counted outcomes over " + (trace.outcome.trials_run ?? "many") + " trials."
      : "Line charts of running statistics against the number of trials.";

  return (
    <div ref={wrapRef} className="h-full w-full">
      <canvas ref={canvasRef} role="img" aria-label={label} />
    </div>
  );
}

// ── histogram mode ──────────────────────────────────────────────────────────

function drawHistograms(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frame: { histograms?: { label: string; binLabels: string[]; counts: number[]; expected?: number[]; emphasis?: number[] }[] },
  ceilings: number[],
  yLabel: string,
) {
  const hists = frame.histograms ?? [];
  if (hists.length === 0) return;
  const panelH = h / hists.length;

  hists.forEach((hist, hi) => {
    const top = hi * panelH;
    const pad = { left: 52, right: 14, top: 22, bottom: 26 };
    const plotW = w - pad.left - pad.right;
    const plotH = panelH - pad.top - pad.bottom;
    const ceiling = ceilings[hi] || 1;

    ctx.fillStyle = INK.label;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(hist.label, pad.left, top + 11);

    // Axis and a couple of gridlines, fixed for the whole run.
    ctx.strokeStyle = INK.grid;
    ctx.lineWidth = 1;
    for (const frac of [0, 0.5, 1]) {
      const y = top + pad.top + plotH - frac * plotH;
      ctx.beginPath();
      ctx.moveTo(pad.left, Math.round(y) + 0.5);
      ctx.lineTo(pad.left + plotW, Math.round(y) + 0.5);
      ctx.stroke();
      ctx.fillStyle = INK.label;
      ctx.textAlign = "right";
      ctx.fillText(String(Math.round(frac * ceiling)), pad.left - 6, y);
    }

    const n = hist.counts.length;
    const slot = plotW / n;
    const barW = Math.max(4, slot * 0.62);

    hist.counts.forEach((count, i) => {
      const x = pad.left + slot * i + (slot - barW) / 2;
      const barH = Math.max(0, (count / ceiling) * plotH);
      const y = top + pad.top + plotH - barH;

      ctx.fillStyle = hist.emphasis?.includes(i) ? OKABE_ITO.vermillion : OKABE_ITO.blue;
      ctx.fillRect(x, y, barW, barH);

      ctx.fillStyle = INK.label;
      ctx.textAlign = "center";
      ctx.fillText(hist.binLabels[i] ?? String(i), x + barW / 2, top + pad.top + plotH + 12);
    });

    // Expected value as a short dashed rule across each bar. Drawn per bar
    // rather than as one line because the expectation is per bin.
    if (hist.expected) {
      ctx.strokeStyle = OKABE_ITO.orange;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      hist.expected.forEach((exp, i) => {
        const x = pad.left + slot * i + (slot - barW) / 2;
        const y = top + pad.top + plotH - (exp / ceiling) * plotH;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + barW + 3, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.fillStyle = OKABE_ITO.orange;
      ctx.textAlign = "right";
      ctx.fillText("expected", w - pad.right, top + 11);
    }

    ctx.fillStyle = INK.label;
    ctx.textAlign = "left";
    ctx.fillText(yLabel, 4, top + pad.top + plotH / 2);
  });
}

// ── series mode ─────────────────────────────────────────────────────────────

function drawSeries(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  frames: { t: number; scalars: Record<string, number> }[],
  idx: number,
  view: Trace["view"],
  domains: [number, number][],
  xKey: string,
  xMax: number,
) {
  const series = view.series ?? [];
  if (series.length === 0) return;
  const panelH = h / series.length;

  series.forEach((spec, si) => {
    const top = si * panelH;
    const pad = { left: 58, right: 14, top: 20, bottom: 24 };
    const plotW = w - pad.left - pad.right;
    const plotH = panelH - pad.top - pad.bottom;
    const [lo, hi] = domains[si];

    const toX = (v: number) => pad.left + (v / xMax) * plotW;
    const toY = (v: number) => top + pad.top + plotH - ((v - lo) / (hi - lo || 1)) * plotH;

    ctx.fillStyle = INK.label;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(spec.label, pad.left, top + 10);

    ctx.strokeStyle = INK.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, top + pad.top);
    ctx.lineTo(pad.left, top + pad.top + plotH);
    ctx.lineTo(pad.left + plotW, top + pad.top + plotH);
    ctx.stroke();

    ctx.textAlign = "right";
    ctx.fillStyle = INK.label;
    ctx.fillText(fmtAxis(hi), pad.left - 6, top + pad.top + 4);
    ctx.fillText(fmtAxis(lo), pad.left - 6, top + pad.top + plotH - 4);

    // The value being converged to.
    if (spec.reference !== undefined) {
      const y = toY(spec.reference);
      ctx.strokeStyle = OKABE_ITO.orange;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + plotW, y);
      ctx.stroke();
      ctx.setLineDash([]);
      if (spec.referenceLabel) {
        ctx.fillStyle = OKABE_ITO.orange;
        ctx.textAlign = "left";
        ctx.fillText(spec.referenceLabel, pad.left + plotW - 28, y - 8);
      }
    }

    const line = (key: string, color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= idx; i++) {
        const x = frames[i].scalars[xKey] ?? 0;
        const v = frames[i].scalars[key];
        if (!Number.isFinite(v)) continue;
        const px = toX(x);
        const py = toY(v);
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };

    if (spec.companion) {
      line(spec.companion.key, OKABE_ITO.bluishGreen, 1.5);
      ctx.fillStyle = OKABE_ITO.bluishGreen;
      ctx.textAlign = "right";
      ctx.fillText(spec.companion.label, w - pad.right, top + 10);
    }
    line(spec.key, OKABE_ITO.blue, 2);

    ctx.fillStyle = INK.label;
    ctx.textAlign = "right";
    ctx.fillText(
      Math.round(frames[idx].scalars[xKey] ?? 0).toLocaleString(),
      pad.left + plotW,
      top + pad.top + plotH + 12,
    );
    ctx.textAlign = "left";
    ctx.fillText(view.seriesX?.label ?? "trials", pad.left, top + pad.top + plotH + 12);
  });
}

function fmtAxis(v: number): string {
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v) >= 1000) return v.toExponential(1);
  if (Number.isInteger(v)) return String(v);
  return v.toFixed(2);
}
