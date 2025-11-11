# Frontend Inventory & Analysis

**Date**: November 9, 2025
**Purpose**: Map frontend file structure, identify organizational issues, and propose immediate fixes

---

## Executive Summary

### Critical Findings

1. **AI workspace has severe component fragmentation**: 18 components in `pages/resume/` but only 2 in `components/`
2. **Inconsistent page structure**: `GenerateResume` = 1,240 lines with minimal folder structure; other pages vary wildly
3. **Duplicate/overlapping concerns**: Multiple generation hooks (v1, v2), preview utilities scattered across locations
4. **Missing barrel exports**: No `index.ts` files for component groups, leading to verbose import paths
5. **Jobs workspace is better organized**: Consistent `index.ts` + component pattern, but still improvable

### Recommendation Priority

1. **High**: Consolidate AI resume components into logical folders
2. **High**: Create barrel exports for all component groups
3. **Medium**: Merge duplicate hooks and utilities
4. **Medium**: Establish consistent page structure conventions
5. **Low**: Add component documentation and PropTypes/interfaces

---

## 1. AI Workspace Structure Analysis

### Current Layout

```
frontend/src/app/workspaces/ai/
├── AiLayout.tsx                    # Workspace layout wrapper
├── components/                     # ONLY 2 components here!
│   ├── DiffCompareDialog.tsx      # Version comparison modal
│   └── ResumeFullPreview.tsx      # Main preview renderer
├── hooks/                          # 3 hooks (1 deprecated)
│   ├── useResumeDrafts.ts         # Draft state management (500+ lines)
│   ├── useResumeGenerationFlow.ts # DEPRECATED v1 hook
│   └── useResumeGenerationFlowV2.ts # Current generation orchestration
├── pages/                          # 8 top-level page folders
│   ├── CompanyResearch/
│   │   └── index.tsx
│   ├── cover_letters/             # Note: snake_case vs others
│   │   └── [minimal structure]
│   ├── DashboardAI/
│   │   └── index.tsx
│   ├── GenerateCoverLetter/
│   │   └── index.tsx
│   ├── GenerateResume/            # PROBLEM AREA
│   │   └── index.tsx              # 1,240 lines!
│   ├── JobMatching/
│   │   └── index.tsx
│   ├── TemplatesHub/
│   │   └── index.tsx
│   └── resume/                    # 18 COMPONENTS (should be in components/)
│       ├── AIResumePreview.tsx
│       ├── ArtifactsHistoryPanel.tsx
│       ├── BulletMergeDialog.tsx
│       ├── DraftSelectorBar.tsx
│       ├── ExperienceTailoringPanel.tsx
│       ├── GenerationCard.tsx
│       ├── ResumeCustomization.tsx
│       ├── ResumeDraftPreviewPanel.tsx
│       ├── ResumeGenerationPanel.tsx
│       ├── ResumeTutorial.tsx
│       ├── ResumeValidationPanel.tsx
│       ├── ResumeVariationsPanel.tsx
│       ├── SectionControlsPanel.tsx
│       ├── SkillsAnalysisPreview.tsx
│       ├── SkillsOptimizationPanel.tsx
│       ├── TemplateManager.tsx
│       ├── VersionManagerPanel.tsx
│       └── VersionsExportAside.tsx
├── services/                       # AI API client layer
│   ├── aiGeneration.ts            # High-level generation functions
│   ├── client.ts                  # HTTP client with auth
│   └── promptTemplates/           # Empty (gitkeep only)
├── types/
│   └── ai.ts                      # Type definitions for AI artifacts
└── utils/
    ├── previewModel.ts            # Preview model transforms
    └── tooltipMap.ts              # Tooltip text mappings
```

### Issues Identified

#### 1.1 Component Organization

**Problem**: 18 components incorrectly placed in `pages/resume/` instead of `components/`

- These are **reusable UI components**, not route pages
- Import paths are confusing: `../resume/GenerationCard` vs `@workspaces/ai/components/`
- Violates single responsibility: `pages/` should only contain route entry points

**Affected Files**:

- All 18 files in `frontend/src/app/workspaces/ai/pages/resume/`

**Impact**: High — makes codebase navigation difficult, import paths verbose

---

#### 1.2 GenerateResume Page Size

**Problem**: `GenerateResume/index.tsx` is 1,240 lines

- Mixes presentation, business logic, and state management
- Contains inline handlers, sub-components, and complex orchestration
- Lazy-loads 6+ components but still has massive initial payload

