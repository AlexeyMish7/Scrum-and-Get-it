#!/usr/bin/env node

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      // Why: On Windows, `npm` is a cmd shim, so spawning works best via a shell.
      shell: process.platform === "win32",
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

function runWithExitCode(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      // Why: On Windows, `npm` is a cmd shim, so spawning works best via a shell.
      shell: process.platform === "win32",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function installDeps(workspaceDir) {
  // Why: For local runs, prefer `npm install` (more tolerant on Windows than `npm ci`).
  // CI continues to use `npm ci` in the workflow.
  await run("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: workspaceDir,
  });
}

function safeUnlink(filePath) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    // ignore
  }
}

function tryExtractTotalTestsFromVitestJson(jsonValue) {
  if (!jsonValue || typeof jsonValue !== "object") return null;

  // Vitest JSON reporter formats can vary by version.
  // Prefer explicit totals if present; otherwise derive by counting assertions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = jsonValue;

  if (typeof json.numTotalTests === "number") return json.numTotalTests;
  if (typeof json.totalTests === "number") return json.totalTests;

  if (Array.isArray(json.testResults)) {
    let total = 0;
    for (const suite of json.testResults) {
      if (Array.isArray(suite?.assertionResults))
        total += suite.assertionResults.length;
      else if (
        typeof suite?.numPassingTests === "number" ||
        typeof suite?.numFailingTests === "number"
      ) {
        total +=
          (suite?.numPassingTests ?? 0) +
          (suite?.numFailingTests ?? 0) +
          (suite?.numPendingTests ?? 0);
      }
    }
    return total;
  }

  if (Array.isArray(json.files)) {
    // Some reporters emit per-file results.
    let total = 0;
    for (const file of json.files) {
      if (typeof file?.numTests === "number") total += file.numTests;
      if (Array.isArray(file?.tests)) total += file.tests.length;
    }
    return total || null;
  }

  return null;
}

function tryExtractAggregateCountsFromVitestJson(jsonValue) {
  if (!jsonValue || typeof jsonValue !== "object") return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = jsonValue;

  const passed =
    typeof json.numPassedTests === "number" ? json.numPassedTests : null;
  const failed =
    typeof json.numFailedTests === "number" ? json.numFailedTests : null;
  const skipped =
    typeof json.numSkippedTests === "number" ? json.numSkippedTests : null;
  const pending =
    typeof json.numPendingTests === "number" ? json.numPendingTests : null;
  const todo = typeof json.numTodoTests === "number" ? json.numTodoTests : null;

  if ([passed, failed, skipped, pending, todo].every((v) => v === null)) {
    return null;
  }

  return {
    passed: passed ?? 0,
    failed: failed ?? 0,
    skipped: skipped ?? 0,
    pending: pending ?? 0,
    todo: todo ?? 0,
  };
}

function extractFailedTestsFromVitestJson(jsonValue) {
  if (!jsonValue || typeof jsonValue !== "object") return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = jsonValue;
  const failures = [];

  // Vitest JSON reporter (v0.34.x) is very similar to Jest.
  if (Array.isArray(json.testResults)) {
    for (const suite of json.testResults) {
      const fileName = suite?.name ?? suite?.filePath ?? "(unknown file)";
      if (!Array.isArray(suite?.assertionResults)) continue;
      for (const test of suite.assertionResults) {
        const status = test?.status;
        if (status !== "failed") continue;
        const title = test?.fullName ?? test?.title ?? "(unknown test)";
        failures.push(`${fileName} :: ${title}`);
      }
    }
  }

  // Some reporter variants store per-file tests differently.
  if (failures.length === 0 && Array.isArray(json.files)) {
    for (const file of json.files) {
      const fileName = file?.name ?? file?.filePath ?? "(unknown file)";
      if (Array.isArray(file?.tests)) {
        for (const test of file.tests) {
          if (test?.result?.state === "fail" || test?.status === "failed") {
            const title = test?.name ?? test?.title ?? "(unknown test)";
            failures.push(`${fileName} :: ${title}`);
          }
        }
      }
    }
  }

  return failures;
}

