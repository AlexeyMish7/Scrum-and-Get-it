#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_WINDOWS = process.platform === "win32";

function openWindowsTerminal({ title, workingDir, commandLine }) {
  return new Promise((resolve, reject) => {
    const inner = `title ${title} && npm install --no-audit --no-fund && ${commandLine}`;

    // Why: `start` is a cmd.exe built-in, so we invoke cmd.exe to execute it.
    // Important: Pass an argv array (not one big string) so Node/Windows handle
    // quoting correctly for paths with spaces.
    const child = spawn(
      "cmd.exe",
      [
        "/d",
        "/s",
        "/c",
        "start",
        '""',
        "/D",
        workingDir,
        "cmd.exe",
        "/k",
        inner,
      ],
      {
        stdio: "inherit",
        windowsHide: false,
      }
    );

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      // Why: On Windows, `npm` is a cmd shim, so spawning works best via a shell.
      shell: IS_WINDOWS,
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else
        reject(
          new Error(`${command} ${args.join(" ")} exited with code ${code}`)
        );
    });
  });
}

function spawnLongRunning(command, args, options) {
  return spawn(command, args, {
    stdio: "inherit",
    shell: IS_WINDOWS,
    ...options,
  });
}

async function installDeps(workspaceDir) {
  // Why: For dev, prefer `npm install` (more tolerant on Windows than `npm ci`).
  // This also matches the old `dev.ps1` behavior.
  await run("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: workspaceDir,
  });
}

async function main() {
  const root = __dirname;
  const serverDir = path.join(root, "server");
  const frontendDir = path.join(root, "frontend");

  console.log("Starting dev environment (server + frontend)...");

  if (IS_WINDOWS) {
    console.log("\nOpening two terminals (Windows)...");
    console.log("  - Each terminal will: npm install, then npm run dev");

    const serverStart = await openWindowsTerminal({
      title: "FlowATS Server",
      workingDir: serverDir,
      commandLine: "npm run dev",
    });

    const frontendStart = await openWindowsTerminal({
      title: "FlowATS Frontend",
      workingDir: frontendDir,
      commandLine: "npm run dev",
    });

    if (serverStart !== 0 || frontendStart !== 0) {
      console.error(
        `\nFailed to open one or more terminals (server exit: ${serverStart}, frontend exit: ${frontendStart}).`
      );
      process.exitCode = 1;
      return;
    }

    console.log("\nURLs:");
    console.log("  - Server:   http://localhost:8787");
    console.log("  - Frontend: http://localhost:5173");
    console.log(
      "\nStop: use Ctrl+C inside each of the two terminals (or close them).\n"
    );
    return;
  }

  console.log("\nInstalling server dependencies...");
  await installDeps(serverDir);

  console.log("\nInstalling frontend dependencies...");
  await installDeps(frontendDir);

  console.log("\nStarting server (npm run dev)...");

  const serverProc = spawnLongRunning("npm", ["run", "dev"], {
    cwd: serverDir,
  });

  console.log("\nStarting frontend (npm run dev)...");
  const frontendProc = spawnLongRunning("npm", ["run", "dev"], {
    cwd: frontendDir,
  });

  console.log("\nURLs:");
  console.log("  - Server:   http://localhost:8787");
  console.log("  - Frontend: http://localhost:5173");
  console.log("\nPress Ctrl+C to stop both.\n");

  const shutdown = () => {
    if (!serverProc.killed) serverProc.kill();
    if (!frontendProc.killed) frontendProc.kill();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  serverProc.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
    shutdown();
  });

  frontendProc.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
    shutdown();
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