**Responsibilities Mixed**:

- Stepper state management
- Draft selection and preview
- Export workflows (PDF/DOCX)
- Material linking (job_materials table)
- Diff comparison
- Tutorial display
- Advanced panel toggling

**Impact**: High — maintenance nightmare, hard to test, slow to load

---

#### 1.3 Hook Duplication

**Problem**: Two generation flow hooks exist

- `useResumeGenerationFlow.ts` (older, 200+ lines)
- `useResumeGenerationFlowV2.ts` (current, 250+ lines)
- Both export similar interfaces (`FlowState`, `SegmentStatus`)
- V1 still present but deprecated (no usage found)

**Impact**: Medium — code bloat, confusion for new developers

---

#### 1.4 Missing Barrel Exports

**Problem**: No `index.ts` files in component/hook/util folders

- Imports require full paths: `@workspaces/ai/pages/resume/GenerationCard`
- Hard to refactor (every import path must be manually updated)
- No single source of truth for public API

**Impact**: Medium — developer friction, fragile refactoring

---

#### 1.5 Naming Inconsistency

**Problem**: Mixed naming conventions

- `cover_letters/` (snake_case) vs `GenerateResume/` (PascalCase)
- Some files use `index.tsx`, others use `PageName.tsx`

**Impact**: Low — minor annoyance, but reduces professionalism

---

### Component Import Analysis

**GenerateResume/index.tsx imports**:

```tsx
// From pages/resume/ (should be components/)
import GenerationCard from "../resume/GenerationCard";
import ResumeTutorial from "../resume/ResumeTutorial";
import VersionsExportAside from "../resume/VersionsExportAside";
import DraftSelectorBar from "../resume/DraftSelectorBar";
// Lazy-loaded
const ResumeVariationsPanel = lazy(
  () => import("../resume/ResumeVariationsPanel")
);
const ArtifactsHistoryPanel = lazy(
  () => import("../resume/ArtifactsHistoryPanel")
);
const VersionManagerPanel = lazy(() => import("../resume/VersionManagerPanel"));
const ResumeValidationPanel = lazy(
  () => import("../resume/ResumeValidationPanel")
);
const ResumeDraftPreviewPanel = lazy(
  () => import("../resume/ResumeDraftPreviewPanel")
);
const AIResumePreview = lazy(() => import("../resume/AIResumePreview"));
const SkillsAnalysisPreview = lazy(
  () => import("../resume/SkillsAnalysisPreview")
);

// From components/ (correct location)
import DiffCompareDialog from "@workspaces/ai/components/DiffCompareDialog";
import ResumeFullPreview from "@workspaces/ai/components/ResumeFullPreview";

// Shared
import { useAuth } from "@shared/context/AuthContext";
import { useErrorHandler } from "@shared/hooks/useErrorHandler";
import RegionAnchor from "@shared/components/common/RegionAnchor";
```

**Analysis**: Heavy coupling to `pages/resume/` folder; should import from `@workspaces/ai/components/resume/`

---

## 2. Jobs Workspace Structure Analysis

### Current Layout

```
frontend/src/app/workspaces/jobs/
├── JobsLayout.tsx
├── components/                     # BETTER organized
│   ├── ApplicationTimeline/
│   │   └── ApplicationTimeline.tsx
│   ├── ArchiveToggle/
│   │   └── ArchiveToggle.tsx
│   ├── DeadlineCalendar/
│   │   └── DeadlineCalendar.tsx
│   ├── JobCard/
│   │   └── JobCard.tsx
│   ├── JobDetails/
│   │   └── JobDetails.tsx
│   ├── JobSearchFilters/
│   │   └── JobSearchFilters.tsx
│   └── NextDeadlinesWidget/
│       └── NextDeadlinesWidget.tsx
└── pages/
    ├── AnalyticsPage/
    │   ├── AnalyticsDashboard.tsx
    │   ├── AnalyticsPage.tsx
    │   ├── BenchmarkCard.tsx
    │   ├── analyticsHelpers.ts
    │   ├── jobsAnalyticsHelpers.ts
    │   ├── index.ts               # ✓ Has barrel export
    │   └── README.md
    ├── AutomationsPage/
    │   ├── AutomationsPage.tsx
    │   └── index.ts               # ✓ Has barrel export
    ├── DocumentsPage/
    │   ├── DocumentsPage.tsx
    │   └── index.ts               # ✓ Has barrel export
    ├── NewJobPage/
    │   ├── NewJobPage.tsx
    │   └── index.ts               # ✓ Has barrel export
    ├── PipelinePage/
    │   ├── PipelinePage.tsx
    │   └── index.ts               # ✓ Has barrel export
    ├── SavedSearchesPage/
    │   ├── SavedSearchesPage.tsx
    │   └── index.ts               # ✓ Has barrel export
    └── ViewArchivedJobs/
        ├── ViewArchivedJobs.tsx
        └── index.ts               # ✓ Has barrel export
```

