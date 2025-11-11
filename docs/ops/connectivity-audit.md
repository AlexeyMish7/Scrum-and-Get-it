# Connectivity Audit — Frontend ↔ Server ↔ Supabase DB

**Date**: November 8, 2025
**Purpose**: Identify and fix communication gaps between frontend, Node server, and Supabase database.

## 🔧 Environment & Configuration Inventory

### Frontend Environment Variables

**File**: `frontend/.env.example`

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=public-anon-key-here
VITE_AI_BASE_URL=http://localhost:8787
```

**Usage Locations**:

- `frontend/src/vite-env.d.ts`: Type definitions
- `frontend/src/app/shared/services/supabaseClient.ts`: Supabase client initialization
- `frontend/src/app/workspaces/ai/services/client.ts`: AI server base URL
- `frontend/src/app/workspaces/ai/pages/resume/GenerationCard.tsx`: AI models config

**Status**: ✅ Well-defined, properly typed, guards for missing vars

### Server Environment Variables

**File**: `server/.env.example`

```bash
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=
FAKE_AI=true
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LOG_LEVEL=info
```

**Usage Locations**:

- `server/supabaseAdmin.ts`: Service role client initialization
- `server/orchestrator.ts`: AI provider config and Supabase checks
- `server/src/index.ts`: CORS and PORT configuration

**Status**: ✅ Comprehensive, guards for missing critical vars

## 🌐 Frontend → Server Network Calls

### AI Client (`frontend/src/app/workspaces/ai/services/client.ts`)

- **Base URL**: `VITE_AI_BASE_URL` (default: `http://localhost:8787`)
- **Auth Method**: `X-User-Id` header (dev-only, not JWT-verified)
- **Methods**: `postJson<T>()`, `getJson<T>()`

### Endpoints Called by Frontend

| Endpoint                                  | Frontend Caller                                      | Purpose                 | Auth Header |
| ----------------------------------------- | ---------------------------------------------------- | ----------------------- | ----------- |
| `POST /api/generate/resume`               | `generateResume()` in `aiGeneration.ts`              | Resume generation       | `X-User-Id` |
| `POST /api/generate/cover-letter`         | `generateCoverLetter()` in `aiGeneration.ts`         | Cover letter generation | `X-User-Id` |
| `POST /api/generate/skills-optimization`  | `generateSkillsOptimization()` in `aiGeneration.ts`  | Skills optimization     | `X-User-Id` |
| `POST /api/generate/experience-tailoring` | `generateExperienceTailoring()` in `aiGeneration.ts` | Experience tailoring    | `X-User-Id` |
| `GET /api/artifacts`                      | `listArtifacts()` in `aiGeneration.ts`               | List AI artifacts       | `X-User-Id` |
| `GET /api/artifacts/:id`                  | `getArtifact()` in `aiGeneration.ts`                 | Get artifact details    | `X-User-Id` |
| `POST /api/job-materials`                 | `linkJobMaterials()` in `aiGeneration.ts`            | Link materials to job   | `X-User-Id` |
| `GET /api/jobs/:id/materials`             | `listJobMaterials()` in `aiGeneration.ts`            | List job materials      | `X-User-Id` |

**Status**: 🔶 Well-structured but **AUTH VULNERABILITY**: Uses client-provided `X-User-Id` without verification

## 🗄️ Frontend → Supabase Direct Calls

### CRUD Helper Usage (`frontend/src/app/shared/services/crud.ts`)

**Tables accessed with `withUser(userId)` scoping**:

- `profiles`: User profile data
- `skills`: User skills
- `employment`: Work history
- `education`: Educational background
- `projects`: Portfolio projects
- `certifications`: Professional certifications
- `jobs`: Job opportunities (user-owned)
- `documents`: File storage metadata
- `job_notes`: Job-specific notes

**Service Layer Examples**:

- `frontend/src/app/workspaces/profile/services/skills.ts`: Skills CRUD
- `frontend/src/app/workspaces/profile/services/projects.ts`: Projects + storage

**Storage Buckets**:

- `documents`: Project files, exported resumes/covers
- `avatars`: Profile pictures

**Status**: ✅ Properly scoped with `withUser()`, good RLS integration

## 🚀 Server → Supabase Usage

### Service Role Operations (`server/supabaseAdmin.ts`)

**Tables Modified**:

- `ai_artifacts`: Insert generated content
- `job_materials`: Link artifacts/documents to jobs
- `documents`: Fetch for validation

