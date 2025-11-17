# Routes Reorganization Plan

## Goal

Organize route handlers by resource/endpoint with all HTTP methods (GET, POST, PATCH, DELETE) grouped together.

## Current Structure (Flat)

```
routes/
├── health.ts           - GET /api/health
├── ai.ts              - All POST /api/generate/* endpoints
├── artifacts.ts       - GET /api/artifacts, POST /api/job-materials
├── coverLetterDrafts.ts - CRUD /api/cover-letter/drafts
├── companyResearch.ts - GET /api/company/research
└── salaryResearch.ts  - POST /api/salary-research
```

## New Structure (Resource-Based)

```
routes/
├── health.ts                       - GET /api/health
├── generate/
│   ├── index.ts                    - Barrel export
│   ├── types.ts                    - Shared types (GenerationCounters)
│   ├── utils.ts                    - Shared utils (makePreview)
│   ├── resume.ts                   - POST /api/generate/resume
│   ├── cover-letter.ts             - POST /api/generate/cover-letter
│   ├── skills-optimization.ts      - POST /api/generate/skills-optimization
│   ├── experience-tailoring.ts     - POST /api/generate/experience-tailoring
│   └── company-research.ts         - POST /api/generate/company-research
├── artifacts/
│   ├── index.ts                    - GET /api/artifacts, GET /api/artifacts/:id
│   └── job-materials.ts            - POST /api/job-materials, GET /api/jobs/:jobId/materials
├── cover-letter/
│   └── drafts.ts                   - GET, POST, PATCH, DELETE /api/cover-letter/drafts
├── company/
│   └── research.ts                 - GET /api/company/research
└── salary/
    └── research.ts                 - POST /api/salary-research
```

## Migration Strategy

### Phase 1: Create new structure (IN PROGRESS)

✅ Created directory structure
✅ Created generate/resume.ts
✅ Created generate/types.ts
✅ Created generate/utils.ts
✅ Created generate/index.ts (partial)

### Phase 2: Extract remaining generate routes

- [ ] Create generate/cover-letter.ts
- [ ] Create generate/skills-optimization.ts
- [ ] Create generate/experience-tailoring.ts
- [ ] Create generate/company-research.ts (move from ai.ts to generate/)

### Phase 3: Reorganize artifacts routes

- [ ] Create artifacts/index.ts (list + get single)
- [ ] Create artifacts/job-materials.ts (create + list for job)

### Phase 4: Move specialized routes

- [ ] Move coverLetterDrafts.ts → cover-letter/drafts.ts
- [ ] Move companyResearch.ts → company/research.ts
- [ ] Move salaryResearch.ts → salary/research.ts

### Phase 5: Update imports

- [ ] Update server.ts to use new paths
- [ ] Update routes/index.ts barrel export
- [ ] Remove old flat files (ai.ts, artifacts.ts, etc.)

### Phase 6: Verification

- [ ] Run `npm run build` to verify TypeScript compilation
- [ ] Test all endpoints with smoke tests
- [ ] Update API documentation if exists

## Naming Convention

**Files**: Lowercase with hyphens (cover-letter.ts, job-materials.ts)
**Exports**: Named by HTTP method (`post`, `get`, `patch`, `delete`)
**Handlers**: Keep backward compat names initially, then deprecate

## Benefits

1. **Clear Organization**: Each resource has its own file/folder
2. **Easy Navigation**: Find endpoint by path structure
3. **Scalability**: Add new endpoints without bloating existing files
4. **Testability**: Easier to unit test individual endpoints
5. **Maintainability**: Changes isolated to specific resource files
