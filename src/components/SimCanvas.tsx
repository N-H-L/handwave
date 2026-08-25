"use client";

/**
 * Two-layer Canvas 2D renderer for a Trace.
 *
 * Static layer  — axes, grid, ground, labels. Redrawn only when the trace or
 *                 the element size changes.
 * Dynamic layer — trail and body. Cleared and redrawn each frame.
 *
 * Design constraints, each traceable to docs/PLAN.md §3:
 *  - Axis domains are fixed for the whole run, never rescaled mid-animation.
 *    Heer & Robertson: rescaling makes change estimation harder, and change
 *    estimation is the entire task we set the student.
 *  - Uniform x/y scale, so a 45° launch looks like 45°. The axis with slack
 *    shows more of the world rather than being stretched.
 *  - Trial 1 plays slowly enough to narrate (Tversky's Apprehension
 *    Principle); replays run at full speed.
 *  - `prefers-reduced-motion` draws the completed path instead of animating.
 */

import { useEffect, useRef } from "react";
import { INK, OKABE_ITO } from "@/lib/palette";
import type { Trace } from "@/lib/sim/types";

type Props = {
  trace: Trace;
  /** Increment to replay. */
  runKey: number;
  playbackRate: number;
  /**
   * Hold the very first frame and do not animate. This is what the prediction
   * gate shows: the student needs to SEE the setup in order to predict about
   * it, and must not see it resolve.
   */
  frozen?: boolean;
  /**
   * The student's committed prediction, drawn on the same axes as the outcome.
   * Kendeou's KReC model: coactivation of the old belief and the new
   * information is the necessary condition for revision. Putting the
   * prediction anywhere but here breaks that.
   */
  ghost?: { axis: "x" | "y"; value: number; label: string } | null;
  onProgress?: (t: number) => void;
  onDone?: () => void;
};

const PAD = { left: 56, right: 20, top: 20, bottom: 40 };
const MONO = "11px ui-monospace, SFMono-Regular, Menlo, monospace";

