/**
 * Local instrumentation for the prediction gate.
 *
 * This exists to answer the first post-hackathon decision gate in docs/PLAN.md,
 * which is the one that decides whether any of the rest is worth building:
 *
 *   Gate 1 — Do students write real predictions? Hand-classify 200: more than
 *   eight words, mechanistically specific, not retrievable from text already on
 *   the screen. Under 40% substantive and the mechanic fails, and nothing else
 *   matters.
 *
 * Everything stays in the visitor's own browser. No prediction is transmitted
 * anywhere, which is both the honest default for something a student typed
 * about being wrong, and the reason this can ship without a privacy story: it
 * is not collection if it never leaves the device.
 *
 * Shaped as an external store with a cached snapshot so React can read it
 * through useSyncExternalStore. That matters for more than tidiness: a
 * component that loaded this in an effect and called setState would render
 * once with an empty log and once with the real one, and on the server it
 * would disagree with the client about what the page says.
 */

const KEY = "handwave.predictions.v1";
const MAX_ENTRIES = 500;

export type LoggedPrediction = {
  ts: number;
  simId: string;
  setupKey: string;
  values: Record<string, string | number>;
  resolved: Record<string, string | number>;
  rationale: string;
  words: number;
  thinkingMs: number;
};

/**
 * Shared frozen empty array. useSyncExternalStore compares snapshots by
 * identity, so handing back a fresh `[]` each call would loop forever.
 */
const EMPTY: readonly LoggedPrediction[] = Object.freeze([]);

let cache: readonly LoggedPrediction[] | null = null;
const listeners = new Set<() => void>();

function load(): readonly LoggedPrediction[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as LoggedPrediction[]) : EMPTY;
  } catch {
    // Private windows, cleared site data, storage blocked outright. A missing
    // log is a normal state, not an error worth putting in front of a student.
    return EMPTY;
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot(): readonly LoggedPrediction[] {
  if (cache === null) cache = load();
  return cache;
}

/** The server has no localStorage, and must agree with the first client render. */
export function getServerSnapshot(): readonly LoggedPrediction[] {
  return EMPTY;
}

export function logPrediction(entry: LoggedPrediction): void {
  const next = [...getSnapshot(), entry].slice(-MAX_ENTRIES);
  cache = Object.freeze(next);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or a blocked accessor. The in-memory cache still updated,
    // so this session stays consistent even though nothing persisted.
  }
  for (const l of listeners) l();
}

export function clearPredictions(): void {
  cache = EMPTY;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
  for (const l of listeners) l();
}

export type LogSummary = {
  total: number;
  substantive: number;
  substantivePct: number;
  medianWords: number;
  medianThinkingSec: number;
};

/** The Gate 1 readout, computed the way the plan specifies it. */
export function summarise(entries: readonly LoggedPrediction[]): LogSummary {
  const total = entries.length;
  if (total === 0) {
    return { total: 0, substantive: 0, substantivePct: 0, medianWords: 0, medianThinkingSec: 0 };
  }
  const substantive = entries.filter((e) => e.words > 8).length;
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  return {
    total,
    substantive,
    substantivePct: (substantive / total) * 100,
    medianWords: median(entries.map((e) => e.words)),
    medianThinkingSec: median(entries.map((e) => e.thinkingMs / 1000)),
  };
}
