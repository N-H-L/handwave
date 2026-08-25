import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src") } },
  test: {
    // .tsx too: the prediction gate is tested by driving the real page.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // node by default because most of the suite is pure physics; component
    // files opt into jsdom with a @vitest-environment docblock.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
