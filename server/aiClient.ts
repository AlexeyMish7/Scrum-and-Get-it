/*
AI client wrapper (server-side)
- Centralizes AI provider selection and request normalization.
- Supports a "mock" provider via FAKE_AI or AI_PROVIDER=mock for local dev.
- Exports `generate` which returns a normalized object { text?, json?, raw?, tokens?, meta? }

NOTES:
- This file is intentionally small and dependency-free so it can be adapted to any environment.
- To plug a real provider, add SDK calls in sendToOpenAI() and sendToAzureAI() with proper auth.
*/

type Provider = "openai" | "azure" | "mock";

const PROVIDER = process.env.AI_PROVIDER ?? "openai";
const API_KEY = process.env.AI_API_KEY ?? "";
const FAKE_AI = (process.env.FAKE_AI ?? "false").toLowerCase() === "true";

export interface GenerateOptions {
  model?: string; // e.g., "gpt-4o-mini" or "gpt-4o" or an Azure model alias
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  timeoutMs?: number; // request timeout in ms
  maxRetries?: number; // number of retries on transient failures
}

export interface GenerateResult {
  // If the model returns structured JSON, supply under json. For plain text, use text.
  text?: string;
  json?: unknown;
  raw?: unknown; // provider raw response
  tokens?: number;
  meta?: Record<string, unknown>;
}

function randomSampleForKind(kind: string) {
  // Deterministic-ish mock outputs for local dev
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

async function sendToOpenAI(
  prompt: string,
  opts: GenerateOptions
): Promise<GenerateResult> {
  if (!API_KEY) throw new Error("AI_API_KEY is not set");

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
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const raw: any = await resp.json();
      clearTimeout(id);

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

async function sendToAzureAI(
  prompt: string,
  opts: GenerateOptions
): Promise<GenerateResult> {
  // Placeholder for Azure OpenAI integration (different endpoint & auth headers)
  throw new Error("Azure provider not implemented yet");
}

export async function generate(
  kind: string,
  prompt: string,
  opts: GenerateOptions = {}
): Promise<GenerateResult> {
  // If FAKE_AI or provider=mock, return deterministic sample output
  if (FAKE_AI || PROVIDER === "mock") {
    return randomSampleForKind(kind);
  }

  // Route to real provider
  if (PROVIDER === "openai") {
    return sendToOpenAI(prompt, opts);
  }
  if (PROVIDER === "azure") {
    return sendToAzureAI(prompt, opts);
  }

  throw new Error("Unsupported AI provider: " + PROVIDER);
}

export default { generate };
