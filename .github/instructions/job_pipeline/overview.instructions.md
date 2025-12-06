# Job Pipeline Workspace Overview

> Job tracking, kanban pipeline, analytics, and application management.

---

## Workspace Path

```
frontend/src/app/workspaces/job_pipeline/
```

---

## Use Cases

| UC ID  | Feature       | Description                             |
| ------ | ------------- | --------------------------------------- |
| UC-101 | Job Tracking  | Add, edit, and manage job applications  |
| UC-102 | Pipeline View | Kanban board with drag-and-drop stages  |
| UC-103 | Job Analytics | Match scores, skills gaps, and insights |

---

## Directory Structure

```
job_pipeline/
├── components/
│   ├── analytics/       # Analytics panels and charts
│   ├── calendar/        # Calendar components
│   ├── cards/           # Job and analytics cards
│   ├── contacts/        # Job contacts management
│   ├── details/         # Job detail views
│   ├── dialogs/         # Modal dialogs
│   ├── documents/       # Document linking
│   ├── forms/           # Job forms
│   ├── import/          # Job import tools
│   ├── search/          # Search components
│   └── timeline/        # Activity timeline
├── hooks/               # Custom React hooks
├── layouts/             # Layout wrappers
├── navigation/          # Navigation components
├── pages/               # Route-level pages
├── services/            # Supabase service layer
├── types/               # TypeScript definitions
├── views/               # View components
├── widgets/             # Widget components
└── index.ts             # Barrel exports
```

---

## Pipeline Stages

```typescript
type PipelineStage =
  | "Interested"
  | "Applied"
  | "Phone Screen"
  | "Interview"
  | "Offer"
  | "Rejected";
```

**Stage Progression:** Jobs move left-to-right through the pipeline.

---

## Database Tables

| Table             | Purpose                                      |
| ----------------- | -------------------------------------------- |
| `jobs`            | Core job data (title, company, status, etc.) |
| `job_history`     | Job status change audit trail                |
| `job_materials`   | Linked resumes/cover letters per job         |
| `job_contacts`    | Contacts associated with jobs                |
| `analytics_cache` | Cached AI analytics per job                  |

---

## Routes

| Route               | Page              | Description         |
| ------------------- | ----------------- | ------------------- |
| `/jobs`             | PipelinePage      | Kanban board view   |
| `/jobs/new`         | NewJobPage        | Add new job         |
| `/jobs/:id`         | JobDetailsPage    | Job details         |
| `/jobs/analytics`   | AnalyticsPage     | Pipeline analytics  |
| `/jobs/documents`   | DocumentsPage     | Document management |
| `/jobs/archived`    | ArchivedJobsPage  | Archived jobs       |
| `/jobs/automations` | AutomationsPage   | Job automations     |
| `/jobs/searches`    | SavedSearchesPage | Saved searches      |

---

## Key Features

### Kanban Pipeline

- Drag-and-drop between stages
- Optimistic UI updates
- Status change tracking
- Stage-specific actions

### Job Analytics

- AI match score (profile vs job)
- Skills gap analysis
- Company research
- Interview preparation tips
- Cached with profile-aware invalidation

### Job Import

- Manual entry form
- URL import (scraping)
- Bulk import

### Document Linking

- Link resumes to jobs
- Link cover letters to jobs
- Track materials per application

---

## Import Pattern

```typescript
// Import services
import { jobsService, pipelineService } from "@job_pipeline/services";
import {
  getAnalytics,
  setAnalytics,
} from "@job_pipeline/services/analyticsCache";

// Import hooks
import { useJobsPipeline } from "@job_pipeline/hooks/useJobsPipeline";
import { useJobMatch } from "@job_pipeline/hooks/useJobMatch";

// Import types
import type { JobRow, JobFormData, PipelineStage } from "@job_pipeline/types";

// Import components
import { JobCard, MatchScoreBadge } from "@job_pipeline/components";
```
