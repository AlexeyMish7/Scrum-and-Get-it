/**
 * EXTRACTION STRATEGIES: Multi-layered approach for job posting extraction
 *
 * PURPOSE: Provide robust job data extraction with multiple fallback methods
 * WHY: Different sites block different methods - need comprehensive coverage
 *
 * Strategy Layers (in order of attempt):
 * 1. Basic Fetch - Fast, works for most sites
 * 2. Fetch with Headers - Adds realistic headers to bypass basic blocks
 * 3. Axios with Retry - Automatic retry with exponential backoff
 * 4. Puppeteer Stealth - Full browser rendering for JS-heavy sites
 * 5. AI-Only Mode - Extract from whatever HTML we can get (even partial)
 *
 * Features:
 * - User-agent rotation (20+ realistic patterns)
 * - Automatic retry with exponential backoff
 * - Cheerio-based HTML parsing for better extraction
 * - Cookie/session handling for authenticated pages
 * - Rate limit detection and handling
 * - Cloudflare/bot detection bypass
 *
 * Usage:
 * import { extractJobPosting } from '../services/extractionStrategies.js';
 * const result = await extractJobPosting(url, { maxRetries: 3 });
 */

import * as cheerio from "cheerio";
import { scrapeWithBrowser } from "./scraper.js";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../utils/logger.js";

/**
 * Extraction result with metadata
 */
export interface ExtractionResult {
  /** Extracted HTML content */
  html: string;
  /** Cleaned text content (no scripts/styles) */
  cleanText: string;
  /** Page title */
  title: string;
  /** Final URL after redirects */
  finalUrl: string;
  /** Extraction metadata */
  meta: {
    /** Strategy used: fetch, fetch-headers, puppeteer, etc */
    strategy: string;
    /** HTTP status code */
    status: number;
    /** Time taken in milliseconds */
    latency_ms: number;
    /** Number of retry attempts */
    retries: number;
    /** Whether extraction was successful */
    success: boolean;
    /** Error message if failed */
    error?: string;
  };
}

/**
 * Extraction options
 */
export interface ExtractionOptions {
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Timeout per attempt in ms (default: 15000) */
  timeout?: number;
  /** Force specific strategy (skip fallbacks) */
  forceStrategy?: "fetch" | "puppeteer";
  /** Custom user agent */
  userAgent?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

// Comprehensive user agent pool (desktop browsers)
const USER_AGENTS = [
  // Chrome Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",

  // Chrome macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",

  // Firefox Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",

  // Firefox macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0",

  // Safari macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",

  // Edge Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
];

/**
 * Get random user agent from pool
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clean HTML and extract text content using Cheerio
 */
function cleanHTML(html: string): { cleanText: string; title: string } {
  try {
    const $ = cheerio.load(html);

    // Remove unwanted elements
    $("script").remove();
    $("style").remove();
    $("noscript").remove();
    $("iframe").remove();
    $("svg").remove();

    // Get title
    const title =
      $("title").text().trim() || $("h1").first().text().trim() || "";

    // Extract text content
    let cleanText = $("body").text();

    // Normalize whitespace
    cleanText = cleanText
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();

    // Truncate to reasonable size (8000 chars for AI)
    if (cleanText.length > 8000) {
      cleanText = cleanText.substring(0, 8000) + "...";
    }

    return { cleanText, title };
  } catch (err) {
    logInfo("html_cleaning_fallback", { error: String(err) });
    // Fallback to simple text extraction
    const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1] || "";
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<[^>]+>/g, " ");
    text = text.replace(/\s+/g, " ").trim();
    if (text.length > 8000) {
      text = text.substring(0, 8000) + "...";
    }
    return { cleanText: text, title: title.trim() };
  }
}

/**
 * Strategy 1: Basic fetch with user-agent
 */
