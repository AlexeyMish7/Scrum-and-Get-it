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
import { logSystemEvent } from "../utils/logger.js";
import { closeBrowser } from "./services/scraper.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const server = createServer();

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
  console.log(`Server running at http://localhost:${PORT}`);
});

process.on("SIGTERM", async () => {
  logSystemEvent("shutdown", { signal: "SIGTERM" });
  await closeBrowser(); // Gracefully close Puppeteer browser
  server.close(() => process.exit(0));
});

process.on("SIGINT", async () => {
  logSystemEvent("shutdown", { signal: "SIGINT" });
  await closeBrowser(); // Gracefully close Puppeteer browser
  server.close(() => process.exit(0));
});
