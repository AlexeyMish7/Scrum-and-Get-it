# Server Refactor Plan

**Date**: November 9, 2025
**Goal**: Transform flat server structure into organized, maintainable architecture
**Duration Estimate**: 12-16 hours over 3-4 sessions
**Risk Level**: Medium-High (touching 1,315-line index.ts)

---

## Executive Summary

### Current Problems

1. **Flat structure**: Critical files at root instead of `src/`
2. **Mega-file**: `src/index.ts` is 1,315 lines (routes + middleware + config)
3. **Import chaos**: Root-level imports require `../` paths from `src/`
4. **Platform lock-in**: PowerShell scripts prevent cross-platform dev
5. **Test duplication**: Multiple files testing same functionality

### Refactor Goals

1. ✅ Organize into `services/`, `routes/`, `middleware/`, `types/`
2. ✅ Split mega `index.ts` into focused route handlers
3. ✅ Create barrel exports for clean imports
4. ✅ Replace PowerShell with Node.js scripts
5. ✅ Remove duplicate test files
6. ✅ All changes backward-compatible (no API changes)

### Success Criteria

- `npm run build` passes
- `npm run dev` starts without errors
- All smoke tests pass
- No breaking changes to API contracts
- Import paths simplified (barrel exports)

---

## Phase 1: Foundation & Quick Wins (3-4 hours)

**Risk Level**: Low
**Goal**: Prepare structure, add tooling, delete duplicates

### 1.1 Create Directory Structure

```bash
# From server/ directory
mkdir -p src/routes
mkdir -p src/middleware
mkdir -p src/services/supabase
mkdir -p src/services/orchestrator
mkdir -p src/services/ai
mkdir -p src/types
mkdir -p docs
```

**Verification**: `ls -la src/` shows new folders

---

### 1.2 Add Barrel Exports (Utilities & Prompts)

**Create**: `src/utils/index.ts`

```typescript
/**
 * Utilities barrel export
 * Centralizes imports for auth, errors, logging, rate limiting
 */
export * from "./auth.js";
export * from "./errors.js";
export * from "./logger.js";
export * from "./rateLimiter.js";
```

**Create**: `src/prompts/index.ts`

```typescript
/**
 * Prompt templates barrel export
 */
export { buildResumePrompt } from "./resume.js";
export { buildCoverLetterPrompt } from "./coverLetter.js";
export { buildSkillsOptimizationPrompt } from "./skillsOptimization.js";
export { buildExperienceTailoringPrompt } from "./experienceTailoring.js";
```

**Verification**:

```bash
npm run build
# Should compile without errors
```

---

### 1.3 Delete Duplicate Test Files

**Remove**:

```bash
git rm tests/auth-standalone.js
# Keep tests/auth-unit.mjs (ES module version)
```

**Decision**: Keep both `migration-checker.mjs` and `simple-migration-check.mjs` for now
(Different purposes: full vs quick check)

**Commit**:

```bash
git add .
git commit -m "refactor(server): add barrel exports, remove auth test duplicate"
```

---

### 1.4 Replace PowerShell Scripts

#### A. Add npm scripts (package.json)

```json
{
  "scripts": {
    "dev": "node --loader ts-node/esm src/index.ts",
    "dev:mock": "FAKE_AI=true node --loader ts-node/esm src/index.ts",
    "build": "tsc",
    "smoke": "node tests/simple-smoke.mjs",
    "smoke:full": "node --loader ts-node/esm tests/smoke.ts",
    "test:auth": "node tests/auth-unit.mjs",
    "test:migrations": "node tests/migration-checker.mjs",
    "check:supabase": "node scripts/check-supabase.mjs"
  }
}
```

#### B. Create Node.js replacement for generate-resume.ps1

**Create**: `scripts/generate-resume.mjs`

```javascript
#!/usr/bin/env node
/**
 * Generate resume via API (replaces generate-resume.ps1)
 * Usage: node scripts/generate-resume.mjs [jobId] [userId]
 */
import http from "http";

const jobId = process.argv[2] || 1;
const userId = process.argv[3] || "test-user-id";
const port = process.env.PORT || 3001;

const payload = JSON.stringify({
  userId,
  jobId: parseInt(jobId, 10),
  options: { tone: "professional", focus: "skills" },
});

const options = {
  hostname: "localhost",
  port,
  path: "/api/generate/resume",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "X-User-Id": userId,
  },
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => (data += chunk));
  res.on("end", () => {
    console.log(`Status: ${res.statusCode}`);
    console.log("Response:", JSON.parse(data));
  });
});

req.on("error", (err) => {
  console.error("Request failed:", err.message);
  process.exit(1);
});

req.write(payload);
req.end();
```

