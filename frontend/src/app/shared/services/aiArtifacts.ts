/**
 * AI ARTIFACTS SERVICE (⚠️ LEGACY - Use documents.ts instead)
 *
 * Status: DEPRECATED - Kept for historical data access only
 *
 * Purpose (Historical):
 * - Original AI-generated content storage (resumes, cover letters)
 * - Single-table approach with unstructured content JSONB field
 * - No versioning, branching, or structured schemas
 *
 * Migration Path:
 * - New code → Use documents.ts service (documents + document_versions tables)
 * - This service → Read-only access to legacy ai_artifacts table
 * - Do NOT create new artifacts via this service
 *
 * Why Deprecated:
 * - No version history tracking
 * - No structured content schema (just generic JSONB)
 * - No document-job linking support
 * - No export history
 * - No file storage integration
 *
 * Replacement Pattern:
 *   Old: await insertAiArtifact(userId, { kind: 'resume', content: {...} })
 *   New: const doc = await createDocument(userId, { type: 'resume', file_name: '...' })
 *        await saveDocumentVersion(userId, doc.id, { content: {...} })
 *
 * Backend Connection:
 * - Database: ai_artifacts table (via crud.ts + RLS)
 * - RLS-enforced user_id scoping
 * - Table still exists for historical data, but not actively used
 */
import { withUser } from "./crud";
import type { Result, ListOptions } from "./types";
import type {
  AiArtifactKind,
  AiArtifactRow,
  AiArtifactContentUnion,
  InsertAiArtifactPayload,
} from "./types/aiArtifacts";

// Table name constant for clarity and ref safety
const TABLE = "ai_artifacts";

// Insert a new AI artifact (auto-scopes user_id using withUser)
export async function insertAiArtifact(
  userId: string,
  payload: InsertAiArtifactPayload
): Promise<Result<AiArtifactRow>> {
  const userCrud = withUser(userId);
  // Ensure kind matches allowed values before sending (quick guard)
  if (!payload.kind) {
    return { data: null, error: { message: "kind is required" }, status: 400 };
  }
  // Serialize content & metadata directly; rely on DB jsonb
  return userCrud.insertRow<AiArtifactRow>(TABLE, {
    kind: payload.kind,
    title: payload.title ?? null,
    job_id: payload.job_id ?? null,
    prompt: payload.prompt ?? null,
    model: payload.model ?? null,
    content: payload.content,
    metadata: payload.metadata ?? {},
  });
}

// Fetch a single artifact by id (scoped to user)
export async function getAiArtifact(
  userId: string,
  id: string
): Promise<Result<AiArtifactRow | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow<AiArtifactRow>(TABLE, "*", {
    eq: { id },
    single: true,
  });
}

// List artifacts for a user with optional filters (e.g., by kind or job_id)
export async function listAiArtifacts(
  userId: string,
  opts?: ListOptions
): Promise<Result<AiArtifactRow[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows<AiArtifactRow>(TABLE, "*", opts);
}

// Convenience: list artifacts for a specific job
export async function listAiArtifactsForJob(
  userId: string,
  jobId: number,
  opts?: Omit<ListOptions, "eq"> & { kinds?: AiArtifactKind[] }
): Promise<Result<AiArtifactRow[]>> {
  const userCrud = withUser(userId);
  const baseEq: Record<string, number> = { job_id: jobId };
  if (opts?.kinds && opts.kinds.length) {
    // Use 'in' filter for kinds
    return userCrud.listRows<AiArtifactRow>(TABLE, "*", {
      ...opts,
      eq: baseEq,
      in: { kind: opts.kinds },
    });
  }
  return userCrud.listRows<AiArtifactRow>(TABLE, "*", { ...opts, eq: baseEq });
}

// Update artifact metadata or title (content updates should generally create a new artifact for versioning)
export async function updateAiArtifactMeta(
  userId: string,
  id: string,
  patch: { title?: string | null; metadata?: Record<string, unknown> }
): Promise<Result<AiArtifactRow>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow<AiArtifactRow>(
    TABLE,
    {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.metadata !== undefined ? { metadata: patch.metadata } : {}),
    },
    { eq: { id } }
  );
}

// Soft-clone: create a new artifact version using an existing one's content with optional overrides
export async function cloneAiArtifact(
  userId: string,
  source: AiArtifactRow,
  overrides?: Partial<InsertAiArtifactPayload>
): Promise<Result<AiArtifactRow>> {
  const content: AiArtifactContentUnion | Record<string, unknown> =
    overrides?.content ?? (source.content as Record<string, unknown>);
  return insertAiArtifact(userId, {
    kind: overrides?.kind ?? source.kind,
    title: overrides?.title ?? source.title ?? `Clone of ${source.id}`,
    job_id: overrides?.job_id ?? source.job_id ?? undefined,
    prompt: overrides?.prompt ?? source.prompt ?? undefined,
    model: overrides?.model ?? source.model ?? undefined,
    content,
    metadata: { ...(source.metadata || {}), ...(overrides?.metadata || {}) },
  });
}

// Link an artifact to a job by setting its job_id
export async function linkArtifactToJob(
  userId: string,
  artifactId: string,
  jobId: number
): Promise<Result<AiArtifactRow>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow<AiArtifactRow>(
    TABLE,
    { job_id: jobId },
    { eq: { id: artifactId } }
  );
}

// Unlink an artifact from any job (sets job_id to null)
export async function unlinkArtifactFromJob(
  userId: string,
  artifactId: string
): Promise<Result<AiArtifactRow>> {
  const userCrud = withUser(userId);
  return userCrud.updateRow<AiArtifactRow>(
    TABLE,
    { job_id: null },
    { eq: { id: artifactId } }
  );
}

// Convenience: get latest resume/cover letter artifact for a job (by updated_at desc)
export async function getLatestMaterialsForJob(
  userId: string,
  jobId: number
): Promise<
  Result<{
    resume: AiArtifactRow | null;
    cover_letter: AiArtifactRow | null;
  }>
> {
  const userCrud = withUser(userId);
  // Fetch top 1 for each kind
  const [resumes, covers] = await Promise.all([
    userCrud.listRows<AiArtifactRow>(TABLE, "*", {
      eq: { job_id: jobId },
      in: { kind: ["resume"] as unknown as string[] },
      order: { column: "updated_at", ascending: false },
      limit: 1,
    }),
    userCrud.listRows<AiArtifactRow>(TABLE, "*", {
      eq: { job_id: jobId },
      in: { kind: ["cover_letter"] as unknown as string[] },
      order: { column: "updated_at", ascending: false },
      limit: 1,
    }),
  ]);

  const error = resumes.error || covers.error || null;
  const status = resumes.status ?? covers.status ?? null;
  return {
    data: {
      resume: resumes.data && resumes.data[0] ? resumes.data[0] : null,
      cover_letter: covers.data && covers.data[0] ? covers.data[0] : null,
    },
    error,
    status,
  };
}

export default {
  insertAiArtifact,
  getAiArtifact,
  listAiArtifacts,
  listAiArtifactsForJob,
  updateAiArtifactMeta,
  cloneAiArtifact,
  linkArtifactToJob,
  unlinkArtifactFromJob,
  getLatestMaterialsForJob,
};
