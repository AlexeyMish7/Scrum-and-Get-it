# Frontend Reorganization Plan

**Date**: November 9, 2025
**Purpose**: Detailed refactoring plan with exact file moves, import updates, and migration scripts

---

## Overview

This plan reorganizes the frontend workspace to establish:

1. **Clear component ownership**: Route pages vs reusable components
2. **Consistent structure**: Every workspace follows the same pattern
3. **Barrel exports**: Simplified imports and easier refactoring
4. **Reduced complexity**: Split mega-files into manageable pieces

---

## Phase 1: AI Workspace Component Reorganization

### 1.1 Move Resume Components to Proper Location

**Rationale**: 18 components currently in `pages/resume/` are **reusable UI components**, not route entry points. They should live in `components/resume/` for clarity and reusability.

#### File Moves (18 files)

```
SOURCE: frontend/src/app/workspaces/ai/pages/resume/
TARGET: frontend/src/app/workspaces/ai/components/resume/
```

| Source File                    | Destination                                      | Component Type   | Used By                               |
| ------------------------------ | ------------------------------------------------ | ---------------- | ------------------------------------- |
| `AIResumePreview.tsx`          | `components/resume/AIResumePreview.tsx`          | Preview renderer | GenerateResume                        |
| `ArtifactsHistoryPanel.tsx`    | `components/resume/ArtifactsHistoryPanel.tsx`    | Advanced panel   | GenerateResume                        |
| `BulletMergeDialog.tsx`        | `components/resume/BulletMergeDialog.tsx`        | Modal dialog     | GenerateResume, ResumeVariationsPanel |
| `DraftSelectorBar.tsx`         | `components/resume/DraftSelectorBar.tsx`         | UI control       | GenerateResume                        |
| `ExperienceTailoringPanel.tsx` | `components/resume/ExperienceTailoringPanel.tsx` | Advanced panel   | GenerateResume                        |
| `GenerationCard.tsx`           | `components/resume/GenerationCard.tsx`           | Card UI          | GenerateResume                        |
| `ResumeCustomization.tsx`      | `components/resume/ResumeCustomization.tsx`      | Settings panel   | GenerateResume                        |
| `ResumeDraftPreviewPanel.tsx`  | `components/resume/ResumeDraftPreviewPanel.tsx`  | Preview panel    | GenerateResume                        |
| `ResumeGenerationPanel.tsx`    | `components/resume/ResumeGenerationPanel.tsx`    | Generation UI    | GenerateResume                        |
| `ResumeTutorial.tsx`           | `components/resume/ResumeTutorial.tsx`           | Onboarding       | GenerateResume                        |
| `ResumeValidationPanel.tsx`    | `components/resume/ResumeValidationPanel.tsx`    | Advanced panel   | GenerateResume                        |
| `ResumeVariationsPanel.tsx`    | `components/resume/ResumeVariationsPanel.tsx`    | Advanced panel   | GenerateResume                        |
| `SectionControlsPanel.tsx`     | `components/resume/SectionControlsPanel.tsx`     | Section editor   | GenerateResume                        |
| `SkillsAnalysisPreview.tsx`    | `components/resume/SkillsAnalysisPreview.tsx`    | Preview card     | GenerateResume                        |
| `SkillsOptimizationPanel.tsx`  | `components/resume/SkillsOptimizationPanel.tsx`  | Advanced panel   | GenerateResume                        |
| `TemplateManager.tsx`          | `components/resume/TemplateManager.tsx`          | Template UI      | GenerateResume                        |
| `VersionManagerPanel.tsx`      | `components/resume/VersionManagerPanel.tsx`      | Advanced panel   | GenerateResume                        |
| `VersionsExportAside.tsx`      | `components/resume/VersionsExportAside.tsx`      | Export sidebar   | GenerateResume                        |

**Action Steps**:

1. Create folder: `frontend/src/app/workspaces/ai/components/resume/`
2. Move all 18 files from `pages/resume/` → `components/resume/`
3. Delete empty `pages/resume/` folder

---

### 1.2 Create Barrel Exports for AI Components

**Rationale**: Barrel exports (`index.ts`) allow importing multiple components from a single path and make future refactoring easier.

