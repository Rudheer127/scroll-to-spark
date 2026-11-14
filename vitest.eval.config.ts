import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Live evals only. The default `npm test` config does not include these files. */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/evals/**/*.eval.ts"],
    testTimeout: 600_000,
  },
});
