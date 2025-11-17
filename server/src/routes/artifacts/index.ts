/**
 * ARTIFACTS ROUTES
 *
 * Endpoints:
 * - GET  /api/artifacts           - list()
 * - GET  /api/artifacts/:id       - get()
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../../utils/errors.js";
import { getCorsHeaders } from "../../middleware/cors.js";
import { legacyLogError as logError } from "../../../utils/logger.js";

// Type definition for dynamic supabase import
type SupabaseAdminModule = {
  default: unknown;
  listAiArtifactsForUser: (params: {
    userId: string;
    kind?: string;
    jobId?: number;
    limit?: number;
    offset?: number;
  }) => Promise<unknown[]>;
  getAiArtifactForUser: (userId: string, id: string) => Promise<unknown>;
};

/**
 * GET /api/artifacts
 *
 * Query params:
 * - kind?: string (filter by artifact kind)
 * - jobId?: number (filter by job ID)
 * - limit?: number (default: 20)
 * - offset?: number (default: 0)
 *
 * Response: { items: ArtifactRow[], persisted: boolean }
 */
export async function get(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  userId: string
): Promise<void> {
  const kind = url.searchParams.get("kind") || undefined;
  const jobIdParam = url.searchParams.get("jobId");
  const jobId = jobIdParam ? Number(jobIdParam) : undefined;
  const limit = Number(url.searchParams.get("limit") || 20);
  const offset = Number(url.searchParams.get("offset") || 0);

  const canPersist = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!canPersist) {
    const payload = { items: [], persisted: false };
    const body = JSON.stringify(payload);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body).toString(),
      ...getCorsHeaders(),
    });
    res.end(body);
    return;
  }

  try {
    const mod = (await import(
      "../../services/supabaseAdmin.js"
    )) as SupabaseAdminModule;
    const listFn = mod.listAiArtifactsForUser;
    if (typeof listFn !== "function") throw new Error("list function missing");
    const data = await listFn({ userId, kind, jobId, limit, offset });

    const payload = { items: data, persisted: true };
    const body = JSON.stringify(payload);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body).toString(),
      ...getCorsHeaders(),
    });
    res.end(body);
  } catch (e: any) {
    throw new ApiError(
      500,
      e?.message || "artifact list failed",
      "artifact_list_failed"
    );
  }
}

/**
 * GET /api/artifacts/:id
 *
 * Path param: id (artifact UUID)
 *
 * Response: { artifact: ArtifactRow }
 */
export async function getById(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  userId: string
): Promise<void> {
  const id = url.pathname.split("/api/artifacts/")[1];
  if (!id) throw new ApiError(400, "missing artifact id", "bad_request");

  const canPersist = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!canPersist) {
    throw new ApiError(
      404,
      "artifact not found (persistence disabled)",
      "not_found"
    );
  }

  try {
    const mod = (await import(
      "../../services/supabaseAdmin.js"
    )) as SupabaseAdminModule;
    const getFn = mod.getAiArtifactForUser;
    if (typeof getFn !== "function") throw new Error("get function missing");
    const row = await getFn(userId, id);
    if (!row) throw new ApiError(404, "artifact not found", "not_found");

    const payload = { artifact: row };
    const body = JSON.stringify(payload);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body).toString(),
      ...getCorsHeaders(),
    });
    res.end(body);
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    logError("artifact_get_failed", { error: e.message });
    throw new ApiError(
      500,
      e?.message || "artifact retrieval failed",
      "artifact_get_failed"
    );
  }
}
