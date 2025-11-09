/**
 * Artifact & Job Materials Routes
 *
 * GET /api/artifacts?kind=resume&jobId=123&limit=20&offset=0
 * GET /api/artifacts/:id
 * POST /api/job-materials
 * GET /api/jobs/:jobId/materials?limit=10
 *
 * All routes require authentication.
 * These routes handle AI-generated artifacts and job application materials tracking.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../utils/errors.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../utils/logger.js";

/**
 * Read and parse JSON body safely
 * Returns {} for empty body
 */
async function readJson(req: IncomingMessage): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

/**
 * LIST ARTIFACTS: GET /api/artifacts
 *
 * Query params:
 * - kind?: string (filter by artifact kind)
 * - jobId?: number (filter by job ID)
 * - limit?: number (default: 20)
 * - offset?: number (default: 0)
 *
 * Response: { items: ArtifactRow[], persisted: boolean }
 */
export async function handleListArtifacts(
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

  if (jobIdParam && Number.isNaN(jobId)) {
    throw new ApiError(400, "jobId must be numeric", "bad_request");
  }

  const canPersist = Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!canPersist) {
    // In mock mode, return empty list (no persistence available)
    const payload = { items: [], persisted: false };
    const body = JSON.stringify(payload);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body).toString(),
    });
    res.end(body);
    return;
  }

  try {
    const mod = await import("../services/supabaseAdmin.js");
    const listFn = (mod as any).listAiArtifactsForUser;
    if (typeof listFn !== "function") throw new Error("list function missing");
    const data = await listFn({ userId, kind, jobId, limit, offset });

    const payload = { items: data, persisted: true };
    const body = JSON.stringify(payload);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body).toString(),
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
 * GET ARTIFACT: GET /api/artifacts/:id
 *
 * Path param: id (artifact UUID)
 *
 * Response: { artifact: ArtifactRow }
 */
export async function handleGetArtifact(
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
    const mod = await import("../services/supabaseAdmin.js");
    const getFn = (mod as any).getAiArtifactForUser;
    if (typeof getFn !== "function") throw new Error("get function missing");
    const row = await getFn(userId, id);
    if (!row) throw new ApiError(404, "artifact not found", "not_found");

    const payload = { artifact: row };
    const body = JSON.stringify(payload);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body).toString(),
    });
    res.end(body);
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      500,
      e?.message || "artifact fetch failed",
      "artifact_fetch_failed"
    );
  }
}

/**
 * CREATE JOB MATERIALS: POST /api/job-materials
 *
 * Body:
 * {
 *   jobId: number,
 *   resume_artifact_id?: string,
 *   resume_document_id?: string,
 *   cover_artifact_id?: string,
 *   cover_document_id?: string,
 *   metadata?: Record<string, unknown>
 * }
 *
 * Validates ownership and creates a job_materials row.
 *
 * Response: 201 with { material: JobMaterialRow }
 */
