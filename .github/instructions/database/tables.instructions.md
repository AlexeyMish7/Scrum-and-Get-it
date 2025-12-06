# Database Tables Reference

This file contains all 94 tables in the FlowATS database with their column definitions.

---

## Core User Profile Tables

### profiles

| Column        | Type        | Nullable | Default |
| ------------- | ----------- | -------- | ------- |
| id            | uuid        | NO       | -       |
| email         | text        | NO       | -       |
| first_name    | text        | NO       | -       |
| last_name     | text        | NO       | -       |
| phone         | text        | YES      | NULL    |
| location      | text        | YES      | NULL    |
| bio           | text        | YES      | NULL    |
| avatar_url    | text        | YES      | NULL    |
| linkedin_url  | text        | YES      | NULL    |
| github_url    | text        | YES      | NULL    |
| portfolio_url | text        | YES      | NULL    |
| created_at    | timestamptz | YES      | now()   |
| updated_at    | timestamptz | YES      | now()   |

### education

| Column         | Type         | Nullable | Default           |
| -------------- | ------------ | -------- | ----------------- |
| id             | uuid         | NO       | gen_random_uuid() |
| user_id        | uuid         | NO       | -                 |
| institution    | text         | NO       | -                 |
| degree         | text         | NO       | -                 |
| field_of_study | text         | NO       | -                 |
| start_date     | date         | NO       | -                 |
| end_date       | date         | YES      | NULL              |
| gpa            | numeric(3,2) | YES      | NULL              |
| activities     | text         | YES      | NULL              |
| description    | text         | YES      | NULL              |
| created_at     | timestamptz  | YES      | now()             |
| updated_at     | timestamptz  | YES      | now()             |

### employment

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| user_id     | uuid        | NO       | -                 |
| company     | text        | NO       | -                 |
| title       | text        | NO       | -                 |
| location    | text        | YES      | NULL              |
| start_date  | date        | NO       | -                 |
| end_date    | date        | YES      | NULL              |
| is_current  | boolean     | YES      | false             |
| description | text        | YES      | NULL              |
| created_at  | timestamptz | YES      | now()             |
| updated_at  | timestamptz | YES      | now()             |

### skills

| Column           | Type              | Nullable | Default           |
| ---------------- | ----------------- | -------- | ----------------- |
| id               | uuid              | NO       | gen_random_uuid() |
| user_id          | uuid              | NO       | -                 |
| name             | text              | NO       | -                 |
| category         | skill_category    | YES      | NULL              |
| proficiency      | skill_proficiency | YES      | NULL              |
| years_experience | integer           | YES      | NULL              |
| created_at       | timestamptz       | YES      | now()             |
| updated_at       | timestamptz       | YES      | now()             |

### certifications

| Column               | Type        | Nullable | Default           |
| -------------------- | ----------- | -------- | ----------------- |
| id                   | uuid        | NO       | gen_random_uuid() |
| user_id              | uuid        | NO       | -                 |
| name                 | text        | NO       | -                 |
| issuing_organization | text        | NO       | -                 |
| issue_date           | date        | YES      | NULL              |
| expiration_date      | date        | YES      | NULL              |
| credential_id        | text        | YES      | NULL              |
| credential_url       | text        | YES      | NULL              |
| created_at           | timestamptz | YES      | now()             |
| updated_at           | timestamptz | YES      | now()             |

### projects

| Column         | Type        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | NO       | gen_random_uuid() |
| user_id        | uuid        | NO       | -                 |
| name           | text        | NO       | -                 |
| description    | text        | YES      | NULL              |
| technologies   | text[]      | YES      | NULL              |
| url            | text        | YES      | NULL              |
| repository_url | text        | YES      | NULL              |
| start_date     | date        | YES      | NULL              |
| end_date       | date        | YES      | NULL              |
| created_at     | timestamptz | YES      | now()             |
| updated_at     | timestamptz | YES      | now()             |

### references_list

| Column       | Type        | Nullable | Default           |
| ------------ | ----------- | -------- | ----------------- |
| id           | uuid        | NO       | gen_random_uuid() |
| user_id      | uuid        | NO       | -                 |
| name         | text        | NO       | -                 |
| relationship | text        | NO       | -                 |
| company      | text        | YES      | NULL              |
| title        | text        | YES      | NULL              |
| email        | text        | YES      | NULL              |
| phone        | text        | YES      | NULL              |
| notes        | text        | YES      | NULL              |
| created_at   | timestamptz | YES      | now()             |
| updated_at   | timestamptz | YES      | now()             |

---

## Job Pipeline Tables

### jobs

| Column         | Type         | Nullable | Default           |
| -------------- | ------------ | -------- | ----------------- |
| id             | uuid         | NO       | gen_random_uuid() |
| user_id        | uuid         | NO       | -                 |
| company        | text         | NO       | -                 |
| position       | text         | NO       | -                 |
| location       | text         | YES      | NULL              |
| salary_min     | integer      | YES      | NULL              |
| salary_max     | integer      | YES      | NULL              |
| job_type       | job_type     | YES      | NULL              |
| work_mode      | work_mode    | YES      | NULL              |
| status         | job_status   | YES      | 'saved'           |
| priority       | job_priority | YES      | 'medium'          |
| source         | text         | YES      | NULL              |
| url            | text         | YES      | NULL              |
| description    | text         | YES      | NULL              |
| requirements   | text         | YES      | NULL              |
| notes          | text         | YES      | NULL              |
| applied_at     | timestamptz  | YES      | NULL              |
| deadline       | date         | YES      | NULL              |
| created_at     | timestamptz  | YES      | now()             |
| updated_at     | timestamptz  | YES      | now()             |
| status_history | jsonb        | YES      | '[]'              |

### job_notes

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| job_id     | uuid        | NO       | -                 |
| user_id    | uuid        | NO       | -                 |
| content    | text        | NO       | -                 |
| created_at | timestamptz | YES      | now()             |
| updated_at | timestamptz | YES      | now()             |

### job_time_entries

| Column           | Type        | Nullable | Default           |
| ---------------- | ----------- | -------- | ----------------- |
| id               | uuid        | NO       | gen_random_uuid() |
| job_id           | uuid        | NO       | -                 |
| user_id          | uuid        | NO       | -                 |
| activity_type    | text        | NO       | -                 |
| duration_minutes | integer     | NO       | -                 |
| notes            | text        | YES      | NULL              |
| date             | date        | YES      | CURRENT_DATE      |
| created_at       | timestamptz | YES      | now()             |

### companies

| Column       | Type         | Nullable | Default           |
| ------------ | ------------ | -------- | ----------------- |
| id           | uuid         | NO       | gen_random_uuid() |
| name         | text         | NO       | -                 |
| website      | text         | YES      | NULL              |
| industry     | text         | YES      | NULL              |
| size         | company_size | YES      | NULL              |
| description  | text         | YES      | NULL              |
| headquarters | text         | YES      | NULL              |
| created_at   | timestamptz  | YES      | now()             |
| updated_at   | timestamptz  | YES      | now()             |

