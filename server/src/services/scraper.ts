/**
 * WEB SCRAPER SERVICE: Puppeteer-based scraping for JavaScript-heavy sites
 *
 * WHAT: Browser automation service for extracting content from dynamic websites
 * WHY: Many job boards require JavaScript rendering or block simple HTTP requests
 *
 * Flow:
 * 1. Launch headless browser with stealth configuration
 * 2. Navigate to URL with realistic user behavior
 * 3. Wait for content to load (network idle)
 * 4. Extract rendered HTML or take screenshot
 * 5. Close browser and return content
 *
 * Features:
 * - Browser pool management (reuse instances)
 * - Stealth mode (avoid bot detection)
 * - User-agent rotation
 * - Timeout handling (30s default)
 * - Screenshot capture for visual content
 * - Error handling and retry logic
 *
 * Usage:
 * import { scrapeWithBrowser } from '../services/scraper.js';
 * const html = await scrapeWithBrowser(url, { waitForSelector: '.job-description' });
 * const screenshot = await scrapeWithBrowser(url, { screenshot: true });
 *
 * Environment:
 * - PUPPETEER_HEADLESS: "true" (default) or "false" for debugging
 * - SCRAPER_TIMEOUT_MS: Max wait time in milliseconds (default: 30000)
 */

import puppeteer, { type Browser, type Page } from "puppeteer";
import {
  legacyLogInfo as logInfo,
  legacyLogError as logError,
} from "../../utils/logger.js";

/**
 * Scraper configuration options
 */
export interface ScraperOptions {
  /** Wait for specific selector before extracting (e.g., '.job-description') */
  waitForSelector?: string;
  /** Capture screenshot instead of HTML (returns base64 PNG) */
  screenshot?: boolean;
  /** Custom timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Custom user agent string (default: Chrome on Windows) */
  userAgent?: string;
  /** Wait for network idle before extracting (default: true) */
  waitForNetworkIdle?: boolean;
}

/**
 * Scraper result with metadata
 */
export interface ScraperResult {
  /** Extracted HTML content or base64 screenshot */
  content: string;
  /** Final URL after redirects */
  finalUrl: string;
  /** Page title */
  title: string;
  /** Extraction metadata */
  meta: {
    /** Time taken in milliseconds */
    latency_ms: number;
    /** Whether content was screenshot */
    screenshot: boolean;
    /** HTTP status code */
    status: number;
  };
}

// Browser pool (singleton pattern)
let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

// Default configuration
const DEFAULT_TIMEOUT = parseInt(process.env.SCRAPER_TIMEOUT_MS || "30000", 10);
const HEADLESS = process.env.PUPPETEER_HEADLESS !== "false";

// Realistic user agents (rotate to avoid detection)
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

/**
 * Get or create browser instance (singleton pattern)
 *
 * WHAT: Manages browser lifecycle and reuses instances for efficiency
 * WHY: Launching a browser is expensive (~2-3s), reuse improves performance
 *
 * Inputs: None
 * Outputs: Promise<Browser> - Puppeteer browser instance
 *
 * Error modes:
 * - Browser launch failure → throws Error
 * - Browser disconnected → relaunches automatically
 *
 * Notes:
 * - First call launches browser, subsequent calls reuse instance
 * - If browser crashes/disconnects, automatically relaunches
 * - Thread-safe with promise deduplication
 */
async function getBrowser(): Promise<Browser> {
  // If browser is already running and connected, return it
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  // If browser is being launched, wait for that promise
  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  // Launch new browser instance
  browserLaunchPromise = puppeteer.launch({
    headless: HEADLESS,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1920,1080",
      // Stealth mode flags
      "--disable-blink-features=AutomationControlled",
    ],
  });

  try {
    browserInstance = await browserLaunchPromise;
    logInfo("browser_launched", { headless: HEADLESS });

    // Clean up on disconnect
    browserInstance.on("disconnected", () => {
      logInfo("browser_disconnected", {});
      browserInstance = null;
      browserLaunchPromise = null;
    });

    return browserInstance;
  } catch (err: any) {
    browserLaunchPromise = null;
    logError("browser_launch_failed", { error: err?.message ?? String(err) });
    throw new Error(`Failed to launch browser: ${err?.message ?? String(err)}`);
  }
}

/**
 * Configure page with stealth settings to avoid bot detection
 *
 * WHAT: Applies anti-detection measures to Puppeteer page
 * WHY: Many sites block headless browsers, stealth mode bypasses detection
 *
 * Inputs:
 * - page: Page - Puppeteer page instance
 * - userAgent: string - Custom user agent (optional)
 *
 * Outputs: Promise<void>
 *
 * Techniques:
 * - Remove webdriver flag
 * - Spoof navigator properties (platform, vendor, languages)
 * - Randomize user agent
 * - Override permissions API
 */
