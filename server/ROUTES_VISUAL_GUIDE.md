# Backend Routes Architecture - Visual Guide

## Before & After Comparison

### BEFORE: Flat Structure (Confusing)

```
┌─────────────────────────────────────────────────────────────┐
│ routes/                                                     │
│                                                             │
│  📄 ai.ts (20KB)                                           │
│     ├─ handleGenerateResume()                              │
│     ├─ handleGenerateCoverLetter()                         │
│     ├─ handleSkillsOptimization()                          │
│     ├─ handleExperienceTailoring()                         │
│     ├─ handleCompanyResearch()                             │
│     └─ handleSalaryResearch()                              │
│                                                             │
│  📄 artifacts.ts (11KB)                                    │
│     ├─ handleListArtifacts()                               │
│     ├─ handleGetArtifact()                                 │
│     ├─ handleCreateJobMaterials()                          │
│     └─ handleListJobMaterialsForJob()                      │
│                                                             │
│  📄 coverLetterDrafts.ts (3.6KB)                           │
│     ├─ handleListDrafts()                                  │
│     ├─ handleGetDraft()                                    │
│     ├─ handleCreateDraft()                                 │
│     ├─ handleUpdateDraft()                                 │
│     └─ handleDeleteDraft()                                 │
│                                                             │
│  📄 companyResearch.ts (3.5KB)                             │
│     └─ handleGetCompanyResearch()                          │
│                                                             │
│  📄 salaryResearch.ts (2.9KB)                              │
│     └─ handleSalaryResearch()                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

❌ Problems:
   - Function names don't indicate HTTP method
   - All handlers mixed together in large files
   - No logical grouping by resource
   - Hard to find specific endpoint
   - Frequent merge conflicts in large files
```

### AFTER: Resource-Based (Clear & Organized)

```
┌─────────────────────────────────────────────────────────────┐
│ routes/                                                     │
│                                                             │
│  📁 generate/                                              │
│     ├─ 📄 resume.ts              → post()                  │
│     ├─ 📄 cover-letter.ts        → post()                  │
│     ├─ 📄 skills-optimization.ts → post()                  │
│     ├─ 📄 experience-tailoring.ts→ post()                  │
│     ├─ 📄 company-research.ts    → post()                  │
│     ├─ 📄 types.ts               → GenerationCounters     │
│     ├─ 📄 utils.ts               → makePreview()          │
│     └─ 📄 index.ts               → barrel export          │
│                                                             │
│  📁 artifacts/                                             │
│     ├─ 📄 index.ts               → get(), getById()        │
│     └─ 📄 job-materials.ts       → post(), getByJob()      │
│                                                             │
│  📁 cover-letter/                                          │
│     └─ 📄 drafts.ts              → list(), get(),          │
│                                     post(), patch(), del() │
│                                                             │
│  📁 company/                                               │
│     └─ 📄 research.ts            → get()                   │
│                                                             │
│  📁 salary/                                                │
│     └─ 📄 research.ts            → post()                  │
│                                                             │
│  📄 health.ts                    → handleHealth()          │
│  📄 index.ts                     → barrel export           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

✅ Benefits:
   - Function name = HTTP method (instant clarity)
   - Logical grouping by resource/endpoint
   - Small, focused files (150-170 lines each)
   - Easy to navigate and find endpoints
   - Shared utilities extracted
   - Better for code reviews and merges
```

---

## URL → File Mapping

### The New Pattern: URL Structure Mirrors File Structure

```
HTTP Method + URL Path                    →  File Path + Function Name
────────────────────────────────────────────────────────────────────────

POST   /api/generate/resume              →  generate/resume.ts::post()
POST   /api/generate/cover-letter        →  generate/cover-letter.ts::post()
POST   /api/generate/skills-optimization →  generate/skills-optimization.ts::post()
POST   /api/generate/experience-tailoring→  generate/experience-tailoring.ts::post()
POST   /api/generate/company-research    →  generate/company-research.ts::post()

GET    /api/artifacts                    →  artifacts/index.ts::get()
GET    /api/artifacts/:id                →  artifacts/index.ts::getById()
POST   /api/job-materials                →  artifacts/job-materials.ts::post()
GET    /api/jobs/:jobId/materials        →  artifacts/job-materials.ts::getByJob()

GET    /api/cover-letter/drafts          →  cover-letter/drafts.ts::list()
GET    /api/cover-letter/drafts/:id      →  cover-letter/drafts.ts::get()
POST   /api/cover-letter/drafts          →  cover-letter/drafts.ts::post()
PATCH  /api/cover-letter/drafts/:id      →  cover-letter/drafts.ts::patch()
DELETE /api/cover-letter/drafts/:id      →  cover-letter/drafts.ts::del()

GET    /api/company/research             →  company/research.ts::get()
POST   /api/salary-research              →  salary/research.ts::post()

GET    /api/health                       →  health.ts::handleHealth()
```

**Pattern Recognition**:

- First segment after `/api/` = folder name (or root if no folder)
- Remaining segments = file name (or `index.ts` if none)
- HTTP method = function name

---

## Function Naming Convention

### HTTP Method → Function Name Mapping

```
┌──────────────┬────────────────┬──────────────────────────────┐
│ HTTP Method  │ Function Name  │ Use Case                     │
├──────────────┼────────────────┼──────────────────────────────┤
│ GET          │ get()          │ Fetch single resource or all │
│ GET          │ list()         │ Fetch collection (explicit)  │
│ GET          │ getById()      │ Fetch by ID (explicit)       │
│ GET          │ getByJob()     │ Fetch filtered by job        │
│ POST         │ post()         │ Create new resource          │
│ PATCH        │ patch()        │ Update existing resource     │
│ PUT          │ put()          │ Replace resource (full)      │
│ DELETE       │ del()          │ Delete resource              │
└──────────────┴────────────────┴──────────────────────────────┘

Note: Use `del()` not `delete()` because "delete" is a reserved keyword in JavaScript
```

