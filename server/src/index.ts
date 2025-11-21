/**
 * Server Entry Point
 *
 * Loads environment variables, creates the HTTP server, and starts listening.
 * Handles graceful shutdown on SIGTERM/SIGINT.
 *
 * Configuration:
 *  - PORT: Server port (default: 8787)
 *  - Must match VITE_AI_BASE_URL in frontend/.env
 *  - Example: VITE_AI_BASE_URL=http://localhost:8787
 */

// Load environment variables FIRST (before any imports that depend on process.env)
import { config } from "dotenv";
config(); // Loads .env from server/.env

import { createServer } from "./server.js";
import { logSystemEvent, logError } from "../utils/logger.js";
import { closeBrowser } from "./services/scraper.js";

// Server port configuration
// Default: 8787 (should match frontend VITE_AI_BASE_URL)
// Override via PORT environment variable in server/.env
const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;

// Global error handlers to prevent crashes from unhandled rejections
process.on("uncaughtException", (error) => {
  console.error("\n" + "=".repeat(80));
  console.error("❌ UNCAUGHT EXCEPTION");
  console.error("=".repeat(80));
  console.error("\nError:", error);
  console.error("\nStack:", error.stack);
  console.error("=".repeat(80) + "\n");
  logError("Uncaught exception during server startup", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\n" + "=".repeat(80));
  console.error("❌ UNHANDLED PROMISE REJECTION");
  console.error("=".repeat(80));
  console.error("\nPromise:", promise);
  console.error("Reason:", reason);
  if (reason instanceof Error) {
    console.error("\nStack:", reason.stack);
  }
  console.error("=".repeat(80) + "\n");
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
    console.log("\n" + "=".repeat(80));
    console.log("🚀 SERVER STARTED");
    console.log("=".repeat(80));
    console.log(`\n✅ Server running at http://localhost:${PORT}`);
    console.log(`📦 Node version: ${process.version}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(
      `🤖 AI Mode: ${
        process.env.FAKE_AI === "true" ? "MOCK (Fake AI)" : "REAL (OpenAI)"
      }`
    );
    console.log(
      `🔐 Auth Mode: ${
        process.env.ALLOW_DEV_AUTH === "true"
          ? "DEV (Bypass)"
          : "PRODUCTION (Supabase)"
      }`
    );
    console.log(
      `🗄️  Database: ${
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
          ? "CONFIGURED ✓"
          : "NOT CONFIGURED ✗"
      }`
    );
    console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || "*"}`);
    console.log(`📝 Log Level: ${process.env.LOG_LEVEL || "info"}`);
    console.log("\n" + "=".repeat(80) + "\n");

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
  });

  server.on("error", (error: any) => {
    console.error("\n" + "=".repeat(80));
    console.error("❌ SERVER ERROR");
    console.error("=".repeat(80));

    if (error.code === "EADDRINUSE") {
      console.error(`\n⚠️  Port ${PORT} is already in use`);
      console.error(`\nTry one of these solutions:`);
      console.error(`  1. Stop the process using port ${PORT}`);
      console.error(`  2. Change the PORT in your .env file`);
      console.error(
        `  3. Run: netstat -ano | findstr :${PORT} (to find the process)`
      );
    } else {
      console.error(`\nError Code: ${error.code || "UNKNOWN"}`);
      console.error(`Error Message: ${error.message}`);
      console.error(`\nFull Error:`, error);
    }

    console.error("\n" + "=".repeat(80) + "\n");
    logError("Server error during runtime", error);
    process.exit(1);
  });
} catch (error) {
  console.error("\n" + "=".repeat(80));
  console.error("❌ FAILED TO CREATE SERVER");
  console.error("=".repeat(80));
  console.error("\nError:", error);
  if (error instanceof Error) {
    console.error("Stack:", error.stack);
  }
  console.error("\n" + "=".repeat(80) + "\n");

  logError(
    "Failed to create server instance",
    error instanceof Error ? error : new Error(String(error))
  );
  process.exit(1);
}

process.on("SIGTERM", async () => {
  console.log("\n" + "=".repeat(80));
  console.log("🛑 SHUTTING DOWN SERVER (SIGTERM)");
  console.log("=".repeat(80) + "\n");

  logSystemEvent("shutdown", { signal: "SIGTERM" });
  await closeBrowser(); // Gracefully close Puppeteer browser
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});

process.on("SIGINT", async () => {
  console.log("\n" + "=".repeat(80));
  console.log("🛑 SHUTTING DOWN SERVER (SIGINT - Ctrl+C)");
  console.log("=".repeat(80) + "\n");

  logSystemEvent("shutdown", { signal: "SIGINT" });
  await closeBrowser(); // Gracefully close Puppeteer browser
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
});