**Make executable**:

```bash
chmod +x scripts/generate-resume.mjs
```

**Archive old scripts**:

```bash
mkdir -p scripts/archive
git mv scripts/*.ps1 scripts/archive/
```

**Commit**:

```bash
git add .
git commit -m "refactor(server): replace PowerShell scripts with Node.js"
```

---

## Phase 2: Move Root-Level Files to src/ (4-5 hours)

**Risk Level**: Medium
**Goal**: Relocate orchestrator, aiClient, supabaseAdmin, types into organized folders

### 2.1 Move & Split types.ts

**Create**: `src/types/requests.ts`

```typescript
/**
 * API Request Types
 * Defines input contracts for all generation endpoints
 */

export interface GenerateResumeRequest {
  userId: string;
  jobId: number;
  options?: {
    tone?: "professional" | "casual" | "enthusiastic";
    focus?: "skills" | "experience" | "education";
    length?: "brief" | "standard" | "detailed";
  };
}

export interface GenerateCoverLetterRequest {
  userId: string;
  jobId: number;
  options?: {
    tone?: "professional" | "casual" | "enthusiastic";
    companyResearch?: boolean;
  };
}

export interface GenerateSkillsOptimizationRequest {
  userId: string;
  jobId: number;
  options?: {
    emphasis?: "technical" | "soft" | "both";
  };
}

export interface GenerateExperienceTailoringRequest {
  userId: string;
  jobId: number;
  experienceIds?: string[];
}
```

**Create**: `src/types/artifacts.ts`

```typescript
/**
 * Artifact & Database Types
 * Defines AI artifact structure and DB row schemas
 */

export interface ArtifactRow {
  id: string;
  user_id: string;
  job_id?: number | null;
  kind:
    | "resume"
    | "cover_letter"
    | "skills_optimization"
    | "experience_tailoring"
    | "company_research"
    | "match"
    | "gap_analysis";
  title?: string | null;
  prompt?: string | null;
  model?: string | null;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ResumeArtifactContent {
  summary?: string;
  ordered_skills?: string[];
  emphasize_skills?: string[];
  add_skills?: string[];
  sections?: {
    experience?: Array<{
      role: string;
      company?: string;
      dates?: string;
      bullets: string[];
    }>;
    education?: Array<{
      institution: string;
      degree?: string;
      graduation_date?: string;
      details?: string[];
    }>;
    projects?: Array<{
      name: string;
      role?: string;
      bullets?: string[];
    }>;
  };
  ats_keywords?: string[];
  meta?: Record<string, unknown>;
}
```

**Create**: `src/types/database.ts`

```typescript
/**
 * Supabase Database Schema Types
 * Auto-generated or manually maintained schema types
 */

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          email: string;
          // ... full schema
        };
      };
      jobs: {
        Row: {
          id: number;
          user_id: string;
          job_title: string;
          // ... full schema
        };
      };
      ai_artifacts: {
        Row: {
          id: string;
          user_id: string;
          // ... full schema
        };
      };
      // ... other tables
    };
  };
};
```

**Create**: `src/types/index.ts` (barrel)

```typescript
/**
 * Types barrel export
 */
export * from "./requests.js";
export * from "./artifacts.js";
export * from "./database.js";
```

**Update imports in src/index.ts**:

```typescript
// Before:
import type { GenerateResumeRequest } from "../types.js";

// After:
import type { GenerateResumeRequest } from "./types/index.js";
```

**Delete old file**:

```bash
git rm types.ts
```

**Commit**:

```bash
git add src/types/
git commit -m "refactor(server): move and split types.ts into src/types/"
```

---

### 2.2 Move supabaseAdmin.ts → src/services/supabase/

**Create**: `src/services/supabase/client.ts`

```typescript
/**
 * Supabase Admin Client
 * Service role client with elevated permissions
 *
 * SECURITY: Never expose service role key to client-side code
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../types/database.js";
import { logInfo, logError } from "../../utils/logger.js";

let supabaseClient: SupabaseClient<Database> | null = null;

/**
 * getSupabaseClient
 * Lazy initialization to avoid startup crash when env vars missing
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    logError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    throw new Error("Supabase configuration incomplete");
  }

  supabaseClient = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  logInfo("Supabase admin client initialized");
  return supabaseClient;
}

export default getSupabaseClient;
```

