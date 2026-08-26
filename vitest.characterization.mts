import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/characterization/**/*.test.ts"],
    // These run against one shared fixture Household, so parallel files would
    // interleave reads of the same rows for no benefit.
    fileParallelism: false,
  },
});
