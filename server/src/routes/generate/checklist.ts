/**
 * SIMPLE CHECKLIST GENERATION ENDPOINT
 *
 * POST /api/generate/checklist
 *
 * Accepts a compact payload describing the role/company and returns an array
 * of suggested checklist items. This is intentionally lightweight and does
 * not call external AI providers — it provides deterministic, useful items
 * so the frontend can rely on a 200/201 response while an AI-backed route
 * is added later.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { ApiError } from "../../../utils/errors.js";
import { readJson } from "../../../utils/http.js";
import { getCorsHeaders } from "../../middleware/cors.js";
import { legacyLogError as logError } from "../../../utils/logger.js";
import { requireAuth } from "../../middleware/auth.js";

export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string
): Promise<void> {
  // Minimal auth required
  if (!userId) throw new ApiError(401, "unauthenticated", "auth_required");

  let body: any;
  try {
    body = await readJson(req);
  } catch (e: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  const jobTitle = (body?.jobTitle ?? "").toString();
  const company = (body?.company ?? "").toString();
  const industry = (body?.industry ?? "").toString();
  const interviewType = (body?.interviewType ?? "").toString();

  if (!jobTitle && !company) {
    throw new ApiError(400, "jobTitle or company required", "bad_request");
  }

  try {
    const title = jobTitle.toLowerCase();
    const items: string[] = [];

    // Role-focused
    items.push(`Review the job description for "${jobTitle || company}" and map your experience to the requirements`);
    items.push("Prepare 3 STAR stories that highlight impact and metrics relevant to this role");

    if (/engineer|developer|software|backend|frontend|full-?stack/.test(title)) {
      items.push("Practice 2-3 algorithm or system-design problems likely for this level");
      items.push("Prepare a short walkthrough of a recent technical project (architecture, decisions, tradeoffs)");
    }

    if (/designer|ux|ui|product designer/.test(title)) {
      items.push("Prepare a portfolio walkthrough for 2-3 design projects focusing on process and outcomes");
    }

    if (/product|pm|product manager/.test(title)) {
      items.push("Prepare 2 product-sense examples that show prioritization and metrics impact");
    }

    // Interview type adjustments
    if (interviewType === "video" || interviewType === "phone") {
      items.push("Test audio/video, camera framing, and screen sharing before the interview");
    }
    if (interviewType === "in-person") {
      items.push("Plan travel route and aim to arrive 10-15 minutes early; verify campus/office instructions");
    }

    // Company research
    if (company) {
      items.push(`Research ${company}: mission, recent news, product updates and competitors`);
      items.push("Prepare 5 thoughtful, company-specific questions to ask the interviewer");
    } else {
      items.push("Research the company & team: mission, recent news, products, and competitors");
      items.push("Prepare 5 thoughtful questions to ask the interviewer");
    }

    // Attire suggestion
    let attire = "Business casual";
    try {
      if (industry && /finance|bank|legal|consult/i.test(industry)) attire = "Formal / Professional";
      else if (industry && /tech|software|startup/i.test(industry)) attire = "Casual / Smart casual";
    } catch {}
    items.push(`Suggested attire: ${attire}`);

    // Logistics and confidence
    items.push("Confirm date, time, and timezone; add to your calendar");
    items.push("Prepare work samples or links and verify they open; have backups ready");
    items.push("Do a 5-minute breathing or grounding exercise before the interview to boost focus");

    const bodyStr = JSON.stringify({ items });
    res.writeHead(201, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr).toString(),
      ...getCorsHeaders(),
    });
    res.end(bodyStr);
  } catch (e: any) {
    logError("checklist_generation_failed", { reqId, userId, error: String(e) });
    throw new ApiError(500, "checklist generation failed", "server_error");
  }
}
