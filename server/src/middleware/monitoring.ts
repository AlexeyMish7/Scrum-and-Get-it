/**
 * RESOURCE MONITORING MIDDLEWARE (UC-137)
 *
 * Purpose:
 * - Monitor CPU, memory, and database connections
 * - Track request performance metrics
 * - Identify resource bottlenecks
 *
 * UC-137 Requirements:
 * - Monitor resource usage (CPU, memory, database connections)
 * - Identify bottlenecks for optimization
 * - Support future auto-scaling decisions
 */

import os from "os";
import http from "http";

// Type aliases for Node.js native HTTP (not Express)
type Request = http.IncomingMessage & {
  method: string;
  path?: string;
  url?: string;
};
type Response = http.ServerResponse & { statusCode: number };
type NextFunction = () => void;

export interface ResourceMetrics {
  timestamp: number;
  cpu: {
    usage: number; // 0-1 (percentage as decimal)
    loadAverage: number[]; // 1min, 5min, 15min
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    percentage: number; // 0-1
    free: number; // bytes
  };
  process: {
    heapUsed: number; // bytes
    heapTotal: number; // bytes
    rss: number; // resident set size
    external: number; // C++ objects bound to JS
    uptime: number; // seconds
  };
  connections?: {
    active: number;
    idle: number;
    utilization: number; // 0-1
  };
}

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number; // milliseconds
  timestamp: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
}

/**
 * Get current resource metrics
 *
 * UC-137: Monitor system resources
 */
export function getResourceMetrics(): ResourceMetrics {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;

  const memUsage = process.memoryUsage();

  return {
    timestamp: Date.now(),
    cpu: {
      usage: getCPUUsage(),
      loadAverage: os.loadavg(),
    },
    memory: {
      used: usedMemory,
      total: totalMemory,
      percentage: usedMemory / totalMemory,
      free: freeMemory,
    },
    process: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
      external: memUsage.external,
      uptime: process.uptime(),
    },
  };
}

/**
 * Calculate CPU usage percentage
 *
 * Uses CPU time delta between calls
 */
let lastCPUUsage = process.cpuUsage();
let lastCPUCheck = Date.now();

function getCPUUsage(): number {
  const currentUsage = process.cpuUsage();
  const currentTime = Date.now();

  const userDelta = currentUsage.user - lastCPUUsage.user;
  const systemDelta = currentUsage.system - lastCPUUsage.system;
  const timeDelta = (currentTime - lastCPUCheck) * 1000; // convert to microseconds

  // Update for next call
  lastCPUUsage = currentUsage;
  lastCPUCheck = currentTime;

  // Calculate percentage (0-1)
  if (timeDelta === 0) return 0;
  return (userDelta + systemDelta) / timeDelta;
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format percentage to string
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Check if resource usage is critical
 *
 * UC-137: Alert thresholds for auto-scaling
 */
export function getResourceStatus(metrics: ResourceMetrics): {
  status: "healthy" | "warning" | "critical";
  alerts: string[];
} {
  const alerts: string[] = [];

  // Track severity levels - use numbers to avoid TypeScript narrowing issues
  // 0 = healthy, 1 = warning, 2 = critical
  let severity = 0;

  // Memory checks
  if (metrics.memory.percentage > 0.9) {
    alerts.push(
      `Critical memory usage: ${formatPercentage(metrics.memory.percentage)}`
    );
    severity = 2;
  } else if (metrics.memory.percentage > 0.8) {
    alerts.push(
      `High memory usage: ${formatPercentage(metrics.memory.percentage)}`
    );
    if (severity < 1) severity = 1;
  }

  // CPU checks
  if (metrics.cpu.usage > 0.9) {
    alerts.push(`Critical CPU usage: ${formatPercentage(metrics.cpu.usage)}`);
    severity = 2;
  } else if (metrics.cpu.usage > 0.7) {
    alerts.push(`High CPU usage: ${formatPercentage(metrics.cpu.usage)}`);
    if (severity < 1) severity = 1;
  }

  // Heap checks (process memory)
  const heapPercentage = metrics.process.heapUsed / metrics.process.heapTotal;
  if (heapPercentage > 0.9) {
    alerts.push(`Critical heap usage: ${formatPercentage(heapPercentage)}`);
    severity = 2;
  }

  // Connection checks (if available)
  if (metrics.connections && metrics.connections.utilization > 0.9) {
    alerts.push(
      `Critical connection pool usage: ${formatPercentage(
        metrics.connections.utilization
      )}`
    );
    severity = 2;
  }

  // Convert severity number back to status string
  const status: "healthy" | "warning" | "critical" =
    severity === 2 ? "critical" : severity === 1 ? "warning" : "healthy";

  return { status, alerts };
}

/**
 * Log resource metrics
 *
 * UC-137: Periodic resource logging for monitoring
 */
export function logResourceMetrics(metrics: ResourceMetrics): void {
  const { status, alerts } = getResourceStatus(metrics);

  console.log("\n📊 Resource Metrics:");
  console.log(`  CPU: ${formatPercentage(metrics.cpu.usage)}`);
  console.log(
    `  Memory: ${formatBytes(metrics.memory.used)} / ${formatBytes(
      metrics.memory.total
    )} (${formatPercentage(metrics.memory.percentage)})`
  );
  console.log(
    `  Heap: ${formatBytes(metrics.process.heapUsed)} / ${formatBytes(
      metrics.process.heapTotal
    )}`
  );
  console.log(
    `  Uptime: ${Math.floor(metrics.process.uptime / 60)}m ${Math.floor(
      metrics.process.uptime % 60
    )}s`
  );

  if (metrics.connections) {
    console.log(
      `  DB Connections: ${metrics.connections.active} active, ${
        metrics.connections.idle
      } idle (${formatPercentage(metrics.connections.utilization)})`
    );
  }

  console.log(
    `  Status: ${
      status === "healthy" ? "✅" : status === "warning" ? "⚠️" : "🚨"
    } ${status.toUpperCase()}`
  );

  if (alerts.length > 0) {
    console.log("  Alerts:");
    alerts.forEach((alert) => console.log(`    - ${alert}`));
  }
}

/**
 * Request monitoring middleware
 *
 * UC-137: Track request performance and resource usage
 */
export function requestMonitoring() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const memoryBefore = process.memoryUsage().heapUsed;
    // Get path from url (Node.js native http uses 'url', not 'path')
    const requestPath = req.url || "/";

    // Log when response finishes
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryDelta = memoryAfter - memoryBefore;

      const metrics: RequestMetrics = {
        method: req.method || "GET",
        path: requestPath,
        statusCode: res.statusCode,
        duration,
        timestamp: startTime,
        memoryBefore,
        memoryAfter,
        memoryDelta,
      };

      // Log slow requests (> 1 second)
      if (duration > 1000) {
        console.warn(
          `⚠️ Slow request: ${metrics.method} ${metrics.path} - ${duration}ms`
        );
      }

      // Log high memory usage (> 10MB)
      if (Math.abs(memoryDelta) > 10 * 1024 * 1024) {
        console.warn(
          `⚠️ High memory delta: ${metrics.method} ${
            metrics.path
          } - ${formatBytes(memoryDelta)}`
        );
      }

      // Log to external monitoring service (e.g., DataDog, New Relic)
      // sendMetricsToMonitoring(metrics);
    });

    next();
  };
}

