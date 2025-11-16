import { useEffect } from "react";
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

/**
 * WEB VITALS PERFORMANCE MONITORING
 *
 * Tracks Core Web Vitals and reports performance metrics.
 * Helps identify performance issues and track improvements over time.
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint): Loading performance (target: < 2.5s)
 * - INP (Interaction to Next Paint): Interactivity (target: < 200ms)
 * - CLS (Cumulative Layout Shift): Visual stability (target: < 0.1)
 * - FCP (First Contentful Paint): Initial render (target: < 1.8s)
 * - TTFB (Time to First Byte): Server response (target: < 600ms)
 *
 * Usage:
 *   // In App.tsx or main.tsx
 *   useWebVitals((metric) => {
 *     console.log(metric.name, metric.value);
 *     // Send to analytics service
 *   });
 *
 * Performance Budget:
 * - Good: LCP < 2.5s, INP < 200ms, CLS < 0.1
 * - Needs Improvement: LCP 2.5-4s, INP 200-500ms, CLS 0.1-0.25
 * - Poor: LCP > 4s, INP > 500ms, CLS > 0.25
 */

export interface PerformanceMetric extends Metric {
  /** Metric category (good, needs-improvement, poor) */
  rating: "good" | "needs-improvement" | "poor";
}

/**
 * Hook to track Web Vitals metrics
 *
 * @param onMetric - Callback function to handle metrics
 * @param enabled - Enable/disable tracking (default: true in production)
 *
 * @example
 * useWebVitals((metric) => {
 *   // Log to console in development
 *   if (import.meta.env.DEV) {
 *     console.log(metric.name, metric.value, metric.rating);
 *   }
 *
 *   // Send to analytics in production
 *   if (import.meta.env.PROD) {
 *     sendToAnalytics({
 *       name: metric.name,
 *       value: metric.value,
 *       rating: metric.rating,
 *     });
 *   }
 * });
 */
export function useWebVitals(
  onMetric: (metric: PerformanceMetric) => void,
  enabled = import.meta.env.PROD
): void {
  useEffect(() => {
    if (!enabled) return;

    // Track all Web Vitals metrics
    onCLS(onMetric);
    onINP(onMetric);
    onLCP(onMetric);
    onFCP(onMetric);
    onTTFB(onMetric);

    // No cleanup needed for web-vitals
  }, [onMetric, enabled]);
}

/**
 * Get threshold rating for a metric
 * Determines if metric is good, needs improvement, or poor
 */
function getRating(
  name: string,
  value: number
): "good" | "needs-improvement" | "poor" {
  const thresholds: Record<string, [number, number]> = {
    LCP: [2500, 4000], // ms
    INP: [200, 500], // ms (replaces FID)
    CLS: [0.1, 0.25], // score
    FCP: [1800, 3000], // ms
    TTFB: [600, 1500], // ms
  };

  const [good, poor] = thresholds[name] || [0, Infinity];

  if (value <= good) return "good";
  if (value <= poor) return "needs-improvement";
  return "poor";
}

/**
 * Web Vitals reporter for development
 * Logs metrics to console with color coding
 */
export function reportWebVitalsToConsole(metric: Metric): void {
  const rating = getRating(metric.name, metric.value);
  const color =
    rating === "good"
      ? "green"
      : rating === "needs-improvement"
      ? "orange"
      : "red";

  console.log(
    `%c${metric.name}: ${Math.round(metric.value)}${
      metric.name === "CLS" ? "" : "ms"
    } (${rating})`,
    `color: ${color}; font-weight: bold;`
  );
}

/**
 * Web Vitals reporter for analytics
 * Sends metrics to analytics service (Google Analytics, etc.)
 *
 * @example
 * useWebVitals(reportWebVitalsToAnalytics);
 */
export function reportWebVitalsToAnalytics(metric: Metric): void {
  const rating = getRating(metric.name, metric.value);

  // Send to Google Analytics if available
  if (typeof window !== "undefined" && "gtag" in window) {
    const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
    if (gtag) {
      gtag("event", metric.name, {
        value: Math.round(
          metric.name === "CLS" ? metric.value * 1000 : metric.value
        ),
        event_category: "Web Vitals",
        event_label: metric.id,
        rating,
        non_interaction: true,
      });
    }
  }

  // Send to custom analytics endpoint
  if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
    fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating,
        id: metric.id,
        timestamp: Date.now(),
      }),
    }).catch((error) => {
      console.debug("Failed to send metric to analytics:", error);
    });
  }
}

/**
 * Performance budget checker
 * Warns in development if metrics exceed thresholds
 *
 * @example
 * useWebVitals(checkPerformanceBudget);
 */
export function checkPerformanceBudget(metric: Metric): void {
  const rating = getRating(metric.name, metric.value);

  if (import.meta.env.DEV && rating === "poor") {
    const thresholds: Record<string, string> = {
      LCP: "< 2500ms",
      FID: "< 100ms",
      INP: "< 200ms",
      CLS: "< 0.1",
      FCP: "< 1800ms",
      TTFB: "< 600ms",
    };

    console.warn(
      `⚠️ Performance budget exceeded: ${metric.name} = ${Math.round(
        metric.value
      )}${metric.name === "CLS" ? "" : "ms"} (target: ${
        thresholds[metric.name] || "within limits"
      })`
    );
  }
}

/**
 * Aggregate performance metrics
 * Collects metrics and provides statistics
 */
export class PerformanceMetricsCollector {
  private metrics: Map<string, number[]> = new Map();

  add(metric: Metric): void {
    const values = this.metrics.get(metric.name) || [];
    values.push(metric.value);
    this.metrics.set(metric.name, values);
  }

  getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
      count: sorted.length,
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  getAll(): Record<
    string,
    ReturnType<PerformanceMetricsCollector["getStats"]>
  > {
    const result: Record<
      string,
      ReturnType<PerformanceMetricsCollector["getStats"]>
    > = {};
    for (const name of this.metrics.keys()) {
      result[name] = this.getStats(name);
    }
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Global collector instance
export const metricsCollector = new PerformanceMetricsCollector();