### user_company_notes

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| user_id    | uuid        | NO       | -                 |
| company_id | uuid        | NO       | -                 |
| notes      | text        | YES      | NULL              |
| rating     | integer     | YES      | NULL              |
| pros       | text[]      | YES      | NULL              |
| cons       | text[]      | YES      | NULL              |
| created_at | timestamptz | YES      | now()             |
| updated_at | timestamptz | YES      | now()             |

---

## Document System Tables

### documents

| Column     | Type          | Nullable | Default           |
| ---------- | ------------- | -------- | ----------------- |
| id         | uuid          | NO       | gen_random_uuid() |
| user_id    | uuid          | NO       | -                 |
| project_id | uuid          | YES      | NULL              |
| type       | document_type | NO       | -                 |
| name       | text          | NO       | -                 |
| content    | text          | YES      | NULL              |
| file_path  | text          | YES      | NULL              |
| file_size  | integer       | YES      | NULL              |
| mime_type  | text          | YES      | NULL              |
| is_master  | boolean       | YES      | false             |
| version    | integer       | YES      | 1                 |
| parent_id  | uuid          | YES      | NULL              |
| created_at | timestamptz   | YES      | now()             |
| updated_at | timestamptz   | YES      | now()             |

### document_versions

| Column         | Type        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | NO       | gen_random_uuid() |
| document_id    | uuid        | NO       | -                 |
| version_number | integer     | NO       | -                 |
| content        | text        | YES      | NULL              |
| file_path      | text        | YES      | NULL              |
| change_summary | text        | YES      | NULL              |
| created_at     | timestamptz | YES      | now()             |
| created_by     | uuid        | YES      | NULL              |

### document_jobs

| Column       | Type        | Nullable | Default           |
| ------------ | ----------- | -------- | ----------------- |
| id           | uuid        | NO       | gen_random_uuid() |
| document_id  | uuid        | NO       | -                 |
| job_id       | uuid        | NO       | -                 |
| is_submitted | boolean     | YES      | false             |
| submitted_at | timestamptz | YES      | NULL              |
| notes        | text        | YES      | NULL              |
| created_at   | timestamptz | YES      | now()             |

### document_reviews

| Column      | Type          | Nullable | Default           |
| ----------- | ------------- | -------- | ----------------- |
| id          | uuid          | NO       | gen_random_uuid() |
| document_id | uuid          | NO       | -                 |
| reviewer_id | uuid          | NO       | -                 |
| status      | review_status | YES      | 'pending'         |
| feedback    | text          | YES      | NULL              |
| created_at  | timestamptz   | YES      | now()             |
| updated_at  | timestamptz   | YES      | now()             |

### review_comments

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| review_id  | uuid        | NO       | -                 |
| user_id    | uuid        | NO       | -                 |
| content    | text        | NO       | -                 |
| position   | jsonb       | YES      | NULL              |
| created_at | timestamptz | YES      | now()             |
| updated_at | timestamptz | YES      | now()             |

### templates

| Column      | Type          | Nullable | Default           |
| ----------- | ------------- | -------- | ----------------- |
| id          | uuid          | NO       | gen_random_uuid() |
| user_id     | uuid          | YES      | NULL              |
| type        | template_type | NO       | -                 |
| name        | text          | NO       | -                 |
| description | text          | YES      | NULL              |
| content     | text          | NO       | -                 |
| is_default  | boolean       | YES      | false             |
| is_system   | boolean       | YES      | false             |
| created_at  | timestamptz   | YES      | now()             |
| updated_at  | timestamptz   | YES      | now()             |

---

## Interview Hub Tables

### interviews

| Column           | Type             | Nullable | Default           |
| ---------------- | ---------------- | -------- | ----------------- |
| id               | uuid             | NO       | gen_random_uuid() |
| job_id           | uuid             | NO       | -                 |
| user_id          | uuid             | NO       | -                 |
| type             | interview_type   | NO       | -                 |
| status           | interview_status | YES      | 'scheduled'       |
| scheduled_at     | timestamptz      | NO       | -                 |
| duration_minutes | integer          | YES      | 60                |
| location         | text             | YES      | NULL              |
| meeting_url      | text             | YES      | NULL              |
| interviewers     | jsonb            | YES      | '[]'              |
| notes            | text             | YES      | NULL              |
| created_at       | timestamptz      | YES      | now()             |
| updated_at       | timestamptz      | YES      | now()             |

### interview_feedback

| Column               | Type        | Nullable | Default           |
| -------------------- | ----------- | -------- | ----------------- |
| id                   | uuid        | NO       | gen_random_uuid() |
| interview_id         | uuid        | NO       | -                 |
| user_id              | uuid        | NO       | -                 |
| overall_rating       | integer     | YES      | NULL              |
| technical_rating     | integer     | YES      | NULL              |
| communication_rating | integer     | YES      | NULL              |
| culture_fit_rating   | integer     | YES      | NULL              |
| strengths            | text[]      | YES      | NULL              |
| improvements         | text[]      | YES      | NULL              |
| notes                | text        | YES      | NULL              |
| created_at           | timestamptz | YES      | now()             |
| updated_at           | timestamptz | YES      | now()             |

### preparation_activities

| Column       | Type             | Nullable | Default           |
| ------------ | ---------------- | -------- | ----------------- |
| id           | uuid             | NO       | gen_random_uuid() |
| interview_id | uuid             | NO       | -                 |
| user_id      | uuid             | NO       | -                 |
| type         | preparation_type | NO       | -                 |
| title        | text             | NO       | -                 |
| description  | text             | YES      | NULL              |
| is_completed | boolean          | YES      | false             |
| completed_at | timestamptz      | YES      | NULL              |
| notes        | text             | YES      | NULL              |
| created_at   | timestamptz      | YES      | now()             |
| updated_at   | timestamptz      | YES      | now()             |

---

## Network Hub Tables

### contacts

| Column         | Type                 | Nullable | Default           |
| -------------- | -------------------- | -------- | ----------------- |
| id             | uuid                 | NO       | gen_random_uuid() |
| user_id        | uuid                 | NO       | -                 |
| name           | text                 | NO       | -                 |
| email          | text                 | YES      | NULL              |
| phone          | text                 | YES      | NULL              |
| company        | text                 | YES      | NULL              |
| title          | text                 | YES      | NULL              |
| relationship   | contact_relationship | YES      | NULL              |
| linkedin_url   | text                 | YES      | NULL              |
| notes          | text                 | YES      | NULL              |
| last_contacted | date                 | YES      | NULL              |
| created_at     | timestamptz          | YES      | now()             |
| updated_at     | timestamptz          | YES      | now()             |

### contact_interactions

| Column           | Type             | Nullable | Default           |
| ---------------- | ---------------- | -------- | ----------------- |
| id               | uuid             | NO       | gen_random_uuid() |
| contact_id       | uuid             | NO       | -                 |
| user_id          | uuid             | NO       | -                 |
| type             | interaction_type | NO       | -                 |
| subject          | text             | YES      | NULL              |
| notes            | text             | YES      | NULL              |
| interaction_date | date             | YES      | CURRENT_DATE      |
| follow_up_date   | date             | YES      | NULL              |
| created_at       | timestamptz      | YES      | now()             |