async function applyStealthMode(page: Page, userAgent?: string): Promise<void> {
  // Set realistic user agent
  const ua =
    userAgent || USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  await page.setUserAgent(ua);

  // Set realistic viewport
  await page.setViewport({
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  });

  // Remove webdriver flag and spoof navigator properties
  await page.evaluateOnNewDocument(() => {
    // Remove webdriver property
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });

    // Spoof Chrome runtime
    (globalThis as any).chrome = {
      runtime: {},
    };

    // Spoof navigator properties
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5], // Non-zero length
    });
  });

  // Set extra headers
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  });
}

/**
 * Scrape a URL using headless browser
 *
 * WHAT: Main scraping function that extracts content from JavaScript-rendered pages
 * WHY: Fallback when simple HTTP fetch fails or site requires browser rendering
 *
 * Inputs:
 * - url: string - Target URL to scrape
 * - options: ScraperOptions - Configuration (waitForSelector, screenshot, timeout, etc.)
 *
 * Outputs:
 * - Promise<ScraperResult> - Extracted content with metadata
 *
 * Error modes:
 * - Navigation timeout → throws Error after timeout
 * - Page load error → throws Error with status code
 * - Selector not found → throws Error if waitForSelector specified
 *
 * Flow:
 * 1. Get/create browser instance
 * 2. Open new page with stealth configuration
 * 3. Navigate to URL with timeout
 * 4. Wait for selector/network idle (if configured)
 * 5. Extract HTML or take screenshot
 * 6. Close page and return result
 *
 * Example:
 * const result = await scrapeWithBrowser('https://jobs.example.com/123', {
 *   waitForSelector: '.job-description',
 *   timeout: 20000
 * });
 * console.log(result.content); // Rendered HTML
 * console.log(result.meta.latency_ms); // 3421
 */
export async function scrapeWithBrowser(
  url: string,
  options: ScraperOptions = {}
): Promise<ScraperResult> {
  const start = Date.now();
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;

  let page: Page | null = null;

  try {
    // Get browser instance
    const browser = await getBrowser();

    // Open new page
    page = await browser.newPage();

    // Apply stealth configuration
    await applyStealthMode(page, options.userAgent);

    // Set timeout
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);

    logInfo("scraper_navigate", { url });

    // Navigate to URL
    const response = await page.goto(url, {
      waitUntil: options.waitForNetworkIdle !== false ? "networkidle2" : "load",
      timeout,
    });

    const status = response?.status() ?? 0;

    // Check for error status codes
    if (status >= 400) {
      throw new Error(`HTTP ${status} error`);
    }

    // Wait for specific selector if provided
    if (options.waitForSelector) {
      logInfo("scraper_wait_selector", { selector: options.waitForSelector });
      await page.waitForSelector(options.waitForSelector, { timeout });
    }

    // Extract content or screenshot
    let content: string;
    if (options.screenshot) {
      logInfo("scraper_screenshot", { url });
      const screenshotBuffer = await page.screenshot({
        type: "png",
        fullPage: true,
      });
      content = (screenshotBuffer as Buffer).toString("base64");
    } else {
      logInfo("scraper_extract_html", { url });
      content = await page.content();
    }

    // Get page metadata
    const finalUrl = page.url();
    const title = await page.title();

    const latencyMs = Date.now() - start;

    logInfo("scraper_success", {
      url,
      finalUrl,
      latency_ms: latencyMs,
      screenshot: !!options.screenshot,
      contentLength: content.length,
    });

    return {
      content,
      finalUrl,
      title,
      meta: {
        latency_ms: latencyMs,
        screenshot: !!options.screenshot,
        status,
      },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    logError("scraper_error", {
      url,
      error: err?.message ?? String(err),
      latency_ms: latencyMs,
    });
    throw new Error(`Scraping failed: ${err?.message ?? String(err)}`);
  } finally {
    // Always close the page
    if (page) {
      await page.close().catch(() => {
        /* ignore close errors */
      });
    }
  }
}

/**
 * Gracefully close browser instance
 *
 * WHAT: Shuts down browser and cleans up resources
 * WHY: Should be called on server shutdown to avoid orphaned processes
 *
 * Usage:
 * import { closeBrowser } from '../services/scraper.js';
 * process.on('SIGTERM', async () => {
 *   await closeBrowser();
 *   process.exit(0);
 * });
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    try {
      await browserInstance.close();
      logInfo("browser_closed", {});
    } catch (err) {
      logError("browser_close_error", { error: String(err) });
    } finally {
      browserInstance = null;
      browserLaunchPromise = null;
    }
  }
}
