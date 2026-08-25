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
import { INK } from "@/lib/palette";
import type { Trace } from "@/lib/sim/types";

type Props = {
  trace: Trace;
  /** Increment to replay. */
  runKey: number;
  playbackRate: number;
  onProgress?: (t: number) => void;
  onDone?: () => void;
};

const PAD = { left: 56, right: 20, top: 20, bottom: 40 };
const MONO = "11px ui-monospace, SFMono-Regular, Menlo, monospace";

function niceStep(range: number, target: number): number {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

export default function SimCanvas({ trace, runKey, playbackRate, onProgress, onDone }: Props) {
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
        c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      }

      const plotW = cssW - PAD.left - PAD.right;
      const plotH = cssH - PAD.top - PAD.bottom;
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

      const ctx = s.getContext("2d")!;
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.font = MONO;
      ctx.textBaseline = "middle";
      ctx.lineWidth = 1;

      const stepX = niceStep(visX, 6);
      const stepY = niceStep(visY, 5);

      for (let gx = dx0; gx <= dx0 + visX + 1e-9; gx += stepX) {
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

      // Ground.
      const [, groundY] = toPx(0, 0);
      ctx.strokeStyle = INK.ground;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PAD.left, Math.round(groundY) + 0.5);
      ctx.lineTo(PAD.left + plotW, Math.round(groundY) + 0.5);
      ctx.stroke();

      ctx.fillStyle = INK.label;
      ctx.textAlign = "center";
      ctx.fillText("horizontal distance (m)", PAD.left + plotW / 2, cssH - 12);
      ctx.save();
      ctx.translate(14, PAD.top + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("height (m)", 0, 0);
      ctx.restore();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [trace]);

  // ── dynamic layer ───────────────────────────────────────────────────────
  useEffect(() => {
    const d = dynamicRef.current;
    if (!d) return;
    const ctx = d.getContext("2d")!;
    let raf = 0;
    let start: number | null = null;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const frames = trace.frames;
    const total = frames[frames.length - 1].t;

    const paint = (upTo: number) => {
      const g = geomRef.current;
      if (!g) return;
      ctx.clearRect(0, 0, g.w, g.h);

      ctx.strokeStyle = INK.trail;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();

      let last = frames[0];
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        if (f.t > upTo) break;
        const [px, py] = g.toPx(f.bodies[0].pos.x, f.bodies[0].pos.y);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
        last = f;
      }
      ctx.stroke();

      const [bx, by] = g.toPx(last.bodies[0].pos.x, last.bodies[0].pos.y);
      ctx.fillStyle = INK.body;
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      onProgress?.(Math.min(upTo, total));
    };

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
  }, [trace, runKey, playbackRate]);

  const label =
    "Projectile trajectory. Lands " +
    trace.outcome.range_m.toFixed(1) +
    " metres away after " +
    trace.outcome.flight_time_s.toFixed(2) +
    " seconds, reaching " +
    trace.outcome.apex_m.toFixed(1) +
    " metres at the top.";

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <canvas ref={staticRef} className="absolute inset-0" aria-hidden="true" />
      <canvas ref={dynamicRef} className="absolute inset-0" role="img" aria-label={label} />
    </div>
  );
}