### contact_reminders

| Column       | Type        | Nullable | Default           |
| ------------ | ----------- | -------- | ----------------- |
| id           | uuid        | NO       | gen_random_uuid() |
| contact_id   | uuid        | NO       | -                 |
| user_id      | uuid        | NO       | -                 |
| title        | text        | NO       | -                 |
| description  | text        | YES      | NULL              |
| due_date     | date        | NO       | -                 |
| is_completed | boolean     | YES      | false             |
| completed_at | timestamptz | YES      | NULL              |
| created_at   | timestamptz | YES      | now()             |
| updated_at   | timestamptz | YES      | now()             |

### referral_requests

| Column       | Type            | Nullable | Default           |
| ------------ | --------------- | -------- | ----------------- |
| id           | uuid            | NO       | gen_random_uuid() |
| user_id      | uuid            | NO       | -                 |
| contact_id   | uuid            | NO       | -                 |
| job_id       | uuid            | YES      | NULL              |
| status       | referral_status | YES      | 'pending'         |
| message      | text            | YES      | NULL              |
| response     | text            | YES      | NULL              |
| requested_at | timestamptz     | YES      | now()             |
| responded_at | timestamptz     | YES      | NULL              |
| created_at   | timestamptz     | YES      | now()             |
| updated_at   | timestamptz     | YES      | now()             |

### informational_interviews

| Column           | Type                  | Nullable | Default           |
| ---------------- | --------------------- | -------- | ----------------- |
| id               | uuid                  | NO       | gen_random_uuid() |
| user_id          | uuid                  | NO       | -                 |
| contact_id       | uuid                  | NO       | -                 |
| status           | info_interview_status | YES      | 'requested'       |
| scheduled_at     | timestamptz           | YES      | NULL              |
| duration_minutes | integer               | YES      | 30                |
| meeting_url      | text                  | YES      | NULL              |
| questions        | text[]                | YES      | NULL              |
| notes            | text                  | YES      | NULL              |
| takeaways        | text[]                | YES      | NULL              |
| created_at       | timestamptz           | YES      | now()             |
| updated_at       | timestamptz           | YES      | now()             |

### networking_events

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| user_id    | uuid        | NO       | -                 |
| name       | text        | NO       | -                 |
| type       | event_type  | YES      | NULL              |
| location   | text        | YES      | NULL              |
| event_url  | text        | YES      | NULL              |
| event_date | timestamptz | NO       | -                 |
| notes      | text        | YES      | NULL              |
| created_at | timestamptz | YES      | now()             |
| updated_at | timestamptz | YES      | now()             |

### networking_event_contacts

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| event_id   | uuid        | NO       | -                 |
| contact_id | uuid        | NO       | -                 |
| notes      | text        | YES      | NULL              |
| created_at | timestamptz | YES      | now()             |

---

## Analytics & Caching Tables

### analytics_cache

| Column              | Type        | Nullable | Default           |
| ------------------- | ----------- | -------- | ----------------- |
| id                  | uuid        | NO       | gen_random_uuid() |
| user_id             | uuid        | NO       | -                 |
| job_id              | uuid        | NO       | -                 |
| profile_version     | integer     | YES      | 1                 |
| match_score         | jsonb       | YES      | NULL              |
| skill_analysis      | jsonb       | YES      | NULL              |
| experience_analysis | jsonb       | YES      | NULL              |
| recommendations     | jsonb       | YES      | NULL              |
| created_at          | timestamptz | YES      | now()             |
| updated_at          | timestamptz | YES      | now()             |
| expires_at          | timestamptz | YES      | NULL              |

### company_research_cache

| Column        | Type        | Nullable | Default           |
| ------------- | ----------- | -------- | ----------------- |
| id            | uuid        | NO       | gen_random_uuid() |
| company_name  | text        | NO       | -                 |
| research_data | jsonb       | NO       | -                 |
| source        | text        | YES      | NULL              |
| created_at    | timestamptz | YES      | now()             |
| expires_at    | timestamptz | YES      | NULL              |

### export_history

| Column        | Type          | Nullable | Default           |
| ------------- | ------------- | -------- | ----------------- |
| id            | uuid          | NO       | gen_random_uuid() |
| user_id       | uuid          | NO       | -                 |
| export_type   | text          | NO       | -                 |
| file_name     | text          | NO       | -                 |
| file_path     | text          | YES      | NULL              |
| file_size     | integer       | YES      | NULL              |
| status        | export_status | YES      | 'pending'         |
| error_message | text          | YES      | NULL              |
| created_at    | timestamptz   | YES      | now()             |
| completed_at  | timestamptz   | YES      | NULL              |

---

## AI Workspace Tables

### generation_sessions

| Column       | Type           | Nullable | Default           |
| ------------ | -------------- | -------- | ----------------- |
| id           | uuid           | NO       | gen_random_uuid() |
| user_id      | uuid           | NO       | -                 |
| job_id       | uuid           | YES      | NULL              |
| session_type | session_type   | NO       | -                 |
| status       | session_status | YES      | 'active'          |
| metadata     | jsonb          | YES      | '{}'              |
| created_at   | timestamptz    | YES      | now()             |
| updated_at   | timestamptz    | YES      | now()             |
| completed_at | timestamptz    | YES      | NULL              |

---

## Team Management Tables

### teams

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| name        | text        | NO       | -                 |
| description | text        | YES      | NULL              |
| owner_id    | uuid        | NO       | -                 |
| settings    | jsonb       | YES      | '{}'              |
| created_at  | timestamptz | YES      | now()             |
| updated_at  | timestamptz | YES      | now()             |

### team_members

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| team_id     | uuid        | NO       | -                 |
| user_id     | uuid        | NO       | -                 |
| role        | team_role   | YES      | 'member'          |
| permissions | jsonb       | YES      | '{}'              |
| joined_at   | timestamptz | YES      | now()             |
| created_at  | timestamptz | YES      | now()             |
| updated_at  | timestamptz | YES      | now()             |

### team_invitations

| Column     | Type              | Nullable | Default           |
| ---------- | ----------------- | -------- | ----------------- |
| id         | uuid              | NO       | gen_random_uuid() |
| team_id    | uuid              | NO       | -                 |
| email      | text              | NO       | -                 |
| role       | team_role         | YES      | 'member'          |
| invited_by | uuid              | NO       | -                 |
| status     | invitation_status | YES      | 'pending'         |
| expires_at | timestamptz       | YES      | NULL              |
| created_at | timestamptz       | YES      | now()             |
| updated_at | timestamptz       | YES      | now()             |

### team_member_assignments

