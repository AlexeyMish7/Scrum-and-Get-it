# Server Architecture Instructions

## Overview

Node.js + Express + TypeScript backend server for AI-powered resume/cover letter generation, company research, job matching, and analytics. Handles OpenAI API calls, prompt management, web scraping, and serves as middleware between frontend and AI services.

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                 # Entry point, loads env, starts server
│   ├── server.ts                # HTTP server setup and routing
│   ├── routes/                  # API route handlers
│   │   ├── index.ts             # Route exports
│   │   ├── health.ts            # Health check endpoint
│   │   ├── analytics.ts         # Interview analytics endpoints
│   │   ├── analytics/
│   │   │   └── networking.ts    # Networking analytics
│   │   ├── artifacts/
│   │   │   ├── index.ts         # AI artifacts CRUD
│   │   │   └── job-materials.ts # Job materials endpoints
│   │   ├── company/
│   │   │   ├── research.ts      # Company research endpoint
│   │   │   └── user-companies.ts # User's companies from employment
│   │   ├── cover-letter/
│   │   │   └── drafts.ts        # Cover letter drafts CRUD
│   │   ├── generate/            # AI generation endpoints
│   │   │   ├── company-research.ts
│   │   │   ├── cover-letter.ts
│   │   │   ├── experience-tailoring.ts
│   │   │   ├── interview-request.ts
│   │   │   ├── job-import.ts
│   │   │   ├── job-match.ts
│   │   │   ├── profile-tips.ts
│   │   │   ├── reference-points.ts
│   │   │   ├── relationship.ts
│   │   │   ├── resume.ts
│   │   │   └── skills-optimization.ts
│   │   ├── predict/
│   │   │   └── job-search.ts    # Job search predictions
│   │   └── salary/
│   │       └── research.ts      # Salary research endpoint
│   ├── services/                # Business logic layer
│   │   ├── aiClient.ts          # OpenAI client wrapper
│   │   ├── analyticsService.ts  # Analytics calculations
│   │   ├── companyResearchService.ts # Company research logic
│   │   ├── coverLetterDraftsService.ts
│   │   ├── extractionStrategies.ts # Job import extraction
│   │   ├── feedbackNlp.ts       # NLP for feedback analysis
│   │   ├── orchestrator.ts      # AI generation orchestration
│   │   ├── prediction.service.ts # Prediction algorithms
│   │   ├── scraper.ts           # Web scraping (Puppeteer)
│   │   └── supabaseAdmin.ts     # Supabase admin client
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts              # JWT verification (Supabase)
│   │   ├── cors.ts              # CORS configuration
│   │   ├── error.ts             # Global error handler
│   │   └── logging.ts           # Request logging
│   └── types/                   # TypeScript type definitions
├── prompts/                     # Prompt templates
│   ├── companyResearch.ts
│   ├── coverLetter.ts
│   ├── experienceTailoring.ts
│   ├── resume.ts
│   └── skillsOptimization.ts
├── utils/                       # Helper utilities
│   ├── errors.ts                # ApiError class
│   └── logger.ts                # Logging utilities
├── tests/                       # Unit tests
└── package.json
```

---

## Server Entry Point

**File:** `server/src/index.ts`

```typescript
import { config } from "dotenv";
config(); // Load .env

import { createServer } from "./server.js";

const PORT = process.env.PORT || 8787;

const server = createServer();

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`AI Mode: ${process.env.FAKE_AI === "true" ? "MOCK" : "REAL"}`);
  console.log(
    `Auth Mode: ${process.env.ALLOW_DEV_AUTH === "true" ? "DEV" : "PRODUCTION"}`
  );
});
```

**File:** `server/src/server.ts`

The server uses native Node.js `http` module (not Express) with manual routing.

```typescript
import http from "http";

export function createServer(): http.Server {
  loadEnvFromFiles();
  validateConfiguration();

  return http.createServer(handleRequest);
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    handleCorsPreflight(req, res);
    return;
  }

  const url = new URL(req.url!, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method || "GET";

  // Route matching
  if (method === "GET" && pathname === "/api/health") {
    await handleHealth(url, res, { startedAt, counters });
    return;
  }

  if (method === "POST" && pathname === "/api/generate/resume") {
    const userId = await requireAuth(req);
    await handleGenerateResume(req, res, url, reqId, userId, counters);
    return;
  }

  // ... more routes
}
```

---

## AI Generation Flow

### High-Level Process

```
1. Frontend Request → 2. Auth Middleware → 3. Route Handler
                                                    ↓
                                          4. Load Prompt Template
                                                    ↓
                                          5. Render with User Data
                                                    ↓
                                          6. OpenAI API Call
                                                    ↓
                                          7. Parse Response
                                                    ↓
                                          8. Return to Frontend
