/**
 * The address bar, read as an external store.
 *
 * A run is fully determined by its spec, so a link to a spec is a link to the
 * exact run. Reading that link back has one constraint worth being careful
 * about: it must not cost the page its server rendering.
 *
 * Next's `useSearchParams` would, because a client component that calls it
 * inside a Suspense boundary prerenders as the FALLBACK — the deployed HTML
 * becomes the word "Loading" and every pixel arrives only after hydration.
 * That was measured, not assumed: it took the prerendered page from the full
 * document to 7.5 KB of shell.
 *
 * useSyncExternalStore avoids it. React renders the server snapshot during
 * hydration and swaps to the client one immediately afterwards, which is the
 * sanctioned way to read something that exists only in the browser without
 * lying to the server about it.
 */

const EMPTY = "";

export function subscribeToUrl(listener: () => void): () => void {
  // popstate covers back and forward. Our own writes use replaceState and
  // deliberately do not notify: re-reading a URL we just wrote would be a
  // round trip through the DOM for a value we already have.
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

export function getUrlSearch(): string {
  return typeof window === "undefined" ? EMPTY : window.location.search;
}

/** The server has no address bar, and must agree with the first client render. */
export function getServerUrlSearch(): string {
  return EMPTY;
}