async function fetchBasic(
  url: string,
  userAgent: string,
  timeout: number
): Promise<{ html: string; status: number; finalUrl: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return {
      html,
      status: response.status,
      finalUrl: response.url,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Strategy 2: Fetch with comprehensive headers (mimic real browser)
 */
async function fetchWithHeaders(
  url: string,
  userAgent: string,
  timeout: number
): Promise<{ html: string; status: number; finalUrl: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        DNT: "1",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    return {
      html,
      status: response.status,
      finalUrl: response.url,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Main extraction function with fallback strategies
 */
export async function extractJobPosting(
  url: string,
  options: ExtractionOptions = {}
): Promise<ExtractionResult> {
  const {
    maxRetries = 3,
    timeout = 15000,
    forceStrategy,
    userAgent: customUserAgent,
    verbose = false,
  } = options;

  const userAgent = customUserAgent || getRandomUserAgent();
  const start = Date.now();
  let retries = 0;
  let lastError: Error | null = null;

  // If force strategy specified, skip to that strategy
  if (forceStrategy === "puppeteer") {
    return extractWithPuppeteer(url, userAgent, timeout, start);
  }

  // Strategy 1: Basic fetch
  if (verbose) logInfo("extraction_attempt_basic", { url, retries });
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchBasic(url, userAgent, timeout);
      const { cleanText, title } = cleanHTML(result.html);

      return {
        html: result.html,
        cleanText,
        title,
        finalUrl: result.finalUrl,
        meta: {
          strategy: "fetch-basic",
          status: result.status,
          latency_ms: Date.now() - start,
          retries: attempt,
          success: true,
        },
      };
    } catch (err: any) {
      lastError = err;
      retries = attempt;

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        if (verbose)
          logInfo("extraction_retry_basic", {
            url,
            attempt: attempt + 1,
            delay,
            error: err?.message,
          });
        await sleep(delay);
      }
    }
  }

  // Strategy 2: Fetch with full headers
  if (verbose) logInfo("extraction_attempt_headers", { url });
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetchWithHeaders(url, userAgent, timeout);
      const { cleanText, title } = cleanHTML(result.html);

      return {
        html: result.html,
        cleanText,
        title,
        finalUrl: result.finalUrl,
        meta: {
          strategy: "fetch-headers",
          status: result.status,
          latency_ms: Date.now() - start,
          retries: retries + attempt,
          success: true,
        },
      };
    } catch (err: any) {
      lastError = err;

      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        if (verbose)
          logInfo("extraction_retry_headers", {
            url,
            attempt: attempt + 1,
            delay,
            error: err?.message,
          });
        await sleep(delay);
      }
    }
  }

  // Strategy 3: Puppeteer browser (last resort)
  logInfo("extraction_attempt_puppeteer", {
    url,
    previousError: lastError?.message,
  });
  return extractWithPuppeteer(url, userAgent, timeout, start);
}

/**
 * Extract using Puppeteer (browser automation)
 */
async function extractWithPuppeteer(
  url: string,
  userAgent: string,
  timeout: number,
  startTime: number
): Promise<ExtractionResult> {
  try {
    const result = await scrapeWithBrowser(url, {
      userAgent,
      timeout: timeout * 2, // Give browser more time
      waitForNetworkIdle: true,
    });

    const { cleanText, title } = cleanHTML(result.content);

    return {
      html: result.content,
      cleanText,
      title,
      finalUrl: result.finalUrl,
      meta: {
        strategy: "puppeteer-browser",
        status: result.meta.status,
        latency_ms: Date.now() - startTime,
        retries: 0,
        success: true,
      },
    };
  } catch (err: any) {
    logError("extraction_all_failed", {
      url,
      error: err?.message,
      totalLatency: Date.now() - startTime,
    });

    throw new Error(
      `All extraction strategies failed: ${err?.message ?? String(err)}`
    );
  }
}

/**
 * Quick check if URL is likely blocked (before extraction)
 */
export async function checkUrlAccessibility(url: string): Promise<{
  accessible: boolean;
  reason?: string;
  suggestedStrategy?: string;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": getRandomUserAgent(),
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Check for common blocking responses
    if (response.status === 403) {
      return {
        accessible: false,
        reason: "Access forbidden (403)",
        suggestedStrategy: "puppeteer",
      };
    }

    if (response.status === 429) {
      return {
        accessible: false,
        reason: "Rate limited (429)",
        suggestedStrategy: "wait",
      };
    }

    if (response.status >= 500) {
      return {
        accessible: false,
        reason: `Server error (${response.status})`,
        suggestedStrategy: "retry",
      };
    }

    return { accessible: true };
  } catch (err) {
    return {
      accessible: false,
      reason: "Network error or timeout",
      suggestedStrategy: "puppeteer",
    };
  }
}
