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
    case "career_paths":
      return {
        json: {
          paths: [
            {
              id: "path-1",
              name: "Senior Engineering Track",
              description: "Continue on individual contributor path, becoming a senior/staff engineer with deep technical expertise",
              targetRole: "Staff Software Engineer",
              targetIndustry: "Technology",
              companyType: "mid-size",
              milestones: [
                {
                  year: 2,
                  title: "Senior Software Engineer",
                  salaryRange: { min: 140000, max: 180000, median: 160000 },
                  probability: 0.85,
                  requiredSkills: ["System Design", "Leadership", "Advanced TypeScript"],
                  description: "Lead major projects, mentor junior engineers, design scalable systems"
                },
                {
                  year: 5,
                  title: "Staff Software Engineer",
                  salaryRange: { min: 180000, max: 240000, median: 210000 },
                  probability: 0.65,
                  requiredSkills: ["Architecture", "Cross-team Leadership", "Strategic Planning"],
                  description: "Define technical strategy, influence org-wide decisions, lead multiple teams"
                },
                {
                  year: 8,
                  title: "Principal Engineer",
                  salaryRange: { min: 220000, max: 320000, median: 270000 },
                  probability: 0.40,
                  requiredSkills: ["Technical Vision", "Org-wide Influence", "Innovation"],
                  description: "Set company-wide technical direction, solve hardest problems, industry thought leadership"
                }
              ],
              salaryProgression: [
                { year: 1, best: 145000, average: 125000, worst: 110000, percentile25: 118000, percentile75: 135000 },
                { year: 2, best: 180000, average: 160000, worst: 140000, percentile25: 150000, percentile75: 170000 },
                { year: 3, best: 195000, average: 170000, worst: 150000, percentile25: 160000, percentile75: 185000 },
                { year: 4, best: 210000, average: 185000, worst: 165000, percentile25: 175000, percentile75: 200000 },
                { year: 5, best: 240000, average: 210000, worst: 180000, percentile25: 195000, percentile75: 225000 },
                { year: 6, best: 260000, average: 225000, worst: 195000, percentile25: 210000, percentile75: 245000 },
                { year: 7, best: 280000, average: 240000, worst: 210000, percentile25: 225000, percentile75: 265000 },
                { year: 8, best: 310000, average: 265000, worst: 230000, percentile25: 245000, percentile75: 290000 },
                { year: 9, best: 335000, average: 285000, worst: 245000, percentile25: 265000, percentile75: 310000 },
                { year: 10, best: 360000, average: 305000, worst: 260000, percentile25: 285000, percentile75: 335000 }
              ],
              fiveYearEarnings: { best: 970000, average: 850000, worst: 745000 },
              tenYearEarnings: { best: 2575000, average: 2205000, worst: 1915000 },
              lifetimeEarningsEstimate: 8500000,
              riskAnalysis: {
                volatility: "low",
                marketDependence: "medium",
                skillObsolescence: "low",
                competitionLevel: "medium",
                summary: "Stable path with consistent demand. Technical skills age slower than management skills. Low layoff risk for senior ICs."
              },
              successScores: {
                salary: 82,
                workLifeBalance: 75,
                learningOpportunities: 95,
                careerImpact: 80,
                autonomy: 90,
                overall: 84
              },
              advantages: [
                "Deep technical expertise highly valued",
                "Strong work-life balance at senior IC levels",
                "Continuous learning opportunities",
                "High autonomy in technical decisions",
                "Less office politics than management track"
              ],
              disadvantages: [
                "Lower ceiling than management for total comp",
                "Fewer leadership development opportunities",
                "Can feel isolated without direct reports",
                "Harder to transition to management later",
                "Limited influence on business strategy"
              ],
              criticalSkillsNeeded: [
                "Advanced system design and architecture",
                "Technical mentorship and code reviews",
                "Cross-functional collaboration",
                "Technical writing and documentation"
              ],
              recommendedActions: [
                "Lead a major architectural initiative in next 6 months",
                "Mentor 2-3 junior engineers consistently",
                "Write technical blog posts or speak at meetups",
                "Deep dive into distributed systems and scalability",
                "Build relationships with other senior ICs across teams"
              ]
            },
            {
              id: "path-2",
              name: "Engineering Management Track",
              description: "Transition into people management, leading teams and driving organizational impact",
              targetRole: "Engineering Manager",
              targetIndustry: "Technology",
              companyType: "mid-size",
              milestones: [
                {
                  year: 2,
                  title: "Tech Lead",
                  salaryRange: { min: 145000, max: 185000, median: 165000 },
                  probability: 0.75,
                  requiredSkills: ["Team Leadership", "Project Management", "Technical Mentorship"],
                  description: "Lead team of 3-5 engineers, manage sprints, guide technical decisions"
                },
                {
                  year: 4,
                  title: "Engineering Manager",
                  salaryRange: { min: 170000, max: 230000, median: 200000 },
                  probability: 0.70,
                  requiredSkills: ["People Management", "Hiring", "Performance Reviews", "Strategy"],
                  description: "Manage 6-10 engineers, own team roadmap, drive hiring and retention"
                },
                {
                  year: 7,
                  title: "Senior Engineering Manager",
                  salaryRange: { min: 200000, max: 280000, median: 240000 },
                  probability: 0.50,
                  requiredSkills: ["Org Design", "Budget Management", "Executive Communication"],
                  description: "Lead multiple teams (20-30 people), influence product strategy, manage managers"
                },
                {
                  year: 10,
                  title: "Director of Engineering",
                  salaryRange: { min: 240000, max: 350000, median: 295000 },
                  probability: 0.35,
                  requiredSkills: ["Strategic Planning", "Executive Leadership", "Cross-org Collaboration"],
                  description: "Own engineering for major product area, set technical vision, executive presence"
                }
              ],
              salaryProgression: [
                { year: 1, best: 145000, average: 125000, worst: 110000, percentile25: 118000, percentile75: 135000 },
                { year: 2, best: 185000, average: 165000, worst: 145000, percentile25: 155000, percentile75: 175000 },
                { year: 3, best: 205000, average: 180000, worst: 160000, percentile25: 170000, percentile75: 195000 },
                { year: 4, best: 230000, average: 200000, worst: 175000, percentile25: 185000, percentile75: 220000 },
                { year: 5, best: 250000, average: 215000, worst: 190000, percentile25: 200000, percentile75: 235000 },
                { year: 6, best: 270000, average: 230000, worst: 205000, percentile25: 215000, percentile75: 255000 },
                { year: 7, best: 295000, average: 250000, worst: 220000, percentile25: 235000, percentile75: 275000 },
                { year: 8, best: 315000, average: 270000, worst: 235000, percentile25: 255000, percentile75: 295000 },
                { year: 9, best: 340000, average: 290000, worst: 250000, percentile25: 270000, percentile75: 320000 },
                { year: 10, best: 365000, average: 310000, worst: 270000, percentile25: 290000, percentile75: 340000 }
              ],
              fiveYearEarnings: { best: 1015000, average: 885000, worst: 780000 },
              tenYearEarnings: { best: 2685000, average: 2285000, worst: 1995000 },
              lifetimeEarningsEstimate: 9200000,
              riskAnalysis: {
                volatility: "medium",
                marketDependence: "high",
                skillObsolescence: "medium",
                competitionLevel: "high",
                summary: "Higher compensation ceiling but more volatile. Management positions often first to be cut in downturns. Requires continuous people skills development."
              },
              successScores: {
                salary: 88,
                workLifeBalance: 55,
                learningOpportunities: 75,
                careerImpact: 90,
                autonomy: 70,
                overall: 76
              },
              advantages: [
                "Higher compensation ceiling with equity multipliers",
                "Significant organizational impact and influence",
                "Develops valuable leadership skills",
                "Career mobility across industries",
                "Clearer progression to executive roles"
              ],
              disadvantages: [
                "Significantly worse work-life balance",
                "Less hands-on technical work",
                "More meetings and administrative work",
                "Higher stress managing people issues",
                "First to be cut during layoffs"
              ],
              criticalSkillsNeeded: [
                "One-on-one coaching and feedback",
                "Hiring and interviewing skills",
                "Performance management and difficult conversations",
                "Strategic planning and roadmap creation",
                "Stakeholder management and communication"
              ],
              recommendedActions: [
                "Shadow current engineering managers for 3 months",
                "Take management training courses (Rands Leadership Slack, etc)",
                "Start mentoring junior engineers formally",
                "Lead team initiatives and coordinate across functions",
                "Read 'The Manager's Path' and 'High Output Management'"
              ]
            },
            {
              id: "path-3",
              name: "Startup Technical Co-founder",
              description: "Launch your own startup, building product from scratch with high risk/reward",
              targetRole: "CTO/Co-founder",
              targetIndustry: "Startup",
              companyType: "startup",
              milestones: [
                {
                  year: 1,
                  title: "Founder/CTO",
                  salaryRange: { min: 0, max: 80000, median: 60000 },
                  probability: 1.0,
                  requiredSkills: ["Full-stack Development", "Product Management", "Fundraising"],
                  description: "Build MVP, find co-founders, raise pre-seed funding, acquire first customers"
                },
                {
                  year: 3,
                  title: "CTO (Series A)",
                  salaryRange: { min: 100000, max: 180000, median: 140000 },
                  probability: 0.20,
                  requiredSkills: ["Team Building", "Technical Vision", "Scaling Systems"],
                  description: "Grow eng team to 10-15, scale product, raise Series A"
                },
                {
                  year: 5,
                  title: "CTO (Series B+)",
                  salaryRange: { min: 150000, max: 250000, median: 200000 },
                  probability: 0.08,
                  requiredSkills: ["Organization Building", "Strategic Partnerships", "Executive Leadership"],
                  description: "Lead 30+ person engineering org, prepare for potential exit/IPO"
                }
              ],
              salaryProgression: [
                { year: 1, best: 80000, average: 60000, worst: 0, percentile25: 40000, percentile75: 70000 },
                { year: 2, best: 120000, average: 80000, worst: 0, percentile25: 50000, percentile75: 100000 },
                { year: 3, best: 180000, average: 120000, worst: 0, percentile25: 80000, percentile75: 150000 },
                { year: 4, best: 200000, average: 140000, worst: 0, percentile25: 100000, percentile75: 180000 },
                { year: 5, best: 250000, average: 180000, worst: 0, percentile25: 120000, percentile75: 220000 },
                { year: 6, best: 2000000, average: 200000, worst: 0, percentile25: 140000, percentile75: 300000 },
                { year: 7, best: 5000000, average: 220000, worst: 0, percentile25: 150000, percentile75: 500000 },
                { year: 8, best: 10000000, average: 250000, worst: 0, percentile25: 160000, percentile75: 1000000 },
                { year: 9, best: 15000000, average: 280000, worst: 0, percentile25: 180000, percentile75: 2000000 },
                { year: 10, best: 50000000, average: 320000, worst: 0, percentile25: 200000, percentile75: 5000000 }
              ],
              fiveYearEarnings: { best: 830000, average: 580000, worst: 0 },
              tenYearEarnings: { best: 82830000, average: 1850000, worst: 0 },
              lifetimeEarningsEstimate: 3500000,
              riskAnalysis: {
                volatility: "high",
                marketDependence: "high",
                skillObsolescence: "low",
                competitionLevel: "high",
                summary: "Extremely high risk with potential for life-changing outcomes. 90% of startups fail. Requires sacrifice of stability, work-life balance, and guaranteed income. Success depends on timing, market fit, and luck."
              },
              successScores: {
                salary: 65,
                workLifeBalance: 20,
                learningOpportunities: 100,
                careerImpact: 95,
                autonomy: 100,
                overall: 76
              },
              advantages: [
                "Unlimited upside potential with successful exit",
                "Complete autonomy over technical decisions",
                "Maximum learning across all domains",
                "Building something from scratch",
                "Potential to change an industry"
              ],
              disadvantages: [
                "90% probability of failure",
                "Extremely long hours (60-80 hours/week)",
                "Financial instability for years",
                "High stress and burnout risk",
                "Delayed retirement savings"
              ],
              criticalSkillsNeeded: [
                "Full-stack product development",
                "Fundraising and pitch skills",
                "Sales and business development",
                "Team building and culture creation",
                "Financial management and unit economics"
              ],
              recommendedActions: [
                "Validate business idea with 50+ customer interviews",
                "Build MVP in 3 months while keeping day job",
                "Save 12-18 months of living expenses",
                "Find technical or business co-founder",
                "Join YC or other accelerator program"
              ]
            }
          ],
          decisionPoints: [
            {
              timeframe: "Year 2-3",
              decision: "Stay IC vs. Transition to Management",
              pathA: "Continue as Senior/Staff Engineer (IC track)",
              pathB: "Become Tech Lead, then Engineering Manager",
              impactDescription: "This is the critical fork where technical and management paths diverge. Harder to switch later.",
              salaryDifferential: 80000,
              recommendedChoice: "Path A (Senior Engineering)",
              reasoning: "Given your learning priority (8/10) and autonomy preference (5/10), the IC track better aligns with your values. Management has only 10% higher 10-year earnings but significantly worse work-life balance."
            },
            {
              timeframe: "Year 0-1",
              decision: "Corporate Job vs. Start Startup",
              pathA: "Continue in stable corporate role",
              pathB: "Leave to start startup as technical co-founder",
              impactDescription: "Startup path has 90% failure rate but 10x+ upside if successful. Requires financial cushion and risk tolerance.",
              salaryDifferential: -400000,
              recommendedChoice: "Path A (Corporate)",
              reasoning: "Your work-life balance priority (6/10) conflicts with startup demands (60-80 hour weeks). Consider starting as side project first to validate idea with less risk."
            }
          ],
          topRecommendation: "path-1",
          reasoning: "The Senior Engineering (IC) track best matches your priorities: highest learning opportunities (95/100), excellent autonomy (90/100), and strong work-life balance (75/100). While management offers 4% higher lifetime earnings, the IC path better aligns with your learning focus and provides more technical depth.",
          industryContext: {
            targetIndustries: ["Technology", "Fintech", "Healthcare Tech"],
            growthOutlook: {
              "Technology": "strong",
              "Fintech": "moderate",
              "Healthcare Tech": "strong"
            },
            emergingOpportunities: [
              "AI/ML Engineering roles seeing 40% YoY salary growth",
              "Platform engineering becoming critical as companies scale",
              "Security engineering demand outpacing supply by 3:1"
            ]
          }
        }
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
