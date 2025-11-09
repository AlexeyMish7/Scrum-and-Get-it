# Server Inventory & Analysis

**Date**: November 9, 2025
**Purpose**: Map server file structure, identify responsibilities, flag issues, and prepare for refactoring

---

## Executive Summary

### Critical Findings

1. **Flat file structure**: Most critical files at root level (orchestrator, aiClient, supabaseAdmin, types) instead of organized folders
2. **Mixed concerns in index.ts**: 1,315 lines combining HTTP handling, route dispatch, env loading, config validation, and business logic
3. **Inconsistent test organization**: Mix of `.ts`, `.mjs`, `.js` test files with overlapping purposes
4. **PowerShell scripts in production**: Dev scripts (`.ps1`) should be node/bash for cross-platform compatibility
5. **No route separation**: All endpoints in single `src/index.ts` file

### Recommendation Priority

1. **High**: Separate routes into `src/routes/` folder
2. **High**: Move orchestrator, aiClient, supabaseAdmin into `src/services/`
3. **Medium**: Consolidate test files and remove duplicates
4. **Medium**: Replace PowerShell scripts with Node.js equivalents
5. **Low**: Add barrel exports for utilities and prompts

---

## 1. Server Structure Analysis

### Current Layout

```
server/
├── .env.example                    # Environment template
├── .env.test                       # Test environment config
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # Main TypeScript config
├── tsconfig.dev.json               # Dev-specific TS config
├── types.ts                        # Shared type definitions (ROOT LEVEL!)
├── aiClient.ts                     # AI provider abstraction (ROOT LEVEL!)
├── orchestrator.ts                 # Business logic coordinator (ROOT LEVEL!)
├── supabaseAdmin.ts                # Supabase service role client (ROOT LEVEL!)
├── README_AI_ORCHESTRATOR.md       # Orchestrator documentation
├── README_ENV.md                   # Environment variable guide
├── src/
│   └── index.ts                    # HTTP server + all routes (1,315 lines!)
├── utils/                          # Utilities (4 files)
│   ├── auth.ts                     # JWT verification
│   ├── errors.ts                   # Error types and helpers
│   ├── logger.ts                   # Structured logging
│   └── rateLimiter.ts              # In-memory rate limiting
├── prompts/                        # AI prompt templates (4 files + README)
│   ├── README.md
│   ├── resume.ts
│   ├── coverLetter.ts
│   ├── skillsOptimization.ts
│   └── experienceTailoring.ts
├── scripts/                        # Dev/test scripts (4 files)
│   ├── check-supabase.mjs          # Supabase connectivity test
│   ├── generate-resume.ps1         # PowerShell test script
│   ├── run-smoke-tests.ps1         # PowerShell test runner
│   └── start-mock-server.ps1       # PowerShell mock server
└── tests/                          # Test files (7 files)
    ├── smoke.ts                    # End-to-end smoke test (TypeScript)
    ├── simple-smoke.mjs            # Lightweight smoke test (ES module)
    ├── auth-standalone.js          # Auth unit test (CommonJS)
    ├── auth-unit.mjs               # Auth unit test (ES module)
    ├── migration-checker.mjs       # DB migration validator
    ├── simple-migration-check.mjs  # Simplified migration check
    └── schema-verifier.mjs         # Schema verification
```

---

## 2. File-by-File Analysis

### 2.1 Entry Point & HTTP Layer

#### `src/index.ts` (1,315 lines) ⚠️

**Purpose**: HTTP server, route dispatch, middleware, environment loading

**Responsibilities** (too many!):

- Environment variable loading from `.env` files
- Configuration validation and logging
- HTTP server creation and request parsing
- CORS handling
- Route dispatch for all endpoints
- Request logging (start/end)
- Error handling and response formatting
- Health check endpoint logic
- Resume generation endpoint logic
- Cover letter endpoint logic
- Skills optimization endpoint logic
- Experience tailoring endpoint logic
- Artifact listing endpoint logic
- Job materials endpoint logic
- Rate limiting integration
- Auth token extraction

**Dependencies**:

```typescript
import http from "http";
import { URL } from "url";
import fs from "fs";
import path from "path";
import orchestrator from "../orchestrator.js";
import {
  createRequestLogger,
  logSystemEvent,
  logConfigEvent /* ... */,
} from "../utils/logger.js";
import { ApiError, errorPayload } from "../utils/errors.js";
import { checkLimit } from "../utils/rateLimiter.js";
import { extractUserId } from "../utils/auth.js";
```

