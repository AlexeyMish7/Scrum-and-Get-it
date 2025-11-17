# Job Pipeline Workspace

> **Clean, organized structure for job application tracking and management**

## 📁 Directory Structure

```
job_pipeline/
├── types/                          # TypeScript type definitions
│   ├── job.types.ts               # Job entity and form types
│   ├── pipeline.types.ts          # Pipeline stages and filters
│   ├── analytics.types.ts         # Statistics and metrics
│   ├── navigation.types.ts        # Navigation and view types
│   └── index.ts                   # Barrel export
│
├── components/                     # Reusable UI components
│   ├── cards/                      # Card components
│   │   ├── JobCard/               # Individual job card display
│   │   ├── SalaryResearchCard/    # Salary information card
│   │   └── BenchmarkCard/         # Benchmark comparison card
│   │
│   ├── dialogs/                    # Modal dialogs
│   │   ├── JobFormDialog/         # Create/edit job form
│   │   ├── JobAnalyticsDialog/    # Job analytics modal
│   │   └── LinkDocumentDialog/    # Document linking modal
│   │
│   ├── analytics/                  # Analytics components
│   │   ├── AnalyticsPanel/        # Full analytics panel
│   │   ├── MatchAnalysisPanel/    # Job match analysis
│   │   ├── MatchScoreBadge/       # Match score indicator
│   │   ├── PipelineAnalytics/     # Pipeline statistics
│   │   └── ApproachSuccessChart/  # Success metrics chart
│   │
│   ├── timeline/                   # Timeline components
│   │   └── ApplicationTimeline/   # Application history timeline
│   │
│   ├── calendar/                   # Calendar components
│   │   ├── DeadlineCalendar/      # Deadline calendar view
│   │   └── NextDeadlinesWidget/   # Upcoming deadlines widget
│   │
│   ├── search/                     # Search & filter components
│   │   ├── JobSearchFilters/      # Advanced search filters
│   │   └── ArchiveToggle/         # Archive toggle control
│   │
│   ├── import/                     # Import components
│   │   └── JobImportURL/          # URL-based job import
│   │
│   ├── documents/                  # Document components
│   │   └── DocumentsDrawer/       # Documents side drawer
│   │
│   └── details/                    # Detail view components
│       └── JobDetails/            # Detailed job information
│
├── pages/                          # Page-level components
│   ├── PipelinePage/              # Main kanban pipeline view
│   ├── JobDetailsPage/            # Job detail page with tabs
│   ├── NewJobPage/                # Create new job page
│   ├── AnalyticsPage/             # Analytics dashboard
│   ├── DocumentsPage/             # Documents management
│   ├── SavedSearchesPage/         # Saved search queries
│   ├── AutomationsPage/           # Automation configuration
│   └── ArchivedJobsPage/          # Archived jobs view
│
├── hooks/                          # Custom React hooks
│   ├── useJobsPipeline.ts         # Pipeline state management
│   ├── useJobMatch.ts             # AI job matching logic
│   ├── useJobsSearch.ts           # Search and filter logic
│   ├── useJobsPagination.ts       # Pagination state
│   └── index.ts                   # Barrel export
│
├── services/                       # Data layer
│   ├── jobsService.ts             # Job CRUD operations
│   ├── pipelineService.ts         # Pipeline-specific operations
│   ├── analyticsCache.ts          # Analytics caching layer
│   ├── index.ts                   # Barrel export
│   └── __tests__/                 # Service unit tests
│
├── views/                          # Composite views
│   ├── PipelineView/              # Pipeline kanban view
│   ├── AnalyticsView/             # Analytics composite view
│   ├── DocumentsView/             # Documents composite view
│   ├── ProfileView/               # Profile composite view
│   └── index.ts                   # Barrel export
│
├── widgets/                        # Dashboard widgets
│   └── CalendarWidget/            # Calendar dashboard widget
│
├── layouts/                        # Layout components
│   ├── JobPipelineLayout.tsx      # Main workspace layout
│   └── UnifiedJobsLayout.tsx      # Unified tabbed layout
│
├── navigation/                     # Navigation
│   ├── JobsNavBar.tsx             # Navigation bar component
│   └── types.ts                   # Navigation type definitions
│
├── index.ts                        # Main workspace export
└── README.md                       # This file
```

## 🎯 Design Principles

### 1. **Separation of Concerns**

- **Types**: Organized by domain (job, pipeline, analytics, navigation)
- **Components**: Categorized by function (cards, dialogs, analytics, etc.)
- **Pages**: Top-level routes and views
- **Hooks**: Business logic and state management
- **Services**: Data layer and API interactions

