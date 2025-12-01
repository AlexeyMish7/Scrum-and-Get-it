import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "frontend/**/*.test.ts",
      "frontend/**/*.test.tsx",
      "frontend/services/**/*.test.ts",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "../../frontend/src"),
      "@app": path.resolve(__dirname, "../../frontend/src/app"),
      "@shared": path.resolve(__dirname, "../../frontend/src/app/shared"),
      "@components": path.resolve(
        __dirname,
        "../../frontend/src/app/shared/components"
      ),
      "@services": path.resolve(
        __dirname,
        "../../frontend/src/app/shared/services"
      ),
      "@utils": path.resolve(__dirname, "../../frontend/src/app/shared/utils"),
      "@workspaces": path.resolve(
        __dirname,
        "../../frontend/src/app/workspaces"
      ),
      "@ai_workspace": path.resolve(
        __dirname,
        "../../frontend/src/app/workspaces/ai_workspace"
      ),
      "@job_pipeline": path.resolve(
        __dirname,
        "../../frontend/src/app/workspaces/job_pipeline"
      ),
      "@profile": path.resolve(
        __dirname,
        "../../frontend/src/app/workspaces/profile"
      ),
    },
  },
});
