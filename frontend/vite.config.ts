import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
        find: "@ai",
        replacement: resolve(__dirname, "src/app/workspaces/ai") + "/",
      },
      {
        find: "@jobs",
        replacement: resolve(__dirname, "src/app/workspaces/jobs") + "/",
      },
      {
        find: "@components",
        replacement: resolve(__dirname, "src/app/shared/components") + "/",
      },
      {
        find: "@services",
        replacement: resolve(__dirname, "src/app/shared/services") + "/",
      },
      {
        find: "@context",
        replacement: resolve(__dirname, "src/app/shared/context") + "/",
      },
      {
        find: "@hooks",
        replacement: resolve(__dirname, "src/app/shared/hooks") + "/",
      },
      {
        find: "@utils",
        replacement: resolve(__dirname, "src/app/shared/utils") + "/",
      },
      {
        find: "@profileTypes",
        replacement:
          resolve(__dirname, "src/app/workspaces/profile/types") + "/",
      },
      {
        find: "@aiTypes",
        replacement: resolve(__dirname, "src/app/workspaces/ai/types") + "/",
      },
      {
        find: "@jobsTypes",
        replacement: resolve(__dirname, "src/app/workspaces/jobs/types") + "/",
      },
      {
        find: "@componentsShared",
        replacement: resolve(__dirname, "src/app/shared/components") + "/",
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
