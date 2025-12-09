# Network Hub Types

> TypeScript type definitions for the network hub workspace.

---

## Type Files

| File                     | Purpose                         |
| ------------------------ | ------------------------------- |
| `familySupport.types.ts` | Family supporter types (UC-113) |
| `peerGroups.types.ts`    | Peer group types (UC-112)       |

---

## Family Support Enums

### Supporter Role

```typescript
type SupporterRole =
  | "spouse"
  | "partner"
  | "parent"
  | "sibling"
  | "child"
  | "friend"
  | "mentor"
  | "therapist"
  | "other";
```

### Supporter Status

```typescript
type SupporterStatus = "pending" | "active" | "declined" | "removed";
```

### Milestone Type

```typescript
type MilestoneType =
  | "first_application"
  | "application_milestone"
  | "first_interview"
  | "interview_milestone"
  | "offer_received"
  | "offer_accepted"
  | "skill_learned"
  | "certification_earned"
  | "networking_milestone"
  | "goal_achieved"
  | "streak_achieved"
  | "custom";
```

### Stress & Mood

```typescript
type StressLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

type MoodType = "great" | "good" | "okay" | "struggling" | "overwhelmed";
```

### Boundary Type

```typescript
type BoundaryType =
  | "communication_frequency"
  | "topic_restriction"
  | "advice_limitation"
  | "timing_preference"
  | "support_style"
  | "custom";
```

### Resource Category

```typescript
type ResourceCategory =
  | "understanding_process"
  | "effective_support"
  | "what_not_to_say"
  | "emotional_support"
  | "practical_help"
  | "celebrating_wins"
  | "handling_rejection"
  | "stress_management";
```

---

## Family Support Row Types

### FamilySupporterRow

```typescript
interface FamilySupporterRow {
  id: string;
  user_id: string;
  supporter_email: string;
  supporter_name: string;
  supporter_user_id: string | null;
  role: SupporterRole;
  custom_role_name: string | null;
  status: SupporterStatus;
  invitation_token: string | null;
  invitation_message: string | null;
  invited_at: string;
  accepted_at: string | null;
  declined_at: string | null;

  // Permissions
  can_view_applications: boolean;
  can_view_interviews: boolean;
  can_view_progress: boolean;
  can_view_milestones: boolean;
  can_view_stress: boolean;
  can_send_encouragement: boolean;

  // Notifications
  notify_on_milestones: boolean;
  notify_on_updates: boolean;
  notify_frequency: string | null;

  // Analytics
  last_viewed_at: string | null;
  view_count: number;
  encouragements_sent: number;
}
```

### FamilySupportSettingsRow

```typescript
interface FamilySupportSettingsRow {
  id: string;
  user_id: string;
  family_support_enabled: boolean;
  auto_share_milestones: boolean;

  // Default permissions for new supporters
  default_view_applications: boolean;
  default_view_interviews: boolean;
  default_view_progress: boolean;
  default_view_milestones: boolean;
  default_view_stress: boolean;

  // Privacy settings
  hide_salary_info: boolean;
  hide_rejection_details: boolean;
  hide_company_names: boolean;

  // Notifications
  digest_frequency: string | null;

  // Well-being tracking
  stress_tracking_enabled: boolean;
  stress_alert_threshold: StressLevel | null;
}
```

### FamilyProgressSummaryRow

```typescript
interface FamilyProgressSummaryRow {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  period_type: "daily" | "weekly" | "monthly";
  title: string;
  summary_text: string;

  // Metrics (sanitized for family)
  applications_sent: number;
  interviews_scheduled: number;
  interviews_completed: number;
  skills_practiced: number;
  networking_activities: number;

  // Mood tracking
  overall_mood: MoodType | null;
  mood_trend: "improving" | "stable" | "declining" | null;

  // Highlights and events
  highlights: SummaryHighlight[];
  upcoming_events: UpcomingEvent[];

  // Sharing
  is_shared: boolean;
  shared_at: string | null;
  shared_with_all: boolean;
  shared_with_supporters: string[];

  // Engagement
  view_count: number;
  encouragement_count: number;
}
```

