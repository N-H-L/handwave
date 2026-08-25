/**
 * Test-environment shims.
 *
 * jsdom implements no layout engine, so it has neither ResizeObserver nor
 * matchMedia. Both are things the real components legitimately use — the
 * canvas redraws on resize, and the animation respects prefers-reduced-motion
 * — so they are stubbed here rather than removed from the components.
 *
 * Guarded on `window` because most of the suite runs in the node environment,
 * where none of this exists or is needed.
 */

import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined") {
  if (!("ResizeObserver" in window)) {
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    (window as unknown as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
    (globalThis as unknown as Record<string, unknown>).ResizeObserver = ResizeObserverStub;
  }

  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;
  }
}
