# Server Structure - In-Depth Technical Guide

## Directory Tree

```
server/
├── src/
│   ├── index.ts                      # Server entry point
│   ├── server.ts                     # Express app configuration
│   ├── routes/                       # API endpoint handlers
│   │   ├── index.ts                 # Route aggregator
│   │   ├── health.ts                # Health check endpoint
│   │   ├── generate/                # AI generation endpoints
│   │   │   ├── index.ts            # Resume/cover letter generation
│   │   │   └── types.ts            # Generation request/response types
│   │   ├── artifacts/               # AI artifacts management
│   │   │   └── index.ts            # CRUD for AI artifacts
│   │   ├── cover-letter/            # Cover letter specific endpoints
│   │   │   └── index.ts            # Cover letter drafts, templates
│   │   ├── company/                 # Company research endpoints
│   │   │   └── index.ts            # Company data fetching
│   │   └── salary/                  # Salary research endpoints
│   │       └── index.ts            # Salary insights
│   ├── services/                    # Business logic layer
│   │   ├── index.ts                # Service exports
│   │   ├── aiClient.ts             # OpenAI API wrapper
│   │   ├── orchestrator.ts         # AI generation orchestration
│   │   ├── companyResearchService.ts # Company data fetching
│   │   ├── coverLetterDraftsService.ts # Cover letter management
│   │   ├── scraper.ts              # Web scraping utilities
│   │   ├── extractionStrategies.ts # Data extraction logic
│   │   └── supabaseAdmin.ts        # Admin Supabase client
│   ├── middleware/                  # Express middleware
│   │   ├── auth.ts                 # JWT verification
│   │   ├── cors.ts                 # CORS configuration
│   │   ├── errorHandler.ts         # Global error handling
│   │   └── logger.ts               # Request logging
│   ├── types/                       # TypeScript type definitions
│   │   ├── express.d.ts            # Express type extensions
│   │   ├── generation.types.ts     # AI generation types
│   │   └── api.types.ts            # API request/response types
│   └── utils/                       # Helper utilities
│       ├── logger.ts               # Winston logger setup
│       ├── validation.ts           # Input validation
│       └── formatting.ts           # Data formatting
├── prompts/                         # AI prompt templates
│   ├── resume.ts                   # Resume generation prompts
│   ├── coverLetter.ts              # Cover letter prompts
│   ├── skillsOptimization.ts       # Skills analysis prompts
│   ├── experienceTailoring.ts      # Experience optimization
│   └── companyResearch.ts          # Company research prompts
├── scripts/                         # Utility scripts
│   └── seedPrompts.ts              # Seed default prompts
├── tests/                          # Test files
│   ├── routes/                     # Route tests
│   ├── services/                   # Service tests
│   └── integration/                # End-to-end tests
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.dev.json              # Dev-specific TS config
└── .env                           # Environment variables
```

## Server Architecture

### Request Flow

```
Client Request
    ↓
1. CORS Middleware (validate origin)
    ↓
2. Logger Middleware (log request)
    ↓
3. Auth Middleware (verify JWT token)
    ↓
4. Route Handler (e.g., /api/generate/resume)
    ↓
5. Service Layer (business logic)
    ↓
6. External APIs (OpenAI, Supabase, web scraping)
    ↓
7. Response Formation
    ↓
8. Error Handler (if error occurs)
    ↓
Client Response
```

## Core Files

### `src/index.ts` - Entry Point

**Purpose:** Starts the Express server

**Responsibilities:**

- Loads environment variables
- Starts server on specified port
- Handles graceful shutdown

**Code Structure:**

```typescript
import dotenv from "dotenv";
import { app } from "./server";

dotenv.config();

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, closing server...");
  server.close(() => {
    console.log("Server closed");
  });
});
```

---

### `src/server.ts` - Express Configuration

**Purpose:** Configures Express app with middleware and routes

**Middleware Stack:**

1. **CORS** - Allow frontend to call API
2. **JSON Parser** - Parse request bodies
3. **Logger** - Log all requests
4. **Routes** - API endpoints
5. **Error Handler** - Catch all errors

**Code Structure:**

```typescript
import express from "express";
import cors from "cors";
import { routes } from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";

export const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(requestLogger);

// Routes
app.use("/api", routes);

// Error handling (must be last)
app.use(errorHandler);
```

---

## Route Handlers

### `/api/health` - Health Check

**File:** `src/routes/health.ts`

**Purpose:** Verify server is running

**Method:** `GET`

**Authentication:** None

