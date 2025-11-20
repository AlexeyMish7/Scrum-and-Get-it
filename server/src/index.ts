/**
 * Server Entry Point
 *
 * Loads environment variables, creates the HTTP server, and starts listening.
 * Handles graceful shutdown on SIGTERM/SIGINT.
 */

// Load environment variables FIRST (before any imports that depend on process.env)
import { config } from "dotenv";
config(); // Loads .env from server/.env

import { createServer } from "./server.js";
import { logSystemEvent, logError } from "../utils/logger.js";
import { closeBrowser } from "./services/scraper.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

// Global error handlers to prevent crashes from unhandled rejections
process.on("uncaughtException", (error) => {
  console.error(" Uncaught Exception:", error);
  logError("Uncaught exception during server startup", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(" Unhandled Rejection at:", promise, "reason:", reason);
  logError(
    "Unhandled promise rejection",
    reason instanceof Error ? reason : new Error(String(reason))
  );
});

// Create and start server
let server: ReturnType<typeof createServer>;

try {
  server = createServer();

  server.listen(PORT, () => {
    logSystemEvent("startup", {
      port: PORT,
      node_version: process.version,
      log_level: process.env.LOG_LEVEL || "info",
      fake_ai: process.env.FAKE_AI === "true",
      allow_dev_auth: process.env.ALLOW_DEV_AUTH === "true",
      supabase_configured: Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
      cors_origin: process.env.CORS_ORIGIN || "*",
    });
    console.log(`✅ Server running at http://localhost:${PORT}`);
  });

  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use`);
      process.exit(1);
    } else {
      console.error(" Server error:", error);
      logError("Server error during runtime", error);
      process.exit(1);
    }
  });
} catch (error) {
  console.error(" Failed to create server:", error);
  logError(
    "Failed to create server instance",
    error instanceof Error ? error : new Error(String(error))
  );
  process.exit(1);
}

process.on("SIGTERM", async () => {
  logSystemEvent("shutdown", { signal: "SIGTERM" });
  await closeBrowser(); // Gracefully close Puppeteer browser
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

process.on("SIGINT", async () => {
  logSystemEvent("shutdown", { signal: "SIGINT" });
  await closeBrowser(); // Gracefully close Puppeteer browser
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});
