# Server Architecture Instructions

## Overview

Node.js + Express + TypeScript backend server for AI-powered resume/cover letter generation. Handles OpenAI API calls, prompt management, and serves as middleware between frontend and AI services.

---

## Project Structure

```
server/
├── src/
│   ├── index.ts                 # Entry point, Express app setup
│   ├── routes/                  # API route handlers
│   │   ├── generate.ts          # AI generation endpoints
│   │   └── health.ts            # Health check endpoint
│   ├── services/                # Business logic layer
│   │   ├── openai.service.ts    # OpenAI client wrapper
│   │   └── prompt.service.ts    # Prompt loading/rendering
│   ├── middleware/              # Express middleware
│   │   ├── auth.ts              # JWT verification (Supabase)
│   │   └── error.ts             # Global error handler
│   └── types/                   # TypeScript type definitions
│       └── generation.types.ts  # Request/response types
├── prompts/                     # Prompt templates (Handlebars)
│   ├── resume/
│   │   ├── chronological.hbs
│   │   ├── functional.hbs
│   │   ├── hybrid.hbs
│   │   └── base.hbs             # Shared prompt fragments
│   └── cover-letter/
│       ├── professional.hbs
│       └── creative.hbs
├── utils/                       # Helper utilities
│   └── logger.ts                # Winston logger
├── tests/                       # Unit tests
└── package.json
```

---

## Server Entry Point

**File:** `server/src/index.ts`

```typescript
import express from "express";
import cors from "cors";
import { generateRouter } from "./routes/generate";
import { healthRouter } from "./routes/health";
import { errorHandler } from "./middleware/error";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/health", healthRouter);
app.use("/api/generate", generateRouter);

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
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

### Detailed Flow

**Step 1: Frontend Request**

```typescript
// Frontend makes POST request
const response = await fetch('http://localhost:3001/api/generate/resume', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  },
  body: JSON.stringify({
    templateType: 'chronological',
    profile: { ... },
    skills: [ ... ],
    employment: [ ... ],
    education: [ ... ],
    jobDetails: { ... },
    options: {
      tone: 'professional',
      length: 'standard',
      focusAreas: ['leadership']
    }
  })
});
```

**Step 2: Auth Middleware**

```typescript
// server/src/middleware/auth.ts
export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    // Verify JWT with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) throw new Error("Invalid token");

    req.user = user; // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}
```

**Step 3: Route Handler**

```typescript
// server/src/routes/generate.ts
import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { generateResume } from "../services/openai.service";

const router = Router();

router.post("/resume", requireAuth, async (req, res, next) => {
  try {
    const {
      templateType,
      profile,
      skills,
      employment,
      education,
      jobDetails,
      options,
    } = req.body;

    // Validate required fields
    if (!templateType || !profile) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Call AI service
    const result = await generateResume({
      templateType,
      profile,
      skills,
      employment,
      education,
      jobDetails,
      options,
      userId: req.user.id,
    });

    res.json(result);
  } catch (err) {
    next(err); // Pass to error handler
  }
});

export { router as generateRouter };
```

**Step 4-6: Prompt Service**

```typescript
// server/src/services/prompt.service.ts
import Handlebars from "handlebars";
import fs from "fs/promises";
import path from "path";

export class PromptService {
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  async loadTemplate(
    type: "resume" | "cover-letter",
    subtype: string
  ): Promise<HandlebarsTemplateDelegate> {
    const cacheKey = `${type}/${subtype}`;

    // Check cache first
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!;
    }

    // Load from filesystem
    const templatePath = path.join(
      __dirname,
      "../../prompts",
      type,
      `${subtype}.hbs`
    );
    const templateSource = await fs.readFile(templatePath, "utf-8");

    // Compile Handlebars template
    const template = Handlebars.compile(templateSource);

    // Cache for reuse
    this.templateCache.set(cacheKey, template);

    return template;
  }

  async renderPrompt(
    type: "resume" | "cover-letter",
    subtype: string,
    data: any
  ): Promise<string> {
    const template = await this.loadTemplate(type, subtype);

    // Render template with user data
    return template(data);
  }
}
```

**Step 7-8: OpenAI Service**

```typescript
// server/src/services/openai.service.ts
import OpenAI from "openai";
import { PromptService } from "./prompt.service";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const promptService = new PromptService();

