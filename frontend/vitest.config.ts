import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/mockData",
        "dist/",
      ],
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: resolve(__dirname, "src") + "/" },
      { find: "@app", replacement: resolve(__dirname, "src/app") + "/" },
      {
        find: "@shared",
        replacement: resolve(__dirname, "src/app/shared") + "/",
      },
      {
        find: "@workspaces",
        replacement: resolve(__dirname, "src/app/workspaces") + "/",
      },
      {
        find: "@profile",
        replacement: resolve(__dirname, "src/app/workspaces/profile") + "/",
      },
      {
        find: "@components",
        replacement: resolve(__dirname, "src/app/shared/components") + "/",
      },
      {
        find: "@services",
        replacement: resolve(__dirname, "src/app/shared/services") + "/",
      },
      { find: "@types", replacement: resolve(__dirname, "src/types") + "/" },
      { find: "@assets", replacement: resolve(__dirname, "src/assets") + "/" },
      {
        find: "@theme",
        replacement: resolve(__dirname, "src/theme/theme.tsx"),
      },
    ],
  },
});