### Strengths

✓ Components properly placed in `components/` folder
✓ Consistent use of barrel exports (`index.ts`)
✓ Page folders contain only page logic + helpers
✓ Naming convention is consistent (PascalCase)

### Issues Identified

#### 2.1 Component Folder Nesting

**Problem**: Every component in its own folder (even single-file components)

- `JobCard/JobCard.tsx` (could be `JobCard.tsx` directly)
- Adds unnecessary nesting for simple components

**Impact**: Low — minor verbosity, but follows React conventions

---

#### 2.2 Helper File Placement

**Problem**: `AnalyticsPage/` has 2 helper files + README

- `analyticsHelpers.ts`, `jobsAnalyticsHelpers.ts` — unclear difference
- Could be consolidated or moved to `utils/`

**Impact**: Low — localized issue, easy to fix

---

## 3. Shared Components Analysis

### Current Layout

```
frontend/src/app/shared/
├── components/
│   ├── common/                     # 12 generic components
│   │   ├── ConfirmDialog.tsx
│   │   ├── ErrorSnackbar.tsx
│   │   ├── Icon.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── NavItem.tsx
│   │   ├── ProfilePicture.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── QuickActionButton.tsx
│   │   ├── RegionAnchor.tsx
│   │   ├── RightDrawer.tsx
│   │   ├── SidebarSection.tsx
│   │   └── SprintTaskSnackbar.tsx
│   ├── sidebars/                   # Workspace sidebars
│   │   ├── AISidebar/
│   │   ├── JobsSidebar/
│   │   └── ProfileSidebar/
│   └── TopNav/                     # Top navigation
├── context/                        # React contexts
│   └── AuthContext.tsx
├── hooks/                          # Shared hooks
│   ├── useErrorHandler.ts
│   ├── useSprintTasks.ts
│   └── useUserJobs.ts
├── layouts/                        # Layout wrappers
│   ├── AppShell.tsx
│   ├── GlobalTopBar.tsx
│   └── SystemLayer.tsx
├── services/                       # Supabase & CRUD
│   ├── crud.ts
│   ├── jobMaterials.ts
│   ├── supabaseClient.ts
│   ├── types.ts
│   └── types/
│       └── aiArtifacts.ts
├── theme/                          # MUI theme
│   ├── darkTheme.tsx
│   ├── exportCssVars.ts
│   ├── factory.ts
│   ├── index.ts                   # ✓ Barrel export
│   ├── lightTheme.tsx
│   ├── mui-augmentations.d.ts
│   └── types.ts
└── utils/                          # Utilities
    ├── dateUtils.ts
    ├── pageTaskMap.ts
    └── taskOwners.ts
```

### Strengths

✓ Clear separation of concerns (components, hooks, services, theme)
✓ `theme/` has barrel export
✓ Reusable components in `common/`
✓ Centralized auth and error handling

### Issues Identified

#### 3.1 Missing Barrel Exports

**Problem**: No `index.ts` in `components/common/`, `hooks/`, `services/`, `utils/`

- Every import requires full path
- Harder to deprecate or refactor internal implementations

**Impact**: Medium — slows refactoring, verbose imports

---

#### 3.2 AI-Specific Types in Shared

**Problem**: `shared/services/types/aiArtifacts.ts` exists

- Should this be in `@workspaces/ai/types/ai.ts` instead?
- Or is it truly shared across workspaces?

**Need to verify**: Whether other workspaces use `aiArtifacts` types

---

## 4. Import Path Analysis

### Current Patterns

```tsx
// Workspace imports (good use of aliases)
import useResumeDrafts from "@workspaces/ai/hooks/useResumeDrafts";
import { useAuth } from "@shared/context/AuthContext";
import RegionAnchor from "@shared/components/common/RegionAnchor";

// Relative imports (problematic)
import GenerationCard from "../resume/GenerationCard";
import BulletMergeDialog from "../resume/BulletMergeDialog";
```