**Helper Functions**:

- `insertAiArtifact()`: Store AI-generated content
- `insertJobMaterials()`: Create material linkages
- `listAiArtifactsForUser()`: User-scoped artifact listing
- `getAiArtifactForUser()`: User-scoped artifact retrieval
- `getJob()`: Job ownership validation
- `getDocumentForUser()`: Document ownership validation

**Status**: ✅ Service role properly used with user_id validation

## 🗃️ Database Schema vs Code Alignment

### Key Tables Schema Check

**`ai_artifacts`**:

```sql
CREATE TABLE public.ai_artifacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id bigint REFERENCES jobs(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('resume','cover_letter','skills_optimization','company_research','match','gap_analysis')),
  title text,
  prompt text,
  model text,
  content jsonb NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Code Usage**: ✅ Matches - server uses all fields correctly

**`job_materials`**:

```sql
CREATE TABLE public.job_materials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_id bigint NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  resume_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  resume_artifact_id uuid REFERENCES ai_artifacts(id) ON DELETE SET NULL,
  cover_document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
  cover_artifact_id uuid REFERENCES ai_artifacts(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Code Usage**: ✅ Matches - frontend and server use correct field names

## 🛡️ Security & RLS Analysis

### Row Level Security Policies

**Frontend**: Uses `withUser(user.id)` wrapper that adds `user_id = auth.uid()` conditions
**Server**: Uses service role with explicit `user_id` validation in code

**Potential Issues**:

1. **🚨 CRITICAL**: Server trusts `X-User-Id` header without JWT verification
2. **🔶 MEDIUM**: No request signing or server-side session validation

### Recommended Fixes

1. **Server auth validation**:

   ```typescript
   // Replace X-User-Id with Authorization: Bearer <jwt>
   const token = req.headers.authorization?.split(" ")[1];
   const { user } = await supabase.auth.getUser(token);
   const userId = user?.id;
   ```

2. **Frontend token passing**:
   ```typescript
   // In aiClient.ts
   const session = await supabase.auth.getSession();
   headers.Authorization = `Bearer ${session.data.session?.access_token}`;
   ```

## 🔧 Network & CORS Configuration

### Server CORS Settings (`server/src/index.ts`)

```typescript
"Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
"Access-Control-Allow-Headers": "Content-Type, X-User-Id",
"Access-Control-Allow-Methods": "GET,POST,OPTIONS"
```

**Status**: ⚠️ Permissive default (`*`), should restrict to frontend origin in production

### Port Configuration

- **Server**: `process.env.PORT || 8787`
- **Frontend**: `VITE_AI_BASE_URL || "http://localhost:8787"`

**Status**: ✅ Aligned for local development

## 🚨 Identified Issues & Priority

### High Priority (Security)

1. **Server auth bypass**: `X-User-Id` header trusted without verification
2. **CORS wildcard**: Should be restricted to known origins

### Medium Priority (Robustness)

1. **Error boundaries**: Frontend should handle server timeouts gracefully
2. **Rate limiting**: Client-side protection for API calls
3. **Retry logic**: Exponential backoff for transient failures

### Low Priority (Observability)

1. **Request tracing**: Add correlation IDs across frontend-server calls
2. **Performance metrics**: Track generation latency and success rates

## 📋 Remediation Plan

### Phase 1: Security Fixes

- [ ] Implement JWT verification in server endpoints
- [ ] Update frontend to pass Authorization header
- [ ] Restrict CORS to known origins
- [ ] Add request signing/validation

### Phase 2: Robustness

- [ ] Add frontend error boundaries for server calls
- [ ] Implement retry logic with exponential backoff
- [ ] Add timeout handling and user feedback
- [ ] Create integration smoke tests

### Phase 3: Observability

- [ ] Add structured logging with request IDs
- [ ] Implement performance monitoring
- [ ] Create health check dashboard
- [ ] Add metrics for generation success rates

## 🧪 Smoke Test Plan

### End-to-End Flow

1. **Setup**: Create test user profile with skills/employment
2. **Generate**: Call resume generation via frontend
3. **Verify**: Check ai_artifacts row created with correct user_id
4. **Apply**: Link artifact to job via job_materials
5. **Validate**: Confirm RLS prevents cross-user access

### Commands

```bash
# Start server
cd server && npm run dev

# Start frontend
cd frontend && npm run dev

# Run smoke test (TBD)
npm run test:integration
```

---

**Next Steps**: Complete auth verification fixes, then proceed with robustness improvements.