#### New File: `frontend/src/app/workspaces/ai/components/resume/index.ts`

```typescript
/**
 * Resume-specific UI components
 * Barrel export for simplified imports
 */

// Preview & Display
export { default as AIResumePreview } from "./AIResumePreview";
export { default as ResumeFullPreview } from "../ResumeFullPreview"; // Re-export top-level
export { default as ResumeDraftPreviewPanel } from "./ResumeDraftPreviewPanel";
export { default as SkillsAnalysisPreview } from "./SkillsAnalysisPreview";

// Generation & Selection
export { default as GenerationCard } from "./GenerationCard";
export { default as ResumeGenerationPanel } from "./ResumeGenerationPanel";
export { default as DraftSelectorBar } from "./DraftSelectorBar";

// Advanced Panels (lazy-loadable)
export { default as ArtifactsHistoryPanel } from "./ArtifactsHistoryPanel";
export { default as ResumeVariationsPanel } from "./ResumeVariationsPanel";
export { default as VersionManagerPanel } from "./VersionManagerPanel";
export { default as ResumeValidationPanel } from "./ResumeValidationPanel";
export { default as SkillsOptimizationPanel } from "./SkillsOptimizationPanel";
export { default as ExperienceTailoringPanel } from "./ExperienceTailoringPanel";
export { default as TemplateManager } from "./TemplateManager";

// Editors & Controls
export { default as SectionControlsPanel } from "./SectionControlsPanel";
export { default as ResumeCustomization } from "./ResumeCustomization";

// Dialogs & Modals
export { default as BulletMergeDialog } from "./BulletMergeDialog";
export { default as DiffCompareDialog } from "../DiffCompareDialog"; // Re-export

// Onboarding & Aside
export { default as ResumeTutorial } from "./ResumeTutorial";
export { default as VersionsExportAside } from "./VersionsExportAside";
```

#### New File: `frontend/src/app/workspaces/ai/components/index.ts`

```typescript
/**
 * AI Workspace Components
 * Top-level barrel export
 */

// Resume components
export * from "./resume";

// Standalone components
export { default as DiffCompareDialog } from "./DiffCompareDialog";
export { default as ResumeFullPreview } from "./ResumeFullPreview";
```

**Result**: Import becomes:

```typescript
import {
  GenerationCard,
  ResumeTutorial,
  DraftSelectorBar,
  BulletMergeDialog,
  ResumeFullPreview,
} from "@workspaces/ai/components/resume";
```

---

### 1.3 Update Imports in GenerateResume Page

**File**: `frontend/src/app/workspaces/ai/pages/GenerateResume/index.tsx`

#### Before (current):

```typescript
import GenerationCard from "../resume/GenerationCard";
import ResumeTutorial from "../resume/ResumeTutorial";
import VersionsExportAside from "../resume/VersionsExportAside";
import DraftSelectorBar from "../resume/DraftSelectorBar";
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
import BulletMergeDialog from "../resume/BulletMergeDialog";
import SectionControlsPanel from "../resume/SectionControlsPanel";
import DiffCompareDialog from "@workspaces/ai/components/DiffCompareDialog";
import ResumeFullPreview from "@workspaces/ai/components/ResumeFullPreview";
```

#### After (with barrel exports):

```typescript
import {
  GenerationCard,
  ResumeTutorial,
  VersionsExportAside,
  DraftSelectorBar,
  BulletMergeDialog,
  SectionControlsPanel,
  DiffCompareDialog,
  ResumeFullPreview,
} from "@workspaces/ai/components/resume";

// Lazy-loaded panels
const ResumeVariationsPanel = lazy(() =>
  import("@workspaces/ai/components/resume").then((m) => ({
    default: m.ResumeVariationsPanel,
  }))
);
const ArtifactsHistoryPanel = lazy(() =>
  import("@workspaces/ai/components/resume").then((m) => ({
    default: m.ArtifactsHistoryPanel,
  }))
);
const VersionManagerPanel = lazy(() =>
  import("@workspaces/ai/components/resume").then((m) => ({
    default: m.VersionManagerPanel,
  }))
);
const ResumeValidationPanel = lazy(() =>
  import("@workspaces/ai/components/resume").then((m) => ({
    default: m.ResumeValidationPanel,
  }))
);
const ResumeDraftPreviewPanel = lazy(() =>
  import("@workspaces/ai/components/resume").then((m) => ({
    default: m.ResumeDraftPreviewPanel,
  }))
);
const AIResumePreview = lazy(() =>
  import("@workspaces/ai/components/resume").then((m) => ({
    default: m.AIResumePreview,
  }))
);
const SkillsAnalysisPreview = lazy(() =>
  import("@workspaces/ai/components/resume").then((m) => ({
    default: m.SkillsAnalysisPreview,
  }))
);
```

