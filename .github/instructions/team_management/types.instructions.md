# Team Management Types

> TypeScript type definitions for the team management workspace.

---

## Type Files

| File                  | Purpose                             |
| --------------------- | ----------------------------------- |
| `team.types.ts`       | Core team, member, invitation types |
| `advisor.types.ts`    | External advisor types (UC-115)     |
| `enterprise.types.ts` | Enterprise/cohort types (UC-114)    |

---

## Core Enums

### Team Roles

```typescript
type TeamRole = "admin" | "mentor" | "candidate";
```

### Invitation Status

```typescript
type InvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled";
```

### Subscription Tiers

```typescript
type SubscriptionTier = "free" | "starter" | "professional" | "enterprise";

type SubscriptionStatus =
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "trialing";
```

### Activity Types

```typescript
type TeamActivityType =
  | "team_created"
  | "member_invited"
  | "member_joined"
  | "member_left"
  | "member_removed"
  | "role_changed"
  | "permissions_updated"
  | "candidate_assigned"
  | "candidate_unassigned"
  | "settings_updated";
```

---

## Team Row Types

### TeamRow

```typescript
interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  settings: TeamSettings;
  total_members: number;
  total_candidates: number;
  total_mentors: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### TeamMemberRow

```typescript
interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  invited_by: string | null;
  invited_at: string | null;
  joined_at: string;
  is_active: boolean;
  custom_permissions: TeamPermissions;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

### TeamInvitationRow

```typescript
interface TeamInvitationRow {
  id: string;
  team_id: string;
  invited_by: string;
  invitee_email: string;
  invitee_user_id: string | null;
  role: TeamRole;
  message: string | null;
  invitation_token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  created_at: string;
  updated_at: string;
}
```

### TeamMemberAssignmentRow

```typescript
interface TeamMemberAssignmentRow {
  id: string;
  team_id: string;
  mentor_id: string;
  candidate_id: string;
  assigned_by: string;
  assigned_at: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
```

### TeamActivityLogRow

```typescript
interface TeamActivityLogRow {
  id: string;
  team_id: string;
  actor_id: string | null;
  activity_type: TeamActivityType;
  description: string;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}
```

### TeamMessageRow

```typescript
interface TeamMessageRow {
  id: string;
  team_id: string;
  sender_id: string;
  message_text: string;
  parent_message_id: string | null;
  mentioned_users: string[];
  attachments: MessageAttachment[];
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## JSONB Types

### TeamSettings

```typescript
interface TeamSettings {
  allow_member_invites: boolean;
  require_admin_approval: boolean;
  auto_assign_candidates: boolean;
  notification_preferences: {
    member_joins: boolean;
    activity_updates: boolean;
    weekly_reports: boolean;
  };
}
```

### TeamPermissions

```typescript
interface TeamPermissions {
  can_view_all_candidates: boolean;
  can_edit_candidates: boolean;
  can_invite_members: boolean;
  can_remove_members: boolean;
  can_change_roles: boolean;
  can_view_analytics: boolean;
  can_export_data: boolean;
  can_manage_team_settings: boolean;
}
```

### SubscriptionLimits

```typescript
interface SubscriptionLimits {
  max_team_members: number | null;
  max_candidates: number | null;
  max_mentors: number | null;
  max_storage_mb: number | null;
  max_ai_generations_per_month: number | null;
  analytics_retention_days: number | null;
  priority_support: boolean;
  custom_branding: boolean;
  api_access: boolean;
}
```

---

## Joined Types

### TeamWithMembers

```typescript
interface TeamWithMembers extends TeamRow {
  members: TeamMemberWithProfile[];
}
```

### TeamMemberWithProfile

```typescript
interface TeamMemberWithProfile extends TeamMemberRow {
  profile: {
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    professional_title: string | null;
  };
}
```

### AssignedCandidateInfo

```typescript
interface AssignedCandidateInfo {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_title: string | null;
  team_id: string;
  team_name: string;
  assignment_id: string;
  assigned_at: string;
  notes: string | null;
}
```

---

## Advisor Types

### Advisor Enums

```typescript
type AdvisorType =
  | "career_coach"
  | "resume_writer"
  | "interview_coach"
  | "industry_mentor"
  | "executive_coach"
  | "recruiter"
  | "counselor"
  | "consultant"
  | "other";

type AdvisorStatus = "pending" | "active" | "paused" | "ended" | "declined";

type SessionStatus =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

type RecommendationStatus =
  | "pending"
  | "in_progress"
  | "implemented"
  | "partially_done"
  | "declined"
  | "not_applicable";
```

### ExternalAdvisorRow

```typescript
interface ExternalAdvisorRow {
  id: string;
  user_id: string;
  advisor_email: string;
  advisor_name: string;
  advisor_user_id: string | null;
  advisor_type: AdvisorType;
  custom_type_name: string | null;
  organization_name: string | null;
  organization_website: string | null;
  advisor_title: string | null;
  status: AdvisorStatus;
  relationship_started_at: string | null;
  relationship_ended_at: string | null;
  end_reason: string | null;

