# Database Functions Reference

This file contains all 88 functions in the FlowATS database organized by category.

---

## Trigger Functions

These functions are used as triggers to automate database operations.

### set_updated_at()

**Returns:** `trigger`
Automatically updates the `updated_at` column to `now()` on row updates.

### update_updated_at_column()

**Returns:** `trigger`
Same as `set_updated_at()` - updates `updated_at` timestamp.

### handle_new_user()

**Returns:** `trigger`
**Security:** DEFINER
Creates a profile record when a new user signs up via Supabase Auth. Extracts name and avatar from OAuth metadata (Google, LinkedIn, etc.).

### auto_add_team_owner()

**Returns:** `trigger`
**Security:** DEFINER
Automatically adds the team owner as a team member with 'owner' role and creates default team settings when a new team is created.

### jobs_append_application_history()

**Returns:** `trigger`
**Security:** DEFINER
Appends status change entries to `job_notes.application_history` when a job's status changes. Tracks from/to status, timestamp, and actor.

---

## AI Artifacts Functions

### ai_artifacts_set_latest_on_insert()

**Returns:** `trigger`
**Security:** DEFINER
Manages versioning for AI artifacts:

- Sets `is_latest = false` on previous artifacts in the same group
- Auto-calculates `version_number` based on parent or max existing version
- Validates parent artifact ownership

### get_artifact_chain(artifact_id uuid)

**Returns:** `TABLE(id, parent_artifact_id, version_number, is_latest, title, created_at, depth)`
**Security:** DEFINER
Recursively retrieves the full version chain for an artifact, following `parent_artifact_id` upward.

---

## Document Functions

### increment_document_version_count()

**Returns:** `trigger`
Increments `documents.total_versions` when a new document version is created.

### update_document_last_edited()

**Returns:** `trigger`
Updates `documents.last_edited_at` and optionally `last_generated_at` (for AI-generated changes) when a version is created.

### user_can_view_document(p_document_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if the current user can view a document (owns it or is an active reviewer).

### user_owns_document(p_user_id uuid, p_document_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Simple check if a user owns a specific document.

### get_document_review_summary(p_document_id uuid)

**Returns:** `TABLE(total_reviews, pending_reviews, completed_reviews, approved_reviews, total_comments, unresolved_comments, overdue_reviews)`
**Security:** DEFINER
Aggregates review statistics for a document.

### get_review_feedback_summary(p_review_id uuid)

**Returns:** `jsonb`
**Security:** DEFINER
Returns comment statistics for a review grouped by type and section.

### update_review_comment_counts()

**Returns:** `trigger`
Keeps `document_reviews.total_comments` and `unresolved_comments` in sync when comments are added/removed/resolved.

---

## Resume & Cover Letter Draft Functions

### auto_increment_resume_version()

**Returns:** `trigger`
Auto-calculates version numbers for resume drafts based on parent relationships and version family.

### mark_previous_version_inactive()

**Returns:** `trigger`
Sets `is_active = false` on parent draft when a new version is created.

### update_resume_drafts_updated_at()

**Returns:** `trigger`
Updates `updated_at` timestamp on resume drafts.

### update_cover_letter_drafts_updated_at()

**Returns:** `trigger`
Updates `updated_at` timestamp on cover letter drafts.

---

## Export Functions

### increment_export_download()

**Returns:** `trigger`
Increments `download_count` and updates `last_downloaded_at` in export_history.

---

## Team & Permission Functions

### is_team_admin(p_user_id uuid, p_team_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if user is a team admin or owner.

### has_team_permission(p_team_id uuid, p_user_id uuid, p_permission text)

**Returns:** `boolean`
**Security:** DEFINER
Checks if user has a specific permission on a team. Owners/admins have all permissions.

### check_team_permission(p_user_id uuid, p_team_id uuid, p_permission text)

**Returns:** `boolean`
**Security:** DEFINER
Detailed permission check with role-based defaults:

- `can_view_all_candidates`: admin, mentor
- `can_edit_candidates`: admin
- `can_invite_members`: admin
- `can_remove_members`: admin
- `can_change_roles`: admin
- `can_view_analytics`: all
- `can_export_data`: admin, mentor
- `can_manage_team_settings`: admin

### get_user_teams(p_user_id uuid)

**Returns:** `TABLE(team_id, team_name, team_description, role, is_owner, member_count, joined_at)`
**Security:** DEFINER
Lists all teams a user belongs to with their role.

### get_user_team_ids(p_user_id uuid)