**Note**: Lazy imports from barrel exports require `.then(m => ({ default: m.ComponentName }))` syntax.

**Alternative** (keep individual lazy imports for better code-splitting):

```typescript
// Eager imports from barrel
import {
  GenerationCard,
  ResumeTutorial,
  VersionsExportAside,
  DraftSelectorBar,
  BulletMergeDialog,
  SectionControlsPanel,
  DiffCompareDialog,
  ResumeFullPreview,
} from "@workspaces/ai/components/resume";

// Keep individual lazy imports for optimal code-splitting
const ResumeVariationsPanel = lazy(
  () => import("@workspaces/ai/components/resume/ResumeVariationsPanel")
);
const ArtifactsHistoryPanel = lazy(
  () => import("@workspaces/ai/components/resume/ArtifactsHistoryPanel")
);
// ... etc
```

**Decision**: Use alternative approach to preserve code-splitting benefits.

---

### 1.4 Update Cross-Component Imports

**File**: `frontend/src/app/workspaces/ai/pages/resume/ResumeVariationsPanel.tsx`
**Current Import**: `import BulletMergeDialog from './BulletMergeDialog';`
**New Import**: `import { BulletMergeDialog } from '@workspaces/ai/components/resume';`

**Action**: Search for all relative imports (`./`, `../`) within moved components and update to use barrel exports.

---

### 1.5 Add Barrel Exports for Hooks

**New File**: `frontend/src/app/workspaces/ai/hooks/index.ts`

```typescript
/**
 * AI Workspace Hooks
 */

export { default as useResumeDrafts } from "./useResumeDrafts";
export { default as useResumeGenerationFlow } from "./useResumeGenerationFlowV2"; // Use v2 as canonical
export type {
  ResumeDraftRecord,
  ResumeDraftContentExperienceItem,
  UseResumeDraftsApi,
} from "./useResumeDrafts";
export type {
  SegmentKey,
  SegmentStatus,
  FlowOptionsV2,
  FlowStateMap,
  UnifiedResultV2,
} from "./useResumeGenerationFlowV2";
```

**Action**:

1. Delete `useResumeGenerationFlow.ts` (v1 — deprecated)
2. Rename `useResumeGenerationFlowV2.ts` → `useResumeGenerationFlow.ts`
3. Update all imports of `useResumeGenerationFlowV2` → `useResumeGenerationFlow`
4. Create barrel export

---

### 1.6 Add Barrel Exports for Services

**New File**: `frontend/src/app/workspaces/ai/services/index.ts`

```typescript
/**
 * AI Workspace Services
 */

export * from "./aiGeneration";
export { default as aiGeneration } from "./aiGeneration";
export { default as aiClient } from "./client";
```

---

### 1.7 Add Barrel Exports for Utils

**New File**: `frontend/src/app/workspaces/ai/utils/index.ts`

```typescript
/**
 * AI Workspace Utilities
 */

export * from "./previewModel";
export { tooltipMap } from "./tooltipMap";
```

---

### 1.8 Rename Inconsistent Folder

**Current**: `frontend/src/app/workspaces/ai/pages/cover_letters/`
**Target**: `frontend/src/app/workspaces/ai/pages/CoverLetters/` (or merge into `GenerateCoverLetter/`)

**Decision**: Merge into `GenerateCoverLetter/` if content is minimal; otherwise rename to PascalCase.

**Action**: Check contents of `cover_letters/` and decide merge vs rename.

---

## Phase 2: Shared Layer Barrel Exports

### 2.1 Add Barrel Export for Common Components

**New File**: `frontend/src/app/shared/components/common/index.ts`