**Request:** None

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-18T12:00:00.000Z",
  "uptime": 3600
}
```

---

### `/api/generate/resume` - Generate Resume

**File:** `src/routes/generate/index.ts`

**Purpose:** AI-powered resume generation

**Method:** `POST`

**Authentication:** Required (JWT)

**Request Body:**

```typescript
{
  templateType: 'chronological' | 'functional' | 'hybrid' | 'creative',
  profile: {
    full_name: string,
    professional_title: string,
    email: string,
    phone?: string,
    summary?: string
  },
  skills: Array<{
    skill_name: string,
    proficiency_level: string,
    skill_category: string
  }>,
  employment: Array<{
    job_title: string,
    company_name: string,
    start_date: string,
    end_date?: string,
    achievements?: string[]
  }>,
  education: Array<{
    institution_name: string,
    degree_type: string,
    field_of_study: string
  }>,
  jobDetails?: {
    job_title: string,
    company_name: string,
    job_description?: string
  },
  options?: {
    tone?: 'professional' | 'casual' | 'enthusiastic',
    length?: 'concise' | 'standard' | 'detailed',
    focusAreas?: string[]
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
    experience: [
      {
        title: string,
        company: string,
        startDate: string,
        endDate: string,
        bullets: string[]
      }
    ],
    education: [...],
    skills: {
      technical: string[],
      soft: string[]
    }
  },
  metadata: {
    model: 'gpt-4',
    tokensUsed: number,
    generationTimeMs: number
  }
}
```

**Processing Steps:**

1. Validate request body
2. Extract user from JWT token
3. Load resume prompt template
4. Inject user data into prompt
5. Call OpenAI API
6. Parse JSON response
7. Save generation session to database
8. Return formatted resume

---

### `/api/generate/cover-letter` - Generate Cover Letter

**File:** `src/routes/generate/index.ts`

**Method:** `POST`

**Authentication:** Required (JWT)

**Request Body:**

```typescript
{
  templateType: 'professional' | 'creative' | 'enthusiastic',
  profile: { ... },
  jobDetails: {
    job_title: string,
    company_name: string,
    job_description?: string,
    hiring_manager_name?: string
  },
  relevantExperience: Array<EmploymentData>,
  relevantSkills: string[],
  options?: {
    tone?: string,
    length?: 'short' | 'medium' | 'long'
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
    body: string[],
    closing: string,
    signature: string
  },
  metadata: { ... }
}
```

---

### `/api/generate/job-match` - Analyze Job Match

**File:** `src/routes/generate/index.ts`

**Method:** `POST`

**Authentication:** Required (JWT)

**Request Body:**

```typescript
{
  profile: { ... },
  skills: [...],
  employment: [...],
  jobDetails: {
    job_title: string,
    job_description: string,
    required_skills?: string[],
    preferred_skills?: string[]
  }
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    matchScore: 85,
    breakdown: {
      skills: {
        score: 90,
        matched: ['JavaScript', 'React'],
        missing: ['GraphQL', 'AWS']
      },
      experience: {
        score: 80,
        relevant: ['3 years React', 'Team leadership']
      },
      education: {
        score: 85,
        requirement: "Bachelor's in CS"
      }
    },
    strengths: [
      'Strong frontend skills',
      'Leadership experience'
    ],
    gaps: [
      'Missing cloud experience',
      'No GraphQL knowledge'
    ],
    recommendations: [
      'Learn AWS basics',
      'Complete GraphQL tutorial'
    ]
  }
}
```

---

### `/api/company/research` - Company Research

**File:** `src/routes/company/index.ts`

**Method:** `POST`

**Authentication:** Required (JWT)

**Request Body:**

```typescript
{
  companyName: string,
  domain?: string
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    name: string,
    description: string,
    industry: string,
    size: string,
    founded: number,
    headquarters: string,
    website: string,
    culture: {
      values: string[],
      benefits: string[],
      workStyle: string
    },
    recentNews: [
      {
        title: string,
        url: string,
        date: string,
        summary: string
      }
    ],
    techStack: string[],
    interviewTips: string[]
  }
}
```

**Data Sources:**

1. Check Supabase `companies` table (cached data)
2. If not found, web scrape company website
3. Call AI to analyze/summarize
4. Cache in database for future requests

---

### `/api/salary/research` - Salary Insights

**File:** `src/routes/salary/index.ts`

**Method:** `POST`

**Authentication:** Required (JWT)

**Request Body:**

```typescript
{
  jobTitle: string,
  location: string,
  experienceLevel?: string
}
```

**Response:**

```typescript
{
  success: true,
  data: {
    range: {
      min: number,
      median: number,
      max: number
    },
    factors: {
      location: string,
      experience: string,
      industry: string
    },
    comparisons: [
      { title: string, range: {...} }
    ],
    insights: string[]
  }
}
```

---

### `/api/artifacts` - AI Artifacts CRUD

**File:** `src/routes/artifacts/index.ts`

**Purpose:** Manage AI-generated artifacts (resumes, cover letters, analyses)

**Endpoints:**

- `GET /api/artifacts` - List all artifacts
- `GET /api/artifacts/:id` - Get single artifact
- `POST /api/artifacts` - Create artifact
- `PUT /api/artifacts/:id` - Update artifact
- `DELETE /api/artifacts/:id` - Delete artifact

**Artifact Types:**

- `resume-draft`
- `cover-letter-draft`
- `job-match-analysis`
- `skills-gap-analysis`
- `interview-prep`

---

### `/api/cover-letter/drafts` - Cover Letter Drafts

**File:** `src/routes/cover-letter/index.ts`

**Purpose:** Manage cover letter drafts with versioning

**Endpoints:**

- `GET /api/cover-letter/drafts` - List drafts
- `POST /api/cover-letter/drafts` - Create draft
- `PUT /api/cover-letter/drafts/:id` - Update draft
- `DELETE /api/cover-letter/drafts/:id` - Delete draft
- `POST /api/cover-letter/drafts/:id/versions` - Create new version

---

## Services Layer

### `src/services/aiClient.ts` - OpenAI Integration

**Purpose:** Wrapper around OpenAI API

**Key Functions:**

#### `generateCompletion(prompt: string, options?: CompletionOptions)`

**Inputs:**

- `prompt` - System prompt with instructions
- `options` - Model, temperature, maxTokens, etc.

**Outputs:**

- Generated text completion

**Code:**

```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCompletion(
  prompt: string,
  options?: CompletionOptions
) {
  const response = await openai.chat.completions.create({
    model: options?.model || "gpt-4",
    messages: [
      {
        role: "system",
        content: prompt,
      },
    ],
    temperature: options?.temperature || 0.7,
    max_tokens: options?.maxTokens || 2000,
    response_format: { type: "json_object" },
  });

  return response.choices[0]?.message?.content;
}
```

#### `generateStructuredOutput(prompt: string, schema: JSONSchema)`

**Inputs:**

- `prompt` - Instructions
- `schema` - Expected JSON structure

**Outputs:**

- JSON object matching schema

**Use Case:** Ensures AI returns valid, parseable data

---

### `src/services/orchestrator.ts` - Generation Orchestration

**Purpose:** Coordinates complex AI generation workflows

**Key Function:** `orchestrateResumeGeneration(input: ResumeInput)`

**Steps:**

1. Validate input data
2. Load appropriate prompt template
3. Inject user data into template
4. Call AI client
5. Parse and validate response
6. Save to database (generation_sessions table)
7. Create document version
8. Return formatted result

**Error Handling:**

- Retry on transient failures
- Fallback to simpler prompts if complex fails
- Log all errors for debugging

---

### `src/services/companyResearchService.ts` - Company Data

**Purpose:** Fetch and cache company information

**Functions:**

#### `researchCompany(companyName: string)`

**Inputs:**

- Company name or domain

**Outputs:**

- Comprehensive company data object

**Data Sources:**

1. **Cache** (Supabase `companies` table)
2. **Web Scraping** (company website, LinkedIn, news)
3. **AI Analysis** (summarize findings)

**Caching Strategy:**

- Cache for 30 days
- Update if data older than 7 days
- Store in `companies` and `companies.research_cache`

---

### `src/services/scraper.ts` - Web Scraping

**Purpose:** Extract data from external websites

**Functions:**

#### `scrapeWebsite(url: string)`

**Inputs:**

- Target URL

**Outputs:**

- Extracted HTML content

**Tools:**

- `axios` for fetching
- `cheerio` for HTML parsing
- Rate limiting to avoid blocking

#### `extractCompanyInfo(html: string)`

**Inputs:**

- HTML content

**Outputs:**

- Structured company data

**Extraction Strategies:**

- Look for `<meta>` tags (description, keywords)
- Parse structured data (JSON-LD, microdata)
- Extract headings and key sections
- Find contact info, social links

---

### `src/services/coverLetterDraftsService.ts` - Cover Letter Management

**Purpose:** CRUD operations for cover letter drafts

**Functions:**

- `createDraft(userId, data)` - Create new draft
- `updateDraft(draftId, data)` - Update existing
- `createVersion(draftId, changes)` - Version control
- `linkToJob(draftId, jobId)` - Associate with job

---

### `src/services/supabaseAdmin.ts` - Admin Database Client

**Purpose:** Server-side Supabase client with admin privileges

**Differences from Frontend Client:**

- Uses service role key (bypasses RLS)
- Can access all users' data (for aggregations, admin tasks)
- Never exposed to frontend

**Use Cases:**

- Seeding data
- Analytics across users
- Admin operations

---

## Prompt System

### Prompt Files

Located in `server/prompts/`, these are TypeScript functions that generate AI prompts:

### `prompts/resume.ts` - Resume Generation

**Function:** `getResumePrompt(input: ResumeInput): string`

**Inputs:**

- Template type
- User profile data
- Skills, experience, education
- Target job (optional)
- Options (tone, length, focus areas)

**Outputs:**

- Complete prompt string for AI

**Prompt Structure:**

```
You are an expert resume writer. Generate a professional resume in JSON format.