**Returns:** `SETOF uuid`
**Security:** DEFINER
Returns just the team IDs for a user (optimized for RLS policies).

### get_team_members_for_sharing(p_user_id uuid, p_team_id uuid)

**Returns:** `TABLE(member_user_id, member_full_name, member_email, member_role)`
**Security:** DEFINER
Lists team members available for document sharing (excludes requesting user).

### update_team_member_stats()

**Returns:** `trigger`
Updates `teams.total_members`, `total_candidates`, and `total_mentors` counts.

### update_team_updated_at()

**Returns:** `trigger`
Updates team `updated_at` timestamp.

### has_pending_invitation(p_email text, p_team_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if an email has a pending, non-expired invitation to a team.

### has_enterprise_subscription(p_team_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if team has an active enterprise subscription.

---

## Mentor/Mentee Functions

### get_assigned_candidates(p_mentor_id uuid, p_team_id uuid DEFAULT NULL)

**Returns:** `TABLE(candidate_id, candidate_name, candidate_email, team_id, team_name, assigned_at)`
**Security:** DEFINER
Lists candidates assigned to a mentor.

### get_mentee_profile_summary(p_mentor_id uuid, p_candidate_id uuid)

**Returns:** `TABLE(candidate_id, full_name, email, professional_title, experience_level, industry, city, state, skill_count, employment_count, education_count, project_count, certification_count)`
**Security:** DEFINER
Returns a mentee's profile summary (validates mentor-candidate relationship).

### get_mentee_job_stats(p_mentor_id uuid, p_candidate_id uuid)

**Returns:** `TABLE(total_jobs, applied_count, interviewing_count, offer_count, rejected_count)`
**Security:** DEFINER
Returns job application statistics for a mentee.

### get_mentee_recent_jobs(p_mentor_id uuid, p_candidate_id uuid, p_limit integer DEFAULT 15)

**Returns:** `TABLE(job_id, title, company_name, job_status, created_at, updated_at)`
**Security:** DEFINER
Returns recent job applications for a mentee.

### get_mentee_activity_summary(p_mentor_id uuid, p_candidate_id uuid)

**Returns:** `TABLE(jobs_created_7d, jobs_updated_7d, documents_updated_7d, goals_completed_7d, last_activity_at, engagement_level)`
**Security:** DEFINER
Returns 7-day activity summary with engagement level (high/moderate/low/inactive).

### get_mentee_documents(p_mentor_id uuid, p_candidate_id uuid, p_team_id uuid)

**Returns:** `TABLE(document_id, title, document_type, version_number, created_at, updated_at, job_id, job_title, company_name)`
**Security:** DEFINER
Returns document versions for a mentee.

### get_mentee_skills(p_mentor_id uuid, p_candidate_id uuid)

**Returns:** `TABLE(skill_id, skill_name, proficiency_level, skill_category, years_of_experience)`
**Security:** DEFINER
Returns skills for a mentee.

### get_mentee_employment(p_mentor_id uuid, p_candidate_id uuid)

**Returns:** `TABLE(employment_id, job_title, company_name, location, start_date, end_date, current_position, job_description, achievements)`
**Security:** DEFINER
Returns employment history for a mentee.

---

## Progress & Snapshot Functions

### create_progress_snapshot(p_user_id uuid, p_team_id uuid, p_period_type text DEFAULT 'weekly', p_period_start date DEFAULT NULL, p_period_end date DEFAULT NULL)

**Returns:** `uuid`
**Security:** DEFINER
Creates a progress snapshot capturing applications, interviews, offers, goals, and trends.

### generate_progress_snapshot(p_user_id uuid, p_team_id uuid, p_period_type text DEFAULT 'weekly')

**Returns:** `uuid`
**Security:** DEFINER
Full snapshot generation with activity scores, streaks, and daily breakdown.

### generate_weekly_progress_snapshots(p_team_id uuid)

**Returns:** `integer`
**Security:** DEFINER
Batch generates weekly snapshots for all active team members. Returns count of snapshots created.

### get_user_progress_summary(p_user_id uuid, p_team_id uuid, p_viewer_id uuid DEFAULT NULL)

**Returns:** `jsonb`
**Security:** DEFINER
Returns progress summary respecting sharing settings and visibility permissions.

---

## Progress Sharing & Messaging Functions

### get_conversation(p_user_id uuid, p_other_user_id uuid, p_team_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)

**Returns:** `TABLE(id, sender_id, recipient_id, message_text, message_type, is_read, created_at, sender_name, recipient_name)`
**Security:** DEFINER
Retrieves conversation messages between two users.

