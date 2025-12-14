/**
 * API URL helpers
 *
 * Why this exists (UC-129): production deployments often host frontend and backend
 * on different domains. We need a single place to decide whether API calls should
 * go to same-origin ("/api/..." via Vite proxy or platform rewrites) or to an
 * absolute backend URL.
 */

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getApiBaseUrl(): string {
  // Preferred: explicit base for all backend endpoints
  const configured =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

  // Back-compat: some code used AI-specific or legacy names.
  const aiBase = (import.meta.env.VITE_AI_BASE_URL as string | undefined) ?? "";
  const legacy = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

  return normalizeBaseUrl(configured || aiBase || legacy);
}

/**
 * Convert an API path like "/api/health" into either:
 * - "/api/health" (same-origin), or
 * - "https://your-backend.com/api/health" (cross-origin)
 */
export function toApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}
