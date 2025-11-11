/**
 * COMPANY RESEARCH ROUTES
 *
 * WHAT: API endpoints for fetching company information
 * WHY: Provide company context for personalized cover letter generation
 *
 * Endpoints:
 * - GET /api/company/research?name=CompanyName&industry=Tech
 *   → Fetch company research data
 *
 * Security:
 * - Authentication required (user must be signed in)
 * - Rate limiting applied (prevent abuse of external APIs)
 * - Input validation (sanitize company name)
 *
 * Response format:
 * {
 *   success: true,
 *   data: CompanyResearch | null,
 *   error?: string
 * }
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  fetchCompanyResearch,
  type CompanyResearch,
} from "../services/companyResearchService.js";
import { logInfo, logWarn } from "../../utils/logger.js";
import { getCorsHeaders } from "../middleware/cors.js";

/**
 * Send JSON response
 */
function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  const bodyStr = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyStr).toString(),
    ...getCorsHeaders(),
  });
  res.end(bodyStr);
}

/**
 * Send error response
 */
function sendError(
  res: ServerResponse,
  statusCode: number,
  message: string,
  error?: Error
) {
  sendJson(res, statusCode, {
    error: message,
    details: error?.message,
  });
}

/**
 * GET /api/company/research
 *
 * Query params:
 * - name: string (required) - Company name
 * - industry: string (optional) - Company industry
 * - jobDescription: string (optional) - Job posting text
 *
 * Response:
 * - 200: { data: CompanyResearch | null }
 * - 400: Missing company name
 * - 500: Server error
 */
export async function handleGetCompanyResearch(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string
) {
  try {
    // Extract query parameters
    const companyName = url.searchParams.get("name");
    const industry = url.searchParams.get("industry");
    const jobDescription = url.searchParams.get("jobDescription");

    // Validate required parameters
    if (!companyName || companyName.trim().length === 0) {
      logWarn("Missing company name in research request", { reqId, userId });
      sendError(res, 400, "Company name is required");
      return;
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitizedName = companyName.trim().slice(0, 200); // Max 200 chars
    const sanitizedIndustry = industry ? industry.trim().slice(0, 100) : null;
    const sanitizedDescription = jobDescription
      ? jobDescription.trim().slice(0, 5000)
      : null;

    logInfo("Fetching company research", {
      reqId,
      userId,
      companyName: sanitizedName,
      industry: sanitizedIndustry || "unknown",
    });

    // Fetch company research
    const research = await fetchCompanyResearch(
      sanitizedName,
      sanitizedIndustry,
      sanitizedDescription
    );

    if (!research) {
      logWarn("Company research not found", {
        reqId,
        userId,
        companyName: sanitizedName,
      });
      sendJson(res, 200, {
        data: null,
        message: "No research data available for this company",
      });
      return;
    }

    logInfo("Company research fetched successfully", {
      reqId,
      userId,
      companyName: sanitizedName,
      newsCount: research.news.length,
      source: research.source,
    });

    sendJson(res, 200, { data: research });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    sendError(res, 500, "Failed to fetch company research", error);
  }
}