### Issues

1. Mixing relative (`../resume/`) and aliased (`@workspaces/ai/`) paths
2. No barrel exports means verbose paths like `@shared/components/common/ErrorSnackbar`
3. Refactoring breaks many import statements

---

## 5. Duplication & Dead Code Analysis

### Hooks

- **Duplicate**: `useResumeGenerationFlow.ts` (v1) + `useResumeGenerationFlowV2.ts`
  → **Action**: Remove v1, rename v2 to canonical name

### Services

- **Overlapping**: `aiGeneration.ts` exports both named functions + `aiGeneration` object
  → **Action**: Standardize to object export with named re-exports

### Utils

- **Scattered**: Preview model transforms in `utils/previewModel.ts` but related diff logic inline in components
  → **Action**: Centralize all preview/diff utilities

---

## 6. Proposed Reorganization Plan

### Phase 1: AI Workspace Cleanup (High Priority)

#### Move Components to Proper Location

```
FROM: frontend/src/app/workspaces/ai/pages/resume/
TO:   frontend/src/app/workspaces/ai/components/resume/
```

**Files to Move**:

- AIResumePreview.tsx
- ArtifactsHistoryPanel.tsx
- BulletMergeDialog.tsx
- DraftSelectorBar.tsx
- ExperienceTailoringPanel.tsx
- GenerationCard.tsx
- ResumeCustomization.tsx
- ResumeDraftPreviewPanel.tsx
- ResumeGenerationPanel.tsx
- ResumeTutorial.tsx
- ResumeValidationPanel.tsx
- ResumeVariationsPanel.tsx
- SectionControlsPanel.tsx
- SkillsAnalysisPreview.tsx
- SkillsOptimizationPanel.tsx
- TemplateManager.tsx
- VersionManagerPanel.tsx
- VersionsExportAside.tsx

**Action**: Create `components/resume/` folder, move files, update all imports in `GenerateResume/index.tsx`

---

#### Create Barrel Exports

```typescript
// New: frontend/src/app/workspaces/ai/components/resume/index.ts
export { default as GenerationCard } from "./GenerationCard";
export { default as ResumeTutorial } from "./ResumeTutorial";
export { default as DraftSelectorBar } from "./DraftSelectorBar";
// ... etc for all 18 components

// New: frontend/src/app/workspaces/ai/components/index.ts
export * from "./resume";
export { default as DiffCompareDialog } from "./DiffCompareDialog";
export { default as ResumeFullPreview } from "./ResumeFullPreview";
```

**Result**: Import becomes `import { GenerationCard, ResumeTutorial } from '@workspaces/ai/components/resume';`

---

#### Remove Deprecated Hook

```
DELETE: frontend/src/app/workspaces/ai/hooks/useResumeGenerationFlow.ts
RENAME: useResumeGenerationFlowV2.ts → useResumeGenerationFlow.ts
```

**Action**: Search codebase for `useResumeGenerationFlow` usage, update to v2, delete old file

---

#### Split GenerateResume Page

**Target**: Reduce from 1,240 lines to <300 lines

**Extract into separate files**:

1. `GenerateResume/StepperFlow.tsx` — stepper UI + navigation logic
2. `GenerateResume/ExportPanel.tsx` — PDF/DOCX export handlers
3. `GenerateResume/MaterialsLinking.tsx` — job_materials association
4. `GenerateResume/hooks/useGenerateResumeState.ts` — state management hook
5. Keep `index.tsx` as orchestrator (imports + composition)

**Structure**:

```
pages/GenerateResume/
├── index.tsx              # Main orchestrator (300 lines)
├── components/
│   ├── StepperFlow.tsx
│   ├── ExportPanel.tsx
│   └── MaterialsLinking.tsx
└── hooks/
    └── useGenerateResumeState.ts
```

---

### Phase 2: Shared Layer Cleanup (Medium Priority)

#### Add Barrel Exports

```typescript
// New: frontend/src/app/shared/components/common/index.ts
export { default as ConfirmDialog } from "./ConfirmDialog";
export { default as ErrorSnackbar } from "./ErrorSnackbar";
// ... all 12 components

// New: frontend/src/app/shared/hooks/index.ts
export { default as useErrorHandler } from "./useErrorHandler";
export { default as useSprintTasks } from "./useSprintTasks";
export { default as useUserJobs } from "./useUserJobs";

// New: frontend/src/app/shared/services/index.ts
export * from "./crud";
export * from "./supabaseClient";
export * from "./jobMaterials";
export * from "./types";
```