```typescript
/**
 * Shared Common Components
 */

export { default as ConfirmDialog } from "./ConfirmDialog";
export { default as ErrorSnackbar } from "./ErrorSnackbar";
export { default as Icon } from "./Icon";
export { default as LoadingSpinner } from "./LoadingSpinner";
export { default as NavItem } from "./NavItem";
export { default as ProfilePicture } from "./ProfilePicture";
export { default as ProtectedRoute } from "./ProtectedRoute";
export { default as QuickActionButton } from "./QuickActionButton";
export { default as RegionAnchor } from "./RegionAnchor";
export { default as RightDrawer } from "./RightDrawer";
export { default as SidebarSection } from "./SidebarSection";
export { default as SprintTaskSnackbar } from "./SprintTaskSnackbar";
```

**Before**:

```typescript
import ErrorSnackbar from "@shared/components/common/ErrorSnackbar";
import LoadingSpinner from "@shared/components/common/LoadingSpinner";
```

**After**:

```typescript
import { ErrorSnackbar, LoadingSpinner } from "@shared/components/common";
```

---

### 2.2 Add Barrel Export for Shared Hooks

**New File**: `frontend/src/app/shared/hooks/index.ts`

```typescript
/**
 * Shared Hooks
 */

export { default as useErrorHandler } from "./useErrorHandler";
export { default as useSprintTasks } from "./useSprintTasks";
export { default as useUserJobs } from "./useUserJobs";
```

---

### 2.3 Add Barrel Export for Shared Services

**New File**: `frontend/src/app/shared/services/index.ts`

```typescript
/**
 * Shared Services
 */

export * from "./crud";
export { default as supabaseClient } from "./supabaseClient";
export * from "./jobMaterials";
export type { Database } from "./types";
export type { AIArtifact, AIArtifactSummary } from "./types/aiArtifacts";
```

---

### 2.4 Add Barrel Export for Shared Utils

**New File**: `frontend/src/app/shared/utils/index.ts`

```typescript
/**
 * Shared Utilities
 */

export * from "./dateUtils";
export { pageTaskMap } from "./pageTaskMap";
export { taskOwners } from "./taskOwners";
```

---

## Phase 3: GenerateResume Page Refactoring

### 3.1 Split into Sub-Components

**Goal**: Reduce `GenerateResume/index.tsx` from 1,240 lines to <300 lines.

#### New Structure:

```
pages/GenerateResume/
├── index.tsx                       # Orchestrator (imports + composition)
├── components/
│   ├── StepperFlow.tsx            # Stepper UI + navigation
│   ├── ExportPanel.tsx            # PDF/DOCX export handlers
│   ├── MaterialsLinking.tsx       # job_materials association
│   └── AdvancedToolsPanel.tsx     # Collapsible advanced features
└── hooks/
    └── useGenerateResumeState.ts  # Centralized state management
```

---

#### 3.1.1 Extract Stepper Logic

**New File**: `pages/GenerateResume/components/StepperFlow.tsx`

**Responsibilities**:

- Render MUI Stepper
- Handle step navigation (next, back, skip)
- Manage active step state
- Integrate with generation flow hook

**Exports**:

```typescript
export default function StepperFlow({
  activeStep,
  onStepChange,
  canAdvance,
}: {
  activeStep: number;
  onStepChange: (step: number) => void;
  canAdvance: boolean;
}) { ... }
```

---

#### 3.1.2 Extract Export Handlers

**New File**: `pages/GenerateResume/components/ExportPanel.tsx`

**Responsibilities**:

- PDF export (via docx → jsPDF)
- DOCX export (via docx library)
- File download triggers
- Export progress indicators

**Exports**:

```typescript
export default function ExportPanel({
  previewContent,
  onExport,
}: {
  previewContent: ResumePreviewModel;
  onExport: (file: Blob, filename: string) => void;
}) { ... }
```

---

#### 3.1.3 Extract Materials Linking

**New File**: `pages/GenerateResume/components/MaterialsLinking.tsx`

**Responsibilities**:

- Job selection dropdown
- Link resume/cover letter to job
- Display current materials for job
- Unlink materials

**Exports**:

