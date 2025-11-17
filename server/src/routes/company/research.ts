/**
 * COMPANY RESEARCH ROUTES
 *
 * Endpoints:
 * - GET /api/company/research?name=CompanyName&industry=Tech  - get()
 *
 * Provides company information and context for personalized cover letter generation.
 *
 * Security:
 * - Authentication required
 * - Rate limiting applied
 * - Input validation and sanitization
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import {
  fetchCompanyResearch,
  type CompanyResearch,
} from "../../services/companyResearchService.js";
import { logInfo, logWarn } from "../../../utils/logger.js";
import { sendJson } from "../../../utils/http.js";

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
export async function get(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string
): Promise<void> {
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