**Result**: `import { useErrorHandler, useSprintTasks } from '@shared/hooks';`

---

#### Verify AI Artifacts Type Location

**Question**: Should `shared/services/types/aiArtifacts.ts` move to `@workspaces/ai/types/`?

**Action**: Search for imports of `aiArtifacts` types; if only used in AI workspace, relocate

---

### Phase 3: Jobs Workspace Refinement (Low Priority)

#### Consolidate Analytics Helpers

```
MERGE: analyticsHelpers.ts + jobsAnalyticsHelpers.ts
INTO:  pages/AnalyticsPage/utils.ts (or move to shared utils if reused)
```

---

## 7. Naming Convention Standards

### Folders

- **Pages**: `PascalCase/` (e.g., `GenerateResume/`, `NewJobPage/`)
- **Components**: `PascalCase/` (e.g., `JobCard/`, `ErrorSnackbar/`)
- **Services/Utils**: `camelCase/` or flat files (e.g., `services/crud.ts`)

### Files

- **Components**: `ComponentName.tsx` (PascalCase)
- **Hooks**: `useHookName.ts` (camelCase)
- **Utils**: `utilName.ts` (camelCase)
- **Types**: `types.ts` or `TypeName.ts`
- **Barrel Exports**: Always `index.ts`

### Exceptions to Fix

- `cover_letters/` → Rename to `CoverLetters/` or merge into `GenerateCoverLetter/`

---

## 8. Quick Wins (Immediate Low-Risk Fixes)

### 1. Add Missing Barrel Exports (1 hour)

Create `index.ts` files for:

- `shared/components/common/`
- `shared/hooks/`
- `shared/services/`
- `shared/utils/`
- `workspaces/ai/components/` (after moving resume components)
- `workspaces/ai/hooks/`
- `workspaces/ai/services/`

**Impact**: Cleaner imports across entire codebase

---

### 2. Delete Deprecated Hook (30 min)

- Confirm `useResumeGenerationFlow.ts` (v1) is unused
- Delete file
- Rename v2 to canonical name

**Impact**: Reduces confusion, removes 200 lines of dead code

---

### 3. Fix Naming Inconsistency (15 min)

- Rename `cover_letters/` → `CoverLetters/`
- Update router import paths

**Impact**: Professional consistency

---

## 9. Testing Strategy for Refactor

### Pre-Refactor Checklist

- [ ] Run `npm run typecheck` in frontend (baseline)
- [ ] Run `npm run lint` (baseline)
- [ ] Verify `npm run dev` starts without errors
- [ ] Manually test GenerateResume flow (generate → preview → apply)

### During Refactor

- [ ] Move 1-2 components at a time
- [ ] Update imports incrementally
- [ ] Run typecheck after each batch
- [ ] Commit after each stable checkpoint

### Post-Refactor Validation

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All routes load without 404s
- [ ] GenerateResume flow works end-to-end
- [ ] No broken imports in browser console

---

## 10. Summary & Next Steps

### Key Metrics

- **AI workspace**: 18 components misplaced, 1 page >1,200 lines
- **Jobs workspace**: Well-organized, minor improvements needed
- **Shared layer**: Missing 4+ barrel exports
- **Total files to touch**: ~30-40 (imports + component moves)

### Recommended Order

1. **Now**: Create barrel exports (quick, low-risk)
2. **Next**: Move `pages/resume/` → `components/resume/` (moderate risk, high impact)
3. **Then**: Split `GenerateResume/index.tsx` into sub-components (high risk, high value)
4. **Finally**: Consolidate hooks and utilities (low risk, cleanup)

### Risk Assessment

- **Low Risk**: Barrel exports, deleting dead code, renaming folders
- **Medium Risk**: Moving components (many import changes, but TypeScript catches errors)
- **High Risk**: Splitting GenerateResume page (complex state dependencies)

---

## Appendix: File Counts by Category

| Category   | AI Workspace       | Jobs Workspace | Shared |
| ---------- | ------------------ | -------------- | ------ |
| Pages      | 8                  | 7              | 0      |
| Components | 2 (+ 18 misplaced) | 7              | 12     |
| Hooks      | 3                  | 0              | 3      |
| Services   | 2                  | 0              | 5      |
| Utils      | 2                  | 0              | 3      |
| Types      | 1                  | 0              | 2      |

**Total Files Analyzed**: ~90

---

**End of Inventory**
