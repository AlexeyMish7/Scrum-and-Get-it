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