**Issues**:

1. Violates single responsibility principle (SRP)
2. Hard to test individual endpoints
3. Difficult to add new routes (must edit massive file)
4. No route-level middleware support
5. Manual URL parsing for every endpoint
6. Endpoint logic mixed with HTTP plumbing

**Refactor Target**: Split into:

- `src/server.ts` — HTTP server creation + middleware chain
- `src/routes/health.ts` — Health check endpoint
- `src/routes/ai.ts` — AI generation endpoints (resume, cover letter, etc.)
- `src/routes/artifacts.ts` — Artifact listing/retrieval
- `src/routes/materials.ts` — Job materials endpoints
- `src/middleware/cors.ts` — CORS handler
- `src/middleware/auth.ts` — Auth middleware
- `src/middleware/logging.ts` — Request logging middleware

---

### 2.2 Business Logic Layer

#### `orchestrator.ts` (683 lines)

**Purpose**: Coordinate AI generation workflows

**Responsibilities**:

- Validate incoming requests
- Fetch user profiles from Supabase
- Fetch job details from Supabase
- Enrich profile with skills/employment/education/projects/certifications
- Build prompts using prompt templates
- Call AI client to generate content
- Sanitize AI output (normalize arrays, clean strings)
- Insert artifacts into `ai_artifacts` table
- Return artifact rows to caller

**Public API**:

```typescript
export async function handleGenerateResume(
  req: GenerateResumeRequest
): Promise<{ artifact?: ArtifactRow; error?: string }>;
export async function handleGenerateCoverLetter(
  req: GenerateCoverLetterRequest
): Promise<{ artifact?: ArtifactRow; error?: string }>;
export async function handleGenerateSkillsOptimization(
  req: GenerateSkillsOptimizationRequest
): Promise<{ artifact?: ArtifactRow; error?: string }>;
export async function handleGenerateExperienceTailoring(
  req: any
): Promise<{ artifact?: ArtifactRow; error?: string }>;
export default {
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleGenerateSkillsOptimization,
  handleGenerateExperienceTailoring,
};
```

**Dependencies**:

```typescript
import type { GenerateResult } from "./aiClient.js";
import aiClient from "./aiClient.js";
import { logError, logInfo } from "./utils/logger.js";
import { buildResumePrompt } from "./prompts/resume.ts";
import { buildCoverLetterPrompt } from "./prompts/coverLetter.ts";
import { buildSkillsOptimizationPrompt } from "./prompts/skillsOptimization.ts";
import { buildExperienceTailoringPrompt } from "./prompts/experienceTailoring.ts";
import type {
  GenerateResumeRequest,
  GenerateCoverLetterRequest,
  GenerateSkillsOptimizationRequest,
  ArtifactRow,
} from "./types.js";
// Dynamic import: "./supabaseAdmin.js" (to avoid crashing when env missing)
```

**Issues**:

1. Lazy imports (`await import("./supabaseAdmin.js")`) make testing harder
2. Repeats Supabase fetch logic across all 4 handlers
3. Sanitization logic embedded in each handler (code duplication)
4. Error handling inconsistent (some return `{ error }`, some throw)
5. No retry/backoff for transient AI errors
6. No telemetry or metrics for success/failure rates

**Refactor Target**: Split into:

- `src/services/orchestrator/resumeOrchestrator.ts` — Resume-specific logic
- `src/services/orchestrator/coverLetterOrchestrator.ts` — Cover letter logic
- `src/services/orchestrator/shared.ts` — Shared helpers (fetch profile, sanitize, persist)
- Add proper error handling and retry logic

---

#### `aiClient.ts` (250 lines)

**Purpose**: Abstract AI provider interactions

**Responsibilities**:

- Select AI provider (OpenAI, Azure, mock)
- Normalize requests across providers
- Handle mock mode for local development
- Retry transient errors
- Return normalized `GenerateResult`

**Public API**:

```typescript
export interface GenerateOptions {
  model?;
  maxTokens?;
  temperature?;
  stream?;
  timeoutMs?;
  maxRetries?;
}
export interface GenerateResult {
  text?;
  json?;
  raw?;
  tokens?;
  meta?;
}
export default {
  generate: (kind: string, prompt: string, opts?: GenerateOptions) =>
    Promise<GenerateResult>,
};
```

