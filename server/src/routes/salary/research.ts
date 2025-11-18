/**
 * SALARY RESEARCH ROUTES
 *
 * Endpoints:
 * - POST /api/salary-research  - post()
 *
 * AI-powered salary research and compensation analysis
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { URL } from "node:url";
import { aiClient } from "../../services/index.js";
import { ApiError } from "../../../utils/errors.js";
import { readJson } from "../../../utils/http.js";
import { getCorsHeaders } from "../../middleware/cors.js";

/**
 * POST /api/salary-research
 *
 * Body: {
 *   title: string (required),
 *   location?: string,
 *   experience?: string,
 *   company?: string,
 *   currentSalary?: number
 * }
 *
 * Response: 201 with { artifact: { content: { range, totalComp, trend, recommendation } } }
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: any
): Promise<void> {
  try {
    const body = (await readJson(req)) as {
      title?: string;
      location?: string;
      experience?: string;
      company?: string;
      currentSalary?: number;
    };
    const { title, location, experience, company, currentSalary } = body;

    if (!title) throw new ApiError(400, "Job title is required", "bad_request");

    // AI prompt for salary analysis
    const prompt = `
You are an experienced HR compensation analyst.
Estimate a realistic salary range and insights for:

- Job Title: ${title}
- Company: ${company || "N/A"}
- Location: ${location || "N/A"}
- Experience Level: ${experience || "N/A"}
- Current Salary: ${currentSalary || "N/A"}

Return ONLY valid JSON in this format:
{
  "range": {"low": number, "avg": number, "high": number},
  "totalComp": number,
  "trend": string,
  "recommendation": string
}`;

    const result = await aiClient.generate("gpt-4o-mini", prompt);

    let outputText: string | undefined =
      (result as any).output?.[0]?.content?.[0]?.text ??
      (result as any).output_text ??
      "";

    let parsed: any = {};
    try {
      parsed = JSON.parse(outputText || "{}");
    } catch {
      parsed = {
        range: { low: 0, avg: 0, high: 0 },
        totalComp: 0,
        trend: "No data",
        recommendation: "Could not generate insights.",
      };
    }

    const payload = { artifact: { content: parsed } };
    const bodyStr = JSON.stringify(payload);

    res.writeHead(201, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(bodyStr).toString(),
      ...getCorsHeaders(),
    });
    res.end(bodyStr);

    counters.generate_success++;
  } catch (err: any) {
    console.error("❌ SalaryResearch error:", err);
    counters.generate_fail++;
    const status = err instanceof ApiError ? err.status : 500;
    const body = JSON.stringify({
      error: err?.message || "Internal Server Error",
    });
    res.writeHead(status, {
      "Content-Type": "application/json",
      ...getCorsHeaders(),
    });
    res.end(body);
  }
}
