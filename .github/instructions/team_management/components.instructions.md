# Team Management Components

> React component reference for the team management workspace.

---

## Directory Structure

```
team_management/
├── components/
│   ├── advisors/           # External advisor components (UC-115)
│   ├── enterprise/         # Enterprise/cohort components (UC-114)
│   └── *.tsx               # Core team components
├── pages/                  # Route-level page components
└── layouts/                # Layout wrappers
```

---

## Core Components

| Component                  | Purpose                              |
| -------------------------- | ------------------------------------ |
| `CreateTeamDialog`         | Modal form for creating a new team   |
| `InviteMemberDialog`       | Dialog for sending team invitations  |
| `TeamActivityFeed`         | Shows recent team activity           |
| `TeamMessaging`            | Team chat/messaging interface        |
| `TeamProgressOverview`     | Dashboard showing team-wide progress |
| `TeamPerformanceBenchmark` | Compare team metrics                 |

---

## Mentorship Components

### Mentor-focused

| Component               | Purpose                            |
| ----------------------- | ---------------------------------- |
| `MenteeProgressCard`    | Card showing mentee's progress     |
| `MenteeGoalsTracker`    | Track mentee goals and milestones  |
| `MenteeDocumentsViewer` | View shared documents from mentees |
| `ProgressReportCard`    | Generate/view progress reports     |
| `CoachingInsights`      | AI-powered coaching suggestions    |

### Progress Sharing

| Component                  | Purpose                        |
| -------------------------- | ------------------------------ |
| `ProgressSharingSettings`  | Configure what data to share   |
| `ProgressVisualization`    | Charts and graphs for progress |
| `ScheduledReportsSettings` | Configure automated reports    |
| `FeedbackPanel`            | Give/receive feedback          |
| `EngagementMonitor`        | Track mentee engagement levels |

---

## Accountability Components

| Component                   | Purpose                      |
| --------------------------- | ---------------------------- |
| `AccountabilityPartnerCard` | Display partner info         |
| `AccountabilityTracker`     | Track accountability goals   |
| `AccountabilityImpactCard`  | Show impact metrics          |
| `AddPartnerDialog`          | Add accountability partner   |
| `MotivationWidget`          | Motivational content display |
| `AchievementCelebration`    | Celebrate milestones         |

---

## Job Sharing Components

| Component                    | Purpose                    |
| ---------------------------- | -------------------------- |
| `SharedJobCard`              | Display shared job listing |
| `ShareJobWithTeamButton`     | Quick share button         |
| `ShareJobFromPipelineDialog` | Share from job pipeline    |

---

## Advisor Components (`advisors/`)

| Component               | Purpose                       |
| ----------------------- | ----------------------------- |
| `AdvisorCard`           | Display advisor information   |
| `AdvisorInviteDialog`   | Invite external advisor       |
| `ImpactDashboard`       | Advisor impact metrics        |
| `RecommendationTracker` | Track advisor recommendations |
| `SessionScheduler`      | Schedule advisor sessions     |
| `SharedMaterialsPanel`  | Materials shared with advisor |

---

## Enterprise Components (`enterprise/`)

| Component               | Purpose                   |
| ----------------------- | ------------------------- |
| `CohortManager`         | Manage student cohorts    |
| `BulkOnboardingWizard`  | Bulk onboard users        |
| `ProgramAnalyticsChart` | Program-level analytics   |
| `ROIReportGenerator`    | Generate ROI reports      |
| `BrandingEditor`        | Custom branding settings  |
| `CompliancePanel`       | FERPA/compliance settings |
| `IntegrationManager`    | Third-party integrations  |

---

## Page Components

### Team Pages

| Page              | Route                    | Purpose                    |
| ----------------- | ------------------------ | -------------------------- |
| `TeamDashboard`   | `/team`                  | Team overview dashboard    |
| `TeamMembers`     | `/team/members`          | Manage team members        |
| `TeamSettings`    | `/team/settings`         | Team configuration         |
| `TeamReports`     | `/team/reports`          | Team analytics and reports |
| `Invitations`     | `/team/invitations`      | Received invitations       |
| `SentInvitations` | `/team/invitations/sent` | Sent invitations           |

### Mentor Pages

| Page                    | Route              | Purpose                       |
| ----------------------- | ------------------ | ----------------------------- |
| `MentorDashboard`       | `/team/mentor`     | Mentor's view of candidates   |
| `CandidateProgressPage` | `/team/mentor/:id` | Individual candidate progress |

### Advisor Pages

| Page               | Route            | Purpose                  |
| ------------------ | ---------------- | ------------------------ |
| `AdvisorDashboard` | `/team/advisors` | Manage external advisors |

### Enterprise Pages

| Page                  | Route               | Purpose                    |
| --------------------- | ------------------- | -------------------------- |
| `EnterpriseDashboard` | `/team/enterprise`  | Enterprise admin dashboard |
| `CohortDetailPage`    | `/team/cohorts/:id` | Cohort details and members |
| `CreateCohortPage`    | `/team/cohorts/new` | Create new cohort          |
| `BulkOnboardingPage`  | `/team/onboarding`  | Bulk user onboarding       |

---

## Component Patterns

### Dialog Pattern

```tsx
// Dialogs receive open state and callbacks from parent
interface CreateTeamDialogProps {
  open: boolean;
  onClose: () => void;
  onTeamCreated: (team: TeamRow) => void;
}

export function CreateTeamDialog({
  open,
  onClose,
  onTeamCreated,
}: CreateTeamDialogProps) {
  // Form state and submission logic
}
```

### Card Pattern

```tsx
// Cards receive data and optional actions
interface MenteeProgressCardProps {
  mentee: TeamMemberWithProfile;
  assignment: TeamMemberAssignmentRow;
  onViewDetails?: () => void;
}

export function MenteeProgressCard({
  mentee,
  assignment,
  onViewDetails,
}: MenteeProgressCardProps) {
  // Display mentee info and progress
}
```

### Settings Pattern

```tsx
// Settings components handle their own save state
interface ProgressSharingSettingsProps {
  userId: string;
  initialSettings?: ProgressSharingPreferences;
}

export function ProgressSharingSettings({
  userId,
  initialSettings,
}: ProgressSharingSettingsProps) {
  // Load, edit, save settings
}
```

---

## Layouts

### TeamLayout

```tsx
// Wraps all team routes, provides navigation
export function TeamLayout() {
  return (
    <Box sx={{ display: "flex" }}>
      <TeamSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
}
```

---

## Key Hooks

| Hook                   | Purpose                      |
| ---------------------- | ---------------------------- |
| `useTeam`              | Current team context         |
| `useTeamMembers`       | Fetch team members           |
| `useTeamRole`          | Current user's role in team  |
| `useMentorAssignments` | Mentor's assigned candidates |
| `useAdvisors`          | User's external advisors     |
| `useCohorts`           | Team's cohorts (enterprise)  |

---

## Import Pattern

```typescript
// Import from workspace barrel
import {
  TeamDashboard,
  CreateTeamDialog,
  MenteeProgressCard,
} from "@workspaces/team_management/components";

// Import specific component
import { AdvisorCard } from "@workspaces/team_management/components/advisors";
import { CohortManager } from "@workspaces/team_management/components/enterprise";
```