```

### AI Client Service

**File:** `server/src/services/aiClient.ts`

The AI client handles communication with OpenAI:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
});

export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options?: { temperature?: number; maxTokens?: number }
) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2000,
  });

  return response.choices[0]?.message?.content;
}
```

### Fake AI Mode

For development without using OpenAI credits:

```bash
# In server/.env
FAKE_AI=true
```

When enabled, the server returns mock responses for all AI endpoints.

---

## Prompt System

### Prompt Templates

**Location:** `server/prompts/`

Prompts are defined as TypeScript template functions:

```typescript
// prompts/resume.ts
export function buildResumePrompt(data: ResumePromptData): string {
  return `
You are an expert resume writer. Generate a professional resume.

## User Profile
Name: ${data.profile.full_name}
Title: ${data.profile.professional_title}

## Employment History
${data.employment
  .map(
    (job) => `
- ${job.job_title} at ${job.company_name}
  ${job.start_date} - ${job.end_date || "Present"}
`
  )
  .join("\n")}

## Skills
${data.skills
  .map((s) => `- ${s.skill_name} (${s.proficiency_level})`)
  .join("\n")}

## Target Job
${
  data.jobDetails
    ? `
Title: ${data.jobDetails.job_title}
Company: ${data.jobDetails.company_name}
Description: ${data.jobDetails.job_description}
`
    : "No specific target job provided."
}

Generate a tailored resume in JSON format.
`;
}
```

---

## Web Scraping Service

**File:** `server/src/services/scraper.ts`

Used for job importing and company research:

```typescript
import puppeteer, { Browser } from "puppeteer";

let browser: Browser | null = null;

// Lazy initialization with connection pooling
export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browser;
}

export async function scrapeJobPosting(url: string): Promise<JobData> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle0" });

    // Extract job data from page
    const jobData = await page.evaluate(() => {
      // ... extraction logic
    });

    return jobData;
  } finally {
    await page.close();
  }
}

// Graceful shutdown
export async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}
```

---

## Company Research Service

**File:** `server/src/services/companyResearchService.ts`

Fetches and caches company information:

```typescript
import { supabaseAdmin } from "./supabaseAdmin";

export async function getCompanyResearch(
  companyName: string
): Promise<CompanyResearch> {
  // Check cache first
  const { data: cached } = await supabaseAdmin
    .from("company_research_cache")
    .select("*")
    .eq("company_name", companyName)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached) {
    // Update access stats
    await supabaseAdmin
      .from("company_research_cache")
      .update({
        access_count: cached.access_count + 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("id", cached.id);

    return cached.research_data;
  }

  // Generate new research using AI
  const research = await generateCompanyResearch(companyName);

  // Cache for 7 days
  await saveCompanyResearch(companyName, research);

  return research;
}
```

---

## Prediction Service

**File:** `server/src/services/prediction.service.ts`

Predicts job search outcomes based on user data and historical patterns:

```typescript
export async function predictJobSearchTimeline(
  userId: string,
  targetRole: string,
  applicationRate: number
): Promise<PredictionResult> {
  // Analyze user's profile strength
  const profileScore = await calculateProfileScore(userId);

  // Calculate expected conversion rates
  const baseConversionRate = getBaseConversionRate(targetRole);
  const adjustedRate = baseConversionRate * (profileScore / 100);

  // Monte Carlo simulation for timeline
  const simulations = runMonteCarloSimulation(applicationRate, adjustedRate);

  return {
    estimatedWeeks: simulations.median,
    confidence: simulations.confidence,
    recommendations: generateRecommendations(profileScore, adjustedRate),
  };
}
```

---

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server health, uptime, and request counters.

### AI Generation Endpoints (Protected)

All require `Authorization: Bearer <jwt_token>` header.

```
POST /api/generate/resume
POST /api/generate/cover-letter
POST /api/generate/skills-optimization
POST /api/generate/experience-tailoring
POST /api/generate/company-research
POST /api/generate/job-import
POST /api/generate/job-match
POST /api/generate/profile-tips
POST /api/generate/relationship
POST /api/generate/reference-points
POST /api/generate/interview-request
```

### Artifacts Endpoints (Protected)

```
GET  /api/artifacts              # List all artifacts
GET  /api/artifacts/:id          # Get single artifact
POST /api/job-materials          # Create job materials
GET  /api/jobs/:jobId/materials  # List materials for job
```