  // Permissions
  can_view_profile: boolean;
  can_view_jobs: boolean;
  can_view_documents: boolean;
  can_view_analytics: boolean;
  can_view_interviews: boolean;
  can_add_recommendations: boolean;
  can_schedule_sessions: boolean;
  can_send_messages: boolean;

  // Notifications
  notify_on_milestones: boolean;
  notify_on_updates: boolean;
  update_frequency: string;
}
```

### AdvisorSessionRow

```typescript
interface AdvisorSessionRow {
  id: string;
  advisor_id: string;
  user_id: string;
  session_type: SessionType;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location_type: LocationType;
  location_details: string | null;
  meeting_link: string | null;
  status: SessionStatus;
  agenda: string | null;
  notes: string | null;
  action_items: ActionItem[];
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}
```

### AdvisorRecommendationRow

```typescript
interface AdvisorRecommendationRow {
  id: string;
  advisor_id: string;
  user_id: string;
  session_id: string | null;
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: Priority;
  status: RecommendationStatus;
  due_date: string | null;
  implementation_notes: string | null;
  outcome: string | null;
  completed_at: string | null;
}
```

---

## Enterprise Types

### Enterprise Enums

```typescript
type CohortStatus = "draft" | "active" | "paused" | "completed" | "archived";

type CompletionStatus = "in_progress" | "completed" | "withdrawn" | "placed";

type IntegrationType =
  | "lms"
  | "sis"
  | "crm"
  | "calendar"
  | "sso"
  | "analytics"
  | "job_board"
  | "ats"
  | "custom_webhook";

type ComplianceEventType =
  | "user_data_access"
  | "user_data_export"
  | "user_data_delete"
  | "settings_change"
  | "role_change"
  | "bulk_operation"
  | "integration_access"
  | "report_generated"
  | "login_attempt"
  | "permission_change";
```

### CohortRow

```typescript
interface CohortRow {
  id: string;
  team_id: string;
  name: string;
  description: string | null;
  program_type: string | null;
  status: CohortStatus;
  start_date: string | null;
  end_date: string | null;
  max_capacity: number | null;
  current_enrollment: number;
  target_placement_rate: number | null;
  target_avg_salary: number | null;
  target_time_to_placement: number | null;
  settings: CohortSettings;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
```

### CohortMemberRow

```typescript
interface CohortMemberRow {
  id: string;
  cohort_id: string;
  user_id: string;
  enrolled_at: string;
  enrolled_by: string | null;
  is_active: boolean;
  completion_status: CompletionStatus;
  placed_at: string | null;
  placement_company: string | null;
  placement_role: string | null;
  placement_salary: number | null;
  progress_score: number;
  last_activity_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
```

### ProgramAnalyticsRow

```typescript
interface ProgramAnalyticsRow {
  id: string;
  team_id: string;
  cohort_id: string | null;
  period_start: string;
  period_end: string;
  granularity: "daily" | "weekly" | "monthly" | "quarterly";
  total_enrolled: number;
  active_users: number;
  new_enrollments: number;
  withdrawals: number;
  total_applications: number;
  total_interviews: number;
  total_offers: number;
  total_placements: number;
  application_to_interview_rate: number | null;
  interview_to_offer_rate: number | null;
  offer_acceptance_rate: number | null;
  overall_placement_rate: number | null;
  avg_time_to_first_interview: number | null;
  avg_time_to_offer: number | null;
  avg_time_to_placement: number | null;
  avg_starting_salary: number | null;
}
```

### EnterpriseBrandingRow

```typescript
interface EnterpriseBrandingRow {
  id: string;
  team_id: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string | null;
  custom_css: string | null;
  custom_domain: string | null;
  email_template: Record<string, unknown>;
  footer_text: string | null;
  is_active: boolean;
}
```

---

## Input Data Types

### CreateTeamData

```typescript
interface CreateTeamData {
  name: string;
  description?: string;
}
```

### InviteMemberData

```typescript
interface InviteMemberData {
  email: string;
  role: TeamRole;
  message?: string;
}
```

### AssignMentorData

```typescript
interface AssignMentorData {
  mentor_id: string;
  candidate_id: string;
  notes?: string;
}
```

### InviteAdvisorData

```typescript
interface InviteAdvisorData {
  advisor_email: string;
  advisor_name: string;
  advisor_type: AdvisorType;
  custom_type_name?: string;
  organization_name?: string;
  organization_website?: string;
  advisor_title?: string;
  personal_message?: string;
  // Permissions
  can_view_profile?: boolean;
  can_view_jobs?: boolean;
  can_view_documents?: boolean;
  can_view_analytics?: boolean;
  can_view_interviews?: boolean;
  can_add_recommendations?: boolean;
  can_schedule_sessions?: boolean;
  can_send_messages?: boolean;
}
```

### CreateCohortData

```typescript
interface CreateCohortData {
  name: string;
  description?: string;
  program_type?: string;
  start_date?: string;
  end_date?: string;
  max_capacity?: number;
  target_placement_rate?: number;
  target_avg_salary?: number;
  target_time_to_placement?: number;
  settings?: Partial<CohortSettings>;
}
```