**Dependencies**:

```typescript
import { logError, logInfo } from "./utils/logger.js";
// Dynamic import: "openai" (lazy to avoid crash when AI_API_KEY missing)
```

**Issues**:

1. Mock responses are static JSON (no variation for testing)
2. No structured error types (returns generic strings)
3. Retry logic not implemented (maxRetries option ignored)
4. Timeout not enforced (timeoutMs option ignored)
5. Streaming not supported

**Refactor Target**:

- Keep as-is but implement missing features (retries, timeout)
- Add structured error types from `utils/errors.ts`
- Optionally split into `src/services/ai/providers/` (openai.ts, azure.ts, mock.ts)

---

#### `supabaseAdmin.ts` (varies)

**Purpose**: Supabase admin client + helper functions

**Responsibilities**:

- Create Supabase client with service role key
- Provide helpers: `getProfile`, `getJob`, `listJobs`, etc.

**Public API**:

```typescript
export default supabaseClient; // SupabaseClient instance
export async function getProfile(userId: string): Promise<any>;
export async function getJob(jobId: number): Promise<any>;
// ... other helpers
```

**Dependencies**:

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
```

**Issues**:

1. Throws if `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing (crashes module load)
2. Helper functions lack type safety (`Promise<any>`)
3. No query result validation (returns raw Supabase response)
4. No caching or memoization for repeated queries

**Refactor Target**:

- Move to `src/services/supabase/client.ts`
- Add `src/services/supabase/helpers.ts` for typed helper functions
- Implement lazy client initialization to avoid startup crash

---

### 2.3 Utilities

#### `utils/auth.ts`

**Purpose**: JWT verification and user ID extraction

**Public API**:

```typescript
export async function verifyAuthToken(
  token: string
): Promise<{ userId: string } | null>;
export async function extractUserId(req: http.IncomingMessage): Promise<string>;
```

**Dependencies**:

```typescript
import { createClient } from "@supabase/supabase-js";
```

**Status**: ✅ Well-designed, minimal issues

---

#### `utils/errors.ts`

**Purpose**: Error types and response helpers

**Public API**:

```typescript
export class ApiError extends Error {
  status: number;
  code?: string;
}
export function errorPayload(err: unknown): { error: string; code?: string };
```

**Status**: ✅ Well-designed, minimal issues

---

#### `utils/logger.ts`

**Purpose**: Structured logging with request context

**Public API**:

```typescript
export function createRequestLogger(req: http.IncomingMessage): RequestLogger;
export class RequestLogger { requestStart(), requestEnd(), info(), warn(), error(), debug() }
export function logInfo(message: string, meta?: object): void;
export function logError(message: string, meta?: object): void;
// ... other legacy exports
```

**Dependencies**: None (pure utility)

**Status**: ✅ Well-designed after recent enhancements

---

#### `utils/rateLimiter.ts`

**Purpose**: In-memory rate limiting per user

**Public API**:

```typescript
export function checkLimit(userId: string, maxPerWindow?: number): boolean;
```

**Issues**:

1. In-memory only (does not persist across restarts)
2. No distributed rate limiting (fails in multi-instance deployments)
3. Hard-coded time window (60 seconds)

**Refactor Target**: Add Redis support or use Supabase for distributed rate limits

---

### 2.4 Prompt Templates

#### `prompts/resume.ts`

**Purpose**: Build resume generation prompts

**Public API**:

```typescript
export function buildResumePrompt(
  profile: any,
  job: any,
  options?: any
): string;
```

#### `prompts/coverLetter.ts`, `prompts/skillsOptimization.ts`, `prompts/experienceTailoring.ts`

**Purpose**: Build specialized prompts

**Status**: ✅ Well-organized, minimal issues

**Potential Improvement**: Add barrel export `prompts/index.ts`

---

### 2.5 Types

#### `types.ts` (ROOT LEVEL!)

**Purpose**: Shared type definitions

**Exports**:

```typescript
export interface GenerateResumeRequest {
  userId: string;
  jobId: number;
  options?: any;
}
export interface GenerateCoverLetterRequest {
  userId: string;
  jobId: number;
  options?: any;
}
export interface GenerateSkillsOptimizationRequest {
  userId: string;
  jobId: number;
  options?: any;
}
export interface ArtifactRow {
  id: string;
  user_id: string;
  job_id?: number;
  kind: string;
  content: any /* ... */;
}
export type Database = {
  /* Supabase schema types */
};
```