```typescript
export default function MaterialsLinking({
  jobId,
  artifactId,
  onLink,
}: {
  jobId: number | null;
  artifactId: string | null;
  onLink: (jobId: number, artifactId: string) => Promise<void>;
}) { ... }
```

---

#### 3.1.4 Extract State Management Hook

**New File**: `pages/GenerateResume/hooks/useGenerateResumeState.ts`

**Responsibilities**:

- Consolidate all `useState` calls from main component
- Provide typed state object and setters
- Handle derived state (e.g., canAdvance, hasChanges)

**Exports**:

```typescript
export default function useGenerateResumeState() {
  const [activeStep, setActiveStep] = useState(0);
  const [lastContent, setLastContent] = useState<ResumeArtifactContent | null>(null);
  const [lastJobId, setLastJobId] = useState<number | null>(null);
  // ... all state

  return {
    state: { activeStep, lastContent, lastJobId, /* ... */ },
    actions: { setActiveStep, setLastContent, setLastJobId, /* ... */ },
    computed: { canAdvance: /* logic */, hasChanges: /* logic */ },
  };
}
```

---

#### 3.1.5 Refactored Main Component

**Updated**: `pages/GenerateResume/index.tsx`

**Target Size**: ~250-300 lines

**Structure**:

```typescript
import { /* MUI */ } from '@mui/material';
import {
  GenerationCard,
  ResumeTutorial,
  DraftSelectorBar,
  // ... other components
} from '@workspaces/ai/components/resume';
import StepperFlow from './components/StepperFlow';
import ExportPanel from './components/ExportPanel';
import MaterialsLinking from './components/MaterialsLinking';
import AdvancedToolsPanel from './components/AdvancedToolsPanel';
import useGenerateResumeState from './hooks/useGenerateResumeState';

export default function GenerateResume() {
  const { state, actions, computed } = useGenerateResumeState();
  const { user } = useAuth();
  const { active, applyOrderedSkills, /* ... */ } = useResumeDrafts();
  const { showSuccess, handleError } = useErrorHandler();

  // Handlers (onGenerate, onApply, onExport, etc.) — keep concise
  const handleGenerate = useCallback(/* ... */, [/* deps */]);
  const handleApply = useCallback(/* ... */, [/* deps */]);
  const handleExport = useCallback(/* ... */, [/* deps */]);

  return (
    <Box>
      <StepperFlow
        activeStep={state.activeStep}
        onStepChange={actions.setActiveStep}
        canAdvance={computed.canAdvance}
      />

      {/* Step content */}
      {state.activeStep === 0 && <DraftSelectorBar /* ... */ />}
      {state.activeStep === 1 && <GenerationCard onGenerate={handleGenerate} />}
      {state.activeStep === 2 && <ExportPanel previewContent={/* ... */} onExport={handleExport} />}

      {/* Advanced tools (collapsed) */}
      <AdvancedToolsPanel /* ... */ />

      {/* Dialogs */}
      <DiffCompareDialog /* ... */ />
      <BulletMergeDialog /* ... */ />
    </Box>
  );
}
```

---

## Phase 4: Migration Scripts

### 4.1 Automated File Move Script

**Script**: `frontend/scripts/move-ai-components.sh` (or `.ps1` for Windows)

```powershell
# PowerShell script to move AI components

$sourceDir = "src/app/workspaces/ai/pages/resume"
$targetDir = "src/app/workspaces/ai/components/resume"

# Create target directory
New-Item -ItemType Directory -Force -Path $targetDir

# Move files
$files = @(
  "AIResumePreview.tsx",
  "ArtifactsHistoryPanel.tsx",
  "BulletMergeDialog.tsx",
  "DraftSelectorBar.tsx",
  "ExperienceTailoringPanel.tsx",
  "GenerationCard.tsx",
  "ResumeCustomization.tsx",
  "ResumeDraftPreviewPanel.tsx",
  "ResumeGenerationPanel.tsx",
  "ResumeTutorial.tsx",
  "ResumeValidationPanel.tsx",
  "ResumeVariationsPanel.tsx",
  "SectionControlsPanel.tsx",
  "SkillsAnalysisPreview.tsx",
  "SkillsOptimizationPanel.tsx",
  "TemplateManager.tsx",
  "VersionManagerPanel.tsx",
  "VersionsExportAside.tsx"
)

foreach ($file in $files) {
  Move-Item "$sourceDir/$file" "$targetDir/$file"
  Write-Host "Moved $file"
}

# Remove empty source directory
Remove-Item -Path $sourceDir -Force

Write-Host "Component migration complete!"
```

