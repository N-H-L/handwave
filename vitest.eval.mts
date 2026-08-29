import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * Config for the live routing eval only.
 *
 * Separate from vitest.config.mts because this one costs money and needs a
 * key, so it must never be picked up by `npm test` or CI. Run it with
 * `npm run eval:routing`.
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src") },
  },
  test: {
    include: ["scripts/**/*.eval.ts"],
    environment: "node",
    // A real model call per question, thirty-two of them, in sequence.
    testTimeout: 300000,
    hookTimeout: 300000,
  },
});