| Column         | Type        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | NO       | gen_random_uuid() |
| team_member_id | uuid        | NO       | -                 |
| job_id         | uuid        | YES      | NULL              |
| document_id    | uuid        | YES      | NULL              |
| assigned_by    | uuid        | NO       | -                 |
| notes          | text        | YES      | NULL              |
| created_at     | timestamptz | YES      | now()             |

### team_messages

| Column       | Type         | Nullable | Default           |
| ------------ | ------------ | -------- | ----------------- |
| id           | uuid         | NO       | gen_random_uuid() |
| team_id      | uuid         | NO       | -                 |
| sender_id    | uuid         | NO       | -                 |
| content      | text         | NO       | -                 |
| message_type | message_type | YES      | 'text'            |
| attachments  | jsonb        | YES      | '[]'              |
| created_at   | timestamptz  | YES      | now()             |
| updated_at   | timestamptz  | YES      | now()             |

### team_activity_log

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| team_id     | uuid        | NO       | -                 |
| user_id     | uuid        | NO       | -                 |
| action      | text        | NO       | -                 |
| entity_type | text        | YES      | NULL              |
| entity_id   | uuid        | YES      | NULL              |
| metadata    | jsonb       | YES      | '{}'              |
| created_at  | timestamptz | YES      | now()             |

### team_settings

| Column        | Type        | Nullable | Default           |
| ------------- | ----------- | -------- | ----------------- |
| id            | uuid        | NO       | gen_random_uuid() |
| team_id       | uuid        | NO       | -                 |
| setting_key   | text        | NO       | -                 |
| setting_value | jsonb       | NO       | -                 |
| created_at    | timestamptz | YES      | now()             |
| updated_at    | timestamptz | YES      | now()             |

### team_subscriptions

| Column               | Type                | Nullable | Default           |
| -------------------- | ------------------- | -------- | ----------------- |
| id                   | uuid                | NO       | gen_random_uuid() |
| team_id              | uuid                | NO       | -                 |
| plan_id              | uuid                | NO       | -                 |
| status               | subscription_status | YES      | 'active'          |
| current_period_start | timestamptz         | NO       | -                 |
| current_period_end   | timestamptz         | NO       | -                 |
| cancel_at_period_end | boolean             | YES      | false             |
| created_at           | timestamptz         | YES      | now()             |
| updated_at           | timestamptz         | YES      | now()             |

### subscription_plans

| Column           | Type          | Nullable | Default           |
| ---------------- | ------------- | -------- | ----------------- |
| id               | uuid          | NO       | gen_random_uuid() |
| name             | text          | NO       | -                 |
| description      | text          | YES      | NULL              |
| price_monthly    | numeric(10,2) | NO       | -                 |
| price_yearly     | numeric(10,2) | YES      | NULL              |
| features         | jsonb         | YES      | '{}'              |
| max_team_members | integer       | YES      | NULL              |
| is_active        | boolean       | YES      | true              |
| created_at       | timestamptz   | YES      | now()             |
| updated_at       | timestamptz   | YES      | now()             |

---

## Peer Networking Tables

### peer_groups

| Column      | Type             | Nullable | Default           |
| ----------- | ---------------- | -------- | ----------------- |
| id          | uuid             | NO       | gen_random_uuid() |
| name        | text             | NO       | -                 |
| description | text             | YES      | NULL              |
| type        | peer_group_type  | YES      | 'general'         |
| visibility  | group_visibility | YES      | 'private'         |
| max_members | integer          | YES      | 50                |
| settings    | jsonb            | YES      | '{}'              |
| created_by  | uuid             | NO       | -                 |
| created_at  | timestamptz      | YES      | now()             |
| updated_at  | timestamptz      | YES      | now()             |

### peer_group_members

| Column     | Type            | Nullable | Default           |
| ---------- | --------------- | -------- | ----------------- |
| id         | uuid            | NO       | gen_random_uuid() |
| group_id   | uuid            | NO       | -                 |
| user_id    | uuid            | NO       | -                 |
| role       | peer_group_role | YES      | 'member'          |
| status     | member_status   | YES      | 'active'          |
| joined_at  | timestamptz     | YES      | now()             |
| created_at | timestamptz     | YES      | now()             |
| updated_at | timestamptz     | YES      | now()             |

### peer_group_posts

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| group_id    | uuid        | NO       | -                 |
| user_id     | uuid        | NO       | -                 |
| content     | text        | NO       | -                 |
| post_type   | post_type   | YES      | 'discussion'      |
| attachments | jsonb       | YES      | '[]'              |
| is_pinned   | boolean     | YES      | false             |
| created_at  | timestamptz | YES      | now()             |
| updated_at  | timestamptz | YES      | now()             |

### peer_post_likes

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| post_id    | uuid        | NO       | -                 |
| user_id    | uuid        | NO       | -                 |
| created_at | timestamptz | YES      | now()             |

### peer_group_challenges

| Column         | Type           | Nullable | Default           |
| -------------- | -------------- | -------- | ----------------- |
| id             | uuid           | NO       | gen_random_uuid() |
| group_id       | uuid           | NO       | -                 |
| title          | text           | NO       | -                 |
| description    | text           | YES      | NULL              |
| challenge_type | challenge_type | YES      | 'weekly'          |
| start_date     | date           | NO       | -                 |
| end_date       | date           | NO       | -                 |
| goal_metric    | text           | YES      | NULL              |
| goal_value     | integer        | YES      | NULL              |
| created_by     | uuid           | NO       | -                 |
| created_at     | timestamptz    | YES      | now()             |
| updated_at     | timestamptz    | YES      | now()             |

### peer_challenge_participants

| Column       | Type        | Nullable | Default           |
| ------------ | ----------- | -------- | ----------------- |
| id           | uuid        | NO       | gen_random_uuid() |
| challenge_id | uuid        | NO       | -                 |
| user_id      | uuid        | NO       | -                 |
| progress     | integer     | YES      | 0                 |
| completed_at | timestamptz | YES      | NULL              |
| created_at   | timestamptz | YES      | now()             |
| updated_at   | timestamptz | YES      | now()             |

### peer_referrals

| Column      | Type                 | Nullable | Default           |
| ----------- | -------------------- | -------- | ----------------- |
| id          | uuid                 | NO       | gen_random_uuid() |
| referrer_id | uuid                 | NO       | -                 |
| referee_id  | uuid                 | NO       | -                 |
| job_id      | uuid                 | YES      | NULL              |
| company     | text                 | YES      | NULL              |
| position    | text                 | YES      | NULL              |
| status      | peer_referral_status | YES      | 'pending'         |
| notes       | text                 | YES      | NULL              |
| created_at  | timestamptz          | YES      | now()             |
| updated_at  | timestamptz          | YES      | now()             |

### peer_referral_interests

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| user_id    | uuid        | NO       | -                 |
| company    | text        | YES      | NULL              |
| industry   | text        | YES      | NULL              |
| role_type  | text        | YES      | NULL              |
| notes      | text        | YES      | NULL              |
| is_active  | boolean     | YES      | true              |
| created_at | timestamptz | YES      | now()             |
| updated_at | timestamptz | YES      | now()             |