### FamilyMilestoneRow

```typescript
interface FamilyMilestoneRow {
  id: string;
  user_id: string;
  milestone_type: MilestoneType;
  title: string;
  description: string | null;
  milestone_value: number | null;
  related_job_id: number | null;
  celebration_message: string | null;
  celebration_emoji: string;

  // Sharing
  is_shared: boolean;
  shared_at: string | null;
  shared_with_all: boolean;
  shared_with_supporters: string[];

  // Engagement
  view_count: number;
  reactions: MilestoneReaction[];

  is_auto_generated: boolean;
  achieved_at: string;
}
```

### StressMetricsRow

```typescript
interface StressMetricsRow {
  id: string;
  user_id: string;
  check_in_date: string;
  check_in_time: string;
  stress_level: StressLevel;
  mood: MoodType;
  stress_score: number;
  energy_level: number | null;
  motivation_level: number | null;
  notes: string | null;
  stress_factors: string[];
  positive_factors: string[];
  self_care_activities: string[];
  sleep_quality: number | null;
  job_search_hours: number | null;
  applications_today: number;
}
```

### SupportBoundaryRow

```typescript
interface SupportBoundaryRow {
  id: string;
  user_id: string;
  boundary_type: BoundaryType;
  title: string;
  description: string;
  applies_to_all: boolean;
  applies_to_supporters: string[];
  positive_alternatives: string[];
  is_active: boolean;
  show_to_supporters: boolean;
  display_order: number;
}
```

---

## Peer Groups Enums

### Group Category

```typescript
type PeerGroupCategory =
  | "technology"
  | "healthcare"
  | "finance"
  | "marketing"
  | "sales"
  | "engineering"
  | "design"
  | "data_science"
  | "product_management"
  | "human_resources"
  | "legal"
  | "education"
  | "consulting"
  | "entry_level"
  | "mid_career"
  | "senior_executive"
  | "career_transition"
  | "remote_work"
  | "freelance"
  | "general";
```

### Membership & Roles

```typescript
type PeerMembershipStatus = "pending" | "active" | "suspended" | "left";

type GroupMemberRole = "owner" | "moderator" | "member";

type PeerPrivacyLevel = "full_name" | "initials_only" | "anonymous";
```

### Post Types

```typescript
type PeerPostType =
  | "discussion"
  | "question"
  | "insight"
  | "resource"
  | "celebration"
  | "advice_request";
```

### Challenge Types

```typescript
type ChallengeType =
  | "applications"
  | "networking"
  | "interviews"
  | "learning"
  | "custom";

type PeerChallengeStatus = "upcoming" | "active" | "completed" | "cancelled";

type ChallengeParticipantStatus =
  | "joined"
  | "in_progress"
  | "completed"
  | "failed"
  | "withdrawn";
```

### Referral Status

```typescript
type PeerReferralStatus =
  | "shared"
  | "interested"
  | "applied"
  | "hired"
  | "expired";
```

---

## Peer Groups Row Types

### PeerGroupRow

```typescript
interface PeerGroupRow {
  id: string;
  name: string;
  description: string | null;
  category: PeerGroupCategory;
  is_public: boolean;
  requires_approval: boolean;
  max_members: number | null;
  created_by: string;
  tags: string[];
  rules: string | null;
  welcome_message: string | null;
  avatar_url: string | null;
  banner_url: string | null;

  // Counts
  member_count: number;
  post_count: number;
  active_challenge_count: number;

  // Coaching features
  has_coaching_sessions: boolean;
  coaching_schedule: CoachingSession[];
  upcoming_webinars: Webinar[];

  is_active: boolean;
}
```

### PeerGroupMemberRow

```typescript
interface PeerGroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  status: PeerMembershipStatus;
  role: GroupMemberRole;
  privacy_level: PeerPrivacyLevel;
  show_activity: boolean;
  notifications_enabled: boolean;
  notification_preferences: NotificationPreferences;

  // Activity metrics
  posts_count: number;
  challenges_completed: number;
  referrals_shared: number;

  joined_at: string;
  last_active_at: string | null;
  left_at: string | null;
}
```

