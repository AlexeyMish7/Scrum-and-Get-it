import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: [
        resolve(__dirname, "../../server/src/**/*.ts"),
        resolve(__dirname, "../../server/utils/**/*.ts"),
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/dist/**",
        "**/node_modules/**",
        "**/scripts/**",
        "**/index.ts", // Barrel exports
      ],
      all: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    include: ["**/*.test.ts"],
    setupFiles: ["./setup.ts"],
  },
  resolve: {
    alias: {
      "@server": resolve(__dirname, "../../server/src"),
      "@utils": resolve(__dirname, "../../server/utils"),
    },
  },
});