**Create**: `src/services/supabase/helpers.ts`

```typescript
/**
 * Supabase Query Helpers
 * Typed helper functions for common DB operations
 */
import { getSupabaseClient } from "./client.js";
import type { Database } from "../../types/database.js";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Skill = Database["public"]["Tables"]["skills"]["Row"];
// ... other types

/**
 * getProfile
 * Fetch user profile with enriched data (skills, employment, education, etc.)
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
}

/**
 * getJob
 * Fetch job details by ID
 */
export async function getJob(jobId: number): Promise<Job | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch job: ${error.message}`);
  }

  return data;
}

/**
 * getUserSkills
 * Fetch all skills for a user
 */
export async function getUserSkills(userId: string): Promise<Skill[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to fetch skills: ${error.message}`);
  }

  return data || [];
}

// Add more helpers as needed: getEmployment, getEducation, etc.
```

**Create**: `src/services/supabase/index.ts` (barrel)

```typescript
export { getSupabaseClient, default } from "./client.js";
export * from "./helpers.js";
```

**Update imports**:

```typescript
// Before (in orchestrator.ts):
const mod = await import("./supabaseAdmin.js");
const supabase = mod.default;

// After:
import {
  getSupabaseClient,
  getProfile,
  getJob,
} from "./services/supabase/index.js";
const supabase = getSupabaseClient();
```

**Delete old file**:

```bash
git rm supabaseAdmin.ts
```

**Commit**:

```bash
git add src/services/supabase/
git commit -m "refactor(server): move supabaseAdmin to src/services/supabase/"
```

---

### 2.3 Move aiClient.ts → src/services/ai/

**Create**: `src/services/ai/client.ts`

```typescript
/**
 * AI Client
 * Abstract AI provider interactions (OpenAI, Azure, mock)
 *
 * FLOW:
 *  1. Select provider based on env config
 *  2. Normalize request format
 *  3. Call provider API
 *  4. Parse and normalize response
 *  5. Return GenerateResult
 */
import { logInfo, logError } from "../../utils/logger.js";

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
}

export interface GenerateResult {
  text?: string;
  json?: Record<string, unknown>;
  raw?: unknown;
  tokens?: { prompt: number; completion: number; total: number };
  meta?: Record<string, unknown>;
}

// ... rest of aiClient.ts content (copy from original file)
```

**Create**: `src/services/ai/index.ts` (barrel)

```typescript
export { default } from "./client.js";
export type { GenerateOptions, GenerateResult } from "./client.js";
```

**Update imports**:

```typescript
// Before:
import aiClient from "./aiClient.js";

// After:
import aiClient from "./services/ai/index.js";
```

**Delete old file**:

```bash
git rm aiClient.ts
```

**Commit**:

```bash
git add src/services/ai/
git commit -m "refactor(server): move aiClient to src/services/ai/"
```

---

### 2.4 Move & Split orchestrator.ts → src/services/orchestrator/

**Strategy**: Keep main file initially, split later in Phase 3

**Create**: `src/services/orchestrator/index.ts`

```typescript
/**
 * AI Generation Orchestrator
 * Coordinates AI content generation workflows
 *
 * RESPONSIBILITIES:
 *  - Validate requests
 *  - Fetch user profile + job data from Supabase
 *  - Build prompts using templates
 *  - Call AI client
 *  - Sanitize AI output
 *  - Persist artifacts to database
 */
// Copy content from orchestrator.ts, update imports
import { getSupabaseClient, getProfile, getJob } from "../supabase/index.js";
import aiClient from "../ai/index.js";
import {
  buildResumePrompt,
  buildCoverLetterPrompt,
} from "../../prompts/index.js";
import { logInfo, logError } from "../../utils/logger.js";
import type { GenerateResumeRequest, ArtifactRow } from "../../types/index.js";

// ... rest of orchestrator logic
```

**Update imports in src/index.ts**:

```typescript
// Before:
import orchestrator from "../orchestrator.js";

// After:
import orchestrator from "./services/orchestrator/index.js";
```

**Delete old file**:

```bash
git rm orchestrator.ts
```

**Commit**:

```bash
git add src/services/orchestrator/
git commit -m "refactor(server): move orchestrator to src/services/orchestrator/"
```

---

## Phase 3: Split Mega index.ts into Routes (5-6 hours)

**Risk Level**: High
**Goal**: Extract route handlers from 1,315-line index.ts

### 3.1 Create Middleware Layer

**Create**: `src/middleware/cors.ts`

```typescript
/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing for API
 */
import type { IncomingMessage, ServerResponse } from "http";
import { logInfo } from "../utils/logger.js";

const ALLOWED_ORIGINS = [
  "http://localhost:5173", // Vite dev
  "http://localhost:3000", // Alt dev port
  process.env.FRONTEND_URL,
].filter(Boolean);

export function handleCors(req: IncomingMessage, res: ServerResponse): boolean {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-User-Id"
    );
  }

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true; // Handled
  }

  return false; // Continue processing
}
```

**Create**: `src/middleware/logging.ts`

```typescript
/**
 * Request Logging Middleware
 * Logs all incoming requests and responses
 */
import type { IncomingMessage, ServerResponse } from "http";
import { createRequestLogger } from "../utils/logger.js";

export function logRequest(req: IncomingMessage, res: ServerResponse): void {
  const logger = createRequestLogger(req);
  logger.requestStart();

  res.on("finish", () => {
    logger.requestEnd({ statusCode: res.statusCode });
  });
}
```

**Create**: `src/middleware/auth.ts`

```typescript
/**
 * Auth Middleware
 * Extracts and validates user authentication
 */
import type { IncomingMessage } from "http";
import { extractUserId } from "../utils/auth.js";
import { ApiError } from "../utils/errors.js";

export async function requireAuth(req: IncomingMessage): Promise<string> {
  try {
    const userId = await extractUserId(req);
    if (!userId) {
      throw new ApiError(401, "Authentication required", "AUTH_REQUIRED");
    }
    return userId;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, "Invalid authentication", "AUTH_INVALID");
  }
}
```

**Create**: `src/middleware/index.ts` (barrel)

```typescript
export { handleCors } from "./cors.js";
export { logRequest } from "./logging.js";
export { requireAuth } from "./auth.js";
```

---

### 3.2 Create Route Handlers

**Create**: `src/routes/health.ts`

```typescript
/**
 * Health Check Route
 * GET /api/health
 *
 * Returns server status and configuration info
 */
import type { IncomingMessage, ServerResponse } from "http";
import { logInfo } from "../utils/logger.js";

export async function handleHealthCheck(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || "development",
      port: process.env.PORT || 3001,
      fakeAi: process.env.FAKE_AI === "true",
      supabaseConfigured: !!(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ),
    },
  };

  logInfo("Health check requested", health);

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(health));
}
```

**Create**: `src/routes/ai.ts`

```typescript
/**
 * AI Generation Routes
 * POST /api/generate/resume
 * POST /api/generate/cover-letter
 * POST /api/generate/skills-optimization
 * POST /api/generate/experience-tailoring
 */
import type { IncomingMessage, ServerResponse } from "http";
import { requireAuth } from "../middleware/auth.js";
import { checkLimit } from "../utils/rateLimiter.js";
import { ApiError, errorPayload } from "../utils/errors.js";
import orchestrator from "../services/orchestrator/index.js";
import { logInfo, logError } from "../utils/logger.js";

/**
 * parseJsonBody
 * Helper to read and parse JSON request body
 */
async function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new ApiError(400, "Invalid JSON", "INVALID_JSON"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * POST /api/generate/resume
 */
export async function handleGenerateResume(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  try {
    const userId = await requireAuth(req);

    if (!checkLimit(userId)) {
      throw new ApiError(429, "Rate limit exceeded", "RATE_LIMIT");
    }

    const body = await parseJsonBody(req);
    const { jobId, options } = body;

    if (!jobId || typeof jobId !== "number") {
      throw new ApiError(400, "jobId is required", "MISSING_JOB_ID");
    }

    logInfo("Generate resume request", { userId, jobId, options });

    const result = await orchestrator.handleGenerateResume({
      userId,
      jobId,
      options,
    });

    if (result.error) {
      throw new ApiError(500, result.error, "GENERATION_FAILED");
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ artifact: result.artifact }));
  } catch (err) {
    logError("Resume generation failed", { error: err });
    const payload = errorPayload(err);
    const status = err instanceof ApiError ? err.status : 500;
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  }
}

/**
 * POST /api/generate/cover-letter
 */
export async function handleGenerateCoverLetter(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  // Similar pattern to handleGenerateResume
  // ... implementation
}

// Export route handlers
export default {
  handleGenerateResume,
  handleGenerateCoverLetter,
  // ... other handlers
};
```

**Create**: `src/routes/artifacts.ts`

```typescript
/**
 * Artifacts Routes
 * GET /api/artifacts/:userId
 * GET /api/artifacts/:userId/:artifactId
 */
import type { IncomingMessage, ServerResponse } from "http";
import { requireAuth } from "../middleware/auth.js";
import { getSupabaseClient } from "../services/supabase/index.js";
import { ApiError, errorPayload } from "../utils/errors.js";

export async function handleListArtifacts(
  req: IncomingMessage,
  res: ServerResponse,
  userId: string
): Promise<void> {
  try {
    await requireAuth(req); // Verify auth

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("ai_artifacts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new ApiError(500, error.message, "DB_ERROR");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ artifacts: data }));
  } catch (err) {
    const payload = errorPayload(err);
    const status = err instanceof ApiError ? err.status : 500;
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  }
}

// ... other artifact handlers
```

**Create**: `src/routes/index.ts` (barrel)

```typescript
export * from "./health.js";
export * from "./ai.js";
export * from "./artifacts.js";
```

---

### 3.3 Create New index.ts (Router)

**Create**: `src/server.ts` (new HTTP server setup)

```typescript
/**
 * HTTP Server Setup
 * Creates server with middleware chain and route dispatch
 */
import http from "http";
import { URL } from "url";
import { handleCors, logRequest } from "./middleware/index.js";
import { handleHealthCheck } from "./routes/health.js";
import {
  handleGenerateResume,
  handleGenerateCoverLetter,
} from "./routes/ai.js";
import { handleListArtifacts } from "./routes/artifacts.js";
import { logInfo, logError } from "./utils/logger.js";
import { errorPayload } from "./utils/errors.js";

/**
 * createServer
 * Build HTTP server with routing and middleware
 */
export function createServer(): http.Server {
  return http.createServer(async (req, res) => {
    // CORS handling
    if (handleCors(req, res)) return;

    // Request logging
    logRequest(req, res);

    try {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      const { pathname, searchParams } = url;

      // Route dispatch
      if (pathname === "/api/health" && req.method === "GET") {
        return await handleHealthCheck(req, res);
      }

      if (pathname === "/api/generate/resume" && req.method === "POST") {
        return await handleGenerateResume(req, res);
      }

      if (pathname === "/api/generate/cover-letter" && req.method === "POST") {
        return await handleGenerateCoverLetter(req, res);
      }

      // ... other routes

      // 404 Not Found
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not Found" }));
    } catch (err) {
      logError("Unhandled request error", { error: err });
      const payload = errorPayload(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify(payload));
    }
  });
}
```

**Simplify**: `src/index.ts` (new entry point)

```typescript
/**
 * Server Entry Point
 * Loads environment, validates config, starts HTTP server
 */
import fs from "fs";
import path from "path";
import { createServer } from "./server.js";
import { logInfo, logError, logConfigEvent } from "./utils/logger.js";

// Load environment variables
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim();
      }
    });
    logInfo("Loaded .env file", { path: envPath });
  }
}

// Validate required config
function validateConfig() {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logError("Missing required environment variables", { missing });
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }

  logConfigEvent({
    nodeEnv: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3001,
    fakeAi: process.env.FAKE_AI === "true",
  });
}

// Start server
async function main() {
  try {
    loadEnv();
    validateConfig();

    const server = createServer();
    const port = parseInt(process.env.PORT || "3001", 10);

    server.listen(port, () => {
      logInfo(`Server listening on http://localhost:${port}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logInfo("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logInfo("Server closed");
        process.exit(0);
      });
    });
  } catch (err) {
    logError("Failed to start server", { error: err });
    process.exit(1);
  }
}