export async function handleCreateJobMaterials(
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

  const jobId = Number(body?.jobId);
  if (!Number.isFinite(jobId)) {
    throw new ApiError(
      400,
      "jobId is required and must be a number",
      "bad_request"
    );
  }

  const resume_artifact_id = body?.resume_artifact_id as string | undefined;
  const cover_artifact_id = body?.cover_artifact_id as string | undefined;
  const resume_document_id = body?.resume_document_id as string | undefined;
  const cover_document_id = body?.cover_document_id as string | undefined;
  const metadata =
    (body?.metadata as Record<string, unknown> | undefined) ?? {};

  if (
    !resume_artifact_id &&
    !cover_artifact_id &&
    !resume_document_id &&
    !cover_document_id
  ) {
    throw new ApiError(
      400,
      "at least one of resume/cover artifact/document id must be provided",
      "bad_request"
    );
  }

  let mod: any;
  try {
    mod = await import("../services/supabaseAdmin.js");
  } catch (e: any) {
    throw new ApiError(
      500,
      "server not configured for persistence",
      "server_config"
    );
  }

  // Verify job exists and belongs to user
  const job = await mod.getJob(jobId);
  if (!job) throw new ApiError(404, "job not found", "not_found");
  if (job.user_id && job.user_id !== userId) {
    throw new ApiError(403, "job does not belong to user", "forbidden");
  }

  // Validate resume artifact
  if (resume_artifact_id) {
    const a = await mod.getAiArtifactForUser(userId, resume_artifact_id);
    if (!a) throw new ApiError(404, "resume artifact not found", "not_found");
    if (a.kind !== "resume") {
      throw new ApiError(
        400,
        "resume_artifact_id must point to kind=resume",
        "bad_request"
      );
    }
  }

  // Validate cover letter artifact
  if (cover_artifact_id) {
    const a = await mod.getAiArtifactForUser(userId, cover_artifact_id);
    if (!a) throw new ApiError(404, "cover artifact not found", "not_found");
    if (a.kind !== "cover_letter") {
      throw new ApiError(
        400,
        "cover_artifact_id must point to kind=cover_letter",
        "bad_request"
      );
    }
  }

  // Validate resume document
  if (resume_document_id) {
    const d = await mod.getDocumentForUser(userId, resume_document_id);
    if (!d) throw new ApiError(404, "resume document not found", "not_found");
    if (d.kind && d.kind !== "resume") {
      throw new ApiError(
        400,
        "resume_document_id must be a resume document",
        "bad_request"
      );
    }
  }

  // Validate cover letter document
  if (cover_document_id) {
    const d = await mod.getDocumentForUser(userId, cover_document_id);
    if (!d) throw new ApiError(404, "cover document not found", "not_found");
    if (d.kind && d.kind !== "cover_letter") {
      throw new ApiError(
        400,
        "cover_document_id must be a cover_letter document",
        "bad_request"
      );
    }
  }

  try {
    const row = await mod.insertJobMaterials({
      user_id: userId,
      job_id: jobId,
      resume_artifact_id: resume_artifact_id ?? null,
      cover_artifact_id: cover_artifact_id ?? null,
      resume_document_id: resume_document_id ?? null,
      cover_document_id: cover_document_id ?? null,
      metadata,
    });

    logInfo("job_materials_created", { reqId, userId, jobId, id: row.id });

    const payload = { material: row };
    const bodyStr = JSON.stringify(payload);
    res.writeHead(201, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr).toString(),
    });
    res.end(bodyStr);
  } catch (e: any) {
    logError("job_materials_insert_failed", {
      reqId,
      userId,
      jobId,
      error: e?.message,
    });
    throw new ApiError(500, "failed to create job materials", "insert_failed");
  }
}

/**
 * LIST JOB MATERIALS: GET /api/jobs/:jobId/materials
 *
 * Path param: jobId (number)
 * Query param: limit? (default: 10)
 *
 * Response: { items: JobMaterialRow[], persisted: boolean }
 */
export async function handleListJobMaterialsForJob(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  userId: string
): Promise<void> {
  const m = url.pathname.match(/^\/api\/jobs\/(\d+)\/materials$/);
  const jobId = m ? Number(m[1]) : NaN;
  if (!Number.isFinite(jobId)) {
    throw new ApiError(400, "jobId must be numeric", "bad_request");
  }

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
    });
    res.end(body);
    return;
  }

  try {
    const mod = await import("../services/supabaseAdmin.js");
    const items = await (mod as any).listJobMaterialsForJob(
      userId,
      jobId,
      limit
    );

    const payload = { items, persisted: true };
    const bodyStr = JSON.stringify(payload);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr).toString(),
    });
    res.end(bodyStr);
  } catch (e: any) {
    throw new ApiError(
      500,
      e?.message || "materials list failed",
      "materials_list_failed"
    );
  }
}