### Cover Letter Drafts (Protected)

```
GET    /api/cover-letter/drafts        # List drafts
GET    /api/cover-letter/drafts/:id    # Get draft
POST   /api/cover-letter/drafts        # Create draft
PATCH  /api/cover-letter/drafts/:id    # Update draft
DELETE /api/cover-letter/drafts/:id    # Delete draft
```

### Company Research (Protected)

```
GET /api/company/research        # Get company research (with caching)
GET /api/company/user-companies  # Get companies from user's employment
```

### Salary Research (Protected)

```
POST /api/salary-research        # Research salary data for role/location
```

### Analytics (Protected)

```
POST /api/analytics/networking   # Log networking analytics
```

### Predictions (Protected)

```
POST /api/predict/job-search     # Predict job search timeline
```

---

## Error Handling

### Global Error Middleware

**File:** `server/src/middleware/error.ts`

```typescript
import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("[Error]", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
  });

  // OpenAI API errors
  if (err.response?.status === 429) {
    return res.status(429).json({
      error: "Rate limit exceeded. Please try again later.",
      code: "RATE_LIMIT",
    });
  }

  if (err.response?.status === 401) {
    return res.status(500).json({
      error: "OpenAI API authentication failed",
      code: "API_AUTH_FAILED",
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: err.message,
      code: "VALIDATION_ERROR",
    });
  }

  // Default 500
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
```

### Service-Level Error Handling

```typescript
export async function generateResume(
  input: GenerateResumeInput
): Promise<GenerateResumeOutput> {
  try {
    // ... generation logic
  } catch (error) {
    // Log detailed error
    console.error("[generateResume] Error:", {
      message: error.message,
      userId: input.userId,
      templateType: input.templateType,
      stack: error.stack,
    });

    // Return structured error
    return {
      success: false,
      error: {
        message: error.message || "Failed to generate resume",
        code: error.code || "GENERATION_FAILED",
      },
    };
  }
}
```

---

## Environment Variables

**File:** `server/.env`

```bash
# Server
PORT=8787
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# AI Provider
AI_API_KEY=sk-...
FAKE_AI=false                    # Set true for mock responses

# Supabase (for auth verification and database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
ALLOW_DEV_AUTH=false             # Set true to bypass auth in dev

# Logging
LOG_LEVEL=info
```

**Loading:**

```typescript
import { config } from "dotenv";
config();

// Access via process.env
const port = process.env.PORT || 8787;
const fakeAi = process.env.FAKE_AI === "true";
```

---

## Type Definitions

**File:** `server/src/types/generation.types.ts`

```typescript
// Input types
export interface GenerateResumeInput {
  templateType: "chronological" | "functional" | "hybrid" | "creative";
  profile: ProfileData;
  skills: SkillData[];
  employment: EmploymentData[];
  education: EducationData[];
  jobDetails?: JobDetailsData;
  options?: GenerationOptions;
  userId: string;
}

export interface ProfileData {
  full_name: string;
  professional_title: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  summary?: string;
}

export interface SkillData {
  skill_name: string;
  proficiency_level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  skill_category: string;
  years_of_experience?: number;
}

export interface EmploymentData {
  job_title: string;
  company_name: string;
  location?: string;
  start_date: string;
  end_date?: string;
  current_position: boolean;
  job_description?: string;
  achievements?: string[];
}

export interface GenerationOptions {
  tone?: "professional" | "casual" | "enthusiastic";
  length?: "concise" | "standard" | "detailed";
  focusAreas?: string[];
  customInstructions?: string;
}

// Output types
export interface GenerateResumeOutput {
  success: boolean;
  data?: ResumeData;
  error?: {
    message: string;
    code: string;
  };
  metadata?: {
    model: string;
    tokensUsed: number;
    generationTimeMs: number;
    templateType: string;
  };
}

export interface ResumeData {
  header: {
    name: string;
    title: string;
    email: string;
    phone?: string;
    location?: string;
  };
  summary: string;
  experience: ExperienceSection[];
  education: EducationSection[];
  skills: {
    technical?: string[];
    soft?: string[];
    languages?: string[];
    tools?: string[];
  };
  projects?: ProjectSection[];
  certifications?: CertificationSection[];
}

export interface ExperienceSection {
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  bullets: string[];
}
```

---

## Testing

### Unit Test Example

**File:** `server/tests/services/prompt.service.test.ts`

