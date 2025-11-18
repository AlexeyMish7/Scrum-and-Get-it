/**
 * DOCUMENTS SERVICE (Resume & Cover Letter Management)
 *
 * Purpose:
 * - Unified interface for resume and cover letter file management
 * - Links to Supabase Storage for file uploads
 * - Tracks document metadata in documents table
 * - Replaces legacy file_path approach with structured storage
 *
 * Backend Connection:
 * - Database: documents table (via crud.ts + RLS)
 * - Storage: Supabase Storage buckets (resumes, cover-letters)
 * - Auth: User-scoped via userId parameter
 *
 * Document Lifecycle:
 * 1. Upload file → Supabase Storage bucket
 * 2. Create document record → documents table (with storage path)
 * 3. Link to jobs → document_jobs table (many-to-many)
 * 4. Track exports → export_history table
 *
 * Storage Pattern:
 * - file_path format: "<bucket>/<key>" or "key" (with configured bucket)
 * - Buckets: "resumes", "cover-letters", "portfolios"
 * - User scoping: All buckets use RLS for user_id access control
 *
 * Usage:
 *   import { listDocuments, uploadDocument } from '@shared/services/documents';
 *
 *   const docs = await listDocuments(userId, { eq: { kind: 'resume' } });
 *
 *   const uploaded = await uploadDocument(userId, {
 *     kind: 'resume',
 *     file: fileBlob,
 *     file_name: 'John_Doe_Resume.pdf'
 *   });
 */
import { withUser } from "./crud";
import type { Result, ListOptions } from "./types";
import { supabase } from "./supabaseClient";

export type DocumentKind = "resume" | "cover_letter" | "portfolio" | "other";

export interface DocumentRow {
  id: string;
  user_id: string;
  kind: DocumentKind;
  file_name: string;
  file_path: string; // Expected format: "<bucket>/<key>" or "key" with configured bucket
  mime_type?: string | null;
  bytes?: number | null;
  meta?: Record<string, unknown> | null;
  uploaded_at: string; // ISO timestamp
}

// List documents for a user with optional filters
export async function listDocuments(
  userId: string,
  opts?: ListOptions
): Promise<Result<DocumentRow[]>> {
  const userCrud = withUser(userId);
  return userCrud.listRows<DocumentRow>("documents", "*", opts);
}

// Fetch a single document by id
export async function getDocument(
  userId: string,
  id: string
): Promise<Result<DocumentRow | null>> {
  const userCrud = withUser(userId);
  return userCrud.getRow<DocumentRow>("documents", "*", {
    eq: { id },
    single: true,
  });
}

// Parse a storage path of the form "bucket/key" or just "key" (with a default bucket)
function parseStoragePath(
  path: string,
  defaultBucket?: string
): { bucket: string; key: string } | null {
  if (!path) return null;
  const parts = path.split("/");
  if (parts.length > 1) {
    const [bucket, ...rest] = parts;
    return { bucket, key: rest.join("/") };
  }
  if (!defaultBucket) return null;
  return { bucket: defaultBucket, key: path };
}

// Create a signed download URL for a document's file_path
export async function getSignedDownloadUrl(
  filePath: string,
  expiresInSeconds = 60,
  defaultBucket?: string
): Promise<Result<{ url: string }>> {
  const parsed = parseStoragePath(filePath, defaultBucket);
  if (!parsed) {
    return {
      data: null,
      error: { message: "Invalid file_path or missing bucket" },
      status: 400,
    };
  }
  try {
    const { data, error } = await supabase.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.key, expiresInSeconds);
    if (error) {
      // Supabase storage errors expose a message and statusCode; fall back to 400 when absent.
      const storageErr = error as { message: string; statusCode?: number };
      return {
        data: null,
        error: { message: storageErr.message },
        status: storageErr.statusCode ?? 400,
      };
    }
    return {
      data: { url: data?.signedUrl as string },
      error: null,
      status: 200,
    };
  } catch (e) {
    return { data: null, error: { message: String(e) }, status: null };
  }
}

export default {
  listDocuments,
  getDocument,
  getSignedDownloadUrl,
};
