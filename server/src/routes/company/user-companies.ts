/**
 * USER COMPANIES ROUTES
 *
 * Endpoints:
 * - GET /api/company/user-companies  - get()
 *
 * Returns list of companies from user's interested jobs for quick-select.
 *
 * Security:
 * - Authentication required
 * - User can only see their own companies
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import supabase from "../../services/supabaseAdmin.js";
import { logInfo, logError } from "../../../utils/logger.js";
import { sendJson } from "../../../utils/http.js";

/**
 * GET /api/company/user-companies
 *
 * Returns array of company names from user's interested jobs (non-archived)
 *
 * Response:
 * - 200: { data: string[] }
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
    logInfo("Fetching user companies from interested jobs", {
      reqId,
      userId,
    });

    // Call database function to get user's companies
    const { data, error } = await supabase.rpc("get_user_companies", {
      p_user_id: userId,
    });

    if (error) {
      logError("Failed to fetch user companies", {
        reqId,
        userId,
        error: error.message,
      });
      sendJson(res, 500, {
        error: "Failed to fetch user companies",
        details: error.message,
      });
      return;
    }

    // Extract company names from result
    const companies =
      data?.map((row: { company_name: string }) => row.company_name) || [];

    logInfo("User companies fetched successfully", {
      reqId,
      userId,
      count: companies.length,
    });

    sendJson(res, 200, { data: companies });
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logError("Error fetching user companies", {
      reqId,
      userId,
      error: error.message,
    });
    sendJson(res, 500, {
      error: "Failed to fetch user companies",
      details: error.message,
    });
  }
}