main();
```

**Commit**:

```bash
git add src/
git commit -m "refactor(server): split index.ts into routes, middleware, server"
```

---

## Phase 4: Testing & Validation (2-3 hours)

### 4.1 Run Build

```bash
npm run build
```

**Expected**: Clean build with no TypeScript errors

---

### 4.2 Run Smoke Tests

```bash
# Start server
npm run dev

# In another terminal:
npm run smoke
npm run smoke:full
```

**Expected**: All tests pass

---

### 4.3 Manual API Testing

```bash
# Health check
curl http://localhost:3001/api/health

# Generate resume (requires valid env)
node scripts/generate-resume.mjs 1 test-user-id
```

**Expected**: Valid JSON responses

---

### 4.4 Update Documentation

**Move**:

```bash
git mv README_AI_ORCHESTRATOR.md docs/AI_ORCHESTRATOR.md
git mv README_ENV.md docs/ENVIRONMENT.md
```

**Update**: `docs/AI_ORCHESTRATOR.md` with new import paths

**Update**: `docs/ENVIRONMENT.md` with npm scripts

**Create**: `server/README.md` (main server README)

````markdown
# ATS Tracker Server

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Run in development
npm run dev

# Run with mock AI
npm run dev:mock

# Build for production
npm run build

# Run tests
npm run smoke
npm test:auth
```
````