### 2. **Modular Organization**

- Each component in its own directory with index.ts for clean imports
- Related components grouped together (e.g., all analytics components)
- Clear naming conventions (e.g., `JobCard`, `MatchAnalysisPanel`)

### 3. **Reusability**

- Components are self-contained and reusable
- Hooks encapsulate reusable logic
- Types are shared across the workspace

### 4. **Discoverability**

- Clear folder names indicate purpose
- README documents structure
- Index files provide barrel exports for easy importing

## 📦 Import Patterns

### Type Imports

```typescript
import type {
  JobRow,
  PipelineStage,
  JobStats,
} from "@workspaces/job_pipeline/types";
```

### Component Imports

```typescript
// Import from category index
import {
  JobCard,
  MatchScoreBadge,
} from "@workspaces/job_pipeline/components/cards";
import { JobFormDialog } from "@workspaces/job_pipeline/components/dialogs";

// Or import from main components index
import {
  JobCard,
  JobFormDialog,
  MatchScoreBadge,
} from "@workspaces/job_pipeline/components";
```

### Hook Imports

```typescript
import { useJobsPipeline, useJobMatch } from "@workspaces/job_pipeline/hooks";
```

### Service Imports

```typescript
import {
  jobsService,
  pipelineService,
} from "@workspaces/job_pipeline/services";
```

### Page Imports

```typescript
import { PipelinePage, AnalyticsPage } from "@workspaces/job_pipeline/pages";
```

## 🔧 Adding New Components

### 1. Create Component Directory

```bash
mkdir -p components/[category]/[ComponentName]
```

### 2. Add Component Files

```
components/[category]/[ComponentName]/
├── [ComponentName].tsx    # Main component
├── index.ts              # Export (optional)
└── [ComponentName].test.tsx  # Tests (optional)
```

### 3. Update Category Index

```typescript
// components/[category]/index.ts
export { default as ComponentName } from "./ComponentName";
```

### 4. Component Template

```typescript
/**
 * COMPONENT_NAME
 * Brief description of what this component does.
 */

import React from "react";
import type { ComponentProps } from "./types"; // If complex

interface ComponentNameProps {
  // Props definition
}

export default function ComponentName({ ...props }: ComponentNameProps) {
  return (
    // Component JSX
  );
}
```

## 🧪 Testing

Tests are colocated with their components or in `__tests__` directories for services.

```
components/cards/JobCard/JobCard.test.tsx
services/__tests__/jobsService.test.ts
```

## 📝 Type Organization

### job.types.ts

- `JobRow`: Database entity
- `JobFormData`: Form input structure
- `JobWithMetadata`: Enhanced job with computed fields

### pipeline.types.ts

- `PipelineStage`: Kanban column stages
- `JobFilters`: Search and filter options
- `PaginatedJobs`: Pagination result structure

### analytics.types.ts

- `JobStats`: Statistical aggregations
- `MatchData`: AI matching results
- `AnalyticsCacheEntry`: Cache metadata

### navigation.types.ts

- `JobsView`: Available view types
- `NavItem`: Navigation item structure

## 🚀 Migration from Old Structure

The old `/jobs` workspace had a flatter structure with less organization. This new structure:

1. ✅ Groups related components together
2. ✅ Separates types by domain
3. ✅ Makes imports more intuitive
4. ✅ Improves maintainability
5. ✅ Scales better with growth

### Import Path Updates

Old:

```typescript
import JobCard from "@workspaces/jobs/components/JobCard/JobCard";
import type { JobRow } from "@workspaces/jobs/types/jobs.types";
import { useJobsPipeline } from "@workspaces/jobs/hooks";
```

New:

```typescript
import { JobCard } from "@workspaces/job_pipeline/components/cards";
import type { JobRow } from "@workspaces/job_pipeline/types";
import { useJobsPipeline } from "@workspaces/job_pipeline/hooks";
```

## 📚 Best Practices

1. **Always use barrel exports**: Import from index files, not direct paths
2. **Colocate related code**: Keep component logic, types, and tests together
3. **Use TypeScript**: Leverage type safety throughout
4. **Document intent**: Add JSDoc comments to complex components
5. **Test coverage**: Write tests for critical business logic
6. **Keep components small**: Single responsibility principle

## 🔗 Related Documentation

- [Architecture Guide](../../../docs/project-structure.md)
- [Component Guide](../../../docs/component-patterns.md)
- [Hook Patterns](../../../docs/hook-patterns.md)
- [Testing Guide](../../../docs/testing.md)
