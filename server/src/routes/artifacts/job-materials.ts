/**
 * JOB MATERIALS ROUTES
 *
 * Endpoints:
 * - POST /api/job-materials                   - post()
 * - GET  /api/jobs/:jobId/materials           - getByJob()
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../../utils/errors.js";
import { readJson } from "../../../utils/http.js";
import { getCorsHeaders } from "../../middleware/cors.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../../utils/logger.js";

// Type definition for dynamic supabase import
type SupabaseAdminModule = {
  default: unknown;
  insertJobMaterials: (payload: unknown) => Promise<unknown>;
  listJobMaterialsForJob: (
    userId: string,
    jobId: number,
    limit?: number
  ) => Promise<unknown[]>;
  getDocumentForUser: (userId: string, id: string) => Promise<unknown>;
  getAiArtifactForUser: (userId: string, id: string) => Promise<unknown>;
};

/**
 * POST /api/job-materials
 *
 * Body: {
 *   jobId: number,
 *   resumeDocumentId?: string,
 *   resumeArtifactId?: string,
 *   coverDocumentId?: string,
 *   coverArtifactId?: string,
 *   metadata?: object
 * }
 *
 * Response: { row: JobMaterialsRow, persisted: boolean }
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string
): Promise<void> {
  let body: any;
  try {
    body = await readJson(req);
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  const jobId = body?.jobId;
  if (!jobId || Number.isNaN(Number(jobId))) {
    throw new ApiError(
      400,
      "jobId is required and must be a number",
      "bad_request"
    );
  }

  const resumeDocumentId = body?.resumeDocumentId || null;
  const resumeArtifactId = body?.resumeArtifactId || null;
  const coverDocumentId = body?.coverDocumentId || null;
  const coverArtifactId = body?.coverArtifactId || null;
  const metadata = body?.metadata || {};

  const canPersist = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!canPersist) {
    const mockRow = {
      id: "mock-id",
      user_id: userId,
      job_id: jobId,
      resume_document_id: resumeDocumentId,
      resume_artifact_id: resumeArtifactId,
      cover_document_id: coverDocumentId,
      cover_artifact_id: coverArtifactId,
      metadata,
      created_at: new Date().toISOString(),
    };
    const payload = { row: mockRow, persisted: false };
    const bodyStr = JSON.stringify(payload);
    res.writeHead(201, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr).toString(),
      ...getCorsHeaders(),
    });
    res.end(bodyStr);
    return;
  }

  try {
    const mod = (await import(
      "../../services/supabaseAdmin.js"
    )) as SupabaseAdminModule;

    // Verify ownership of referenced documents/artifacts
    if (resumeDocumentId) {
      const doc = await mod.getDocumentForUser(userId, resumeDocumentId);
      if (!doc)
        throw new ApiError(404, "resume document not found", "not_found");
    }
    if (resumeArtifactId) {
      const art = await mod.getAiArtifactForUser(userId, resumeArtifactId);
      if (!art)
        throw new ApiError(404, "resume artifact not found", "not_found");
    }
    if (coverDocumentId) {
      const doc = await mod.getDocumentForUser(userId, coverDocumentId);
      if (!doc)
        throw new ApiError(404, "cover document not found", "not_found");
    }
    if (coverArtifactId) {
      const art = await mod.getAiArtifactForUser(userId, coverArtifactId);
      if (!art)
        throw new ApiError(404, "cover artifact not found", "not_found");
    }

    // Insert job materials row
    const insertFn = mod.insertJobMaterials;
    if (typeof insertFn !== "function")
      throw new Error("insert function missing");

    const row = await insertFn({
      user_id: userId,
      job_id: jobId,
      resume_document_id: resumeDocumentId,
      resume_artifact_id: resumeArtifactId,
      cover_document_id: coverDocumentId,
      cover_artifact_id: coverArtifactId,
      metadata,
    });

    logInfo("job_materials_created", { reqId, userId, jobId });

    const payload = { row, persisted: true };
    const bodyStr = JSON.stringify(payload);
    res.writeHead(201, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr).toString(),
      ...getCorsHeaders(),
    });
    res.end(bodyStr);
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    logError("job_materials_create_failed", { reqId, error: e.message });
    throw new ApiError(
      500,
      e?.message || "job materials creation failed",
      "create_failed"
    );
  }
}

/**
 * GET /api/jobs/:jobId/materials
 *
 * Query params:
 * - limit?: number (default: 10)
 *
 * Response: { items: JobMaterialsRow[], persisted: boolean }
 */
export async function getByJob(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  userId: string
): Promise<void> {
  const jobIdMatch = url.pathname.match(/\/api\/jobs\/(\d+)\/materials/);
  if (!jobIdMatch) {
    throw new ApiError(400, "invalid job ID in path", "bad_request");
  }
  const jobId = Number(jobIdMatch[1]);
  const limit = Number(url.searchParams.get("limit") || 10);

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
    const items = await mod.listJobMaterialsForJob(userId, jobId, limit);

    const payload = { items, persisted: true };
    const bodyStr = JSON.stringify(payload);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr).toString(),
      ...getCorsHeaders(),
    });
    res.end(bodyStr);
  } catch (e: any) {
    throw new ApiError(
      500,
      e?.message || "failed to list job materials",
      "list_failed"
    );
  }
}
