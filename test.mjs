#!/usr/bin/env node

/**
 * Test Runner Script
 *
 * Runs all tests in an organized, clean format:
 * - Server API tests
 * - Frontend UI tests
 * - Frontend Supabase tests
 *
 * Usage: node test.mjs
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function printHeader(text, color = colors.cyan) {
  console.log(`\n${color}${colors.bright}${"═".repeat(60)}${colors.reset}`);
  console.log(`${color}${colors.bright}  ${text}${colors.reset}`);
  console.log(`${color}${colors.bright}${"═".repeat(60)}${colors.reset}\n`);
}

function printSection(text, color = colors.blue) {
  console.log(`${color}${colors.bright}▶ ${text}${colors.reset}`);
}

function printResult(label, passed, failed, total) {
  const icon = failed === 0 ? `${colors.green}✓` : `${colors.red}✗`;
  const passedStr = `${colors.green}${passed} passed${colors.reset}`;
  const failedStr =
    failed > 0 ? ` | ${colors.red}${failed} failed${colors.reset}` : "";
  console.log(
    `  ${icon} ${label}: ${passedStr}${failedStr} ${colors.dim}(${total} total)${colors.reset}`
  );
}

function run(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
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
      shell: process.platform === "win32",
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function installDeps(workspaceDir) {
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

function tryExtractAggregateCountsFromVitestJson(jsonValue) {
  if (!jsonValue || typeof jsonValue !== "object") return null;

  const json = jsonValue;

  const passed =
    typeof json.numPassedTests === "number" ? json.numPassedTests : null;
  const failed =
    typeof json.numFailedTests === "number" ? json.numFailedTests : null;

  if (passed === null && failed === null) {
    return null;
  }

  return {
    passed: passed ?? 0,
    failed: failed ?? 0,
  };
}

function extractFailedTestsFromVitestJson(jsonValue) {
  if (!jsonValue || typeof jsonValue !== "object") return [];

  const json = jsonValue;
  const failures = [];

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

  return failures;
}

function categorizeTestResults(jsonValue) {
  const categories = {
    ui: { passed: 0, failed: 0, total: 0 },
    supabase: { passed: 0, failed: 0, total: 0 },
    services: { passed: 0, failed: 0, total: 0 },
    performance: { passed: 0, failed: 0, total: 0 },
  };

  if (!jsonValue || !Array.isArray(jsonValue.testResults)) {
    return categories;
  }

  for (const suite of jsonValue.testResults) {
    const filePath = suite?.name ?? "";
    const assertions = suite?.assertionResults ?? [];

    let category = "services";
    if (filePath.includes("/ui/") || filePath.includes("\\ui\\")) {
      category = "ui";
    } else if (
      filePath.includes("/supabase/") ||
      filePath.includes("\\supabase\\")
    ) {
      category = "supabase";
    } else if (
      filePath.includes("/performance/") ||
      filePath.includes("\\performance\\")
    ) {
      category = "performance";
    }

    for (const test of assertions) {
      categories[category].total++;
      if (test?.status === "passed") {
        categories[category].passed++;
      } else if (test?.status === "failed") {
        categories[category].failed++;
      }
    }
  }

  return categories;
}

async function main() {
  const root = __dirname;
  const testsDir = path.join(root, "tests");
  const serverReportPath = path.join(testsDir, ".vitest-results-server.json");
  const frontendReportPath = path.join(
    testsDir,
    ".vitest-results-frontend.json"
  );

  printHeader("FlowATS Test Suite", colors.cyan);

  console.log(`${colors.dim}Installing dependencies...${colors.reset}`);
  await installDeps(testsDir);
  console.log(`${colors.green}✓${colors.reset} Dependencies ready\n`);

  // ─────────────────────────────────────────────────────────
  // SERVER TESTS
  // ─────────────────────────────────────────────────────────
  printSection("Server API Tests");
  safeUnlink(serverReportPath);

  const serverExitCode = await runWithExitCode(
    "npm",
    [
      "run",
      "test:server",
      "--",
      "--reporter",
      "dot",
      "--reporter",
      "json",
      "--outputFile",
      ".vitest-results-server.json",
    ],
    { cwd: testsDir }
  );

  // ─────────────────────────────────────────────────────────
  // FRONTEND TESTS
  // ─────────────────────────────────────────────────────────
  console.log("");
  printSection("Frontend Tests");
  safeUnlink(frontendReportPath);

  const frontendExitCode = await runWithExitCode(
    "npm",
    [
      "run",
      "test:frontend",
      "--",
      "--reporter",
      "dot",
      "--reporter",
      "json",
      "--outputFile",
      ".vitest-results-frontend.json",
    ],
    { cwd: testsDir }
  );

  // ─────────────────────────────────────────────────────────
  // PARSE RESULTS
  // ─────────────────────────────────────────────────────────
  const serverJson = fs.existsSync(serverReportPath)
    ? JSON.parse(fs.readFileSync(serverReportPath, "utf8"))
    : null;
  const frontendJson = fs.existsSync(frontendReportPath)
    ? JSON.parse(fs.readFileSync(frontendReportPath, "utf8"))
    : null;

  const serverCounts = tryExtractAggregateCountsFromVitestJson(serverJson);
  const frontendCategories = categorizeTestResults(frontendJson);

  // ─────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────
  printHeader("Test Results Summary", colors.magenta);

  // Server results
  if (serverCounts) {
    printResult(
      "Server API       ",
      serverCounts.passed,
      serverCounts.failed,
      serverCounts.passed + serverCounts.failed
    );
  }

  // Frontend results by category
  if (frontendCategories.ui.total > 0) {
    printResult(
      "Frontend UI      ",
      frontendCategories.ui.passed,
      frontendCategories.ui.failed,
      frontendCategories.ui.total
    );
  }

  if (frontendCategories.supabase.total > 0) {
    printResult(
      "Frontend Supabase",
      frontendCategories.supabase.passed,
      frontendCategories.supabase.failed,
      frontendCategories.supabase.total
    );
  }

  if (frontendCategories.services.total > 0) {
    printResult(
      "Frontend Services",
      frontendCategories.services.passed,
      frontendCategories.services.failed,
      frontendCategories.services.total
    );
  }

  if (frontendCategories.performance.total > 0) {
    printResult(
      "Frontend Perf    ",
      frontendCategories.performance.passed,
      frontendCategories.performance.failed,
      frontendCategories.performance.total
    );
  }

  // Calculate totals
  const serverTotal = serverCounts
    ? serverCounts.passed + serverCounts.failed
    : 0;
  const serverPassed = serverCounts?.passed ?? 0;
  const serverFailed = serverCounts?.failed ?? 0;

  const frontendTotal =
    frontendCategories.ui.total +
    frontendCategories.supabase.total +
    frontendCategories.services.total +
    frontendCategories.performance.total;
  const frontendPassed =
    frontendCategories.ui.passed +
    frontendCategories.supabase.passed +
    frontendCategories.services.passed +
    frontendCategories.performance.passed;
  const frontendFailed =
    frontendCategories.ui.failed +
    frontendCategories.supabase.failed +
    frontendCategories.services.failed +
    frontendCategories.performance.failed;

  const totalPassed = serverPassed + frontendPassed;
  const totalFailed = serverFailed + frontendFailed;
  const grandTotal = serverTotal + frontendTotal;

  console.log(`\n${colors.bright}${"─".repeat(50)}${colors.reset}`);
  console.log(
    `${colors.bright}  Total: ${colors.green}${totalPassed} passed${
      colors.reset
    }${
      totalFailed > 0
        ? `, ${colors.red}${totalFailed} failed${colors.reset}`
        : ""
    } ${colors.dim}(${grandTotal} tests)${colors.reset}`
  );

  // Show failed tests if any
  const allFailed = [
    ...extractFailedTestsFromVitestJson(serverJson),
    ...extractFailedTestsFromVitestJson(frontendJson),
  ];

  if (allFailed.length > 0) {
    console.log(`\n${colors.red}${colors.bright}Failed Tests:${colors.reset}`);
    for (const name of allFailed.slice(0, 15)) {
      // Shorten the path for readability
      const shortName = name.split("::").pop()?.trim() || name;
      console.log(`  ${colors.red}✗${colors.reset} ${shortName}`);
    }
    if (allFailed.length > 15) {
      console.log(
        `  ${colors.dim}...and ${allFailed.length - 15} more${colors.reset}`
      );
    }
  }

  const overallExitCode = serverExitCode || frontendExitCode ? 1 : 0;

  if (overallExitCode === 0) {
    console.log(
      `\n${colors.green}${colors.bright}✓ All tests passed!${colors.reset}\n`
    );
  } else {
    console.log(
      `\n${colors.red}${colors.bright}✗ Some tests failed${colors.reset}\n`
    );
  }

  process.exitCode = overallExitCode;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