**Issues**:

1. Located at root instead of `src/types/` or `src/shared/`
2. Mixes request/response types with database schema types
3. Some types are `any` (not type-safe)

**Refactor Target**: Move to `src/types/` folder, split into:

- `src/types/requests.ts` — API request types
- `src/types/artifacts.ts` — Artifact/DB types
- `src/types/database.ts` — Supabase schema types

---

### 2.6 Scripts

#### `scripts/check-supabase.mjs`

**Purpose**: Test Supabase connectivity

**Status**: ✅ Useful dev tool

---

#### `scripts/generate-resume.ps1` ⚠️

**Purpose**: PowerShell script to call resume generation API

**Issues**:

1. PowerShell is Windows-only (not cross-platform)
2. Not runnable in CI/CD (Linux environments)
3. Hard-coded curl commands (fragile)

**Refactor Target**: Replace with Node.js script (`scripts/generate-resume.mjs`)

---

#### `scripts/run-smoke-tests.ps1` ⚠️

**Purpose**: PowerShell runner for smoke tests

**Issues**: Same as above (PowerShell dependency)

**Refactor Target**: Use `npm run smoke` script instead (already exists in package.json)

---

#### `scripts/start-mock-server.ps1` ⚠️

**Purpose**: Start server in mock mode

**Issues**: Same as above

**Refactor Target**: Add `npm run dev:mock` script with `FAKE_AI=true` env var

---

### 2.7 Tests

#### `tests/smoke.ts` (TypeScript, end-to-end)

**Purpose**: Full smoke test with auth, DB writes, artifact verification

**Dependencies**:

```typescript
import { createClient } from "@supabase/supabase-js";
```

**Status**: ✅ Comprehensive, requires service role key

---

#### `tests/simple-smoke.mjs` (ES module, lightweight)

**Purpose**: Connectivity + basic auth checks without full DB persistence

**Status**: ✅ Useful for quick validation

---

#### `tests/auth-standalone.js` (CommonJS) ⚠️

**Purpose**: Unit tests for auth logic

**Issues**: Duplicates `auth-unit.mjs` (same purpose, different module system)

**Refactor Target**: Remove one duplicate (keep `.mjs` version)

---

#### `tests/auth-unit.mjs` (ES module)

**Purpose**: Unit tests for auth logic

**Status**: ✅ Well-designed

---

#### `tests/migration-checker.mjs`

**Purpose**: Validate DB migrations

**Status**: ✅ Useful for schema verification

---

#### `tests/simple-migration-check.mjs` ⚠️

**Purpose**: Simplified migration check

**Issues**: Duplicates `migration-checker.mjs` functionality

**Refactor Target**: Remove or merge into single migration validator

---

#### `tests/schema-verifier.mjs`

**Purpose**: Verify Supabase schema matches expectations

**Status**: ✅ Useful for integration testing

---

## 3. Dependency Graph

### Core Dependencies Flow

```
src/index.ts
  ↓
  ├── orchestrator.ts
  │   ├── aiClient.ts
  │   │   └── utils/logger.ts
  │   ├── supabaseAdmin.ts (lazy import)
  │   ├── prompts/*.ts
  │   ├── utils/logger.ts
  │   └── types.ts
  ├── utils/auth.ts
  │   └── @supabase/supabase-js
  ├── utils/errors.ts
  ├── utils/logger.ts
  └── utils/rateLimiter.ts
```

### Test Dependencies

```
tests/smoke.ts → src/index.ts (via HTTP) + @supabase/supabase-js
tests/simple-smoke.mjs → src/index.ts (via HTTP)
tests/auth-unit.mjs → utils/auth.ts (direct import)
tests/migration-checker.mjs → db/migrations/*.sql (file reads)
tests/schema-verifier.mjs → @supabase/supabase-js
```

---

## 4. Import Pattern Analysis

### Current Patterns

```typescript
// Root-level imports (problematic — files should be in src/)
import orchestrator from "../orchestrator.js";
import aiClient from "./aiClient.js";
import type { ArtifactRow } from "./types.js";

// Relative imports (verbose but correct)
import { createRequestLogger } from "../utils/logger.js";
import { ApiError } from "../utils/errors.js";

// Dynamic imports (to avoid crashes)
const mod = await import("./supabaseAdmin.js");
```

