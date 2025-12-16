import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/node_modules/**",
        "**/dist/**",
      ],
    },
    include: ["server/**/*.test.ts"],
    setupFiles: [resolve(__dirname, "./setup.ts")],
  },
  resolve: {
    alias: {
      "@server": resolve(__dirname, "../../server/src"),
      "@utils": resolve(__dirname, "../../server/utils"),
      "@serverUtils": resolve(__dirname, "../../server/utils"),
    },
  },
});
