/**
 * COVER LETTER DRAFTS ROUTES
 *
 * Endpoints:
 * - GET    /api/cover-letter/drafts       - list()
 * - GET    /api/cover-letter/drafts/:id   - get()
 * - POST   /api/cover-letter/drafts       - post()
 * - PATCH  /api/cover-letter/drafts/:id   - patch()
 * - DELETE /api/cover-letter/drafts/:id   - del()
 *
 * All routes require authentication and perform RLS checks
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../../utils/errors.js";
import { legacyLogError as logError } from "../../../utils/logger.js";
import { readJson, sendJson } from "../../../utils/http.js";
import * as coverLetterDraftsService from "../../services/coverLetterDraftsService.js";

/**
 * GET /api/cover-letter/drafts
 *
 * List all cover letter drafts for the authenticated user
 */
export async function list(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string
): Promise<void> {
  const drafts = await coverLetterDraftsService.listCoverLetterDrafts(userId);
  sendJson(res, 200, { drafts });
}

/**
 * GET /api/cover-letter/drafts/:id
 *
 * Get a specific cover letter draft by ID
 */
export async function get(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  draftId: string
): Promise<void> {
  if (!draftId) {
    throw new ApiError(400, "Draft ID is required", "bad_request");
  }

  const draft = await coverLetterDraftsService.getCoverLetterDraft(
    draftId,
    userId
  );
  sendJson(res, 200, { draft });
}

/**
 * POST /api/cover-letter/drafts
 *
 * Create a new cover letter draft
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
    throw new ApiError(400, "Invalid JSON body", "bad_json");
  }

  if (!body.name || typeof body.name !== "string") {
    throw new ApiError(400, "Draft name is required", "bad_request");
  }

  const draft = await coverLetterDraftsService.createCoverLetterDraft({
    user_id: userId,
    name: body.name,
    template_id: body.template_id,
    job_id: body.job_id,
    company_name: body.company_name,
    job_title: body.job_title,
    content: body.content,
    metadata: body.metadata,
    company_research: body.company_research,
  });

  sendJson(res, 201, { draft });
}

/**
 * PATCH /api/cover-letter/drafts/:id
 *
 * Update an existing cover letter draft
 */
export async function patch(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  draftId: string
): Promise<void> {
  if (!draftId) {
    throw new ApiError(400, "Draft ID is required", "bad_request");
  }

  let body: any;
  try {
    body = await readJson(req);
  } catch (e: any) {
    throw new ApiError(400, "Invalid JSON body", "bad_json");
  }

  const draft = await coverLetterDraftsService.updateCoverLetterDraft(
    draftId,
    userId,
    body
  );
  sendJson(res, 200, { draft });
}

/**
 * DELETE /api/cover-letter/drafts/:id
 *
 * Delete (soft delete) a cover letter draft
 */
export async function del(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  draftId: string
): Promise<void> {
  if (!draftId) {
    throw new ApiError(400, "Draft ID is required", "bad_request");
  }

  await coverLetterDraftsService.deleteCoverLetterDraft(draftId, userId);
  sendJson(res, 204, {});
}