/** Direct-labelled series colours, Okabe-Ito order. */
function bodyColor(i: number): string {
  const ramp = [OKABE_ITO.blue, OKABE_ITO.vermillion, OKABE_ITO.bluishGreen, OKABE_ITO.orange];
  return ramp[i % ramp.length];
}

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export default function SimCanvas({
  trace,
  runKey,
  playbackRate,
  frozen = false,
  ghost = null,
  onProgress,
  onDone,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const staticRef = useRef<HTMLCanvasElement>(null);
  const dynamicRef = useRef<HTMLCanvasElement>(null);
  const geomRef = useRef<{
    toPx: (x: number, y: number) => [number, number];
    w: number;
    h: number;
  } | null>(null);

  // ── static layer ────────────────────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    const s = staticRef.current;
    const d = dynamicRef.current;
    if (!wrap || !s || !d) return;

    const draw = () => {
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;
      if (cssW === 0 || cssH === 0) return;
      const dpr = window.devicePixelRatio || 1;

      for (const c of [s, d]) {
        c.width = Math.round(cssW * dpr);
        c.height = Math.round(cssH * dpr);
        c.style.width = cssW + "px";
        c.style.height = cssH + "px";
        c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const plotW = cssW - PAD.left - PAD.right;
      const plotH = cssH - PAD.top - PAD.bottom;
      const view = trace.view;
      const [dx0, dx1] = trace.domain.x;
      const [dy0, dy1] = trace.domain.y;

      // Uniform scale; the axis with room to spare shows more world.
      const scale = Math.min(plotW / (dx1 - dx0), plotH / (dy1 - dy0));
      const visX = plotW / scale;
      const visY = plotH / scale;

      const toPx = (x: number, y: number): [number, number] => [
        PAD.left + (x - dx0) * scale,
        PAD.top + plotH - (y - dy0) * scale,
      ];
      geomRef.current = { toPx, w: cssW, h: cssH };

      const ctx = s.getContext("2d");
      // A 2D context can genuinely be unavailable: too many live contexts in a
      // tab, a headless renderer, a browser with canvas disabled. Draw nothing
      // rather than take the page down with it.
      if (!ctx) return;
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.font = MONO;
      ctx.textBaseline = "middle";
      ctx.lineWidth = 1;

      const stepX = niceStep(visX, 6);
      const stepY = niceStep(visY, 5);

      if (view.xAxis) for (let gx = dx0; gx <= dx0 + visX + 1e-9; gx += stepX) {
        const [px] = toPx(gx, 0);
        ctx.strokeStyle = INK.grid;
        ctx.beginPath();
        ctx.moveTo(Math.round(px) + 0.5, PAD.top);
        ctx.lineTo(Math.round(px) + 0.5, PAD.top + plotH);
        ctx.stroke();
        ctx.fillStyle = INK.label;
        ctx.textAlign = "center";
        ctx.fillText(String(Number(gx.toFixed(2))), px, PAD.top + plotH + 16);
      }

      for (let gy = dy0; gy <= dy0 + visY + 1e-9; gy += stepY) {
        const [, py] = toPx(0, gy);
        ctx.strokeStyle = INK.grid;
        ctx.beginPath();
        ctx.moveTo(PAD.left, Math.round(py) + 0.5);
        ctx.lineTo(PAD.left + plotW, Math.round(py) + 0.5);
        ctx.stroke();
        ctx.fillStyle = INK.label;
        ctx.textAlign = "right";
        ctx.fillText(String(Number(gy.toFixed(2))), PAD.left - 8, py);
      }

      // Ground, only where the simulator says there is one.
      if (view.ground !== null) {
        const [, groundY] = toPx(0, view.ground);
        ctx.strokeStyle = INK.ground;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(PAD.left, Math.round(groundY) + 0.5);
        ctx.lineTo(PAD.left + plotW, Math.round(groundY) + 0.5);
        ctx.stroke();
      }

      // Static world geometry: the surface of a ramp, a wall.
      ctx.strokeStyle = INK.ground;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      for (const seg of view.segments) {
        const [sx, sy] = toPx(seg.from.x, seg.from.y);
        const [ex, ey] = toPx(seg.to.x, seg.to.y);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
      }

      // Fixed anchors for any links (a pendulum pivot).
      ctx.fillStyle = INK.ground;
      for (const link of view.links) {
        const [ax, ay] = toPx(link.from.x, link.from.y);
        ctx.beginPath();
        ctx.arc(ax, ay, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // The committed prediction, in Okabe-Ito orange against the blue of the
      // trajectory. Dashed, because it is a claim rather than a measurement.
      if (ghost && Number.isFinite(ghost.value)) {
        ctx.save();
        ctx.strokeStyle = INK.ghost;
        ctx.fillStyle = INK.ghost;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        if (ghost.axis === "x") {
          const [gx] = toPx(ghost.value, 0);
          ctx.moveTo(gx, PAD.top);
          ctx.lineTo(gx, PAD.top + plotH);
        } else {
          const [, gy] = toPx(0, ghost.value);
          ctx.moveTo(PAD.left, gy);
          ctx.lineTo(PAD.left + plotW, gy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = MONO;
        if (ghost.axis === "x") {
          const [gx] = toPx(ghost.value, 0);
          ctx.textAlign = gx > PAD.left + plotW * 0.75 ? "right" : "left";
          ctx.fillText(ghost.label, gx + (gx > PAD.left + plotW * 0.75 ? -6 : 6), PAD.top + 10);
        } else {
          const [, gy] = toPx(0, ghost.value);
          ctx.textAlign = "left";
          ctx.fillText(ghost.label, PAD.left + 6, gy - 8);
        }
        ctx.restore();
      }

      ctx.fillStyle = INK.label;
      ctx.textAlign = "center";
      ctx.fillText(view.xLabel, PAD.left + plotW / 2, cssH - 12);
      ctx.save();
      ctx.translate(14, PAD.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(view.yLabel, 0, 0);
      ctx.restore();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [trace, ghost]);

  // ── dynamic layer ───────────────────────────────────────────────────────
  useEffect(() => {
    const d = dynamicRef.current;
    if (!d) return;
    const ctx = d.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let start: number | null = null;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const view = trace.view;
    const frames = trace.frames;
    const total = frames[frames.length - 1].t;

    const paint = (upTo: number) => {
      const g = geomRef.current;
      if (!g) return;
      ctx.clearRect(0, 0, g.w, g.h);

      let last = frames[0];
      let lastIndex = 0;
      for (let i = 0; i < frames.length; i++) {
        if (frames[i].t > upTo) break;
        last = frames[i];
        lastIndex = i;
      }

      // One trail per body, so a two-object drop reads as two objects.
      if (view.trail) {
        for (let b = 0; b < last.bodies.length; b++) {
          ctx.strokeStyle = bodyColor(b);
          ctx.lineWidth = 2.5;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();
          for (let i = 0; i <= lastIndex; i++) {
            const p = frames[i].bodies[b].pos;
            const [px, py] = g.toPx(p.x, p.y);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
      }

      // Links back to their fixed anchors.
      ctx.strokeStyle = INK.ground;
      ctx.lineWidth = 1.5;
      for (const link of view.links) {
        const body = last.bodies[link.toBody];
        if (!body) continue;
        const [ax, ay] = g.toPx(link.from.x, link.from.y);
        const [bx2, by2] = g.toPx(body.pos.x, body.pos.y);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx2, by2);
        ctx.stroke();
      }

      for (let b = 0; b < last.bodies.length; b++) {
        const [bx, by] = g.toPx(last.bodies[b].pos.x, last.bodies[b].pos.y);
        ctx.fillStyle = bodyColor(b);
        ctx.beginPath();
        ctx.arc(bx, by, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (last.bodies.length > 1) {
          ctx.fillStyle = bodyColor(b);
          ctx.font = MONO;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(last.bodies[b].id, bx + 11, by);
        }
      }

      onProgress?.(Math.min(upTo, total));
    };

    // Frozen: paint the setup and stop. There is no code path from here to the
    // outcome that does not go through committing a prediction.
    if (frozen) {
      paint(0);
      return;
    }

    if (reduced) {
      paint(total);
      onDone?.();
      return;
    }

    const tick = (now: number) => {
      if (start === null) start = now;
      const simT = ((now - start) / 1000) * playbackRate;
      paint(Math.min(simT, total));
      if (simT < total) raf = requestAnimationFrame(tick);
      else onDone?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trace, runKey, playbackRate, frozen, ghost]);

  const label = frozen
    ? "The setup, held still. Commit a prediction to run it."
    : describe(trace);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas ref={staticRef} className="absolute inset-0" aria-hidden="true" />
      <canvas ref={dynamicRef} className="absolute inset-0" role="img" aria-label={label} />
    </div>
  );
}

/** Screen-reader description of what a completed run did. */
function describe(trace: Trace): string {
  const parts = Object.entries(trace.outcome)
    .filter(([k, v]) => Number.isFinite(v) && !["landed", "touched", "moved"].includes(k))
    .slice(0, 4)
    .map(([k, v]) => k.replace(/_/g, " ") + " " + v.toPrecision(4));
  return trace.simId + " run. " + parts.join(", ") + ".";
}