## Project Structure

See [docs/ENVIRONMENT.md](./docs/ENVIRONMENT.md) for detailed configuration.
See [docs/AI_ORCHESTRATOR.md](./docs/AI_ORCHESTRATOR.md) for AI generation architecture.

````

**Commit**:
```bash
git add docs/ README.md
git commit -m "docs(server): update documentation for new structure"
````

---

## Rollback Plan

### Pre-Refactor Tag

```bash
git tag refactor-server-pre-$(date +%Y%m%d%H%M)
git push origin --tags
```

### Revert Steps

If issues arise during refactor:

```bash
# Find the pre-refactor tag
git tag -l "refactor-server-pre-*"

# Revert to that tag
git reset --hard <tag-name>

# Or revert specific commits
git revert <commit-hash>
```

### Safety Checks Before Each Phase

- [ ] Run `npm run build` (baseline)
- [ ] Run `npm run smoke` (baseline)
- [ ] Commit with clear message
- [ ] Tag major milestones

---

## Migration Scripts

### Update Imports Script (Optional)

If needed, create a script to batch-update imports:

**Create**: `scripts/update-imports.mjs`

```javascript
#!/usr/bin/env node
/**
 * Update imports after file moves
 * Usage: node scripts/update-imports.mjs
 */
import fs from "fs";
import path from "path";
import { glob } from "glob";