```typescript
import { PromptService } from "../../src/services/prompt.service";

describe("PromptService", () => {
  let service: PromptService;

  beforeEach(() => {
    service = new PromptService();
  });

  test("loads and caches template", async () => {
    const template1 = await service.loadTemplate("resume", "chronological");
    const template2 = await service.loadTemplate("resume", "chronological");

    // Should return same instance (cached)
    expect(template1).toBe(template2);
  });

  test("renders template with data", async () => {
    const rendered = await service.renderPrompt("resume", "chronological", {
      profile: { full_name: "John Doe" },
      skills: [{ skill_name: "JavaScript", proficiency_level: "Expert" }],
    });

    expect(rendered).toContain("John Doe");
    expect(rendered).toContain("JavaScript");
  });
});
```

### Integration Test Example

```typescript
import request from "supertest";
import app from "../../src/index";

describe("POST /api/generate/resume", () => {
  test("generates resume with valid input", async () => {
    const response = await request(app)
      .post("/api/generate/resume")
      .set("Authorization", `Bearer ${validToken}`)
      .send({
        templateType: "chronological",
        profile: { full_name: "Test User", email: "test@test.com" },
        skills: [],
        employment: [],
        education: [],
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("header");
  });

  test("returns 401 without auth token", async () => {
    const response = await request(app)
      .post("/api/generate/resume")
      .send({ templateType: "chronological" });

    expect(response.status).toBe(401);
  });
});
```

---

## Logging

**File:** `server/utils/logger.ts`

```typescript
import winston from "winston";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
  ],
});

export default logger;
```

**Usage:**

```typescript
import logger from "../utils/logger";

logger.info("Generating resume", { userId, templateType });
logger.error("OpenAI API failed", { error: err.message, userId });
logger.warn("High token usage", { tokensUsed, userId });
```

---

## Development Guidelines for AI Assistant

### ✅ DO:

1. **Validate input** - Check all required fields before processing
2. **Handle errors gracefully** - Return structured error responses
3. **Log important events** - Generation requests, errors, token usage
4. **Use TypeScript** - Define types for all inputs/outputs
5. **Cache prompts** - Don't reload templates on every request
6. **Keep prompts maintainable** - Use Handlebars, not string concatenation
7. **Test AI responses** - Validate JSON structure before returning
8. **Add timeouts** - Don't let OpenAI calls hang forever
9. **Rate limit** - Protect against abuse
10. **Monitor costs** - Track token usage and API costs

### ❌ DON'T:

1. **Expose API keys** - Keep sensitive data in .env
2. **Skip validation** - Always validate user input
3. **Trust AI output blindly** - Parse and validate JSON
4. **Hardcode prompts** - Use template files
5. **Ignore errors** - Always catch and log
6. **Return raw OpenAI errors** - Transform to user-friendly messages
7. **Skip auth** - Always verify JWT tokens
8. **Store user data** - Server is stateless, database handles persistence
9. **Use synchronous I/O** - Always use async/await
10. **Over-complicate** - Keep code simple and readable

### Code Quality Checklist

- [ ] Input validation with clear error messages
- [ ] TypeScript types for request/response
- [ ] Error handling with try/catch
- [ ] Logging for debugging
- [ ] Auth middleware on protected routes
- [ ] Comments explaining prompt logic
- [ ] Tests for critical paths
- [ ] Environment variables for config
- [ ] No hardcoded values
- [ ] Clean, readable code

---

## Quick Reference Commands

```bash
# Install dependencies
npm install

# Development (auto-reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run tests
npm test

# Type checking
npm run type-check
```

---

## Common Issues & Solutions

### Issue: OpenAI API timeout

**Solution:** Add timeout to fetch calls

```typescript
const response = await openai.chat.completions.create(
  {
    // ... config
  },
  {
    timeout: 30000, // 30 seconds
  }
);
```

### Issue: Invalid JSON from OpenAI

**Solution:** Validate and retry

````typescript
let content = response.choices[0]?.message?.content;
if (!content) throw new Error("No content");

try {
  return JSON.parse(content);
} catch (err) {
  // Try cleaning markdown code blocks
  content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  return JSON.parse(content);
}
````

### Issue: Prompt too long (token limit)

**Solution:** Truncate or summarize data

```typescript
// Limit achievements to 3 per job
const employment = input.employment.map((job) => ({
  ...job,
  achievements: (job.achievements || []).slice(0, 3),
}));
```

---

This is your server bible. Reference this when working on AI generation features, adding new endpoints, or debugging prompt issues. Keep it simple, handle errors, and always validate AI output.