### get_conversations_list(p_user_id uuid, p_team_id uuid)

**Returns:** `TABLE(partner_id, partner_name, partner_title, last_message_text, last_message_at, last_message_sender_id, unread_count)`
**Security:** DEFINER
Lists all conversations for a user with unread counts.

### get_unread_message_count(p_user_id uuid)

**Returns:** `integer`
**Security:** DEFINER
Returns total unread message count for a user.

---

## Achievement & Celebration Functions

### check_and_create_achievement(p_user_id uuid, p_team_id uuid, p_event_type text, p_event_value integer DEFAULT NULL)

**Returns:** `uuid`
**Security:** DEFINER
Checks for achievement milestones and creates celebrations. Supported events:

- `application_added`: First application, milestones at 10, 25, 50, 100, 250, 500
- `interview_scheduled`: First interview
- `offer_received`: Job offer
- `offer_accepted`: Accepted offer
- `goal_completed`: Goal completion

---

## Goal Functions

### get_goal_progress(goal_id uuid)

**Returns:** `numeric`
Calculates goal completion percentage (capped at 100%).

### get_active_goals_summary(p_user_id uuid)

**Returns:** `TABLE(total_active, on_track, behind_schedule, completed_this_month, avg_progress)`
Returns summary of active career goals with on-track/behind status.

### update_career_goals_updated_at()

**Returns:** `trigger`
Updates `updated_at` timestamp on career goals.

---

## Advisor Functions

### is_advisor_for_user(p_advisor_id uuid, p_user_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if an advisor relationship exists and is active.

### get_advisor_impact(p_user_id uuid, p_advisor_id uuid DEFAULT NULL)

**Returns:** `TABLE(advisor_id, advisor_name, total_sessions, completed_sessions, total_recommendations, implemented_recommendations, implementation_rate, average_session_rating, total_hours, active_since)`
**Security:** DEFINER
Returns impact metrics for advisors.

### get_upcoming_advisor_sessions(p_user_id uuid, p_limit integer DEFAULT 10)

**Returns:** `TABLE(session_id, advisor_id, advisor_name, title, scheduled_start, scheduled_end, status, location_type, meeting_url)`
**Security:** DEFINER
Lists upcoming scheduled/confirmed advisor sessions.

### get_pending_recommendations(p_user_id uuid)

**Returns:** `TABLE(recommendation_id, advisor_id, advisor_name, title, description, category, priority, target_date, created_at)`
**Security:** DEFINER
Lists pending/in-progress recommendations sorted by priority.

### update_advisor_session_stats()

**Returns:** `trigger`
Increments `external_advisors.total_sessions` when a session is completed.

### update_advisor_recommendation_stats()

**Returns:** `trigger`
Increments `external_advisors.total_recommendations` when a recommendation is created.

---

## Family Support Functions

### is_family_supporter(p_user_id uuid, p_supporter_user_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if someone is an active family supporter.

### can_supporter_view(p_user_id uuid, p_supporter_user_id uuid, p_content_type text)

**Returns:** `boolean`
**Security:** DEFINER
Checks if a supporter can view specific content types: applications, interviews, progress, milestones, stress.

### update_family_updated_at()

**Returns:** `trigger`
Updates `updated_at` timestamp on family-related tables.

---

## Peer Networking Functions

### is_peer_group_member(p_group_id uuid, p_user_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if user is an active member of a peer group.

### is_peer_group_admin(p_group_id uuid, p_user_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if user is an owner or moderator of a peer group.

### update_group_member_count()

**Returns:** `trigger`
Updates `peer_groups.member_count` when members join/leave.

### update_group_post_count()

**Returns:** `trigger`
Updates `peer_groups.post_count` and reply counts on posts.

### update_post_like_count()

**Returns:** `trigger`
Updates `peer_group_posts.like_count` when likes are added/removed.

### update_challenge_participant_count()

**Returns:** `trigger`
Updates `peer_group_challenges.participant_count` and `completion_count`.

### update_peer_updated_at()

**Returns:** `trigger`
Updates `updated_at` timestamp on peer networking tables.

---

## Cohort Functions

### update_cohort_enrollment_count()

**Returns:** `trigger`
Updates `cohorts.current_enrollment` when members are added/removed or activated/deactivated.

### get_cohort_analytics(p_cohort_id uuid)