const replacements = [
  { from: 'from "../types.js"', to: 'from "./types/index.js"' },
  {
    from: 'from "../orchestrator.js"',
    to: 'from "./services/orchestrator/index.js"',
  },
  { from: 'from "./aiClient.js"', to: 'from "./services/ai/index.js"' },
  // ... add more
];

const files = await glob("src/**/*.ts");

for (const file of files) {
  let content = fs.readFileSync(file, "utf-8");
  let changed = false;

  for (const { from, to } of replacements) {
    if (content.includes(from)) {
      content = content.replaceAll(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, "utf-8");
    console.log(`Updated: ${file}`);
  }
}

console.log("Import update complete");
```

---

## Success Metrics

After completing all phases:

- [ ] ✅ `npm run build` passes
- [ ] ✅ `npm run dev` starts without errors
- [ ] ✅ `npm run smoke` passes
- [ ] ✅ All PowerShell scripts replaced or archived
- [ ] ✅ No duplicate test files
- [ ] ✅ Barrel exports in all utility folders
- [ ] ✅ Root-level files moved to `src/`
- [ ] ✅ `src/index.ts` reduced from 1,315 to <200 lines
- [ ] ✅ Documentation updated

---

## Timeline Estimate

| Phase     | Description             | Time            | Risk   |
| --------- | ----------------------- | --------------- | ------ |
| 1         | Foundation & Quick Wins | 3-4 hours       | Low    |
| 2         | Move Root-Level Files   | 4-5 hours       | Medium |
| 3         | Split Mega index.ts     | 5-6 hours       | High   |
| 4         | Testing & Validation    | 2-3 hours       | Low    |
| **Total** |                         | **14-18 hours** |        |

**Recommended approach**:

- Session 1 (4h): Phase 1 complete
- Session 2 (5h): Phase 2 complete
- Session 3 (6h): Phase 3 complete
- Session 4 (3h): Phase 4 complete + buffer

---

**End of Server Refactor Plan**
