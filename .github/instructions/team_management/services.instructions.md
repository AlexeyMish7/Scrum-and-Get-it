# Team Management Services

> Service layer for team management workspace. All services use direct Supabase access with RLS enforcement.

---

## Service Files

| File                         | Purpose                      |
| ---------------------------- | ---------------------------- |
| `teamService.ts`             | Core team CRUD operations    |
| `mentorService.ts`           | Mentor dashboard (UC-109)    |
| `progressSharingService.ts`  | Progress sharing (UC-111)    |
| `messagingService.ts`        | Team and partner messaging   |
| `advisorService.ts`          | External advisors (UC-115)   |
| `enterpriseService.ts`       | Enterprise features (UC-114) |
| `analyticsService.ts`        | Team analytics               |
| `motivationService.ts`       | Motivation tracking          |
| `scheduledReportsService.ts` | Automated reports            |

---

## Team Service

**File:** `services/teamService.ts`

### Team Operations

| Function                                   | Description                     |
| ------------------------------------------ | ------------------------------- |
| `createTeam(userId, data)`                 | Create team, add owner as admin |
| `getTeam(userId, teamId)`                  | Get team with members           |
| `getUserTeams(userId)`                     | Get all teams for user          |
| `updateTeamSettings(userId, teamId, data)` | Update team config              |
| `deleteTeam(userId, teamId)`               | Delete team (owner only)        |

### Member Operations

| Function                                           | Description           |
| -------------------------------------------------- | --------------------- |
| `inviteMember(userId, teamId, data)`               | Send invitation email |
| `getTeamMembers(teamId)`                           | List active members   |
| `updateMemberRole(userId, teamId, memberId, role)` | Change role           |
| `removeMember(userId, teamId, memberId)`           | Deactivate member     |

### Invitation Operations

| Function                                           | Description          |
| -------------------------------------------------- | -------------------- |
| `getPendingInvitations(teamId)`                    | List pending invites |
| `getUserInvitations(email)`                        | Get invites for user |
| `acceptInvitation(userId, invitationId)`           | Join team            |
| `declineInvitation(userId, invitationId, reason?)` | Decline invite       |
| `cancelInvitation(userId, invitationId)`           | Cancel invite        |

### Assignment Operations

| Function                                   | Description              |
| ------------------------------------------ | ------------------------ |
| `assignMentor(userId, teamId, data)`       | Link mentor to candidate |
| `getAssignedCandidates(mentorId, teamId?)` | Get mentor's mentees     |
| `unassignMentor(userId, assignmentId)`     | Remove assignment        |

### Activity Logging

| Function                                              | Description       |
| ----------------------------------------------------- | ----------------- |
| `logTeamActivity(teamId, actorId, type, description)` | Log event         |
| `getTeamActivityLog(teamId, limit?)`                  | Get activity feed |

### User Checks

| Function                        | Description                       |
| ------------------------------- | --------------------------------- |
| `checkUserExistsByEmail(email)` | Check if user exists (for invite) |

---

## Mentor Service

**File:** `services/mentorService.ts`

### Mentee Data

| Function                                          | Description               |
| ------------------------------------------------- | ------------------------- |
| `getAssignedMentees(userId, teamId?)`             | Get mentees with progress |
| `getMenteeJobStats(mentorId, candidateId)`        | Job search stats          |
| `getMenteeRecentActivity(mentorId, candidateId)`  | Activity timeline         |
| `getMenteeEngagementLevel(mentorId, candidateId)` | Engagement score          |

### Mentee Types

```typescript
interface MenteeWithProgress {
  // Assignment info
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  team_id: string;
  assigned_at: string;

  // Job stats
  jobStats: {
    total: number;
    applied: number;
    interviewing: number;
    offers: number;
    rejected: number;
  };

  // Engagement
  recentActivity: ActivityItem[];
  engagementLevel: "high" | "medium" | "low" | "inactive";
  lastActiveAt: string | null;
}
```

### Document Access

| Function                                            | Description          |
| --------------------------------------------------- | -------------------- |
| `getMenteeDocuments(mentorId, candidateId, teamId)` | Get shared documents |
| `getMenteeDocumentContent(mentorId, documentId)`    | Get document text    |

### Feedback Operations

| Function                                           | Description          |
| -------------------------------------------------- | -------------------- |
| `createFeedback(userId, data)`                     | Submit feedback      |
| `getMenteeFeedback(mentorId, candidateId, teamId)` | Get feedback history |
| `updateFeedback(userId, feedbackId, data)`         | Edit feedback        |
| `deleteFeedback(userId, feedbackId)`               | Remove feedback      |
| `markFeedbackRead(candidateId, feedbackId)`        | Mark as read         |

