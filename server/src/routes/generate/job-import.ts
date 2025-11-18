/**
 * JOB IMPORT FROM URL: POST /api/generate/job-import
 *
 * Flow: validate → extract HTML → AI extraction → parse → return structured job data
 *
 * Inputs:
 * - headers: { 'X-User-Id': uuid } (or Authorization JWT)
 * - body: { url: string, options?: { useScreenshot?: boolean } }
 *
 * Output:
 * - 200: { jobData: ExtractedJobData, meta: { source: 'ai'|'scraper', confidence: number } }
 * - 400: validation error
 * - 500: extraction failure
 *
 * Contract:
 * - Fetches job posting HTML from URL
 * - Sends HTML to OpenAI for structured extraction
 * - Parses and validates extracted job details
 * - Returns job data ready for form pre-fill
 *
 * Notes:
 * - Primary: Basic fetch with user-agent spoofing
 * - Fallback: Puppeteer scraper for JavaScript-heavy sites (if useScreenshot=true)
 * - AI extraction parses HTML into structured data
 * - Returns partial data if extraction is incomplete
 * - Does NOT persist job (frontend handles that)
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { generate } from "../../services/aiClient.js";
import { scrapeWithBrowser } from "../../services/scraper.js";
import {
  extractJobPosting,
  checkUrlAccessibility,
} from "../../services/extractionStrategies.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../../utils/logger.js";
import { readJson, sendJson } from "../../../utils/http.js";
import { ApiError } from "../../../utils/errors.js";
import { checkLimit } from "../../../utils/rateLimiter.js";
import type { GenerationCounters } from "./types.js";

// Extracted job data structure
export interface ExtractedJobData {
  job_title?: string | null;
  company_name?: string | null;
  street_address?: string | null;
  city_name?: string | null;
  state_code?: string | null;
  zipcode?: string | null;
  start_salary_range?: number | null;
  end_salary_range?: number | null;
  job_description?: string | null;
  industry?: string | null;
  job_type?: string | null; // Full-time, Part-time, Contract, etc.
  requirements?: string[] | null;
  qualifications?: string[] | null;
  benefits?: string[] | null;
}

// Request body type
interface JobImportRequestBody {
  url: string;
  options?: {
    useScreenshot?: boolean; // DEPRECATED: Use forceStrategy instead
    useBrowserFallback?: boolean; // DEPRECATED: Always enabled now
    forceStrategy?: "fetch" | "puppeteer"; // Force specific extraction strategy
    maxRetries?: number; // Max retry attempts (default: 3)
    verbose?: boolean; // Enable verbose logging
  };
}

// Extraction metadata (for response)
interface ExtractionMeta {
  strategy: string;
  retries: number;
  latency_ms: number;
}

/**
 * Build AI prompt for job extraction
 */
function buildExtractionPrompt(cleanedHTML: string, url: string): string {
  return `You are a job posting data extraction assistant. Extract structured job information from the provided job posting HTML.

Source URL: ${url}

Job Posting Content:
${cleanedHTML}

Extract the following information and return ONLY valid JSON (no markdown, no code blocks):

{
  "job_title": "exact job title as listed",
  "company_name": "company name",
  "street_address": "street address if available, otherwise null",
  "city_name": "city name if available",
  "state_code": "2-letter state code (e.g., CA, NY) if available",
  "zipcode": "zip code if available",
  "start_salary_range": number or null (annual salary minimum in dollars),
  "end_salary_range": number or null (annual salary maximum in dollars),
  "job_description": "comprehensive job description (max 2000 chars)",
  "industry": "industry/sector (e.g., Technology, Healthcare, Finance)",
  "job_type": "employment type (Full-time, Part-time, Contract, Internship, etc.)",
  "requirements": ["array", "of", "key", "requirements"],
  "qualifications": ["array", "of", "required", "qualifications"],
  "benefits": ["array", "of", "benefits", "mentioned"]
}

Rules:
- Use null for missing information
- Extract salary as annual amounts in USD (convert if hourly)
- Keep job_description under 2000 characters
- Identify requirements vs qualifications (requirements are must-haves, qualifications are nice-to-haves)
- Only include explicitly mentioned benefits
- Return valid JSON only`;
}

/**
 * Parse and validate AI extraction result
 */
function parseExtractionResult(aiResult: any): ExtractedJobData {
  // AI client returns { json, text, ... }
  const data = aiResult.json || {};

  // Validate and clean extracted data
  const extracted: ExtractedJobData = {
    job_title:
      typeof data.job_title === "string" ? data.job_title.trim() : null,
    company_name:
      typeof data.company_name === "string" ? data.company_name.trim() : null,
    street_address:
      typeof data.street_address === "string"
        ? data.street_address.trim()
        : null,
    city_name:
      typeof data.city_name === "string" ? data.city_name.trim() : null,
    state_code:
      typeof data.state_code === "string" ? data.state_code.trim() : null,
    zipcode: typeof data.zipcode === "string" ? data.zipcode.trim() : null,
    start_salary_range:
      typeof data.start_salary_range === "number"
        ? Math.max(0, data.start_salary_range)
        : null,
    end_salary_range:
      typeof data.end_salary_range === "number"
        ? Math.max(0, data.end_salary_range)
        : null,
    job_description:
      typeof data.job_description === "string"
        ? data.job_description.substring(0, 2000).trim()
        : null,
    industry: typeof data.industry === "string" ? data.industry.trim() : null,
    job_type: typeof data.job_type === "string" ? data.job_type.trim() : null,
    requirements: Array.isArray(data.requirements)
      ? data.requirements.filter((r: any) => typeof r === "string")
      : null,
    qualifications: Array.isArray(data.qualifications)
      ? data.qualifications.filter((q: any) => typeof q === "string")
      : null,
    benefits: Array.isArray(data.benefits)
      ? data.benefits.filter((b: any) => typeof b === "string")
      : null,
  };

  return extracted;
}