### PeerGroupPostRow

```typescript
interface PeerGroupPostRow {
  id: string;
  group_id: string;
  author_id: string;
  post_type: PeerPostType;
  title: string | null;
  content: string;
  is_anonymous: boolean;
  parent_post_id: string | null;
  reply_count: number;
  like_count: number;
  attachments: PostAttachment[];
  is_pinned: boolean;
  is_hidden: boolean;
  hidden_reason: string | null;
}
```

### PeerGroupChallengeRow

```typescript
interface PeerGroupChallengeRow {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string;
  status: PeerChallengeStatus;
  participant_count: number;
  completion_count: number;
  badge_name: string | null;
  badge_icon: string | null;
  celebration_message: string | null;
  rules: string | null;
  verification_required: boolean;
}
```

### ChallengeParticipantRow

```typescript
interface ChallengeParticipantRow {
  id: string;
  challenge_id: string;
  user_id: string;
  status: ChallengeParticipantStatus;
  current_value: number;
  progress_history: ProgressEntry[];
  completed_at: string | null;
  joined_at: string;
  last_updated_at: string | null;
}
```

### PeerSuccessStoryRow

```typescript
interface PeerSuccessStoryRow {
  id: string;
  author_id: string;
  group_id: string | null;
  title: string;
  story_content: string;
  is_anonymous: boolean;
  industry: string | null;
  role_type: string | null;
  job_search_duration_weeks: number | null;
  key_learnings: string[];
  advice_for_others: string | null;
  helpful_factors: HelpfulFactors;
  view_count: number;
  like_count: number;
  is_featured: boolean;
  is_approved: boolean;
}
```

### PeerReferralRow

```typescript
interface PeerReferralRow {
  id: string;
  shared_by: string;
  group_id: string;
  job_title: string;
  company_name: string;
  job_description: string | null;
  job_link: string | null;
  location: string | null;
  salary_range: string | null;
  is_internal_referral: boolean;
  referral_notes: string | null;
  application_deadline: string | null;
  status: PeerReferralStatus;
  views_count: number;
  interested_count: number;
  applied_count: number;
  expires_at: string | null;
}
```

### PeerNetworkingImpactRow

```typescript
interface PeerNetworkingImpactRow {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  groups_joined: number;
  posts_created: number;
  replies_given: number;
  challenges_participated: number;
  challenges_completed: number;
  referrals_shared: number;
  referrals_received: number;
  connections_made: number;
  interviews_from_peers: number;
  offers_from_peers: number;
  impact_score: number;
}
```

---

## Input Data Types

### InviteSupporterData

```typescript
interface InviteSupporterData {
  supporterEmail: string;
  supporterName: string;
  role: SupporterRole;
  customRoleName?: string;
  invitationMessage?: string;
  permissions: {
    canViewApplications?: boolean;
    canViewInterviews?: boolean;
    canViewProgress?: boolean;
    canViewMilestones?: boolean;
    canViewStress?: boolean;
    canSendEncouragement?: boolean;
  };
}
```

### CreatePeerGroupData

```typescript
interface CreatePeerGroupData {
  name: string;
  description?: string;
  category: PeerGroupCategory;
  is_public?: boolean;
  requires_approval?: boolean;
  max_members?: number;
  tags?: string[];
  rules?: string;
  welcome_message?: string;
}
```

### CreateChallengeData

```typescript
interface CreateChallengeData {
  group_id: string;
  title: string;
  description?: string;
  challenge_type: ChallengeType;
  target_value: number;
  target_unit: string;
  start_date: string;
  end_date: string;
  badge_name?: string;
  badge_icon?: string;
  rules?: string;
  verification_required?: boolean;
}
```

### StressCheckInData

```typescript
interface StressCheckInData {
  stress_level: StressLevel;
  mood: MoodType;
  energy_level?: number;
  motivation_level?: number;
  notes?: string;
  stress_factors?: string[];
  positive_factors?: string[];
  self_care_activities?: string[];
  sleep_quality?: number;
  job_search_hours?: number;
}
```
