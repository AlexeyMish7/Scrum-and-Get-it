import { defineConfig } from "vitest/config";
import { resolve } from "path";

// NOTE: The main server test suite lives under the monorepo `tests/` workspace.
// We run that suite from the `server/` workspace when we want *server-side* coverage,
// because older Vitest versions in `tests/` have trouble reporting coverage for
// source files outside the test workspace root on Windows.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["../tests/server/**/*.test.ts"],
    setupFiles: [resolve(__dirname, "../tests/server/setup.ts")],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: resolve(__dirname, "coverage"),
      clean: true,
      include: ["src/**/*.ts", "utils/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "dist/**",
        "node_modules/**",
        "scripts/**",
        "**/index.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@server": resolve(__dirname, "./src"),
      "@utils": resolve(__dirname, "./utils"),
      "@serverUtils": resolve(__dirname, "./utils"),
    },
  },
});