### peer_success_stories

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| user_id    | uuid        | NO       | -                 |
| group_id   | uuid        | YES      | NULL              |
| title      | text        | NO       | -                 |
| content    | text        | NO       | -                 |
| job_id     | uuid        | YES      | NULL              |
| is_public  | boolean     | YES      | false             |
| created_at | timestamptz | YES      | now()             |
| updated_at | timestamptz | YES      | now()             |

### peer_benchmarks

| Column       | Type             | Nullable | Default           |
| ------------ | ---------------- | -------- | ----------------- |
| id           | uuid             | NO       | gen_random_uuid() |
| user_id      | uuid             | NO       | -                 |
| metric_type  | benchmark_metric | NO       | -                 |
| value        | numeric          | NO       | -                 |
| period_start | date             | NO       | -                 |
| period_end   | date             | NO       | -                 |
| created_at   | timestamptz      | YES      | now()             |

### peer_networking_impact

| Column             | Type        | Nullable | Default           |
| ------------------ | ----------- | -------- | ----------------- |
| id                 | uuid        | NO       | gen_random_uuid() |
| user_id            | uuid        | NO       | -                 |
| referrals_given    | integer     | YES      | 0                 |
| referrals_received | integer     | YES      | 0                 |
| connections_made   | integer     | YES      | 0                 |
| posts_count        | integer     | YES      | 0                 |
| helpful_responses  | integer     | YES      | 0                 |
| impact_score       | numeric     | YES      | 0                 |
| calculated_at      | timestamptz | YES      | now()             |
| created_at         | timestamptz | YES      | now()             |
| updated_at         | timestamptz | YES      | now()             |

### user_peer_settings

| Column                   | Type               | Nullable | Default           |
| ------------------------ | ------------------ | -------- | ----------------- |
| id                       | uuid               | NO       | gen_random_uuid() |
| user_id                  | uuid               | NO       | -                 |
| allow_referral_requests  | boolean            | YES      | true              |
| show_job_search_status   | boolean            | YES      | true              |
| profile_visibility       | profile_visibility | YES      | 'connections'     |
| notification_preferences | jsonb              | YES      | '{}'              |
| created_at               | timestamptz        | YES      | now()             |
| updated_at               | timestamptz        | YES      | now()             |

---

## Family Support Tables

### family_supporters

| Column       | Type                | Nullable | Default           |
| ------------ | ------------------- | -------- | ----------------- |
| id           | uuid                | NO       | gen_random_uuid() |
| user_id      | uuid                | NO       | -                 |
| email        | text                | NO       | -                 |
| name         | text                | NO       | -                 |
| relationship | family_relationship | NO       | -                 |
| access_level | family_access_level | YES      | 'viewer'          |
| status       | supporter_status    | YES      | 'pending'         |
| invite_token | text                | YES      | NULL              |
| invited_at   | timestamptz         | YES      | now()             |
| accepted_at  | timestamptz         | YES      | NULL              |
| created_at   | timestamptz         | YES      | now()             |
| updated_at   | timestamptz         | YES      | now()             |

### family_support_settings

| Column                  | Type        | Nullable | Default           |
| ----------------------- | ----------- | -------- | ----------------- |
| id                      | uuid        | NO       | gen_random_uuid() |
| user_id                 | uuid        | NO       | -                 |
| share_job_count         | boolean     | YES      | true              |
| share_interview_count   | boolean     | YES      | true              |
| share_application_stats | boolean     | YES      | true              |
| share_milestones        | boolean     | YES      | true              |
| share_stress_level      | boolean     | YES      | false             |
| weekly_summary_enabled  | boolean     | YES      | true              |
| created_at              | timestamptz | YES      | now()             |
| updated_at              | timestamptz | YES      | now()             |

### progress_sharing_settings

| Column             | Type        | Nullable | Default           |
| ------------------ | ----------- | -------- | ----------------- |
| id                 | uuid        | NO       | gen_random_uuid() |
| user_id            | uuid        | NO       | -                 |
| share_with_family  | boolean     | YES      | true              |
| share_with_mentors | boolean     | YES      | true              |
| share_with_peers   | boolean     | YES      | false             |
| visible_metrics    | jsonb       | YES      | '{}'              |
| created_at         | timestamptz | YES      | now()             |
| updated_at         | timestamptz | YES      | now()             |

### family_progress_summaries

| Column             | Type         | Nullable | Default           |
| ------------------ | ------------ | -------- | ----------------- |
| id                 | uuid         | NO       | gen_random_uuid() |
| user_id            | uuid         | NO       | -                 |
| period_start       | date         | NO       | -                 |
| period_end         | date         | NO       | -                 |
| summary_type       | summary_type | YES      | 'weekly'          |
| applications_count | integer      | YES      | 0                 |
| interviews_count   | integer      | YES      | 0                 |
| offers_count       | integer      | YES      | 0                 |
| highlights         | text[]       | YES      | NULL              |
| mood_trend         | mood_trend   | YES      | NULL              |
| created_at         | timestamptz  | YES      | now()             |

### family_milestones

| Column         | Type           | Nullable | Default           |
| -------------- | -------------- | -------- | ----------------- |
| id             | uuid           | NO       | gen_random_uuid() |
| user_id        | uuid           | NO       | -                 |
| milestone_type | milestone_type | NO       | -                 |
| title          | text           | NO       | -                 |
| description    | text           | YES      | NULL              |
| achieved_at    | timestamptz    | YES      | now()             |
| is_shared      | boolean        | YES      | true              |
| job_id         | uuid           | YES      | NULL              |
| created_at     | timestamptz    | YES      | now()             |

### family_communications

| Column       | Type                | Nullable | Default           |
| ------------ | ------------------- | -------- | ----------------- |
| id           | uuid                | NO       | gen_random_uuid() |
| user_id      | uuid                | NO       | -                 |
| supporter_id | uuid                | NO       | -                 |
| message_type | family_message_type | NO       | -                 |
| content      | text                | NO       | -                 |
| is_read      | boolean             | YES      | false             |
| created_at   | timestamptz         | YES      | now()             |

### family_resources

| Column          | Type            | Nullable | Default           |
| --------------- | --------------- | -------- | ----------------- |
| id              | uuid            | NO       | gen_random_uuid() |
| title           | text            | NO       | -                 |
| description     | text            | YES      | NULL              |
| resource_type   | resource_type   | NO       | -                 |
| url             | text            | YES      | NULL              |
| content         | text            | YES      | NULL              |
| target_audience | target_audience | YES      | 'job_seeker'      |
| created_at      | timestamptz     | YES      | now()             |
| updated_at      | timestamptz     | YES      | now()             |

### support_boundaries

| Column        | Type          | Nullable | Default           |
| ------------- | ------------- | -------- | ----------------- |
| id            | uuid          | NO       | gen_random_uuid() |
| user_id       | uuid          | NO       | -                 |
| boundary_type | boundary_type | NO       | -                 |
| description   | text          | YES      | NULL              |
| is_active     | boolean       | YES      | true              |
| created_at    | timestamptz   | YES      | now()             |
| updated_at    | timestamptz   | YES      | now()             |

