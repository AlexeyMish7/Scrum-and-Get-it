# Job Pipeline Components

> React component reference for the job pipeline workspace.

---

## Directory Structure

```
components/
├── analytics/           # Analytics panels and charts
├── calendar/            # Calendar components
├── cards/               # Job and analytics cards
├── contacts/            # Job contacts management
├── details/             # Job detail views
├── dialogs/             # Modal dialogs
├── documents/           # Document linking
├── forms/               # Job forms
├── import/              # Job import tools
├── search/              # Search components
├── timeline/            # Activity timeline
└── ShareJobWithTeamButton.tsx
```

---

## Analytics Components (`analytics/`)

| Folder                  | Purpose                            |
| ----------------------- | ---------------------------------- |
| `AnalyticsPanel/`       | Main analytics panel container     |
| `ApproachSuccessChart/` | Application approach success rates |
| `MatchAnalysisPanel/`   | AI match analysis display          |
| `MatchScoreBadge/`      | Match score badge component        |
| `PipelineAnalytics/`    | Pipeline funnel analytics          |

---

## Card Components (`cards/`)

| Folder                        | Purpose                   |
| ----------------------------- | ------------------------- |
| `JobCard/`                    | Main job card for kanban  |
| `ApplicationAnalyticsCard/`   | Application metrics       |
| `ApplicationQualityCard/`     | Application quality score |
| `CompanyResearchCard/`        | Company insights          |
| `CompetitivePositioningCard/` | Market positioning        |
| `GoalSettingCard/`            | Job search goals          |
| `InterviewAnalyticsCard/`     | Interview metrics         |
| `MarketIntelligenceCard/`     | Market data               |
| `PatternRecognitionCard/`     | Success patterns          |
| `ResponseRateCard/`           | Response rate metrics     |
| `SalaryProgressionCard/`      | Salary trends             |
| `SalaryResearchCard/`         | Salary research data      |
| `SkillsGapCard/`              | Skills gap analysis       |
| `TimeInvestmentCard/`         | Time tracking             |
| `TimeToHireCard/`             | Hiring timeline           |

---

## Dialog Components (`dialogs/`)

| Folder                | Purpose               |
| --------------------- | --------------------- |
| `JobFormDialog/`      | Add/edit job dialog   |
| `JobAnalyticsDialog/` | Job analytics modal   |
| `LinkDocumentDialog/` | Link documents to job |

---

## Detail Components (`details/`)

| Folder        | Purpose              |
| ------------- | -------------------- |
| `JobDetails/` | Full job detail view |

---

## Page Components

| Folder               | Purpose             |
| -------------------- | ------------------- |
| `PipelinePage/`      | Kanban board view   |
| `JobDetailsPage/`    | Single job detail   |
| `NewJobPage/`        | Add new job form    |
| `AnalyticsPage/`     | Pipeline analytics  |
| `DocumentsPage/`     | Document management |
| `ArchivedJobsPage/`  | Archived jobs list  |
| `AutomationsPage/`   | Job automations     |
| `SavedSearchesPage/` | Saved job searches  |

---

## View Components (`views/`)

| Folder           | Purpose                 |
| ---------------- | ----------------------- |
| `PipelineView/`  | Kanban pipeline display |
| `AnalyticsView/` | Analytics dashboard     |
| `DocumentsView/` | Documents list view     |
| `ProfileView/`   | Profile summary view    |

---

## Widget Components (`widgets/`)

| Folder            | Purpose                       |
| ----------------- | ----------------------------- |
| `CalendarWidget/` | Calendar widget for deadlines |

---

## Component Patterns

### JobCard Pattern

```tsx
interface JobCardProps {
  job: JobRow;
  onEdit?: () => void;
  onDelete?: () => void;
  onMove?: (newStage: PipelineStage) => void;
  showMatchScore?: boolean;
}
```

### Dialog Pattern

```tsx
interface JobFormDialogProps {
  open: boolean;
  onClose: () => void;
  job?: JobRow; // undefined for create, defined for edit
  onSuccess?: (job: JobRow) => void;
}
```

### Analytics Card Pattern

```tsx
interface AnalyticsCardProps {
  userId: string;
  jobId?: number; // optional for aggregate views
  loading?: boolean;
}
```

---

## Hooks

| Hook                | Purpose                           |
| ------------------- | --------------------------------- |
| `useJobsPipeline`   | Central pipeline state management |
| `useJobMatch`       | AI match score calculation        |
| `useJobsPagination` | Paginated job list                |
| `useJobsSearch`     | Job search with filters           |

---

## Import Pattern

```typescript
// Import from barrel
import {
  JobCard,
  MatchScoreBadge,
  JobFormDialog,
} from "@job_pipeline/components";

// Import specific component
import { AnalyticsPanel } from "@job_pipeline/components/analytics";
import { SalaryResearchCard } from "@job_pipeline/components/cards";

// Import pages
import { PipelinePage, JobDetailsPage } from "@job_pipeline/pages";
```