**Usage**:

```powershell
cd frontend
.\scripts\move-ai-components.ps1
```

---

### 4.2 Import Update Script (find-and-replace)

**Tool**: VS Code's find-and-replace with regex

**Pattern 1**: Update relative imports to barrel exports

- **Find**: `from ['"]\.\./resume/([A-Za-z]+)['"]`
- **Replace**: `from '@workspaces/ai/components/resume'`
- **Manual**: Add component to import destructuring

**Pattern 2**: Update lazy imports

- **Find**: `lazy\(\(\) => import\(['"]\.\.\/resume\/([A-Za-z]+)['"]\)\)`
- **Replace**: `lazy(() => import('@workspaces/ai/components/resume/$1'))`

---

### 4.3 Validation Script

**Script**: `frontend/scripts/validate-refactor.sh`

```bash
#!/bin/bash
# Validation script for refactor

echo "Running TypeScript type check..."
npm run typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type check failed"
  exit 1
fi

echo "Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "⚠️  Lint warnings/errors found"
fi

echo "Testing dev server startup..."
timeout 30s npm run dev &
DEV_PID=$!
sleep 15

if ps -p $DEV_PID > /dev/null; then
  echo "✅ Dev server started successfully"
  kill $DEV_PID
else
  echo "❌ Dev server failed to start"
  exit 1
fi

echo "✅ All validation checks passed"
```

---

## Phase 5: Implementation Checklist

### 5.1 Pre-Refactor Checklist

- [ ] Run `npm run typecheck` (baseline)
- [ ] Run `npm run lint` (baseline)
- [ ] Create feature branch: `git checkout -b refactor/frontend-reorg`
- [ ] Tag current commit: `git tag pre-refactor-$(date +%Y%m%d)`
- [ ] Backup current state: `git stash push -m "pre-refactor backup"`

---

### 5.2 Phase 1: Component Moves (AI Workspace)

#### Batch 1: Create barrel exports (no breaking changes)

- [ ] Create `ai/components/resume/index.ts` (barrel export)
- [ ] Create `ai/components/index.ts` (top-level barrel)
- [ ] Create `ai/hooks/index.ts`
- [ ] Create `ai/services/index.ts`
- [ ] Create `ai/utils/index.ts`
- [ ] Run `npm run typecheck` (should still pass)
- [ ] Commit: "feat: add barrel exports for AI workspace"

#### Batch 2: Move components (1-5 files at a time)

- [ ] Move `GenerationCard.tsx`, `ResumeTutorial.tsx`, `DraftSelectorBar.tsx`
- [ ] Update imports in `GenerateResume/index.tsx` for these 3 files
- [ ] Run `npm run typecheck` (fix any errors)
- [ ] Commit: "refactor: move GenerationCard, ResumeTutorial, DraftSelectorBar"

- [ ] Move `BulletMergeDialog.tsx`, `SectionControlsPanel.tsx`, `VersionsExportAside.tsx`
- [ ] Update imports
- [ ] Run `npm run typecheck`
- [ ] Commit: "refactor: move BulletMergeDialog, SectionControlsPanel, VersionsExportAside"

- [ ] Move remaining 12 components (in 2-3 batches)
- [ ] Update all imports
- [ ] Run `npm run typecheck` after each batch
- [ ] Commit after each batch

#### Batch 3: Clean up deprecated files

- [ ] Delete `useResumeGenerationFlow.ts` (v1)
- [ ] Rename `useResumeGenerationFlowV2.ts` → `useResumeGenerationFlow.ts`
- [ ] Update imports of v2 hook
- [ ] Run `npm run typecheck`
- [ ] Commit: "refactor: consolidate generation hooks, remove v1"

#### Batch 4: Delete empty folders

- [ ] Delete `pages/resume/` (now empty)
- [ ] Check for orphaned gitkeep files
- [ ] Commit: "chore: remove empty folders after reorganization"