### progress_messages

| Column         | Type           | Nullable | Default           |
| -------------- | -------------- | -------- | ----------------- |
| id             | uuid           | NO       | gen_random_uuid() |
| user_id        | uuid           | NO       | -                 |
| recipient_type | recipient_type | NO       | -                 |
| recipient_id   | uuid           | YES      | NULL              |
| content        | text           | NO       | -                 |
| is_automated   | boolean        | YES      | false             |
| sent_at        | timestamptz    | YES      | now()             |
| created_at     | timestamptz    | YES      | now()             |

---

## External Advisors Tables

### external_advisors

| Column       | Type           | Nullable | Default           |
| ------------ | -------------- | -------- | ----------------- |
| id           | uuid           | NO       | gen_random_uuid() |
| user_id      | uuid           | NO       | -                 |
| email        | text           | NO       | -                 |
| name         | text           | NO       | -                 |
| title        | text           | YES      | NULL              |
| company      | text           | YES      | NULL              |
| expertise    | text[]         | YES      | NULL              |
| advisor_type | advisor_type   | NO       | -                 |
| status       | advisor_status | YES      | 'pending'         |
| hourly_rate  | numeric(10,2)  | YES      | NULL              |
| bio          | text           | YES      | NULL              |
| linkedin_url | text           | YES      | NULL              |
| created_at   | timestamptz    | YES      | now()             |
| updated_at   | timestamptz    | YES      | now()             |

### advisor_sessions

| Column           | Type           | Nullable | Default           |
| ---------------- | -------------- | -------- | ----------------- |
| id               | uuid           | NO       | gen_random_uuid() |
| advisor_id       | uuid           | NO       | -                 |
| user_id          | uuid           | NO       | -                 |
| scheduled_at     | timestamptz    | NO       | -                 |
| duration_minutes | integer        | YES      | 60                |
| status           | session_status | YES      | 'scheduled'       |
| meeting_url      | text           | YES      | NULL              |
| agenda           | text           | YES      | NULL              |
| notes            | text           | YES      | NULL              |
| rating           | integer        | YES      | NULL              |
| feedback         | text           | YES      | NULL              |
| created_at       | timestamptz    | YES      | now()             |
| updated_at       | timestamptz    | YES      | now()             |

### advisor_messages

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| advisor_id  | uuid        | NO       | -                 |
| user_id     | uuid        | NO       | -                 |
| sender_type | sender_type | NO       | -                 |
| content     | text        | NO       | -                 |
| is_read     | boolean     | YES      | false             |
| created_at  | timestamptz | YES      | now()             |

### advisor_recommendations

| Column              | Type                    | Nullable | Default           |
| ------------------- | ----------------------- | -------- | ----------------- |
| id                  | uuid                    | NO       | gen_random_uuid() |
| advisor_id          | uuid                    | NO       | -                 |
| user_id             | uuid                    | NO       | -                 |
| session_id          | uuid                    | YES      | NULL              |
| recommendation_type | recommendation_type     | NO       | -                 |
| title               | text                    | NO       | -                 |
| description         | text                    | YES      | NULL              |
| priority            | recommendation_priority | YES      | 'medium'          |
| status              | recommendation_status   | YES      | 'pending'         |
| due_date            | date                    | YES      | NULL              |
| completed_at        | timestamptz             | YES      | NULL              |
| created_at          | timestamptz             | YES      | now()             |
| updated_at          | timestamptz             | YES      | now()             |

### advisor_shared_materials

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| advisor_id  | uuid        | NO       | -                 |
| user_id     | uuid        | NO       | -                 |
| document_id | uuid        | YES      | NULL              |
| job_id      | uuid        | YES      | NULL              |
| shared_by   | sender_type | NO       | -                 |
| notes       | text        | YES      | NULL              |
| created_at  | timestamptz | YES      | now()             |

### advisor_invitations

| Column       | Type              | Nullable | Default           |
| ------------ | ----------------- | -------- | ----------------- |
| id           | uuid              | NO       | gen_random_uuid() |
| user_id      | uuid              | NO       | -                 |
| email        | text              | NO       | -                 |
| name         | text              | NO       | -                 |
| advisor_type | advisor_type      | NO       | -                 |
| message      | text              | YES      | NULL              |
| status       | invitation_status | YES      | 'pending'         |
| invite_token | text              | YES      | NULL              |
| expires_at   | timestamptz       | YES      | NULL              |
| created_at   | timestamptz       | YES      | now()             |
| updated_at   | timestamptz       | YES      | now()             |

### advisor_billing

| Column         | Type           | Nullable | Default           |
| -------------- | -------------- | -------- | ----------------- |
| id             | uuid           | NO       | gen_random_uuid() |
| advisor_id     | uuid           | NO       | -                 |
| user_id        | uuid           | NO       | -                 |
| session_id     | uuid           | YES      | NULL              |
| amount         | numeric(10,2)  | NO       | -                 |
| status         | billing_status | YES      | 'pending'         |
| paid_at        | timestamptz    | YES      | NULL              |
| payment_method | text           | YES      | NULL              |
| invoice_url    | text           | YES      | NULL              |
| created_at     | timestamptz    | YES      | now()             |
| updated_at     | timestamptz    | YES      | now()             |

---

## Mentorship & Career Tables

### mentee_goals

| Column      | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| user_id     | uuid        | NO       | -                 |
| mentor_id   | uuid        | YES      | NULL              |
| title       | text        | NO       | -                 |
| description | text        | YES      | NULL              |
| goal_type   | goal_type   | NO       | -                 |
| target_date | date        | YES      | NULL              |
| status      | goal_status | YES      | 'active'          |
| progress    | integer     | YES      | 0                 |
| milestones  | jsonb       | YES      | '[]'              |
| created_at  | timestamptz | YES      | now()             |
| updated_at  | timestamptz | YES      | now()             |

### mentor_feedback

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| goal_id    | uuid        | NO       | -                 |
| mentor_id  | uuid        | NO       | -                 |
| feedback   | text        | NO       | -                 |
| rating     | integer     | YES      | NULL              |
| created_at | timestamptz | YES      | now()             |

### career_goals

| Column          | Type        | Nullable | Default           |
| --------------- | ----------- | -------- | ----------------- |
| id              | uuid        | NO       | gen_random_uuid() |
| user_id         | uuid        | NO       | -                 |
| title           | text        | NO       | -                 |
| description     | text        | YES      | NULL              |
| target_role     | text        | YES      | NULL              |
| target_industry | text        | YES      | NULL              |
| target_salary   | integer     | YES      | NULL              |
| target_date     | date        | YES      | NULL              |
| status          | goal_status | YES      | 'active'          |
| created_at      | timestamptz | YES      | now()             |
| updated_at      | timestamptz | YES      | now()             |

### accountability_partnerships