function readTotalTestsFromVitestJsonFile(jsonPath) {
  const raw = fs.readFileSync(jsonPath, "utf8");
  const parsed = JSON.parse(raw);
  const total = tryExtractTotalTestsFromVitestJson(parsed);
  if (typeof total !== "number") {
    throw new Error(
      `Could not determine total tests from ${path.basename(jsonPath)}.`
    );
  }
  return total;
}

async function main() {
  const root = __dirname;
  const testsDir = path.join(root, "tests");
  const serverReportPath = path.join(testsDir, ".vitest-results-server.json");
  const frontendReportPath = path.join(
    testsDir,
    ".vitest-results-frontend.json"
  );

  console.log("Running full test suite from tests/ (server + frontend)...\n");
  console.log("Notes:");
  console.log(
    "  - Server tests run in Node and cover API routes (including /api/generate/*)."
  );
  console.log(
    "  - Frontend tests run in JSDOM and validate frontend service/perf logic; they do not require a live Supabase DB."
  );

  console.log("\nInstalling test workspace dependencies...");
  await installDeps(testsDir);

  console.log("\nRunning server tests...");
  safeUnlink(serverReportPath);
  const serverExitCode = await runWithExitCode(
    "npm",
    [
      "run",
      "test:server",
      "--",
      "--reporter",
      "default",
      "--reporter",
      "json",
      "--outputFile",
      ".vitest-results-server.json",
    ],
    { cwd: testsDir }
  );

  console.log("\nRunning frontend tests...");
  safeUnlink(frontendReportPath);
  const frontendExitCode = await runWithExitCode(
    "npm",
    [
      "run",
      "test:frontend",
      "--",
      "--reporter",
      "default",
      "--reporter",
      "json",
      "--outputFile",
      ".vitest-results-frontend.json",
    ],
    { cwd: testsDir }
  );

  const overallExitCode = serverExitCode || frontendExitCode ? 1 : 0;

  const serverJson = fs.existsSync(serverReportPath)
    ? JSON.parse(fs.readFileSync(serverReportPath, "utf8"))
    : null;
  const frontendJson = fs.existsSync(frontendReportPath)
    ? JSON.parse(fs.readFileSync(frontendReportPath, "utf8"))
    : null;

  const serverTotalTests = serverJson
    ? readTotalTestsFromVitestJsonFile(serverReportPath)
    : 0;
  const frontendTotalTests = frontendJson
    ? readTotalTestsFromVitestJsonFile(frontendReportPath)
    : 0;
  const totalTests = serverTotalTests + frontendTotalTests;

  const serverCounts = tryExtractAggregateCountsFromVitestJson(serverJson);
  const frontendCounts = tryExtractAggregateCountsFromVitestJson(frontendJson);
  const combinedCounts =
    serverCounts && frontendCounts
      ? {
          passed: serverCounts.passed + frontendCounts.passed,
          failed: serverCounts.failed + frontendCounts.failed,
          skipped: serverCounts.skipped + frontendCounts.skipped,
          pending: serverCounts.pending + frontendCounts.pending,
          todo: serverCounts.todo + frontendCounts.todo,
        }
      : null;

  const serverFailed = serverJson
    ? extractFailedTestsFromVitestJson(serverJson)
    : [];
  const frontendFailed = frontendJson
    ? extractFailedTestsFromVitestJson(frontendJson)
    : [];
  const failedTests = [...serverFailed, ...frontendFailed];

  console.log("\nTest summary:");
  console.log(
    `- Total: ${totalTests} (server: ${serverTotalTests}, frontend: ${frontendTotalTests})`
  );
  if (combinedCounts) {
    console.log(`- Passed: ${combinedCounts.passed}`);
    console.log(`- Failed: ${combinedCounts.failed}`);
    console.log(`- Skipped: ${combinedCounts.skipped}`);
    console.log(`- Pending: ${combinedCounts.pending}`);
    console.log(`- Todo: ${combinedCounts.todo}`);
  }

  if (failedTests.length > 0) {
    console.log("\nFailed tests:");
    for (const name of failedTests.slice(0, 100)) {
      console.log(`- ${name}`);
    }
    if (failedTests.length > 100) {
      console.log(`- ...and ${failedTests.length - 100} more`);
    }
  }

  if (overallExitCode === 0) {
    console.log("\nAll tests passed.");
  }

  process.exitCode = overallExitCode;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
