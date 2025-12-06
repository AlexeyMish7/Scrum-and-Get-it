# Team Management Workspace Overview

> Team collaboration workspace for FlowATS. Handles teams, mentorship, progress sharing, external advisors, and enterprise features.

---

## Workspace Location

```
frontend/src/app/workspaces/team_management/
```

---

## Structure

```
team_management/
├── components/
│   ├── advisors/                    # External advisor components (UC-115)
│   │   ├── AdvisorCard.tsx
│   │   ├── AdvisorInviteDialog.tsx
│   │   ├── ImpactDashboard.tsx
│   │   ├── RecommendationTracker.tsx
│   │   ├── SessionScheduler.tsx
│   │   └── SharedMaterialsPanel.tsx
│   ├── enterprise/                  # Enterprise features (UC-114)
│   │   ├── BrandingEditor.tsx
│   │   ├── BulkOnboardingWizard.tsx
│   │   ├── CohortManager.tsx
│   │   ├── CompliancePanel.tsx
│   │   ├── IntegrationManager.tsx
│   │   ├── ProgramAnalyticsChart.tsx
│   │   └── ROIReportGenerator.tsx
│   ├── AccountabilityImpactCard.tsx
│   ├── AccountabilityPartnerCard.tsx
│   ├── AccountabilityTracker.tsx
│   ├── AchievementCelebration.tsx
│   ├── AddPartnerDialog.tsx
│   ├── CoachingInsights.tsx
│   ├── CreateTeamDialog.tsx
│   ├── EngagementMonitor.tsx
│   ├── FeedbackPanel.tsx
│   ├── InviteMemberDialog.tsx
│   ├── MenteeDocumentsViewer.tsx
│   ├── MenteeGoalsTracker.tsx
│   ├── MenteeProgressCard.tsx
│   ├── MotivationWidget.tsx
│   ├── ProgressReportCard.tsx
│   ├── ProgressSharingSettings.tsx
│   ├── ProgressVisualization.tsx
│   ├── ScheduledReportsSettings.tsx
│   ├── SharedJobCard.tsx
│   ├── ShareJobFromPipelineDialog.tsx
│   ├── ShareJobWithTeamButton.tsx
│   ├── TeamActivityFeed.tsx
│   ├── TeamMessaging.tsx
│   ├── TeamPerformanceBenchmark.tsx
│   └── TeamProgressOverview.tsx
├── hooks/
│   ├── useAdvisorRecommendations.ts
│   ├── useAdvisorSessions.ts
│   ├── useCohortManagement.ts
│   ├── useEnterprise.ts
│   ├── useExternalAdvisors.ts
│   ├── useMessaging.ts
│   └── useProgressSharing.ts
├── layouts/
│   └── TeamLayout.tsx
├── pages/
│   ├── AdvisorDashboard.tsx
│   ├── BulkOnboardingPage.tsx
│   ├── CandidateProgressPage.tsx
│   ├── CohortDetailPage.tsx
│   ├── CreateCohortPage.tsx
│   ├── EnterpriseDashboard.tsx
│   ├── Invitations.tsx
│   ├── MentorDashboard.tsx         # UC-109
│   ├── SentInvitations.tsx
│   ├── TeamDashboard.tsx           # UC-108
│   ├── TeamMembers.tsx
│   ├── TeamReports.tsx
│   └── TeamSettings.tsx
├── services/
│   ├── advisorService.ts           # UC-115
│   ├── analyticsService.ts
│   ├── enterpriseService.ts        # UC-114
│   ├── mentorService.ts            # UC-109
│   ├── messagingService.ts
│   ├── motivationService.ts
│   ├── progressSharingService.ts   # UC-111
│   ├── scheduledReportsService.ts
│   └── teamService.ts              # Core team CRUD
├── types/
│   ├── advisor.types.ts
│   ├── enterprise.types.ts
│   └── team.types.ts
└── utils/
```

---

## Key Features

### 1. Team Management (UC-108)

- Create and manage teams
- Invite members via email
- Role-based access (admin, mentor, candidate)
- Team settings and permissions

### 2. Mentor Dashboard (UC-109)

- View assigned mentees
- Track mentee progress and job stats
- Provide feedback and recommendations
- Set goals and milestones

### 3. Progress Sharing (UC-111)

- Privacy settings for data sharing
- Progress snapshots with metrics
- Accountability partnerships
- Achievement celebrations

### 4. External Advisors (UC-115)

- Invite career coaches and mentors
- Schedule coaching sessions
- Track recommendations
- Share job materials
- Measure advisor impact

### 5. Enterprise Features (UC-114)

- Cohort management
- Program analytics and ROI
- White-label branding
- Compliance logging
- Bulk onboarding
- External integrations

---

## Database Tables

| Table                         | Purpose                 |
| ----------------------------- | ----------------------- |
| `teams`                       | Team accounts           |
| `team_members`                | User-team relationships |
| `team_invitations`            | Pending invitations     |
| `team_member_assignments`     | Mentor-candidate links  |
| `team_activity_log`           | Activity audit trail    |
| `team_messages`               | Team chat               |
| `team_settings`               | Extended settings       |
| `team_subscriptions`          | Subscription billing    |
| `mentee_goals`                | Candidate goals         |
| `mentor_feedback`             | Mentor feedback records |
| `progress_sharing_settings`   | Privacy settings        |
| `progress_snapshots`          | Progress metrics        |
| `accountability_partnerships` | Partner relationships   |
| `achievement_celebrations`    | Celebration events      |
| `progress_messages`           | Partner messaging       |
| `external_advisors`           | Advisor relationships   |
| `advisor_sessions`            | Coaching sessions       |
| `advisor_recommendations`     | Advisor suggestions     |
| `advisor_shared_materials`    | Shared documents        |
| `advisor_messages`            | Advisor communication   |
| `advisor_billing`             | Session billing         |
| `cohorts`                     | Enterprise cohorts      |
| `cohort_members`              | Cohort enrollments      |
| `program_analytics`           | Aggregate metrics       |
| `enterprise_branding`         | White-label config      |
| `compliance_log`              | Audit records           |
| `external_integrations`       | Third-party links       |

---

## Team Roles

| Role        | Permissions                                |
| ----------- | ------------------------------------------ |
| `admin`     | Full access, manage members, settings      |
| `mentor`    | View assigned candidates, provide feedback |
| `candidate` | View own progress, participate in team     |

---

## Layout

Uses `TeamLayout.tsx` which wraps content in AppShell with TeamSidebar.

---

## RLS Security

All operations enforce Row Level Security:

- Team membership required for data access
- Admin role for management operations
- Mentor-candidate assignments for mentorship data
- Privacy settings respected for progress data
