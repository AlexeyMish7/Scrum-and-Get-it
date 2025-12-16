import type http from "node:http";
import { ApiError } from "../../utils/errors.js";
import { checkLimit } from "../../utils/rateLimiter.js";

function isHttps(req: http.IncomingMessage): boolean {
  const xfProto = String(req.headers["x-forwarded-proto"] || "").toLowerCase();
  if (xfProto) return xfProto === "https";
  // Fallback for direct TLS (rare here, but safe)
  // @ts-expect-error - IncomingMessage socket may be TLSSocket
  return Boolean(req.socket?.encrypted);
}

export function getClientIp(req: http.IncomingMessage): string {
  const xff = String(req.headers["x-forwarded-for"] || "").trim();
  const firstFromXff = xff ? xff.split(",")[0]?.trim() : "";
  const xri = String(req.headers["x-real-ip"] || "").trim();
  const raw = firstFromXff || xri || req.socket.remoteAddress || "unknown";

  // Normalize IPv6-mapped IPv4 addresses like ::ffff:127.0.0.1
  return raw.startsWith("::ffff:") ? raw.slice("::ffff:".length) : raw;
}

export function applySecurityHeaders(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  // Why: These headers reduce the browser attack surface even for an API-only service.
  // We set them early so that they apply even when handlers call `writeHead()`.
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );

  // Why: This API should never be embedded or execute scripts.
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  );

  // Only set HSTS when we know the request came over HTTPS.
  if (isHttps(req)) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }
}

function parseAllowedOrigins(): string[] {
  const raw = (process.env.CORS_ORIGIN || "").trim();
  if (!raw || raw === "*") return ["*"];

  // Support comma-separated lists: "https://a.com, https://b.com"
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string): boolean {
  const allowed = parseAllowedOrigins();
  if (allowed.includes("*")) return true;
  return allowed.includes(origin);
}

export function enforceBrowserOriginOrThrow(
  req: http.IncomingMessage,
  pathname: string
) {
  const method = String(req.method || "GET").toUpperCase();
  const isMutating =
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE";

  // Only guard API mutations; allow scripts/tools (no Origin header).
  if (!isMutating || !pathname.startsWith("/api/")) return;

  const origin = String(req.headers.origin || "").trim();
  if (!origin) return;

  if (!isOriginAllowed(origin)) {
    throw new ApiError(403, "origin not allowed", "forbidden_origin");
  }
}

function normalizeRateLimitGroup(pathname: string): string {
  if (pathname.startsWith("/api/generate/")) return "/api/generate/*";
  if (pathname.startsWith("/api/predict/")) return "/api/predict/*";
  if (pathname.startsWith("/api/predictions/")) return "/api/predictions/*";
  if (pathname.startsWith("/api/cover-letter/drafts"))
    return "/api/cover-letter/drafts";
  if (pathname.startsWith("/api/artifacts")) return "/api/artifacts";
  if (pathname.startsWith("/api/job-materials")) return "/api/job-materials";
  if (pathname.startsWith("/api/jobs/")) return "/api/jobs/*";
  if (pathname.startsWith("/api/company/")) return "/api/company/*";
  if (pathname.startsWith("/api/analytics/")) return "/api/analytics/*";
  if (pathname.startsWith("/api/monitoring/")) return "/api/monitoring/*";
  return pathname;
}

export function enforceIpRateLimitOrThrow(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string
) {
  if (!pathname.startsWith("/api/") || pathname === "/api/health") return;

  const ip = getClientIp(req);
  const group = normalizeRateLimitGroup(pathname);

  // Why: This service runs on a single Node process in most course deployments.
  // This per-instance limiter still prevents accidental storms and basic abuse.
  // For multi-instance production, swap to a shared store (Redis) behind this interface.
  let max = 600;
  const windowMs = 300_000; // 5 minutes

  if (
    group === "/api/generate/*" ||
    group === "/api/predict/*" ||
    group === "/api/predictions/*"
  ) {
    max = 200;
  }

  if (group === "/api/monitoring/*" || group === "/api/metrics") {
    max = 120;
  }

  const method = String(req.method || "GET").toUpperCase();
  const limit = checkLimit(`ip:${ip}:${method}:${group}`, max, windowMs);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }
}