---

### 5.3 Phase 2: Shared Layer Barrel Exports

- [ ] Create `shared/components/common/index.ts`
- [ ] Create `shared/hooks/index.ts`
- [ ] Create `shared/services/index.ts`
- [ ] Create `shared/utils/index.ts`
- [ ] Run `npm run typecheck`
- [ ] Commit: "feat: add barrel exports for shared layer"

---

### 5.4 Phase 3: GenerateResume Refactor (optional, high-risk)

**Note**: This phase is optional and should be done in a separate PR after Phase 1-2 stabilize.

- [ ] Create `GenerateResume/components/` folder
- [ ] Create `GenerateResume/hooks/` folder
- [ ] Extract `StepperFlow.tsx`
- [ ] Extract `ExportPanel.tsx`
- [ ] Extract `MaterialsLinking.tsx`
- [ ] Extract `useGenerateResumeState.ts`
- [ ] Refactor `index.tsx` to use extracted components
- [ ] Run `npm run typecheck`
- [ ] Manual test: Generate → Apply → Export flow
- [ ] Commit: "refactor: split GenerateResume into sub-components"

---

### 5.5 Post-Refactor Validation

- [ ] Run `npm run typecheck` (must pass)
- [ ] Run `npm run lint` (fix critical errors)
- [ ] Run `npm run dev` and verify startup
- [ ] Manual test checklist:
  - [ ] Navigate to `/ai/resume`
  - [ ] Select draft
  - [ ] Generate resume
  - [ ] Apply to draft
  - [ ] Preview updates correctly
  - [ ] Export to PDF
  - [ ] Link to job materials
- [ ] Check browser console for errors
- [ ] Commit: "test: validate full GenerateResume flow"

---

## Phase 6: Rollback Strategy

### 6.1 Rollback to Pre-Refactor State

```bash
# Revert to tagged commit
git reset --hard pre-refactor-$(date +%Y%m%d)

# Or revert specific commits
git revert <commit-hash>
```

### 6.2 Partial Rollback (Cherry-Pick)

If only certain batches need reverting:

```bash
# Identify problematic commit
git log --oneline

# Revert specific commit
git revert <commit-hash>

# Or reset to specific commit and re-apply safe changes
git reset --hard <safe-commit-hash>
git cherry-pick <safe-commit-1> <safe-commit-2>
```

---

## Phase 7: Documentation Updates

### 7.1 Update Import Conventions Doc

**File**: `docs/development/import-conventions.md` (create if missing)

````markdown
# Import Conventions

## Workspace Imports

Always use aliased imports for workspace modules:

```typescript
// ✅ Correct
import { GenerationCard } from "@workspaces/ai/components/resume";
import { useErrorHandler } from "@shared/hooks";

// ❌ Avoid
import GenerationCard from "../../components/resume/GenerationCard";
```
````

## Barrel Exports

Use barrel exports for component groups:

- `@workspaces/ai/components` → AI workspace components
- `@shared/components/common` → Shared UI components
- `@shared/hooks` → Shared hooks

```

---

### 7.2 Update Project Structure Doc

**File**: `docs/project-structure.md`

Add updated folder structure diagrams reflecting new organization.

---

## Summary

### File Moves
- **18 components** moved from `pages/resume/` → `components/resume/`
- **1 deprecated hook** deleted
- **1 hook** renamed (v2 → canonical)

### New Files Created
- **9 barrel export files** (`index.ts` in various folders)
- **4 sub-components** for GenerateResume (optional Phase 3)

### Import Changes
- **~40-50 import statements** updated in `GenerateResume/index.tsx`
- **~10-15 import statements** updated in moved components

### Risk Mitigation
- Incremental commits (1-5 files at a time)
- Type checking after each batch
- Manual testing after major batches
- Rollback tags and scripts

### Estimated Time
- **Phase 1-2** (barrel exports + component moves): 3-4 hours
- **Phase 3** (GenerateResume split): 4-6 hours (optional)
- **Testing & validation**: 2-3 hours

**Total**: 5-13 hours depending on whether Phase 3 is included.

---

**End of Reorganization Plan**
```
