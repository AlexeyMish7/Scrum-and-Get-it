# Database ENUM Types Reference

This file contains all ENUM types used in the FlowATS database.

---

## User & Profile Enums

### experience_level_enum

Represents a user's career experience level.

```
entry | mid | senior | executive
```

### education_level_enum

Represents the highest education level achieved.

```
high_school | associate | bachelor | master | phd | other
```

### proficiency_level_enum

Represents skill proficiency levels.

```
beginner | intermediate | advanced | expert
```

### verification_status_enum

Status for verifying certifications or credentials.

```
unverified | pending | verified | rejected
```

---

## Project & Goal Enums

### project_status_enum

Status of a user's project.

```
planned | ongoing | completed
```

### goal_status_enum

Status of career or mentee goals.

```
active | completed | paused | cancelled | archived
```

### goal_category_enum

Categories for career goals.

```
application_volume | interview_success | skill_development | networking | salary_target | career_advancement | work_life_balance | custom
```

### goal_timeframe_enum

Timeframe for goal completion.

```
short_term | medium_term | long_term
```

---

## Document Review Enums

### review_type_enum

Type of document review being requested.

```
feedback | approval | peer_review | mentor_review
```

### review_status_enum

Status of a document review.

```
pending | in_progress | completed | expired | cancelled
```

### review_access_enum

Access level granted to a reviewer.

```
view | comment | suggest | approve
```

### comment_type_enum

Type of comment on a document review.

```
comment | suggestion | praise | change_request | question | approval | rejection
```

---

## Team & Membership Enums

### team_role_enum

Roles within a team.

```
admin | mentor | candidate
```

### team_activity_type_enum

Types of activities logged in team activity.

```
team_created | member_invited | member_joined | member_left | member_removed | role_changed | permissions_updated | candidate_assigned | candidate_unassigned | settings_updated
```

### invitation_status_enum

Status of team or advisor invitations.

```
pending | accepted | declined | expired | cancelled
```

### subscription_tier_enum

Subscription tiers for teams.

```
free | starter | professional | enterprise
```

---

## Session & Scheduling Enums

### session_status_enum

Status of advisor or coaching sessions.

```
scheduled | confirmed | in_progress | completed | cancelled | no_show | rescheduled
```

---

## Advisor Enums

### advisor_type_enum

Types of external advisors.

```
career_coach | resume_writer | interview_coach | industry_mentor | executive_coach | recruiter | counselor | consultant | other
```

### advisor_status_enum

Status of advisor relationship.

```
pending | active | paused | ended | declined
```

### recommendation_status_enum

Status of advisor recommendations.

```
pending | in_progress | implemented | partially_done | declined | not_applicable
```

### billing_status_enum

Status of advisor billing.

```
free | pending | paid | overdue | refunded | cancelled
```

---

## Peer Networking Enums

### peer_group_category_enum

Categories for peer groups.

```
technology | healthcare | finance | marketing | sales | engineering | design | data_science | product_management | human_resources | legal | education | consulting | entry_level | mid_career | senior_executive | career_transition | remote_work | freelance | general
```

### peer_membership_status_enum

Status of peer group membership.

```
pending | active | suspended | left
```

### peer_post_type_enum

Types of posts in peer groups.

```
discussion | question | insight | resource | celebration | advice_request
```

### peer_privacy_level_enum

Privacy level for peer group participation.

```
full_name | initials_only | anonymous
```

### peer_referral_status_enum

Status of peer referrals.

```
shared | interested | applied | hired | expired
```

### peer_challenge_status_enum

Status of peer group challenges.

```
upcoming | active | completed | cancelled
```

### challenge_participant_status_enum

Status of a user's participation in a challenge.

```
joined | in_progress | completed | failed | withdrawn
```

---

## Family Support Enums

### supporter_role_enum

Relationship of family supporter to job seeker.

```
spouse | partner | parent | sibling | child | friend | mentor | therapist | other
```

### supporter_status_enum

Status of family supporter invitation.

```
pending | active | declined | removed
```

### stress_level_enum

Stress level for wellness tracking.

```
very_low | low | moderate | high | very_high
```

### mood_type_enum

Mood types for check-ins.

```
great | good | okay | struggling | overwhelmed
```

### milestone_type_enum

Types of milestones to celebrate.

```
first_application | application_milestone | first_interview | interview_milestone | offer_received | offer_accepted | skill_learned | certification_earned | networking_milestone | goal_achieved | streak_achieved | custom
```

### celebration_type_enum

Types of achievement celebrations.

```
first_application | application_milestone | first_interview | interview_milestone | goal_completed | streak_achieved | offer_received | offer_accepted | document_approved | weekly_target_met | monthly_target_met | custom
```

### communication_type_enum

Types of family communications.

```
progress_update | milestone_share | general_update | thank_you | boundary_reminder | custom
```

### boundary_type_enum

Types of support boundaries.

```
communication_frequency | topic_restriction | advice_limitation | timing_preference | support_style | custom
```

### resource_category_enum

Categories for family support resources.

```
understanding_process | effective_support | what_not_to_say | emotional_support | practical_help | celebrating_wins | handling_rejection | stress_management
```

---

## Progress & Sharing Enums

### sharing_visibility_enum

Visibility levels for progress sharing.

```
private | mentors_only | accountability | team | public
```

### partnership_status_enum

Status of accountability partnerships.

```
pending | active | paused | ended
```

---

## Cohort & Program Enums

### cohort_status_enum

Status of cohorts/programs.

```
draft | active | completed | archived
```

### onboarding_job_status_enum

Status of bulk onboarding jobs.

```
pending | processing | completed | failed | partial
```

---

## Enterprise & Compliance Enums

### compliance_event_enum

Types of compliance events to log.

```
user_data_access | user_data_export | user_data_delete | settings_change | role_change | bulk_operation | integration_access | report_generated | login_attempt | permission_change
```

### integration_type_enum

Types of external integrations.

```
lms | sis | crm | calendar | sso | analytics | job_board | ats | custom_webhook
```