**Returns:** `TABLE(enrolled_count, active_count, placed_count, placement_rate, avg_salary, avg_time_to_placement, industry_breakdown, completion_breakdown)`
**Security:** DEFINER
Returns analytics for a cohort.

### get_cohort_stats(p_team_id uuid)

**Returns:** `TABLE(total_cohorts, active_cohorts, total_enrolled, total_placed, avg_placement_rate)`
**Security:** DEFINER
Returns aggregate cohort statistics for a team.

---

## Company Research Functions

### get_company_research(p_company_name text, p_industry text DEFAULT NULL)

**Returns:** `jsonb`
**Security:** DEFINER
Retrieves company info with cached research data (if not expired).

### save_company_research(p_company_id uuid, p_research_data jsonb, p_metadata jsonb DEFAULT '{}')

**Returns:** `uuid`
**Security:** DEFINER
Saves company research to cache with 7-day TTL.

### upsert_company_info(p_company_name text, p_industry text DEFAULT 'Unknown', p_size text DEFAULT NULL, p_location text DEFAULT NULL, p_founded_year text DEFAULT NULL, p_website text DEFAULT NULL, p_description text DEFAULT NULL, p_company_data jsonb DEFAULT '{}', p_source text DEFAULT 'ai')

**Returns:** `uuid`
**Security:** DEFINER
Creates or updates company information, merging JSONB data.

### update_company_research_cache_updated_at()

**Returns:** `trigger`
Updates `updated_at` timestamp on company research cache.

### get_user_companies(p_user_id uuid)

**Returns:** `TABLE(company_name text)`
**Security:** DEFINER
Returns distinct company names from a user's non-archived jobs.

---

## Analytics & Cache Functions

### cleanup_expired_analytics()

**Returns:** `integer`
**Security:** DEFINER
Deletes expired analytics cache entries. Returns count of deleted rows.

### cleanup_expired_company_research()

**Returns:** `integer`
**Security:** DEFINER
Deletes expired company research cache entries. Returns count of deleted rows.

### update_analytics_access()

**Returns:** `trigger`
Increments `access_count` and updates `last_accessed_at` on analytics cache.

### update_job_analytics_cache_updated_at()

**Returns:** `trigger`
Updates `updated_at` timestamp on job analytics cache.

---

## Competitive Benchmarking Functions

### compute_peer_benchmarks(target_industry text, target_experience_level text, target_title_category text DEFAULT NULL, target_region text DEFAULT NULL)

**Returns:** `void`
**Security:** DEFINER
Computes aggregated peer benchmarks for an industry/experience segment. Requires minimum 5 users for privacy. Calculates:

- Average applications/month, response/interview/offer rates
- Time to interview and offer
- Top required and missing skills
- Salary statistics

### compute_all_peer_benchmarks()

**Returns:** `void`
**Security:** DEFINER
Batch computes benchmarks for all industry/experience level combinations.

### get_user_competitive_position(target_user_id uuid)

**Returns:** `TABLE(percentile_data, peer_comparison, industry_comparison, strengths, gaps, recommendations)`
**Security:** DEFINER
Returns a user's competitive position analysis including percentiles and comparisons.

### update_competitive_benchmarking_timestamp()

**Returns:** `trigger`
Updates `updated_at` timestamp on competitive benchmarking tables.

---

## Pattern Recognition Functions

### update_pattern_recognition_timestamp()

**Returns:** `trigger`
Updates `updated_at` timestamp on pattern recognition tables.

---

## Preparation Activity Functions

### auto_link_prep_activities()

**Returns:** `trigger`
Automatically links preparation activities to nearby jobs (within 7 days).

### update_prep_activity_outcomes()

**Returns:** `trigger`
Updates prep activity outcomes (`led_to_response`, `led_to_interview`, `led_to_offer`) when job status changes.

---

## Profile Functions

### can_view_profile(profile_id uuid)

**Returns:** `boolean`
**Security:** DEFINER
Checks if current user can view a profile (own profile or same team member).

---

## Interview Functions

### update_interviews_updated_at()

**Returns:** `trigger`
Updates `updated_at` timestamp on interviews.

---

## User Management Functions

### delete_user(p_user_id uuid)

**Returns:** `void`
**Security:** DEFINER
Deletes a user and all their data. Authorization: only the session user can delete their own account.

Order of deletion:

1. documents
2. projects
3. skills
4. certifications
5. education
6. employment
7. profiles
8. auth.users

### delete_user_userid(user_id uuid)

**Returns:** `void`
**Security:** DEFINER
Wrapper function that calls `delete_user()`.
