import { createServer } from "./server.js";
import { logSystemEvent } from "../utils/logger.js";

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

process.on("SIGTERM", () => {
  logSystemEvent("shutdown", { signal: "SIGTERM" });
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  logSystemEvent("shutdown", { signal: "SIGINT" });
  server.close(() => process.exit(0));
});