### Goal Management

| Function                                        | Description     |
| ----------------------------------------------- | --------------- |
| `createGoal(userId, data)`                      | Set mentee goal |
| `getMenteeGoals(mentorId, candidateId, teamId)` | Get goals       |
| `updateGoal(userId, goalId, data)`              | Update goal     |
| `updateGoalProgress(userId, goalId, progress)`  | Update progress |
| `completeGoal(userId, goalId)`                  | Mark complete   |

---

## Progress Sharing Service

**File:** `services/progressSharingService.ts`

### Visibility Levels

```typescript
type SharingVisibility =
  | "private" // Only user
  | "mentors_only" // Assigned mentors
  | "accountability" // Partners
  | "team" // All team members
  | "public"; // Anyone in system
```

### Settings Operations

| Function                                      | Description          |
| --------------------------------------------- | -------------------- |
| `getSharingSettings(userId, teamId)`          | Get privacy settings |
| `updateSharingSettings(userId, teamId, data)` | Update settings      |
| `initializeSharingSettings(userId, teamId)`   | Create defaults      |

### Snapshot Operations

| Function                                 | Description           |
| ---------------------------------------- | --------------------- |
| `createProgressSnapshot(userId, teamId)` | Generate snapshot     |
| `getUserSnapshots(userId, teamId)`       | Get user's snapshots  |
| `getTeamSnapshots(userId, teamId)`       | Get visible snapshots |
| `getLatestSnapshot(userId, teamId)`      | Most recent snapshot  |

### Partnership Operations

| Function                                        | Description         |
| ----------------------------------------------- | ------------------- |
| `requestPartnership(userId, teamId, partnerId)` | Send request        |
| `getPartnershipRequests(userId, teamId)`        | Get pending         |
| `acceptPartnership(userId, partnershipId)`      | Accept request      |
| `declinePartnership(userId, partnershipId)`     | Decline request     |
| `endPartnership(userId, partnershipId)`         | End partnership     |
| `getActivePartnerships(userId, teamId)`         | Get active partners |

### Celebration Operations

| Function                                              | Description             |
| ----------------------------------------------------- | ----------------------- |
| `createCelebration(userId, data)`                     | Create achievement      |
| `getUserCelebrations(userId, teamId)`                 | Get celebrations        |
| `getTeamCelebrations(userId, teamId)`                 | Get shared celebrations |
| `reactToCelebration(userId, celebrationId, reaction)` | Add reaction            |

---

## Messaging Service

**File:** `services/messagingService.ts`

### Message Types

```typescript
type MessageType =
  | "message" // Regular message
  | "encouragement" // Support message
  | "progress_update" // Status update
  | "goal_reminder" // Goal nudge
  | "celebration" // Achievement share
  | "feedback"; // Mentor feedback
```

### Operations

| Function                                          | Description           |
| ------------------------------------------------- | --------------------- |
| `sendMessage(senderId, data)`                     | Send message          |
| `getConversation(userId, partnerId, teamId)`      | Get messages          |
| `getConversationList(userId, teamId)`             | Get all conversations |
| `getUnreadCount(userId, teamId)`                  | Unread message count  |
| `markMessageRead(userId, messageId)`              | Mark as read          |
| `markConversationRead(userId, partnerId, teamId)` | Mark all read         |

---

## Advisor Service

**File:** `services/advisorService.ts`

### Advisor Management

| Function                                           | Description             |
| -------------------------------------------------- | ----------------------- |
| `inviteAdvisor(data)`                              | Invite external advisor |
| `getAdvisors(filters?)`                            | List advisors           |
| `getAdvisor(advisorId)`                            | Get single advisor      |
| `updateAdvisor(advisorId, data)`                   | Update relationship     |
| `updateAdvisorPermissions(advisorId, permissions)` | Change access           |
| `endAdvisorRelationship(advisorId, reason?)`       | End relationship        |

### Session Management

| Function                             | Description      |
| ------------------------------------ | ---------------- |
| `createSession(advisorId, data)`     | Schedule session |
| `getSessions(advisorId, filters?)`   | List sessions    |
| `updateSession(sessionId, data)`     | Update session   |
| `completeSession(sessionId, notes?)` | Mark complete    |
| `cancelSession(sessionId, reason?)`  | Cancel session   |

### Recommendations

| Function                                          | Description          |
| ------------------------------------------------- | -------------------- |
| `createRecommendation(advisorId, data)`           | Add recommendation   |
| `getRecommendations(advisorId, filters?)`         | List recommendations |
| `updateRecommendation(recommendationId, data)`    | Update status        |
| `markRecommendationImplemented(recommendationId)` | Mark done            |