## Output Format
{
  "header": { "name": "...", ... },
  "summary": "...",
  "experience": [ ... ],
  "education": [ ... ],
  "skills": { ... }
}

## User Profile
Name: John Doe
Title: Software Engineer
...

## Employment History
**Senior Developer** at Tech Corp
- Led team of 5 engineers
- Increased performance by 40%
...

## Target Job
Title: Staff Engineer
Company: Big Tech
Description: Looking for experienced engineer...

Tailor the resume to emphasize [focus areas].
Use a [tone] tone.
Length: [length]
```

**Prompt Engineering Techniques:**

- Clear output format specification
- Examples of good resume bullets
- Context about target job
- Constraints (length, tone)
- Few-shot examples (show 2-3 sample outputs)

---

### `prompts/coverLetter.ts` - Cover Letter Generation

**Function:** `getCoverLetterPrompt(input: CoverLetterInput): string`

**Prompt Structure:**

```
You are a professional cover letter writer.

Generate a cover letter with these sections:
1. Greeting (Dear [Hiring Manager/Hiring Team])
2. Opening paragraph (grab attention)
3. Body paragraphs (2-3, highlight relevant experience)
4. Closing paragraph (call to action)
5. Signature (Sincerely, [Name])

Return as JSON:
{
  "greeting": "...",
  "opening": "...",
  "body": ["paragraph 1", "paragraph 2"],
  "closing": "...",
  "signature": "..."
}

