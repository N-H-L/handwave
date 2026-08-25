/**
 * Fixed-timestep velocity-Verlet.
 *
 * Chosen over semi-implicit Euler (1st order) and RK4 (not symplectic, so
 * energy drifts secularly on oscillators). Verlet is 2nd-order accurate and
 * symplectic: bounded energy error over long runs, which is exactly the
 * property we assert in CI and plot on screen.
 *
 * Fixed timestep, never wall-clock delta: the trace must be byte-identical
 * across machines or the "same seed, same run" promise is a lie.
 */

import type { InvariantSeries, Vec2 } from "./types";

export const DEFAULT_DT = 1 / 240;
export const DEFAULT_MAX_STEPS = 240 * 120; // 120 s of sim time, hard cap

export type Accel = (pos: Vec2, vel: Vec2, t: number) => Vec2;

export type VerletState = { pos: Vec2; vel: Vec2; acc: Vec2 };

export function initVerlet(pos: Vec2, vel: Vec2, accel: Accel, t = 0): VerletState {
  return { pos: { ...pos }, vel: { ...vel }, acc: accel(pos, vel, t) };
}

/**
 * One velocity-Verlet step.
 *
 *   x(t+dt) = x + v·dt + ½·a·dt²
 *   v(t+dt) = v + ½·(a + a')·dt
 *
 * Velocity-dependent acceleration (drag) makes a' depend on v(t+dt), which we
 * do not have yet. We use the standard one-pass predictor: estimate v with the
 * old acceleration, evaluate a' there, then correct. This costs the strict
 * symplectic guarantee — but drag is dissipative, so energy is not conserved
 * in that case anyway and the invariant switches to `non_increasing`.
 */
export function verletStep(s: VerletState, dt: number, accel: Accel, t: number): VerletState {
  const halfDtSq = 0.5 * dt * dt;
  const pos: Vec2 = {
    x: s.pos.x + s.vel.x * dt + s.acc.x * halfDtSq,
    y: s.pos.y + s.vel.y * dt + s.acc.y * halfDtSq,
  };
  const velPredicted: Vec2 = {
    x: s.vel.x + s.acc.x * dt,
    y: s.vel.y + s.acc.y * dt,
  };
  const acc = accel(pos, velPredicted, t + dt);
  const vel: Vec2 = {
    x: s.vel.x + 0.5 * (s.acc.x + acc.x) * dt,
    y: s.vel.y + 0.5 * (s.acc.y + acc.y) * dt,
  };
  return { pos, vel, acc };
}

/**
 * Linear interpolation factor for the step in which `f` crosses zero.
 * Returns a fraction in [0,1] of the way from `before` to `after`.
 *
 * Deliberately linear, not bisection: PLAN §4 cuts event detection with
 * bisection as the thing a longer plan dies on. At dt = 1/240 s the landing
 * position error from linear interpolation is well under a pixel.
 */
export function crossingFraction(before: number, after: number): number {
  const denom = before - after;
  if (denom === 0) return 0;
  return Math.max(0, Math.min(1, before / denom));
}

export function lerp(a: number, b: number, f: number): number {
  return a + (b - a) * f;
}

export function lerpVec(a: Vec2, b: Vec2, f: number): Vec2 {
  return { x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) };
}

/** Fractional drift of a series that claims to be conserved. */
export function relativeDrift(values: number[]): number {
  if (values.length === 0) return 0;
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = Math.abs(sum / values.length);
  if (mean < 1e-12) return max - min;
  return (max - min) / mean;
}

/** True when the series obeys the law it declares. Asserted in CI and on screen. */
export function invariantHolds(inv: InvariantSeries): boolean {
  if (!inv.active) return true;
  if (inv.law === "conserved") return relativeDrift(inv.values) <= inv.tolerance;
  for (let i = 1; i < inv.values.length; i++) {
    // Allow tolerance-sized upticks from float noise.
    if (inv.values[i] > inv.values[i - 1] + inv.tolerance * Math.abs(inv.values[0])) return false;
  }
  return true;
}
