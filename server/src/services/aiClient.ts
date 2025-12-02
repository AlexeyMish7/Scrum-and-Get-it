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
        text: "I am writing to express my strong interest in the Software Engineer position at TechCorp...",
        json: {
          sections: {
            opening:
              "I am writing to express my strong interest in the Software Engineer position at TechCorp, as I discovered through your careers page. With over five years of experience in full-stack development and a proven track record of delivering scalable solutions, I am excited about the opportunity to contribute to your innovative team. Your company's commitment to cutting-edge technology and user-centric design aligns perfectly with my professional values and technical expertise. I am particularly drawn to TechCorp's recent expansion into cloud-native solutions, an area where I have extensive hands-on experience developing microservices architectures that have served millions of users.",
            body: [
              "Throughout my career at StartupXYZ, I have consistently demonstrated the ability to tackle complex technical challenges while maintaining focus on business objectives. I led the migration of our monolithic application to a microservices architecture, reducing deployment times by 75% and improving system reliability to 99.99% uptime. This project required deep expertise in containerization technologies, which I gained through hands-on experience with Docker and Kubernetes, as well as a strong understanding of distributed systems design patterns. Additionally, I implemented comprehensive CI/CD pipelines using GitHub Actions and ArgoCD, which enabled our team to deploy multiple times per day with confidence. My technical skills extend to modern frontend frameworks including React and TypeScript, backend technologies like Node.js and Python, and cloud platforms such as AWS and Google Cloud.",
              "Beyond my technical capabilities, I bring strong leadership and collaboration skills that have proven essential in cross-functional team environments. As a senior engineer, I mentored three junior developers, helping them grow their skills and advance their careers while maintaining high code quality standards through rigorous code reviews and pair programming sessions. I also worked closely with product managers and designers to translate business requirements into technical specifications, ensuring that our solutions not only met technical standards but also delivered exceptional user experiences. My passion for continuous learning drives me to stay current with emerging technologies and best practices, which I regularly share with my team through technical talks and documentation. I am confident that my combination of technical depth, leadership experience, and commitment to excellence would make me a valuable addition to your engineering team.",
            ],
            closing:
              "Thank you for considering my application. I am genuinely excited about the possibility of contributing to TechCorp's mission of building innovative software solutions that make a difference. I would welcome the opportunity to discuss how my experience and skills align with your team's needs and to learn more about the exciting projects you're working on. I am available for an interview at your convenience and look forward to hearing from you soon.",
          },
          metadata: {
            wordCount: 425,
            tone: "professional",
            paragraphCount: 4,
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
    case "market_intelligence":
      return {
        json: {
          jobMarketTrends: [
            {
              industry: "Technology",
              location: "San Francisco, CA",
              demandLevel: "hot",
              trendLabel: "High Demand",
              summary:
                "Tech sector showing strong hiring activity with 25% YoY growth.",
            },
            {
              industry: "Healthcare",
              location: "Boston, MA",
              demandLevel: "growing",
              trendLabel: "Expanding",
              summary:
                "Healthcare IT roles increasing as digital transformation accelerates.",
            },
          ],
          skillDemand: {
            coreSkills: [
              {
                name: "JavaScript",
                category: "core",
                trend: "stable",
                commentary:
                  "Fundamental skill with consistent demand across web development.",
              },
              {
                name: "Python",
                category: "core",
                trend: "rising",
                commentary:
                  "Growing demand driven by AI/ML and data science applications.",
              },
            ],
            emergingSkills: [
              {
                name: "TypeScript",
                category: "emerging",
                trend: "rising",
                commentary:
                  "Rapidly becoming standard for large-scale JavaScript applications.",
              },
            ],
            decliningSkills: [
              {
                name: "jQuery",
                category: "declining",
                trend: "declining",
                commentary:
                  "Modern frameworks have reduced reliance on jQuery.",
              },
            ],
          },
          salaryTrends: [
            {
              role: "Software Engineer",
              location: "San Francisco, CA",
              median: 145000,
              range: "$120K - $180K",
              trend: "rising",
              commentary:
                "Salaries increasing 8% annually due to talent shortage.",
            },
          ],
          companyGrowthPatterns: [
            {
              name: "Tech Startups",
              industry: "Technology",
              hiringOutlook: "aggressive",
              commentary:
                "Well-funded startups expanding engineering teams rapidly.",
            },
          ],
          industryDisruptionInsights: [
            "AI/ML integration transforming traditional software roles",
            "Remote work enabling global talent competition",
          ],
          recommendations: [
            "Focus on TypeScript and modern React patterns for frontend roles",
            "Consider emerging tech hubs with lower cost of living",
          ],
          opportunityWindows: [
            {
              label: "Q4 Hiring Push",
              timing: "now",
              priority: "high",
              description:
                "Companies rushing to fill positions before year-end budgets expire.",
            },
          ],
          competitiveLandscapeSummary:
            "Strong candidate market with companies competing for talent. Senior roles particularly competitive.",
        },
      };
    case "time_investment":
      return {
        json: {
          timeByActivity: [
            {
              activityType: "applications",
              totalMinutes: 240,
              sessionCount: 8,
              avgMinutesPerSession: 30,
            },
            {
              activityType: "networking",
              totalMinutes: 180,
              sessionCount: 6,
              avgMinutesPerSession: 30,
            },
          ],
          schedulePatterns: {
            byHour: [{ hour: 9, minutes: 120 }],
            byWeekday: [{ weekday: 1, minutes: 240 }],
            bestHours: [9, 10, 14],
            bestWeekdays: [1, 2, 3],
          },
          outcomesByActivity: [
            {
              activityType: "applications",
              totalMinutes: 240,
              outcomeCount: 5,
              successCount: 2,
              outcomesPerHour: 1.25,
              successRate: 40,
            },
          ],
          wellness: {
            avgEnergyLevel: 3.5,
            highEnergyShare: 45,
            lowEnergyShare: 20,
            burnoutRisk: "low",
          },
          energyCorrelation: {
            description:
              "Peak productivity during morning hours (9-11 AM) with high energy levels correlating to 35% better outcomes.",
          },
          efficiencyMetrics: {
            avgMinutesPerOutcome: 48,
            outcomeRate: 1.25,
            improvementTrend: 15,
          },
          aiRecommendations: {
            timeAllocation: [
              "Increase networking time by 20% for better referral opportunities",
              "Consolidate application sessions to 90-minute focused blocks",
            ],
            burnoutPrevention: [
              "Take regular breaks every 50 minutes",
              "Limit job search activities to 4 hours per day",
            ],
            coaching: [
              "Your morning sessions (9-11 AM) show 35% better outcomes",
              "Consider shifting more activities to high-energy periods",
            ],
          },
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
  const timeoutMs = opts.timeoutMs ?? 120_000;

  const body = {
    model: opts.model ?? "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 1500,
    response_format: { type: "json_object" }, // Force JSON response
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

      let raw: any;
      try {
        raw = await resp.json();
      } catch (jsonErr) {
        clearTimeout(id);
        logError("ai_response_json_parse_failed", {
          status: resp.status,
          error: String(jsonErr),
        });
        throw new Error(`Failed to parse OpenAI response: ${resp.status}`);
      }

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
          .filter((t: any) => typeof t === "string")
          .join("\n") ?? null;
      const tokens = raw?.usage?.total_tokens ?? undefined;

      // Try to parse JSON from text if it looks like JSON
      let json: unknown = undefined;
      if (text) {
        const trimmed = text.trim();
        if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
          try {
            json = JSON.parse(trimmed);
          } catch (e) {
            // Try removing markdown code blocks if present
            try {
              const cleaned = trimmed
                .replace(/```json\s*/g, "")
                .replace(/```\s*/g, "")
                .trim();
              json = JSON.parse(cleaned);
            } catch (e2) {
              // Not valid JSON, leave json undefined and keep text
              logInfo("ai_json_parse_failed", {
                error: String(e),
                textPreview: trimmed.substring(0, 200),
              });
            }
          }
        }
      }

      return { text, json, raw, tokens, meta: { status: resp.status } };
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
    if (provider === "mock") {
      const mockResult = randomSampleForKind(kind);
      // Add metadata to indicate mock data was used
      return {
        ...mockResult,
        meta: {
          ...("meta" in mockResult && mockResult.meta ? mockResult.meta : {}),
          isMockData: true,
          provider: "mock",
        },
      };
    }
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
