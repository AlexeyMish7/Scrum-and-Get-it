#!/usr/bin/env node

/**
 * Coverage Report Script
 *
 * Runs all tests with coverage collection and generates a unified report.
 * Shows coverage for both server and frontend code.
 *
 * Usage: node coverage.mjs
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
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
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
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
  await run("npm", ["install", "--no-audit", "--no-fund"], { cwd: workspaceDir });
}

function printCoverageSummary(coverageDir, label) {
  const summaryPath = path.join(coverageDir, "coverage-summary.json");
  
  if (!fs.existsSync(summaryPath)) {
    console.log(`  ${colors.dim}No coverage data found${colors.reset}`);
    return null;
  }

  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
    const total = summary.total;

    if (!total) {
      console.log(`  ${colors.dim}No coverage summary available${colors.reset}`);
      return null;
    }

    const formatPct = (pct) => {
      if (typeof pct !== "number" || isNaN(pct)) {
        return `${colors.dim}N/A${colors.reset}`;
      }
      const color = pct >= 80 ? colors.green : pct >= 50 ? colors.yellow : colors.red;
      return `${color}${pct.toFixed(1)}%${colors.reset}`;
    };

    console.log(`  ${colors.bright}${label}${colors.reset}`);
    console.log(`    Statements: ${formatPct(total.statements?.pct)} (${total.statements?.covered ?? 0}/${total.statements?.total ?? 0})`);
    console.log(`    Branches:   ${formatPct(total.branches?.pct)} (${total.branches?.covered ?? 0}/${total.branches?.total ?? 0})`);
    console.log(`    Functions:  ${formatPct(total.functions?.pct)} (${total.functions?.covered ?? 0}/${total.functions?.total ?? 0})`);
    console.log(`    Lines:      ${formatPct(total.lines?.pct)} (${total.lines?.covered ?? 0}/${total.lines?.total ?? 0})`);
    console.log("");

    return total;
  } catch (err) {
    console.log(`  ${colors.dim}Error reading coverage: ${err.message}${colors.reset}`);
    return null;
  }
}

async function main() {
  const root = __dirname;
  const testsDir = path.join(root, "tests");
  const serverCoverageDir = path.join(testsDir, "coverage", "server");
  const frontendCoverageDir = path.join(testsDir, "coverage", "frontend");

  printHeader("FlowATS Coverage Report", colors.cyan);

  console.log(`${colors.dim}Installing dependencies...${colors.reset}`);
  await installDeps(testsDir);
  console.log(`${colors.green}✓${colors.reset} Dependencies ready\n`);

  // ─────────────────────────────────────────────────────────
  // SERVER COVERAGE
  // ─────────────────────────────────────────────────────────
  printSection("Server Coverage");

  const serverExitCode = await runWithExitCode(
    "npm",
    [
      "run",
      "test:server",
      "--",
      "--coverage.enabled=true",
      "--coverage.reporter=json-summary",
      "--coverage.reporter=text",
      "--coverage.reportsDirectory=coverage/server",
      "--reporter",
      "dot",
    ],
    { cwd: testsDir }
  );

  // ─────────────────────────────────────────────────────────
  // FRONTEND COVERAGE
  // ─────────────────────────────────────────────────────────
  console.log("");
  printSection("Frontend Coverage");

  const frontendExitCode = await runWithExitCode(
    "npm",
    [
      "run",
      "test:frontend",
      "--",
      "--coverage.enabled=true",
      "--coverage.reporter=json-summary",
      "--coverage.reporter=text",
      "--coverage.reportsDirectory=coverage/frontend",
      "--reporter",
      "dot",
    ],
    { cwd: testsDir }
  );

  // ─────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────
  printHeader("Coverage Summary", colors.magenta);

  const serverTotal = printCoverageSummary(serverCoverageDir, "Server API");
  const frontendTotal = printCoverageSummary(frontendCoverageDir, "Frontend");

  // Combined summary - only if at least one has data
  if (serverTotal || frontendTotal) {
    const safeGet = (obj, key) => obj?.[key] ?? { covered: 0, total: 0 };
    const combined = {
      statements: {
        covered: (safeGet(serverTotal, "statements").covered || 0) + (safeGet(frontendTotal, "statements").covered || 0),
        total: (safeGet(serverTotal, "statements").total || 0) + (safeGet(frontendTotal, "statements").total || 0),
      },
      branches: {
        covered: (safeGet(serverTotal, "branches").covered || 0) + (safeGet(frontendTotal, "branches").covered || 0),
        total: (safeGet(serverTotal, "branches").total || 0) + (safeGet(frontendTotal, "branches").total || 0),
      },
      functions: {
        covered: (safeGet(serverTotal, "functions").covered || 0) + (safeGet(frontendTotal, "functions").covered || 0),
        total: (safeGet(serverTotal, "functions").total || 0) + (safeGet(frontendTotal, "functions").total || 0),
      },
      lines: {
        covered: (safeGet(serverTotal, "lines").covered || 0) + (safeGet(frontendTotal, "lines").covered || 0),
        total: (safeGet(serverTotal, "lines").total || 0) + (safeGet(frontendTotal, "lines").total || 0),
      },
    };

    const calcPct = (c, t) => (t > 0 ? (c / t) * 100 : 0);
    const formatPct = (pct) => {
      if (typeof pct !== "number" || isNaN(pct)) return `${colors.dim}N/A${colors.reset}`;
      const color = pct >= 80 ? colors.green : pct >= 50 ? colors.yellow : colors.red;
      return `${color}${pct.toFixed(1)}%${colors.reset}`;
    };

    console.log(`${colors.bright}${"─".repeat(50)}${colors.reset}`);
    console.log(`${colors.bright}  Combined Coverage${colors.reset}`);
    console.log(`    Statements: ${formatPct(calcPct(combined.statements.covered, combined.statements.total))}`);
    console.log(`    Branches:   ${formatPct(calcPct(combined.branches.covered, combined.branches.total))}`);
    console.log(`    Functions:  ${formatPct(calcPct(combined.functions.covered, combined.functions.total))}`);
    console.log(`    Lines:      ${formatPct(calcPct(combined.lines.covered, combined.lines.total))}`);
  }

  const overallExitCode = serverExitCode || frontendExitCode ? 1 : 0;

  if (overallExitCode === 0) {
    console.log(`\n${colors.green}${colors.bright}✓ Coverage report complete!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.red}${colors.bright}✗ Some tests failed${colors.reset}\n`);
  }

  console.log(`${colors.dim}Detailed reports: tests/coverage/{server,frontend}/index.html${colors.reset}\n`);

  process.exitCode = overallExitCode;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
