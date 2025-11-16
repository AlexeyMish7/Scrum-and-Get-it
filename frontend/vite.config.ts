import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  build: {
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
          ],
          "vendor-dnd": ["@hello-pangea/dnd"],
          // Workspace-specific chunks for lazy loading
          "workspace-ai": [
            "./src/app/workspaces/ai/pages/ResumeEditorV2/index.tsx",
            "./src/app/workspaces/ai/pages/CoverLetterEditor/index.tsx",
          ],
        },
      },
    },
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 600,
    // Enable terser minification (console removal happens automatically in production)
    minify: "terser",
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
