/**
 * Cover Letter Drafts Routes
 *
 * GET    /api/cover-letter/drafts       - List all user's drafts
 * GET    /api/cover-letter/drafts/:id   - Get specific draft
 * POST   /api/cover-letter/drafts       - Create new draft
 * PATCH  /api/cover-letter/drafts/:id   - Update draft
 * DELETE /api/cover-letter/drafts/:id   - Delete draft (soft delete)
 *
 * All routes require authentication and perform RLS checks
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../utils/errors.js";
import { legacyLogError as logError } from "../../utils/logger.js";
import { getCorsHeaders } from "../middleware/cors.js";
import * as coverLetterDraftsService from "../services/coverLetterDraftsService.js";

/**
 * Read and parse JSON body safely
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
 * Send JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, payload: any) {
  const bodyStr = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyStr).toString(),
    ...getCorsHeaders(),
  });
  res.end(bodyStr);
}

/**
 * LIST DRAFTS: GET /api/cover-letter/drafts
 */
export async function handleListDrafts(
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
 * GET DRAFT: GET /api/cover-letter/drafts/:id
 */
export async function handleGetDraft(
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
 * CREATE DRAFT: POST /api/cover-letter/drafts
 */
export async function handleCreateDraft(
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
 * UPDATE DRAFT: PATCH /api/cover-letter/drafts/:id
 */
export async function handleUpdateDraft(
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
 * DELETE DRAFT: DELETE /api/cover-letter/drafts/:id
 */
export async function handleDeleteDraft(
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
