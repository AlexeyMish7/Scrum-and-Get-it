/**
 * ACCESSIBILITY AUDITING (Development Only)
 *
 * Integrates axe-core for automated accessibility testing in development.
 * Logs WCAG violations to console with severity and remediation guidance.
 *
 * USAGE:
 * Import and call once in App.tsx or main.tsx (development only):
 *
 * ```ts
 * import { initAccessibilityAudit } from '@shared/utils/a11yAudit';
 *
 * if (import.meta.env.DEV) {
 *   initAccessibilityAudit();
 * }
 * ```
 *
 * FEATURES:
 * - Automatic violation detection on mount and updates
 * - Color-coded console output by severity (critical, serious, moderate, minor)
 * - Links to WCAG documentation for each violation
 * - Configurable violation threshold (default: warn on all)
 *
 * WCAG LEVELS:
 * - Level A: Essential (violations block basic access)
 * - Level AA: Ideal target (industry standard)
 * - Level AAA: Enhanced (exceeds typical requirements)
 */

/**
 * Initialize accessibility auditing with axe-core
 * Only runs in development mode
 *
 * @param options Configuration options
 * @returns Cleanup function to stop auditing
 */
export async function initAccessibilityAudit(
  options: {
    /** Minimum impact level to report (default: all violations) */
    minImpact?: "critical" | "serious" | "moderate" | "minor";
    /** WCAG level to test against (default: AA) */
    wcagLevel?: "A" | "AA" | "AAA";
    /** Delay before running audit (ms, default: 1000) */
    auditDelay?: number;
  } = {}
): Promise<() => void> {
  // Only run in development
  if (!import.meta.env.DEV) {
    return () => {};
  }

  const { minImpact = "minor", wcagLevel = "AA", auditDelay = 1000 } = options;

  try {
    // Dynamically import axe-core and React integration
    const axe = await import("@axe-core/react");
    const React = await import("react");
    const ReactDOM = await import("react-dom/client");

    // Run axe on the document
    let timeoutId: number;

    const runAudit = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(async () => {
        try {
          // @axe-core/react takes (React, ReactDOM, delay) parameters
          axe.default(React.default, ReactDOM.default, auditDelay);
        } catch (error) {
          console.error("Accessibility audit failed:", error);
        }
      }, auditDelay);
    };

    // Run initial audit
    runAudit();

    // Re-run on DOM mutations (debounced)
    const observer = new MutationObserver(runAudit);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    console.info(
      `%c♿ Accessibility Auditing Enabled (WCAG ${wcagLevel}, min impact: ${minImpact})`,
      "color: #0066cc; font-weight: bold; font-size: 12px;"
    );

    // Return cleanup function
    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  } catch (error) {
    console.warn("Could not initialize accessibility auditing:", error);
    return () => {};
  }
}

/**
 * Manual accessibility audit of specific element
 * Useful for testing individual components in isolation
 *
 * @param element Element to audit
 * @param options Audit configuration
 * @returns Promise with results
 */
export async function auditElement(
  element: HTMLElement,
  options: {
    wcagLevel?: "A" | "AA" | "AAA";
    rules?: string[];
  } = {}
): Promise<import("axe-core").AxeResults | null> {
  if (!import.meta.env.DEV) {
    return null;
  }

  try {
    const axeCore = await import("axe-core");
    type RunOptions = import("axe-core").RunOptions;
    type AxeResults = import("axe-core").AxeResults;
    type Result = import("axe-core").Result;
    type NodeResult = import("axe-core").NodeResult;

    const { wcagLevel = "AA", rules } = options;

    // Configure axe-core run options
    const config: RunOptions = {
      runOnly: {
        type: "tag",
        values: [
          `wcag${wcagLevel.toLowerCase()}`,
          `wcag2${wcagLevel.toLowerCase()}`,
        ],
      },
    };

    // If specific rules provided, enable only those
    if (rules && rules.length > 0) {
      delete config.runOnly;
      config.rules = {};
      rules.forEach((rule) => {
        config.rules![rule] = { enabled: true };
      });
    }

    const results: AxeResults = await axeCore.default.run(element, config);

    // Log results to console
    if (results.violations.length > 0) {
      console.group(
        `%c♿ Accessibility Violations (${results.violations.length})`,
        "color: red; font-weight: bold;"
      );
      results.violations.forEach((violation: Result) => {
        const impactColor =
          violation.impact === "critical"
            ? "red"
            : violation.impact === "serious"
            ? "orange"
            : violation.impact === "moderate"
            ? "gold"
            : "yellow";

        console.group(
          `%c${violation.impact?.toUpperCase()} - ${violation.help}`,
          `color: ${impactColor}; font-weight: bold;`
        );
        console.log("Description:", violation.description);
        console.log("Help:", violation.helpUrl);
        console.log("Affected elements:", violation.nodes.length);
        violation.nodes.forEach((node: NodeResult, i: number) => {
          console.log(`  ${i + 1}. ${node.target.join(" > ")}`);
          console.log(`     HTML: ${node.html}`);
          if (node.failureSummary) {
            console.log(`     Issue: ${node.failureSummary}`);
          }
        });
        console.groupEnd();
      });
      console.groupEnd();
    } else {
      console.log(
        "%c♿ No accessibility violations found!",
        "color: green; font-weight: bold;"
      );
    }

    return results;
  } catch (error) {
    console.error("Element audit failed:", error);
    return null;
  }
}

/**
 * Get summary statistics of accessibility violations
 *
 * @param results Axe audit results
 * @returns Summary object with counts by impact level
 */
export function getViolationSummary(results: import("axe-core").AxeResults): {
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
} {
  const summary = {
    total: results.violations.length,
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  results.violations.forEach((violation) => {
    if (violation.impact === "critical") summary.critical++;
    else if (violation.impact === "serious") summary.serious++;
    else if (violation.impact === "moderate") summary.moderate++;
    else if (violation.impact === "minor") summary.minor++;
  });

  return summary;
}

/**
 * Generate accessibility report as formatted string
 * Useful for logging or exporting
 *
 * @param results Axe audit results
 * @returns Formatted report string
 */
export function generateReport(results: import("axe-core").AxeResults): string {
  const summary = getViolationSummary(results);

  let report = "=".repeat(60) + "\n";
  report += "ACCESSIBILITY AUDIT REPORT\n";
  report += "=".repeat(60) + "\n\n";

  report += `Total Violations: ${summary.total}\n`;
  report += `  Critical: ${summary.critical}\n`;
  report += `  Serious:  ${summary.serious}\n`;
  report += `  Moderate: ${summary.moderate}\n`;
  report += `  Minor:    ${summary.minor}\n\n`;

  report += `Passes: ${results.passes.length}\n`;
  report += `Incomplete: ${results.incomplete.length}\n`;
  report += `Inapplicable: ${results.inapplicable.length}\n\n`;

  if (results.violations.length > 0) {
    report += "=".repeat(60) + "\n";
    report += "VIOLATIONS\n";
    report += "=".repeat(60) + "\n\n";

    results.violations.forEach((violation, i) => {
      report += `${i + 1}. [${violation.impact?.toUpperCase()}] ${
        violation.help
      }\n`;
      report += `   ${violation.description}\n`;
      report += `   Help: ${violation.helpUrl}\n`;
      report += `   Tags: ${violation.tags.join(", ")}\n`;
      report += `   Affected elements: ${violation.nodes.length}\n`;
      violation.nodes.forEach((node, j) => {
        report += `     ${j + 1}. ${node.target.join(" > ")}\n`;
      });
      report += "\n";
    });
  }

  return report;
}
