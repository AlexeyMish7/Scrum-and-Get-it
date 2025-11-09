/**
 * AI client wrapper (server-side)
 *
 * What this does:
 * - Centralizes AI provider selection and request normalization
 * - Supports a "mock" provider via FAKE_AI=true or AI_PROVIDER=mock for local dev
 * - Exposes `generate(kind, prompt, opts)` returning a normalized shape
 *
 * Where it's used:
 * - Orchestrator calls `aiClient.generate` to create resume/cover/company research/etc.
 * - The caller persists results (ai_artifacts) and handles UI flow.
 *
 * Notes:
 * - Keep provider specifics isolated here. If you add Azure or Anthropic, add a sendToX function and route in selectProvider.
 * - Avoid leaking SDK types outward; return a simple typed object.
 */
import { logError, logInfo } from "../../utils/logger.js";

type Provider = "openai" | "azure" | "mock";

const PROVIDER = process.env.AI_PROVIDER ?? "openai";
const FAKE_AI = (process.env.FAKE_AI ?? "false").toLowerCase() === "true";

/** Options supported when generating content */
export interface GenerateOptions {
  /** Model name or alias (e.g., gpt-4o-mini, azure-deployment-name) */
  model?: string;
  /** Max tokens for the completion */
  maxTokens?: number;
  /** Temperature (0..1) */
  temperature?: number;
  /** Enable streaming (not implemented in this wrapper yet) */
  stream?: boolean;
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Max retries for transient errors */
  maxRetries?: number;
}

/** Normalized result returned by providers */
export interface GenerateResult {
  /** Plain text, when provider returns text */
  text?: string | null;
  /** Structured JSON, when the prompt asks for JSON */
  json?: unknown;
  /** Provider raw response (for debugging/telemetry only) */
  raw?: unknown;
  /** Token usage (if available from provider) */
  tokens?: number;
  /** Additional metadata such as HTTP status, headers, etc. */
  meta?: Record<string, unknown>;
}

/**
 * Deterministic-ish mock outputs for local dev.
 * Ensures frontend and persistence flows can be exercised without external calls/cost.
 */
function randomSampleForKind(kind: string) {
  switch (kind) {
    case "resume":
      return {
        text: "- Led migration to cloud, reduced costs by 30%\n- Built CI/CD pipelines; improved deployment frequency",
        json: {
          bullets: [
            { text: "Led migration to cloud, reduced costs by 30%" },
            { text: "Built CI/CD pipelines; improved deployment frequency" },
          ],
        },
      };
    case "cover_letter":
      return {
        text: "Dear Hiring Manager, I'm excited to apply...",
        json: {
          sections: {
            opening: "Dear Hiring Manager...",
            body: "I led cloud migrations...",
            closing: "Sincerely",
          },
        },
      };
    case "company_research":
      return {
        json: {
          name: "Acme Corp",
          size: "200-500",
          industry: "Fintech",
          recent_news: [],
        },
      };
    case "match":
      return {
        json: {
          overall_score: 78,
          breakdown: { skills: 60, experience: 90, education: 75 },
          explanation: "Strong skills match, moderate experience fit.",
        },
      };
    default:
      return { text: "Mock response" };
  }
}

/**
 * OpenAI REST integration using chat.completions endpoint.
 * Lightweight and dependency-free (uses fetch via undici/polyfill).
 */
async function sendToOpenAI(
  prompt: string,
  opts: GenerateOptions
): Promise<GenerateResult> {
  // Read the API key at call-time so late-loaded env (from index env loader) is respected.
  // Support common aliases to reduce configuration friction.
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw new Error("AI_API_KEY is not set");

  // Basic retry + timeout wrapper around a single REST call.
  const maxRetries = opts.maxRetries ?? 2;
  const timeoutMs = opts.timeoutMs ?? 30_000;

  const body = {
    model: opts.model ?? "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 800,
  };

  let attempt = 0;
  while (true) {
    attempt++;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const raw: any = await resp.json();
      clearTimeout(id);
      if (!resp.ok) {
        const errMsg = raw?.error?.message || `OpenAI HTTP ${resp.status}`;
        const err: any = new Error(errMsg);
        (err.status as any) = resp.status;
        throw err;
      }
      // Compose text from choices if present
      const text =
        raw?.choices
          ?.map((c: any) => c.message?.content ?? c.text)
          .join("\n") ?? null;
      const tokens = raw?.usage?.total_tokens ?? undefined;
      return { text, raw, tokens, meta: { status: resp.status } };
    } catch (err: any) {
      clearTimeout(id);
      const isAbort = err?.name === "AbortError";
      // Retry on transient network / 5xx or abort if out of retries
      const shouldRetry =
        attempt <= maxRetries &&
        (isAbort || err?.status >= 500 || !err?.status);
      if (!shouldRetry) {
        throw err;
      }
      // backoff with jitter
      const backoff = Math.min(1000 * 2 ** (attempt - 1), 10_000);
      const jitter = Math.floor(Math.random() * 300);
      await new Promise((res) => setTimeout(res, backoff + jitter));
      // loop to retry
    }
  }
}

/** Azure provider placeholder (wire in your Azure OpenAI endpoint/headers here) */
async function sendToAzureAI(
  prompt: string,
  opts: GenerateOptions
): Promise<GenerateResult> {
  throw new Error("Azure provider not implemented yet");
}

/** Provider selector */
function selectProvider(): Provider {
  if (FAKE_AI || PROVIDER === "mock") return "mock";
  if (PROVIDER === "openai" || PROVIDER === "azure") return PROVIDER;
  return "openai"; // default
}

/**
 * Generate content for a given kind using the selected provider.
 * - kind: used to decide mock shape and can be used in future provider routing
 * - prompt: the constructed instruction/payload
 */
export async function generate(
  kind: string,
  prompt: string,
  opts: GenerateOptions = {}
): Promise<GenerateResult> {
  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
    throw new Error("prompt too short or invalid");
  }
  if (prompt.length > 20000) {
    throw new Error("prompt exceeds maximum length (20k chars)");
  }
  const provider = selectProvider();
  logInfo("ai_generate_start", {
    kind,
    provider,
    model: opts.model,
    len: prompt.length,
  });
  try {
    if (provider === "mock") return randomSampleForKind(kind);
    if (provider === "openai") {
      const r = await sendToOpenAI(prompt, opts);
      logInfo("ai_generate_ok", {
        kind,
        provider,
        tokens: r.tokens,
        model: opts.model,
      });
      return r;
    }
    if (provider === "azure") {
      const r = await sendToAzureAI(prompt, opts);
      logInfo("ai_generate_ok", {
        kind,
        provider,
        tokens: r.tokens,
        model: opts.model,
      });
      return r;
    }
    throw new Error("Unsupported AI provider: " + provider);
  } catch (e: any) {
    logError("ai_generate_error", {
      kind,
      provider,
      model: opts.model,
      error: e?.message ?? String(e),
    });
    throw e;
  }
}

export default { generate };