/**
 * Calculate confidence score for extraction
 * Based on completeness and data quality
 */
function calculateConfidence(data: ExtractedJobData): number {
  let score = 0;
  const weights = {
    job_title: 20,
    company_name: 20,
    job_description: 15,
    city_name: 10,
    state_code: 5,
    start_salary_range: 10,
    industry: 10,
    job_type: 5,
    requirements: 5,
  };

  if (data.job_title) score += weights.job_title;
  if (data.company_name) score += weights.company_name;
  if (data.job_description && data.job_description.length > 50)
    score += weights.job_description;
  if (data.city_name) score += weights.city_name;
  if (data.state_code) score += weights.state_code;
  if (data.start_salary_range) score += weights.start_salary_range;
  if (data.industry) score += weights.industry;
  if (data.job_type) score += weights.job_type;
  if (data.requirements && data.requirements.length > 0)
    score += weights.requirements;

  return Math.min(100, score);
}

/**
 * POST /api/generate/job-import
 * Extract job posting details from URL using AI
 *
 * Rate limit: 10 requests per minute per user
 */
export async function post(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  reqId: string,
  userId: string,
  counters: GenerationCounters
): Promise<void> {
  // Rate limit (50 per 5min per user)
  const limit = checkLimit(`job-import:${userId}`, 50, 300_000);
  if (!limit.ok) {
    res.setHeader("Retry-After", String(limit.retryAfterSec ?? 60));
    throw new ApiError(429, "rate limited", "rate_limited");
  }

  // Parse request body
  let body: any;
  try {
    body = await readJson(req);
  } catch (err: any) {
    throw new ApiError(400, "invalid JSON body", "bad_json");
  }

  // Validate URL
  if (!body?.url || typeof body.url !== "string") {
    throw new ApiError(400, "Missing or invalid url field", "bad_request");
  }

  // Validate URL format
  let parsedUrl: globalThis.URL;
  try {
    parsedUrl = new globalThis.URL(body.url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid protocol");
    }
  } catch (err) {
    throw new ApiError(
      400,
      "Invalid URL format. Must be http:// or https://",
      "bad_request"
    );
  }

  logInfo("job_import_request", { userId, url: body.url, reqId });

  // Update counters
  counters.generate_total++;
  const start = Date.now();

  try {
    // Step 0: Quick accessibility check (optional, helps with early detection)
    const accessCheck = await checkUrlAccessibility(body.url);
    if (!accessCheck.accessible) {
      logInfo("job_import_url_blocked", {
        url: body.url,
        reason: accessCheck.reason,
        suggested: accessCheck.suggestedStrategy,
      });
      // Continue anyway - extraction strategies will handle it
    }

    // Step 1: Extract HTML using multi-strategy approach
    const forceStrategy =
      body.options?.forceStrategy ||
      (body.options?.useScreenshot ? "puppeteer" : undefined);

    const extractionResult = await extractJobPosting(body.url, {
      forceStrategy,
      maxRetries: body.options?.maxRetries ?? 3,
      verbose: body.options?.verbose ?? false,
      timeout: 20000, // 20 second timeout per attempt
    });

    logInfo("job_import_extraction_success", {
      url: body.url,
      strategy: extractionResult.meta.strategy,
      retries: extractionResult.meta.retries,
      latency_ms: extractionResult.meta.latency_ms,
    });

    // Step 2: Build AI prompt with cleaned content
    const prompt = buildExtractionPrompt(extractionResult.cleanText, body.url);

    // Step 3: Call AI extraction
    const aiResult = await generate("job-import", prompt, {
      model: "gpt-4o-mini",
      temperature: 0.1,
      maxTokens: 2000,
    });

    // Step 4: Parse and validate result
    const extractedData = parseExtractionResult(aiResult);

    // Step 5: Calculate confidence
    const confidence = calculateConfidence(extractedData);

    const latencyMs = Date.now() - start;

    logInfo("job_import_success", {
      userId,
      url: body.url,
      reqId,
      confidence,
      hasTitle: !!extractedData.job_title,
      hasCompany: !!extractedData.company_name,
      strategy: extractionResult.meta.strategy,
      latency_ms: latencyMs,
    });

    counters.generate_success++;

    // Return extracted data
    sendJson(res, 200, {
      jobData: extractedData,
      meta: {
        source: "ai",
        confidence,
        url: body.url,
        latency_ms: latencyMs,
        extraction: {
          strategy: extractionResult.meta.strategy,
          retries: extractionResult.meta.retries,
          latency_ms: extractionResult.meta.latency_ms,
        },
      },
    });
  } catch (err: any) {
    const latencyMs = Date.now() - start;

    counters.generate_fail++;
    logError("job_import_error", {
      userId,
      url: body.url,
      reqId,
      error: err?.message ?? String(err),
      latency_ms: latencyMs,
    });

    throw new ApiError(
      502,
      err?.message ?? "Failed to extract job data",
      "ai_error"
    );
  }
}