## Job Details
Title: [job title]
Company: [company name]
Description: [job description]

## Relevant Experience
[Include 2-3 most relevant positions]

## Tone
[professional/enthusiastic/creative]
```

---

### `prompts/skillsOptimization.ts` - Skills Gap Analysis

**Function:** `getSkillsAnalysisPrompt(profile, jobDetails): string`

**Purpose:** Identify missing skills for a job

**Prompt:**

```
Analyze the candidate's skills against the job requirements.

## Candidate Skills
[List user's skills with proficiency levels]

## Job Requirements
Required: [job required_skills]
Preferred: [job preferred_skills]

Return JSON:
{
  "matched": ["skill1", "skill2"],
  "missing": ["skill3", "skill4"],
  "score": 85,
  "recommendations": ["Learn skill3", "Get certified in skill4"]
}
```

---

### `prompts/experienceTailoring.ts` - Experience Optimization

**Function:** `tailorExperience(experience, jobDescription): string`

**Purpose:** Rewrite experience bullets to match job

**Prompt:**

```
You are an expert at tailoring resume bullets to job descriptions.

Rewrite these achievement bullets to highlight skills relevant to the target job.

## Original Bullets
- [original bullet 1]
- [original bullet 2]

## Target Job
[job description]

## Requirements
- Keep bullets concise (1-2 lines)
- Start with action verbs
- Include metrics when possible
- Emphasize skills mentioned in job description

Return JSON:
{
  "optimized_bullets": ["tailored bullet 1", "tailored bullet 2"]
}
```

---

## Middleware

### `src/middleware/auth.ts` - Authentication

**Purpose:** Verify JWT tokens from Supabase

**Function:** `requireAuth(req, res, next)`

**Process:**

1. Extract token from `Authorization: Bearer <token>` header
2. Verify token with Supabase
3. Attach user to `req.user`
4. Call `next()` to proceed
5. If invalid, return 401 Unauthorized

**Code:**

```typescript
import { supabase } from "../services/supabase";

export async function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error("Invalid token");
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "Unauthorized" });
  }
}
```

---

### `src/middleware/errorHandler.ts` - Global Error Handler

**Purpose:** Catch all errors and return consistent responses

**Function:** `errorHandler(err, req, res, next)`

**Error Types Handled:**

- **ValidationError** → 400 Bad Request
- **AuthenticationError** → 401 Unauthorized
- **NotFoundError** → 404 Not Found
- **RateLimitError** → 429 Too Many Requests
- **InternalError** → 500 Internal Server Error

**Code:**

```typescript
export function errorHandler(err, req, res, next) {
  console.error("[Error]", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // OpenAI rate limit
  if (err.response?.status === 429) {
    return res.status(429).json({
      error: "Rate limit exceeded. Please try again later.",
      code: "RATE_LIMIT",
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

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Logging
LOG_LEVEL=info
```

---

This covers the server's structure, endpoints, services, prompts, and middleware in technical depth.