### Examples

```typescript
// Simple GET handler
export async function get(req, res) {
  // GET /api/artifacts
}

// Specific GET handler
export async function getById(req, res) {
  // GET /api/artifacts/:id
}

// POST handler
export async function post(req, res) {
  // POST /api/generate/resume
}

// PATCH handler
export async function patch(req, res) {
  // PATCH /api/cover-letter/drafts/:id
}

// DELETE handler
export async function del(req, res) {
  // DELETE /api/cover-letter/drafts/:id
}
```

---

## Resource Grouping Strategy

### How We Organize Endpoints

```
1️⃣  By Primary Resource
   └─ All operations on same resource in same folder
      Example: artifacts/ contains all artifact operations

2️⃣  By Sub-Resource
   └─ Related sub-resources get their own file
      Example: artifacts/job-materials.ts for job-specific materials

3️⃣  By Domain/Feature
   └─ Related functionality grouped together
      Example: generate/ contains all AI generation endpoints

4️⃣  Shared Utilities Extracted
   └─ Common code in types.ts and utils.ts
      Example: generate/types.ts, generate/utils.ts
```

### Decision Tree: Where Should This Handler Go?

```
                    New Endpoint to Add
                            │
                            ▼
            ┌───────────────┴───────────────┐
            │                               │
      Single Purpose?               Multiple Related?
            │                               │
            ▼                               ▼
    Put in existing file          Create new folder
    (e.g., company/research.ts)   (e.g., generate/)
            │                               │
            └───────────────┬───────────────┘
                            ▼
                    Name function after
                    HTTP method (get, post, etc.)
```

---

## Import Pattern Evolution

### Before (Flat Imports)

```typescript
// server.ts
import {
  handleGenerateResume,
  handleGenerateCoverLetter,
  handleSkillsOptimization,
} from "./routes/ai.js";

import { handleListArtifacts, handleGetArtifact } from "./routes/artifacts.js";

// ❌ Problems:
// - Long import lists
// - Unclear what HTTP method each handler uses
// - No grouping by resource
```

### After (Resource-Based Imports)

```typescript
// server.ts
import {
  handleGenerateResume, // POST /api/generate/resume
  handleGenerateCoverLetter, // POST /api/generate/cover-letter
  handleSkillsOptimization, // POST /api/generate/skills-optimization
} from "./routes/index.js"; // Via legacy compatibility

// OR (future pattern)
import {
  postGenerateResume, // Clearly a POST
  postGenerateCoverLetter, // Clearly a POST
  postSkillsOptimization, // Clearly a POST
} from "./routes/index.js";

// OR (direct imports)
import { post as generateResume } from "./routes/generate/resume.js";
import { post as generateCoverLetter } from "./routes/generate/cover-letter.js";

// ✅ Benefits:
// - Clear HTTP method in name
// - Grouped by resource
// - Easy to find and update
```

---

## Developer Workflow Examples

### Scenario 1: Fix Bug in Resume Generation

**Before**:

1. Search for "resume" in codebase
2. Find `ai.ts` (20KB file)
3. Scroll through 744 lines
4. Find `handleGenerateResume()` function
5. Fix bug
6. Hope you didn't break other 5 handlers in same file

**After**:

1. Navigate to `routes/generate/resume.ts`
2. See focused 162-line file with single `post()` function
3. Fix bug
4. Only this endpoint affected

---

### Scenario 2: Add New Artifact Operation

**Before**:

1. Open `artifacts.ts` (11KB)
2. Add new `handleXXX()` function
3. Update barrel export
4. Merge conflicts likely in this popular file

**After**:

1. Decide if it fits in existing file or needs new file
2. If existing: add `newOperation()` to `artifacts/index.ts`
3. If new: create `artifacts/new-operation.ts::post()`
4. Update barrel export
5. Smaller files = fewer conflicts

---

### Scenario 3: Understand What Endpoints Exist

**Before**:

1. Open each route file
2. Read through to find handler functions
3. Guess HTTP method from function name (inconsistent)
4. Build mental map of all endpoints

**After**:

1. Look at folder structure
2. File path = URL path
3. Function name = HTTP method
4. Instant understanding!

```
generate/resume.ts::post()        = POST /api/generate/resume
artifacts/index.ts::get()         = GET  /api/artifacts
cover-letter/drafts.ts::del()     = DELETE /api/cover-letter/drafts/:id
```

---

## Code Organization Principles Applied

### 1. Single Responsibility Principle

- Each file has one job
- `resume.ts` only handles resume generation
- `drafts.ts` only handles draft CRUD

### 2. Don't Repeat Yourself (DRY)

- Shared code extracted to utilities
- `generate/utils.ts` has `makePreview()`
- `generate/types.ts` has shared types

### 3. Separation of Concerns

- Routes only handle HTTP concerns
- Business logic in services/orchestrator
- Data access in services/supabaseAdmin

### 4. Convention Over Configuration

- Standard pattern: `post()` = POST handler
- No need to document naming convention
- Self-evident from code

### 5. Principle of Least Surprise

- Developer expects `generate/resume.ts` for resume endpoint
- Developer expects `post()` for POST handler
- File structure matches mental model

---

## Conclusion

The reorganization transforms a **flat, unclear structure** into a **hierarchical, self-documenting architecture** where:

✅ **File path matches URL path**
✅ **Function name matches HTTP method**
✅ **Related code grouped together**
✅ **Shared utilities extracted**
✅ **Easy to navigate and maintain**

Result: **Faster development, fewer bugs, happier developers!**