| Column             | Type               | Nullable | Default           |
| ------------------ | ------------------ | -------- | ----------------- |
| id                 | uuid               | NO       | gen_random_uuid() |
| user_id            | uuid               | NO       | -                 |
| partner_id         | uuid               | NO       | -                 |
| status             | partnership_status | YES      | 'active'          |
| check_in_frequency | check_in_frequency | YES      | 'weekly'          |
| goals              | jsonb              | YES      | '[]'              |
| created_at         | timestamptz        | YES      | now()             |
| updated_at         | timestamptz        | YES      | now()             |

### progress_snapshots

| Column             | Type        | Nullable | Default           |
| ------------------ | ----------- | -------- | ----------------- |
| id                 | uuid        | NO       | gen_random_uuid() |
| user_id            | uuid        | NO       | -                 |
| snapshot_date      | date        | NO       | -                 |
| applications_count | integer     | YES      | 0                 |
| interviews_count   | integer     | YES      | 0                 |
| offers_count       | integer     | YES      | 0                 |
| rejections_count   | integer     | YES      | 0                 |
| active_jobs_count  | integer     | YES      | 0                 |
| metrics            | jsonb       | YES      | '{}'              |
| created_at         | timestamptz | YES      | now()             |

### achievement_celebrations

| Column           | Type             | Nullable | Default           |
| ---------------- | ---------------- | -------- | ----------------- |
| id               | uuid             | NO       | gen_random_uuid() |
| user_id          | uuid             | NO       | -                 |
| achievement_type | achievement_type | NO       | -                 |
| title            | text             | NO       | -                 |
| description      | text             | YES      | NULL              |
| achieved_at      | timestamptz      | YES      | now()             |
| shared_with      | jsonb            | YES      | '[]'              |
| reactions        | jsonb            | YES      | '{}'              |
| created_at       | timestamptz      | YES      | now()             |

### confidence_logs

| Column           | Type        | Nullable | Default           |
| ---------------- | ----------- | -------- | ----------------- |
| id               | uuid        | NO       | gen_random_uuid() |
| user_id          | uuid        | NO       | -                 |
| confidence_level | integer     | NO       | -                 |
| factors          | text[]      | YES      | NULL              |
| notes            | text        | YES      | NULL              |
| logged_at        | timestamptz | YES      | now()             |
| created_at       | timestamptz | YES      | now()             |

### stress_metrics

| Column            | Type        | Nullable | Default           |
| ----------------- | ----------- | -------- | ----------------- |
| id                | uuid        | NO       | gen_random_uuid() |
| user_id           | uuid        | NO       | -                 |
| stress_level      | integer     | NO       | -                 |
| energy_level      | integer     | YES      | NULL              |
| motivation_level  | integer     | YES      | NULL              |
| sleep_quality     | integer     | YES      | NULL              |
| factors           | text[]      | YES      | NULL              |
| coping_strategies | text[]      | YES      | NULL              |
| logged_at         | timestamptz | YES      | now()             |
| created_at        | timestamptz | YES      | now()             |

---

## Cohort & Program Tables

### cohorts

| Column           | Type         | Nullable | Default           |
| ---------------- | ------------ | -------- | ----------------- |
| id               | uuid         | NO       | gen_random_uuid() |
| name             | text         | NO       | -                 |
| description      | text         | YES      | NULL              |
| program_type     | program_type | NO       | -                 |
| start_date       | date         | NO       | -                 |
| end_date         | date         | YES      | NULL              |
| max_participants | integer      | YES      | NULL              |
| settings         | jsonb        | YES      | '{}'              |
| created_by       | uuid         | NO       | -                 |
| created_at       | timestamptz  | YES      | now()             |
| updated_at       | timestamptz  | YES      | now()             |

### cohort_members

| Column       | Type                 | Nullable | Default           |
| ------------ | -------------------- | -------- | ----------------- |
| id           | uuid                 | NO       | gen_random_uuid() |
| cohort_id    | uuid                 | NO       | -                 |
| user_id      | uuid                 | NO       | -                 |
| role         | cohort_role          | YES      | 'participant'     |
| status       | cohort_member_status | YES      | 'active'          |
| joined_at    | timestamptz          | YES      | now()             |
| completed_at | timestamptz          | YES      | NULL              |
| created_at   | timestamptz          | YES      | now()             |
| updated_at   | timestamptz          | YES      | now()             |

### program_analytics

| Column       | Type                | Nullable | Default           |
| ------------ | ------------------- | -------- | ----------------- |
| id           | uuid                | NO       | gen_random_uuid() |
| cohort_id    | uuid                | NO       | -                 |
| metric_type  | program_metric_type | NO       | -                 |
| value        | numeric             | NO       | -                 |
| period_start | date                | NO       | -                 |
| period_end   | date                | NO       | -                 |
| metadata     | jsonb               | YES      | '{}'              |
| created_at   | timestamptz         | YES      | now()             |

---

## Enterprise & Compliance Tables

### enterprise_branding

| Column          | Type        | Nullable | Default           |
| --------------- | ----------- | -------- | ----------------- |
| id              | uuid        | NO       | gen_random_uuid() |
| team_id         | uuid        | NO       | -                 |
| logo_url        | text        | YES      | NULL              |
| primary_color   | text        | YES      | NULL              |
| secondary_color | text        | YES      | NULL              |
| custom_domain   | text        | YES      | NULL              |
| settings        | jsonb       | YES      | '{}'              |
| created_at      | timestamptz | YES      | now()             |
| updated_at      | timestamptz | YES      | now()             |

### bulk_onboarding_jobs

| Column          | Type            | Nullable | Default           |
| --------------- | --------------- | -------- | ----------------- |
| id              | uuid            | NO       | gen_random_uuid() |
| team_id         | uuid            | NO       | -                 |
| status          | bulk_job_status | YES      | 'pending'         |
| total_users     | integer         | NO       | -                 |
| processed_users | integer         | YES      | 0                 |
| failed_users    | integer         | YES      | 0                 |
| error_log       | jsonb           | YES      | '[]'              |
| started_at      | timestamptz     | YES      | NULL              |
| completed_at    | timestamptz     | YES      | NULL              |
| created_by      | uuid            | NO       | -                 |
| created_at      | timestamptz     | YES      | now()             |
| updated_at      | timestamptz     | YES      | now()             |

### compliance_logs

| Column        | Type        | Nullable | Default           |
| ------------- | ----------- | -------- | ----------------- |
| id            | uuid        | NO       | gen_random_uuid() |
| team_id       | uuid        | YES      | NULL              |
| user_id       | uuid        | YES      | NULL              |
| action        | text        | NO       | -                 |
| resource_type | text        | NO       | -                 |
| resource_id   | uuid        | YES      | NULL              |
| ip_address    | inet        | YES      | NULL              |
| user_agent    | text        | YES      | NULL              |
| metadata      | jsonb       | YES      | '{}'              |
| created_at    | timestamptz | YES      | now()             |

### roi_reports