### Issues

1. Root-level modules require `../` imports from `src/`
2. No barrel exports (verbose imports)
3. Dynamic imports make testing harder

---

## 5. Dead Code & Duplication Analysis

### Duplicate Files

1. **Auth tests**: `auth-standalone.js` + `auth-unit.mjs` (same purpose)
   → **Action**: Keep `.mjs`, delete `.js`

2. **Migration checks**: `migration-checker.mjs` + `simple-migration-check.mjs`
   → **Action**: Merge or keep one with clear purpose differentiation

3. **Smoke tests**: `smoke.ts` + `simple-smoke.mjs` (intentionally different, keep both)

### Potentially Dead Files

1. **PowerShell scripts**: `*.ps1` files may be replaced by npm scripts
   → **Action**: Verify usage; if unused, archive or rewrite as Node.js

2. **README_AI_ORCHESTRATOR.md** and **README_ENV.md**: May be outdated
   → **Action**: Review and update to match current implementation

---

## 6. Proposed Reorganization Plan

### Target Structure

```
server/
├── .env.example
├── .env.test
├── package.json
├── tsconfig.json
├── tsconfig.dev.json
├── README.md                       # Main server README
├── src/
│   ├── index.ts                    # Entry point (minimal — server creation only)
│   ├── server.ts                   # HTTP server setup + middleware chain
│   ├── middleware/
│   │   ├── cors.ts                 # CORS handler
│   │   ├── auth.ts                 # Auth middleware
│   │   └── logging.ts              # Request logging
│   ├── routes/
│   │   ├── health.ts               # GET /api/health
│   │   ├── ai.ts                   # POST /api/generate/* endpoints
│   │   ├── artifacts.ts            # GET /api/artifacts/*
│   │   └── materials.ts            # POST /api/materials/*
│   ├── services/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Supabase admin client
│   │   │   └── helpers.ts          # Typed query helpers (getProfile, getJob, etc.)
│   │   ├── orchestrator/
│   │   │   ├── index.ts            # Barrel export
│   │   │   ├── resumeOrchestrator.ts
│   │   │   ├── coverLetterOrchestrator.ts
│   │   │   └── shared.ts           # Shared orchestration utilities
│   │   └── ai/
│   │       ├── index.ts            # Barrel export
│   │       ├── client.ts           # AI client (formerly aiClient.ts)
│   │       └── providers/          # Optional: split by provider
│   │           ├── openai.ts
│   │           ├── azure.ts
│   │           └── mock.ts
│   ├── prompts/
│   │   ├── index.ts                # Barrel export
│   │   ├── resume.ts
│   │   ├── coverLetter.ts
│   │   ├── skillsOptimization.ts
│   │   └── experienceTailoring.ts
│   ├── types/
│   │   ├── index.ts                # Barrel export
│   │   ├── requests.ts             # API request types
│   │   ├── artifacts.ts            # Artifact/DB types
│   │   └── database.ts             # Supabase schema types
│   └── utils/
│       ├── index.ts                # Barrel export
│       ├── auth.ts
│       ├── errors.ts
│       ├── logger.ts
│       └── rateLimiter.ts
├── scripts/
│   ├── check-supabase.mjs
│   ├── generate-resume.mjs         # Replace .ps1 with .mjs
│   ├── run-smoke-tests.sh          # Replace .ps1 with bash/node
│   └── start-mock.sh               # Replace .ps1 with bash/node
├── tests/
│   ├── smoke.ts                    # Keep (end-to-end)
│   ├── simple-smoke.mjs            # Keep (lightweight)
│   ├── auth-unit.mjs               # Keep (delete auth-standalone.js)
│   ├── migration-checker.mjs       # Keep or merge with simple-migration-check
│   └── schema-verifier.mjs         # Keep
└── docs/                           # Move READMEs here
    ├── AI_ORCHESTRATOR.md
    └── ENVIRONMENT.md
```

---

## 7. File Move Mapping

### Root-Level → src/

```
FROM: server/orchestrator.ts
TO:   server/src/services/orchestrator/index.ts (+ split into sub-files)

FROM: server/aiClient.ts
TO:   server/src/services/ai/client.ts

FROM: server/supabaseAdmin.ts
TO:   server/src/services/supabase/client.ts + helpers.ts

FROM: server/types.ts
TO:   server/src/types/*.ts (split by category)
```