export async function generateResume(
  input: GenerateResumeInput
): Promise<GenerateResumeOutput> {
  const startTime = Date.now();

  try {
    // Step 1: Render prompt template
    const systemPrompt = await promptService.renderPrompt(
      "resume",
      input.templateType,
      input
    );

    // Step 2: Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Generate a ${input.templateType} resume for ${
            input.profile.full_name
          }. Tone: ${input.options?.tone || "professional"}. Length: ${
            input.options?.length || "standard"
          }.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }, // Force JSON output
    });

    // Step 3: Extract and parse response
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content in OpenAI response");

    const resumeData = JSON.parse(content);

    // Step 4: Return with metadata
    return {
      success: true,
      data: resumeData,
      metadata: {
        model: response.model,
        tokensUsed: response.usage?.total_tokens || 0,
        generationTimeMs: Date.now() - startTime,
        templateType: input.templateType,
      },
    };
  } catch (error) {
    console.error("[generateResume] Error:", error);

    return {
      success: false,
      error: {
        message: error.message || "Failed to generate resume",
        code: "GENERATION_FAILED",
      },
    };
  }
}
```

---

## Prompt System (Handlebars Templates)

### Why Handlebars?

- **Templating**: Dynamic prompts based on user data
- **Reusability**: Shared fragments across templates
- **Maintainability**: Easier to edit than string concatenation

### Template Structure

**Base Template:** `server/prompts/resume/base.hbs`

```handlebars
{{! Shared instructions for all resume types }}
You are an expert resume writer. Generate a professional resume in JSON format.
## Output Format Return ONLY a valid JSON object with this structure: {
"header": { "name": "{{profile.full_name}}", "title": "{{profile.professional_title}}",
"email": "{{profile.email}}", "phone": "{{profile.phone}}", "location": "{{profile.city}},
{{profile.state}}" }, "summary": "Professional summary text (3-4 sentences)",
"experience": [ { "title": "Job Title", "company": "Company Name", "location":
"City, State", "startDate": "MM/YYYY", "endDate": "MM/YYYY or Present",
"bullets": ["Achievement 1", "Achievement 2"] } ], "education": [...], "skills":
{ "technical": ["Skill 1", "Skill 2"], "soft": ["Skill 1", "Skill 2"] } } ##
Tone
{{#if options.tone}}
  Use a
  {{options.tone}}
  tone throughout.
{{else}}
  Use a professional tone throughout.
{{/if}}

## Focus Areas
{{#if options.focusAreas}}
  Emphasize the following areas:
  {{#each options.focusAreas}}
    -
    {{this}}
  {{/each}}
{{/if}}
```

**Chronological Template:** `server/prompts/resume/chronological.hbs`

```handlebars
{{> base}}

## Resume Type: Chronological
Focus on work history in reverse chronological order.

## User Data

### Profile
Name: {{profile.full_name}}
Title: {{profile.professional_title}}
{{#if profile.summary}}
Current Summary: {{profile.summary}}
{{/if}}

### Employment History
{{#each employment}}
**{{this.job_title}}** at {{this.company_name}}
Location: {{this.location}}
Duration: {{this.start_date}} to {{#if this.current_position}}Present{{else}}{{this.end_date}}{{/if}}

{{#if this.job_description}}
Description: {{this.job_description}}
{{/if}}

{{#if this.achievements}}
Achievements:
{{#each this.achievements}}
- {{this}}
{{/each}}
{{/if}}

{{/each}}

### Skills
{{#each skills}}
- {{this.skill_name}} ({{this.proficiency_level}})
{{/each}}

### Education
{{#each education}}
{{this.degree_type}} in {{this.field_of_study}}
{{this.institution_name}}
Graduated: {{this.graduation_date}}
{{#if this.gpa}}GPA: {{this.gpa}}{{/if}}
{{/each}}

{{#if jobDetails}}
## Target Job
Title: {{jobDetails.job_title}}
Company: {{jobDetails.company_name}}
{{#if jobDetails.job_description}}
Description: {{jobDetails.job_description}}
{{/if}}

Tailor the resume to match this job posting.
{{/if}}
```

### Handlebars Helpers

**Register custom helpers:**

```typescript
// server/src/services/prompt.service.ts
import Handlebars from "handlebars";

// Helper to format dates
Handlebars.registerHelper("formatDate", (date: string) => {
  if (!date) return "Present";
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getFullYear()}`;
});

// Helper to limit array length
Handlebars.registerHelper("limit", (array: any[], limit: number) => {
  return array.slice(0, limit);
});

// Helper for conditional bullets
Handlebars.registerHelper("hasBullets", (achievements: string[]) => {
  return achievements && achievements.length > 0;
});
```

**Usage in templates:**

```handlebars
{{formatDate employment.start_date}}
to
{{formatDate employment.end_date}}

{{#each (limit skills 10)}}
  -
  {{this.skill_name}}
{{/each}}

{{#if (hasBullets employment.achievements)}}
  Achievements:
  {{#each employment.achievements}}
    -
    {{this}}
  {{/each}}
{{/if}}
```

---

## API Endpoints

### POST /api/generate/resume

**Purpose:** Generate AI resume

**Request:**

```typescript
{
  templateType: 'chronological' | 'functional' | 'hybrid' | 'creative',
  profile: {
    full_name: string;
    professional_title: string;
    email: string;
    phone?: string;
    summary?: string;
    // ... other profile fields
  },
  skills: Array<{
    skill_name: string;
    proficiency_level: string;
    skill_category: string;
  }>,
  employment: Array<{
    job_title: string;
    company_name: string;
    start_date: string;
    end_date?: string;
    current_position: boolean;
    achievements?: string[];
  }>,
  education: Array<{
    institution_name: string;
    degree_type: string;
    field_of_study: string;
    graduation_date?: string;
  }>,
  jobDetails?: {
    job_title: string;
    company_name: string;
    job_description?: string;
    required_skills?: string[];
  },
  options?: {
    tone?: 'professional' | 'casual' | 'enthusiastic';
    length?: 'concise' | 'standard' | 'detailed';
    focusAreas?: string[];
  }
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    header: { name, title, email, phone, location },
    summary: string,
    experience: [...],
    education: [...],
    skills: { technical: [...], soft: [...] }
  },
  metadata: {
    model: 'gpt-4',
    tokensUsed: 1234,
    generationTimeMs: 5678,
    templateType: 'chronological'
  }
}
```

### POST /api/generate/cover-letter

**Purpose:** Generate AI cover letter

**Request:**

```typescript
{
  templateType: 'professional' | 'creative' | 'enthusiastic',
  profile: { ... },
  jobDetails: {
    job_title: string;
    company_name: string;
    job_description?: string;
    hiring_manager_name?: string;
  },
  relevantExperience: Array<{
    job_title: string;
    company_name: string;
    achievements: string[];
  }>,
  relevantSkills: string[],
  options?: {
    tone?: string;
    length?: 'short' | 'medium' | 'long';
    includeCallToAction?: boolean;
  }
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    greeting: string,
    opening: string,
    body: string[],  // Array of paragraphs
    closing: string,
    signature: string
  },
  metadata: { ... }
}
```

### POST /api/generate/job-match

**Purpose:** Analyze job match score

**Request:**

```typescript
{
  profile: { ... },
  skills: [...],
  employment: [...],
  jobDetails: {
    job_title: string;
    job_description: string;
    required_skills?: string[];
    preferred_skills?: string[];
  }
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    matchScore: 85,  // 0-100
    breakdown: {
      skills: { score: 90, matched: [...], missing: [...] },
      experience: { score: 80, relevant: [...] },
      education: { score: 85, requirement: string }
    },
    strengths: ["Strong Python skills", "Relevant leadership experience"],
    gaps: ["Missing AWS certification", "No GraphQL experience"],
    recommendations: ["Learn GraphQL", "Get AWS certification"]
  }
}
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
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# OpenAI
OPENAI_API_KEY=sk-...

# Supabase (for auth verification)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Logging
LOG_LEVEL=info
```

**Loading:**

```typescript
import dotenv from "dotenv";
dotenv.config();

const config = {
  port: process.env.PORT || 3001,
  openaiApiKey: process.env.OPENAI_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  clientUrl: process.env.CLIENT_URL,
};
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