/**
 * Health check endpoint handler
 *
 * UC-137: /api/health endpoint for monitoring
 *
 * Example usage in server.ts:
 * ```
 * import { healthCheck } from './middleware/monitoring';
 * app.get('/api/health', healthCheck);
 * ```
 */
export async function healthCheck(_req: Request, res: Response): Promise<void> {
  const metrics = getResourceMetrics();
  const { status, alerts } = getResourceStatus(metrics);

  // Add database connection health if available
  // const dbHealth = await getConnectionHealthStatus();
  // metrics.connections = dbHealth;

  const response = {
    status,
    timestamp: new Date().toISOString(),
    uptime: metrics.process.uptime,
    metrics: {
      cpu: {
        usage: formatPercentage(metrics.cpu.usage),
        loadAverage: metrics.cpu.loadAverage.map((avg) => avg.toFixed(2)),
      },
      memory: {
        used: formatBytes(metrics.memory.used),
        total: formatBytes(metrics.memory.total),
        percentage: formatPercentage(metrics.memory.percentage),
      },
      process: {
        heapUsed: formatBytes(metrics.process.heapUsed),
        heapTotal: formatBytes(metrics.process.heapTotal),
        rss: formatBytes(metrics.process.rss),
      },
    },
    alerts,
  };

  // Return 503 if critical, 200 otherwise
  const statusCode = status === "critical" ? 503 : 200;

  // Use native Node.js http response methods
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(response));
}

/**
 * Start periodic resource monitoring
 *
 * UC-137: Background monitoring task
 * Run every 30 seconds to log resource usage
 */
export function startResourceMonitoring(
  intervalMs: number = 30000
): NodeJS.Timer {
  return setInterval(() => {
    const metrics = getResourceMetrics();
    logResourceMetrics(metrics);
  }, intervalMs);
}

/**
 * UC-137 Monitoring Strategy Documentation
 *
 * Free Tier Monitoring:
 * - Built-in Node.js metrics (CPU, memory, uptime)
 * - Request performance tracking (duration, memory)
 * - Health check endpoint for external monitoring
 * - Console logging for debugging
 *
 * Production Monitoring (Future):
 * - External APM: DataDog, New Relic, AppSignal
 * - Log aggregation: LogTail, Papertrail
 * - Uptime monitoring: UptimeRobot, Pingdom
 * - Error tracking: Sentry, Rollbar
 *
 * Alert Thresholds:
 * - Memory > 80%: Warning (consider scaling)
 * - Memory > 90%: Critical (auto-scale or restart)
 * - CPU > 70%: Warning
 * - CPU > 90%: Critical
 * - Request > 1s: Slow (investigate queries)
 * - Request > 5s: Very slow (likely timeout)
 *
 * Integration with Auto-Scaling:
 * - Platform-specific (Vercel, Render, Railway)
 * - Monitor /api/health endpoint
 * - Scale up when status = 'critical' for 5+ minutes
 * - Scale down when status = 'healthy' for 30+ minutes
 *
 * Free Tier Platforms with Auto-Scaling:
 * - Vercel: Automatic (serverless)
 * - Render: Manual scaling only in free tier
 * - Railway: Manual scaling
 * - Fly.io: Manual scaling
 *
 * Recommendation (UC-137):
 * - Start with Vercel (automatic scaling)
 * - If Node.js server needed: Railway (easy migration)
 * - Add external monitoring when > 1000 users
 */