### Material Sharing

| Function                                  | Description        |
| ----------------------------------------- | ------------------ |
| `shareMaterial(advisorId, data)`          | Share document/job |
| `getSharedMaterials(advisorId)`           | List shared items  |
| `updateMaterialSharing(materialId, data)` | Update sharing     |
| `unshareMatrial(materialId)`              | Remove sharing     |

### Impact Tracking

| Function                      | Description            |
| ----------------------------- | ---------------------- |
| `getAdvisorImpact(advisorId)` | Get impact metrics     |
| `getDashboardSummary()`       | Advisor dashboard data |

---

## Enterprise Service

**File:** `services/enterpriseService.ts`

### Cohort Management

| Function                             | Description       |
| ------------------------------------ | ----------------- |
| `createCohort(userId, teamId, data)` | Create cohort     |
| `getTeamCohorts(teamId)`             | List cohorts      |
| `getCohort(cohortId)`                | Get with members  |
| `updateCohort(cohortId, data)`       | Update cohort     |
| `deleteCohort(cohortId)`             | Archive cohort    |
| `addCohortMembers(cohortId, data)`   | Enroll members    |
| `updateCohortMember(memberId, data)` | Update enrollment |
| `removeCohortMember(memberId)`       | Remove member     |

### Program Analytics

| Function                                          | Description           |
| ------------------------------------------------- | --------------------- |
| `getProgramAnalytics(teamId, cohortId?, period?)` | Get metrics           |
| `getAnalyticsSummary(teamId)`                     | Dashboard summary     |
| `getProgramEffectiveness(teamId)`                 | Effectiveness metrics |
| `getCohortStats(cohortId)`                        | Cohort-level stats    |
| `getTeamCohortStats(teamId)`                      | Aggregate stats       |

### ROI Reporting

| Function                        | Description     |
| ------------------------------- | --------------- |
| `createROIReport(teamId, data)` | Generate report |
| `getROIReports(teamId)`         | List reports    |
| `getROIReport(reportId)`        | Get report      |
| `publishROIReport(reportId)`    | Publish report  |

### Branding

| Function                       | Description         |
| ------------------------------ | ------------------- |
| `getBranding(teamId)`          | Get branding config |
| `updateBranding(teamId, data)` | Update branding     |
| `uploadLogo(teamId, file)`     | Upload logo         |

### Compliance

| Function                                   | Description      |
| ------------------------------------------ | ---------------- |
| `logComplianceEvent(teamId, userId, data)` | Log event        |
| `getComplianceLog(teamId, filters?)`       | Get log entries  |
| `getComplianceReport(teamId, period)`      | Generate report  |
| `exportComplianceData(teamId, period)`     | Export for audit |

### Integrations

| Function                                 | Description        |
| ---------------------------------------- | ------------------ |
| `createIntegration(teamId, data)`        | Add integration    |
| `getIntegrations(teamId)`                | List integrations  |
| `updateIntegration(integrationId, data)` | Update config      |
| `testIntegration(integrationId)`         | Test connection    |
| `deleteIntegration(integrationId)`       | Remove integration |

### Bulk Onboarding

| Function                                | Description    |
| --------------------------------------- | -------------- |
| `createBulkOnboardingJob(teamId, data)` | Start import   |
| `getBulkOnboardingJobs(teamId)`         | List jobs      |
| `getBulkOnboardingJob(jobId)`           | Get job status |
| `cancelBulkOnboardingJob(jobId)`        | Cancel job     |

---

## Common Patterns

### No withUser for teams Table

Teams uses `owner_id`, not `user_id`:

```typescript
// Direct insert without withUser
const teamResult = await insertRow<TeamRow>("teams", {
  name: data.name,
  owner_id: userId,
});
```

### RPC Functions for Complex Queries

Uses database functions for optimized queries:

```typescript
const { data } = await supabase.rpc("get_user_teams", {
  p_user_id: userId,
});

const { data } = await supabase.rpc("get_assigned_candidates", {
  p_mentor_id: userId,
  p_team_id: teamId,
});
```

### Joined Queries with Explicit FK

When table has multiple FKs to same table:

```typescript
const { data } = await supabase
  .from("team_members")
  .select(
    `
    *,
    profile:profiles!user_id(full_name, email)
  `
  )
  .eq("team_id", teamId);
```

### Activity Logging

Most operations log to activity feed:

```typescript
await logTeamActivity(
  teamId,
  userId,
  "member_invited",
  `Invited ${email} as ${role}`
);
```
