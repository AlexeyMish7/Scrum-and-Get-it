/**
 * JOB MATERIALS SERVICE (⚠️ LEGACY - Use document_jobs table instead)
 *
 * Status: DEPRECATED - Kept for historical data access only
 *
 * Purpose (Historical):
 * - Link resumes and cover letters to job applications
 * - Support both legacy artifacts and newer document references
 * - Track which materials were used for each application
 *
 * Migration Path:
 * - New code → Use document_jobs table directly (many-to-many linking)
 * - This service → Read-only access to legacy job_materials table
 * - Do NOT create new job_materials records
 *
 * Why Deprecated:
 * - Awkward dual-reference pattern (document_id vs artifact_id)
 * - No support for multiple versions of same document
 * - No branching or version history
 * - Limited metadata capabilities
 *
 * Replacement Pattern:
 *   Old: await upsertJobMaterials(userId, {
 *          job_id: 123,
 *          resume_document_id: 'abc',
 *          cover_document_id: 'def'
 *        })
 *
 *   New: await linkDocumentToJob(userId, {
 *          document_id: 'abc',
 *          job_id: 123,
 *          document_type: 'resume'
 *        })
 *        await linkDocumentToJob(userId, {
 *          document_id: 'def',
 *          job_id: 123,
 *          document_type: 'cover-letter'
 *        })
 *
 * Backend Connection:
 * - Database: job_materials table (via crud.ts + RLS)
 * - RLS-enforced user_id scoping
 * - Table still exists for historical data
 */
import { withUser } from "./crud";
import type { Result, ListOptions } from "./types";

export interface JobMaterialsRow {
  id: string;
  user_id: string;
  job_id: number;
  resume_document_id?: string | null;
  resume_artifact_id?: string | null;
  cover_document_id?: string | null;
  cover_artifact_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertJobMaterialsPayload {
  job_id: number;
  resume_document_id?: string | null;
  resume_artifact_id?: string | null;
  cover_document_id?: string | null;
  cover_artifact_id?: string | null;
  metadata?: Record<string, unknown>;
}

const TABLE = "job_materials";

// Insert a new materials selection for a job (new row per change for history)
export async function addJobMaterials(
  userId: string,
  payload: UpsertJobMaterialsPayload
): Promise<Result<JobMaterialsRow>> {
  const userCrud = withUser(userId);
  return userCrud.insertRow<JobMaterialsRow>(TABLE, payload);
}

// List materials history for a job (most recent first)
export async function listJobMaterialsHistory(
  userId: string,
  jobId: number,
  opts?: Omit<ListOptions, "eq" | "order"> & { limit?: number; offset?: number }
): Promise<Result<JobMaterialsRow[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows<JobMaterialsRow>(TABLE, "*", {
    ...(opts ?? {}),
    eq: { job_id: jobId },
    order: { column: "created_at", ascending: false },
  });
}

// Get the latest (current) materials for a job using the view if present, falling back to history
export async function getCurrentJobMaterials(
  userId: string,
  jobId: number
): Promise<Result<JobMaterialsRow | null>> {
  const userCrud = withUser(userId);
  // Try the view first (if the DB has it)
  const viewRes = await userCrud.getRow<JobMaterialsRow>(
    "v_job_current_materials",
    "*",
    { eq: { job_id: jobId }, single: true }
  );
  if (!viewRes.error && viewRes.data) return viewRes;

  // Fallback: query the base table (ordered by created_at desc)
  const listRes = await userCrud.listRows<JobMaterialsRow>(TABLE, "*", {
    eq: { job_id: jobId },
    order: { column: "created_at", ascending: false },
    limit: 1,
  });
  return {
    data: listRes.data && listRes.data[0] ? listRes.data[0] : null,
    error: listRes.error,
    status: listRes.status ?? null,
  };
}

export default {
  addJobMaterials,
  listJobMaterialsHistory,
  getCurrentJobMaterials,
};