| Column               | Type          | Nullable | Default           |
| -------------------- | ------------- | -------- | ----------------- |
| id                   | uuid          | NO       | gen_random_uuid() |
| team_id              | uuid          | NO       | -                 |
| report_period_start  | date          | NO       | -                 |
| report_period_end    | date          | NO       | -                 |
| total_placements     | integer       | YES      | 0                 |
| average_time_to_hire | numeric       | YES      | NULL              |
| cost_per_hire        | numeric(10,2) | YES      | NULL              |
| satisfaction_score   | numeric(3,2)  | YES      | NULL              |
| metrics              | jsonb         | YES      | '{}'              |
| generated_at         | timestamptz   | YES      | now()             |
| created_at           | timestamptz   | YES      | now()             |

### external_integrations

| Column           | Type               | Nullable | Default           |
| ---------------- | ------------------ | -------- | ----------------- |
| id               | uuid               | NO       | gen_random_uuid() |
| team_id          | uuid               | YES      | NULL              |
| user_id          | uuid               | YES      | NULL              |
| integration_type | integration_type   | NO       | -                 |
| credentials      | jsonb              | NO       | -                 |
| settings         | jsonb              | YES      | '{}'              |
| status           | integration_status | YES      | 'active'          |
| last_sync_at     | timestamptz        | YES      | NULL              |
| created_at       | timestamptz        | YES      | now()             |
| updated_at       | timestamptz        | YES      | now()             |

---

## Competitive Intelligence Tables

### user_competitive_position

| Column           | Type        | Nullable | Default           |
| ---------------- | ----------- | -------- | ----------------- |
| id               | uuid        | NO       | gen_random_uuid() |
| user_id          | uuid        | NO       | -                 |
| target_role      | text        | NO       | -                 |
| target_industry  | text        | YES      | NULL              |
| overall_score    | numeric     | YES      | NULL              |
| skill_score      | numeric     | YES      | NULL              |
| experience_score | numeric     | YES      | NULL              |
| education_score  | numeric     | YES      | NULL              |
| network_score    | numeric     | YES      | NULL              |
| calculated_at    | timestamptz | YES      | now()             |
| created_at       | timestamptz | YES      | now()             |
| updated_at       | timestamptz | YES      | now()             |

### industry_standards

| Column                   | Type        | Nullable | Default           |
| ------------------------ | ----------- | -------- | ----------------- |
| id                       | uuid        | NO       | gen_random_uuid() |
| industry                 | text        | NO       | -                 |
| role_level               | role_level  | NO       | -                 |
| required_skills          | jsonb       | YES      | '[]'              |
| preferred_skills         | jsonb       | YES      | '[]'              |
| typical_experience_years | integer     | YES      | NULL              |
| education_requirements   | jsonb       | YES      | '{}'              |
| salary_range             | jsonb       | YES      | '{}'              |
| created_at               | timestamptz | YES      | now()             |
| updated_at               | timestamptz | YES      | now()             |

### career_progression_patterns

| Column          | Type        | Nullable | Default           |
| --------------- | ----------- | -------- | ----------------- |
| id              | uuid        | NO       | gen_random_uuid() |
| from_role       | text        | NO       | -                 |
| to_role         | text        | NO       | -                 |
| industry        | text        | YES      | NULL              |
| typical_years   | integer     | YES      | NULL              |
| required_skills | jsonb       | YES      | '[]'              |
| success_factors | jsonb       | YES      | '[]'              |
| sample_size     | integer     | YES      | NULL              |
| created_at      | timestamptz | YES      | now()             |
| updated_at      | timestamptz | YES      | now()             |

### success_patterns

| Column              | Type         | Nullable | Default           |
| ------------------- | ------------ | -------- | ----------------- |
| id                  | uuid         | NO       | gen_random_uuid() |
| pattern_type        | pattern_type | NO       | -                 |
| industry            | text         | YES      | NULL              |
| role_type           | text         | YES      | NULL              |
| pattern_data        | jsonb        | NO       | -                 |
| effectiveness_score | numeric      | YES      | NULL              |
| sample_size         | integer      | YES      | NULL              |
| created_at          | timestamptz  | YES      | now()             |
| updated_at          | timestamptz  | YES      | now()             |

### timing_patterns

| Column                     | Type        | Nullable | Default           |
| -------------------------- | ----------- | -------- | ----------------- |
| id                         | uuid        | NO       | gen_random_uuid() |
| industry                   | text        | YES      | NULL              |
| role_type                  | text        | YES      | NULL              |
| best_application_months    | integer[]   | YES      | NULL              |
| best_application_days      | integer[]   | YES      | NULL              |
| average_response_time_days | integer     | YES      | NULL              |
| hiring_cycle_months        | integer     | YES      | NULL              |
| created_at                 | timestamptz | YES      | now()             |
| updated_at                 | timestamptz | YES      | now()             |

### strategy_effectiveness

| Column             | Type          | Nullable | Default           |
| ------------------ | ------------- | -------- | ----------------- |
| id                 | uuid          | NO       | gen_random_uuid() |
| user_id            | uuid          | NO       | -                 |
| strategy_type      | strategy_type | NO       | -                 |
| applications_count | integer       | YES      | 0                 |
| interviews_count   | integer       | YES      | 0                 |
| offers_count       | integer       | YES      | 0                 |
| conversion_rate    | numeric       | YES      | NULL              |
| period_start       | date          | NO       | -                 |
| period_end         | date          | NO       | -                 |
| created_at         | timestamptz   | YES      | now()             |
| updated_at         | timestamptz   | YES      | now()             |

### pattern_evolution

| Column              | Type        | Nullable | Default           |
| ------------------- | ----------- | -------- | ----------------- |
| id                  | uuid        | NO       | gen_random_uuid() |
| pattern_id          | uuid        | NO       | -                 |
| version             | integer     | NO       | -                 |
| changes             | jsonb       | NO       | -                 |
| effectiveness_delta | numeric     | YES      | NULL              |
| recorded_at         | timestamptz | YES      | now()             |
| created_at          | timestamptz | YES      | now()             |

### predictive_models

| Column               | Type        | Nullable | Default           |
| -------------------- | ----------- | -------- | ----------------- |
| id                   | uuid        | NO       | gen_random_uuid() |
| model_type           | model_type  | NO       | -                 |
| industry             | text        | YES      | NULL              |
| role_type            | text        | YES      | NULL              |
| model_data           | jsonb       | NO       | -                 |
| accuracy_score       | numeric     | YES      | NULL              |
| last_trained_at      | timestamptz | YES      | NULL              |
| training_sample_size | integer     | YES      | NULL              |
| created_at           | timestamptz | YES      | now()             |
| updated_at           | timestamptz | YES      | now()             |

---

## UI Customization Tables

### themes

| Column     | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| user_id    | uuid        | YES      | NULL              |
| name       | text        | NO       | -                 |
| is_system  | boolean     | YES      | false             |
| colors     | jsonb       | NO       | -                 |
| fonts      | jsonb       | YES      | '{}'              |
| spacing    | jsonb       | YES      | '{}'              |
| created_at | timestamptz | YES      | now()             |
| updated_at | timestamptz | YES      | now()             |
