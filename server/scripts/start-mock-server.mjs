#!/usr/bin/env node
/**
 * Start the AI server in mock mode with automatic env export and file watch.
 *
 * Usage:
 *   From server directory: node scripts/start-mock-server.mjs
 *   Or make executable: chmod +x scripts/start-mock-server.mjs && ./scripts/start-mock-server.mjs
 *
 * What this script does:
 * - Creates `server/.env` from example if missing
 * - Forces `FAKE_AI=true` so all generations use deterministic mock output
 * - Loads environment variables from `.env` into process.env
 * - Starts the dev server (auto-restarts on file changes with `--watch`)
 *
 * Notes:
 * - No secrets are printed
 * - If Supabase service role vars are present, persistence is attempted even in mock mode
 * - Press Ctrl+C to stop watching
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverDir = resolve(__dirname, "..");

console.log(`Server folder: ${serverDir}`);

// Change to server directory
process.chdir(serverDir);

// Create .env from example if missing
const envPath = resolve(serverDir, ".env");
const envExamplePath = resolve(serverDir, ".env.example");

if (!existsSync(envPath)) {
  console.log("No .env found - copying .env.example -> .env");
  copyFileSync(envExamplePath, envPath);
}

// Ensure FAKE_AI=true is present
let envContent = readFileSync(envPath, "utf-8");
if (/^FAKE_AI=/m.test(envContent)) {
  envContent = envContent.replace(/^FAKE_AI=.*/m, "FAKE_AI=true");
} else {
  envContent = envContent.trimEnd() + "\nFAKE_AI=true\n";
}
writeFileSync(envPath, envContent);

// Set FAKE_AI for this process
process.env.FAKE_AI = "true";
console.log("FAKE_AI=true set for this session and in server/.env");

// Load other vars from server/.env into process.env
try {
  const lines = envContent
    .split("\n")
    .filter((line) => line.trim() && !line.trim().startsWith("#"));

  for (const line of lines) {
    const match = line.match(/^\s*([^=\s]+)=(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2];
      // Strip surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  }
  console.log("Exported env vars from server/.env into this session.");
} catch (err) {
  console.warn(`Failed to export .env vars into session: ${err.message}`);
}

console.log(
  "Starting server in dev watch mode (npm run dev). Press Ctrl+C to stop."
);

// Start npm run dev as child process
const npmProcess = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
  cwd: serverDir,
});

npmProcess.on("error", (err) => {
  console.error(`Failed to start npm: ${err.message}`);
  process.exit(1);
});

npmProcess.on("exit", (code) => {
  console.log(`npm run dev exited with code ${code}`);
  process.exit(code || 0);
});

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\nStopping server...");
  npmProcess.kill("SIGINT");
});