### Scripts Rewrites

```
FROM: server/scripts/generate-resume.ps1
TO:   server/scripts/generate-resume.mjs

FROM: server/scripts/run-smoke-tests.ps1
TO:   Use `npm run smoke` directly (already exists)

FROM: server/scripts/start-mock-server.ps1
TO:   Add `npm run dev:mock` script in package.json
```

### Test Consolidation

```
DELETE: server/tests/auth-standalone.js
KEEP:   server/tests/auth-unit.mjs

MERGE OR DELETE: server/tests/simple-migration-check.mjs
KEEP:            server/tests/migration-checker.mjs
```

---

## 8. Quick Wins (Immediate Low-Risk Fixes)

### 1. Add Barrel Exports (2 hours)

Create `index.ts` files for:

- `src/utils/`
- `src/prompts/`
- `src/types/` (after moving from root)

**Impact**: Cleaner imports, easier refactoring

---

### 2. Delete Duplicate Test Files (30 min)

- Delete `tests/auth-standalone.js` (keep `auth-unit.mjs`)
- Decide on migration checker consolidation

**Impact**: Reduces confusion, cleaner test suite

---

### 3. Add npm Scripts for PowerShell Replacements (1 hour)

```json
{
  "scripts": {
    "dev:mock": "FAKE_AI=true npm run dev",
    "generate:resume": "node scripts/generate-resume.mjs"
  }
}
```

**Impact**: Cross-platform compatibility

---

### 4. Move Root-Level Files to src/ (3 hours)

- Move `orchestrator.ts` → `src/services/orchestrator/index.ts`
- Move `aiClient.ts` → `src/services/ai/client.ts`
- Move `supabaseAdmin.ts` → `src/services/supabase/client.ts`
- Move `types.ts` → `src/types/` (split into multiple files)
- Update all imports

**Impact**: Professional structure, easier navigation

---

## 9. Testing Strategy for Refactor

### Pre-Refactor Checklist

- [ ] Run `npm run build` (baseline)
- [ ] Run `npm run smoke:simple` (baseline)
- [ ] Run `npm run dev` and verify `/api/health` responds
- [ ] Tag commit: `git tag pre-server-refactor-$(date +%Y%m%d)`

### During Refactor

- [ ] Move 1-2 files at a time
- [ ] Update imports incrementally
- [ ] Run `npm run build` after each batch
- [ ] Commit after each stable checkpoint

### Post-Refactor Validation

- [ ] `npm run build` passes
- [ ] `npm run dev` starts without errors
- [ ] `npm run smoke:simple` passes
- [ ] Manual test: POST /api/generate/resume
- [ ] No broken imports

---

## 10. Summary & Next Steps

### Key Metrics

- **Root-level files to move**: 4 (orchestrator, aiClient, supabaseAdmin, types)
- **Mega-file to split**: 1 (`src/index.ts` — 1,315 lines)
- **Duplicate files to remove**: 2-3 (auth-standalone.js, simple-migration-check.mjs?)
- **PowerShell scripts to replace**: 3 (\*.ps1)
- **Total files to touch**: ~20-30 (imports + moves)

### Recommended Order

1. **Now**: Add barrel exports (quick, low-risk)
2. **Next**: Move root-level files to `src/` (moderate risk, high clarity gain)
3. **Then**: Split `src/index.ts` into routes (high risk, high value)
4. **Finally**: Remove duplicates and update docs

### Risk Assessment

- **Low Risk**: Barrel exports, deleting duplicates
- **Medium Risk**: Moving root-level files (TypeScript catches errors)
- **High Risk**: Splitting `index.ts` (complex request handling logic)

---

## Appendix: File Counts by Category

| Category     | Current Count      | Issues                            |
| ------------ | ------------------ | --------------------------------- |
| Entry points | 1 (`src/index.ts`) | Too large (1,315 lines)           |
| Services     | 3 (root-level)     | Wrong location                    |
| Utilities    | 4                  | Well-organized                    |
| Prompts      | 4 + README         | Missing barrel export             |
| Types        | 1 (root-level)     | Should be in `src/types/`         |
| Scripts      | 4                  | 3 PowerShell (platform-dependent) |
| Tests        | 7                  | 2-3 duplicates                    |

**Total Files Analyzed**: ~30

---

**End of Server Inventory**
