# Database Schema - Complete Reference

This document explains every table in the FlowATS database, what it stores, and where it's used in the app.

## User & Authentication

### `auth.users` (Supabase managed)

**Purpose:** Core authentication table managed by Supabase

**What it stores:**

- User ID (UUID)
- Email address
- Encrypted password
- Email confirmation status
- Last sign-in timestamp

**Where it's used:**

- Login/logout
- Password reset
- Email verification
- Session management

**Note:** You don't directly interact with this table - Supabase handles it.

---

### `profiles`

**Purpose:** Extended user information and professional details

**Columns:**

- `id` - User UUID (links to auth.users)
- `first_name` - First name (required)
- `last_name` - Last name (required)
- `full_name` - Computed full name
- `email` - Email address (required, unique)
- `phone` - Phone number
- `professional_title` - Current job title (e.g., "Software Engineer")
- `summary` - Professional bio/summary
- `experience_level` - entry/mid/senior/executive
- `industry` - Industry focus
- `city` - Current city
- `state` - Current state
- `metadata` - JSON for flexible fields
- `created_at` - Account creation date
- `updated_at` - Last modification date

**Where it's used:**

- Profile page (display/edit)
- Resume generation (header section)
- Cover letter generation (signature)
- Job matching (experience level consideration)

**Relationships:**

- One-to-one with `auth.users`
- One-to-many with all other user data tables

---

## Profile Data (Resume Content)

### `skills`

**Purpose:** User's professional skills

**Columns:**

- `id` - Unique skill ID
- `user_id` - Links to profiles
- `skill_name` - Skill name (e.g., "JavaScript")
- `proficiency_level` - Beginner/Intermediate/Advanced/Expert
- `skill_category` - Technical/Soft/Language/Tool/Framework/Other
- `years_of_experience` - How long they've used this skill
- `last_used_date` - When last used
- `metadata` - Additional data
- `created_at`, `updated_at`

**Where it's used:**

- Profile → Skills section
- Resume generation → Skills section
- Job matching → Skills comparison
- Skills gap analysis → Identify missing skills

**Example data:**

```json
{
  "skill_name": "React",
  "proficiency_level": "Advanced",
  "skill_category": "Framework",
  "years_of_experience": 3
}
```

---

### `employment`

**Purpose:** Work history

**Columns:**

- `id` - Unique employment record ID
- `user_id` - Links to profiles
- `job_title` - Position title
- `company_name` - Employer name
- `location` - Job location
- `start_date` - Start date (required)
- `end_date` - End date (null if current)
- `current_position` - Boolean flag
- `job_description` - Role description
- `achievements` - Array of accomplishment bullets
- `metadata` - Additional data
- `created_at`, `updated_at`

**Where it's used:**

- Profile → Experience section
- Resume generation → Experience section
- Cover letter → Highlight relevant experience
- Job matching → Compare experience level

**Example data:**

```json
{
  "job_title": "Senior Software Engineer",
  "company_name": "Tech Corp",
  "start_date": "2020-01-15",
  "current_position": true,
  "achievements": [
    "Led team of 5 engineers",
    "Increased performance by 40%",
    "Mentored 3 junior developers"
  ]
}
```

---

### `education`

**Purpose:** Educational background

**Columns:**

- `id` - Unique education record ID
- `user_id` - Links to profiles
- `institution_name` - School/university name (required)
- `degree_type` - Bachelor's, Master's, etc.
- `field_of_study` - Major/field
- `education_level` - Enum for standardized levels
- `start_date` - Enrollment start (required)
- `graduation_date` - Graduation date (null if enrolled)
- `enrollment_status` - enrolled/graduated/transferred/dropped
- `gpa` - GPA (0-4 scale)
- `honors` - Honors/awards
- `metadata` - Additional data
- `created_at`, `updated_at`

**Where it's used:**

- Profile → Education section
- Resume generation → Education section
- Job matching → Education requirement check

---

### `projects`

**Purpose:** Portfolio projects

**Columns:**

- `id` - Project ID
- `user_id` - Links to profiles
- `proj_name` - Project name (required)
- `proj_description` - Description
- `role` - User's role in project
- `start_date` - Project start (required)
- `end_date` - Project end
- `status` - planned/active/completed/archived
- `tech_and_skills` - Array of technologies used
- `industry_proj_type` - Industry/type
- `team_size` - Number of team members
- `team_details` - Team composition
- `project_url` - Link to project
- `media_path` - Screenshots/images path
- `proj_outcomes` - Results/impact
- `metadata`, `created_at`, `updated_at`

**Where it's used:**

- Profile → Projects section
- Resume generation → Projects section (if template supports)
- Portfolio showcase

---

### `certifications`

**Purpose:** Professional certifications

**Columns:**

- `id` - Certification ID
- `user_id` - Links to profiles
- `name` - Certification name (required)
- `issuing_org` - Issuing organization
- `category` - Certification category
- `certification_id` - Credential ID
- `date_earned` - When earned
- `expiration_date` - When expires
- `does_not_expire` - Boolean flag
- `verification_status` - unverified/pending/verified/expired
- `verification_url` - Link to verify
- `media_path` - Certificate image
- `metadata`, `created_at`, `updated_at`

**Where it's used:**

- Profile → Certifications section
- Resume generation → Certifications section
- Job matching → Certification requirements

---

## Job Tracking

### `jobs`

**Purpose:** Job opportunities user is tracking

**Columns:**

- `id` - Job ID (auto-increment bigint, not UUID!)
- `user_id` - Links to profiles
- `company_id` - Links to companies (optional)
- `job_title` - Position title (required)
- `company_name` - Company name (denormalized)
- `job_description` - Full job description
- `industry` - Job industry
- `job_type` - full-time/part-time/contract/internship/freelance
- `experience_level` - entry/mid/senior/executive/internship
- `street_address`, `city_name`, `state_code`, `zipcode` - Location
- `remote_type` - onsite/remote/hybrid
- `start_salary_range`, `end_salary_range` - Compensation
- `benefits` - Array of benefits
- `job_link` - URL to posting
- `posted_date` - When posted
- `application_deadline` - Application due date
- `source` - manual/imported-url/linkedin/indeed/etc.
- `required_skills`, `preferred_skills` - Arrays of skills
- `job_status` - Interested/Applied/Phone Screen/Interview/Offer/Rejected/Accepted/Declined
- `status_changed_at` - When status last changed
- `match_score` - AI match score (0-100)
- `is_favorite`, `is_archived` - Organization flags
- `archive_reason` - Why archived
- `created_at`, `updated_at`

**Where it's used:**

- Job Pipeline → Kanban board (main feature!)
- Calendar widget → Show deadlines
- Job details drawer → Full information
- AI matching → Calculate match score
- Search/filter → Find specific jobs

**Status Flow:**

```
Interested → Applied → Phone Screen → Interview → Offer
                                              ↓
                                         Accepted/Declined/Rejected
```

---

### `job_notes`

**Purpose:** Personal notes about each job

**Columns:**

- `id` - Note ID
- `user_id` - Links to profiles
- `job_id` - Links to jobs
- `recruiter_name`, `recruiter_email`, `recruiter_phone` - Recruiter contact
- `hiring_manager_name`, `hiring_manager_email`, `hiring_manager_phone` - Hiring manager
- `personal_notes` - General notes
- `red_flags` - Warning signs
- `pros` - Positive aspects
- `cons` - Negative aspects
- `interview_schedule` - JSON array of interview objects
- `follow_ups` - JSON array of follow-up tasks
- `questions_to_ask` - Array of questions
- `interview_notes` - Notes from interviews
- `interview_feedback` - Feedback received
- `salary_negotiation_notes` - Salary discussions
- `application_history` - JSON timeline of events
- `rating` - Personal rating (1-5 stars)
- `offer_details` - JSON with offer specifics
- `rejection_reason`, `rejection_date` - If rejected
- `created_at`, `updated_at`

**Where it's used:**

- Job details drawer → Edit notes
- Interview Hub → Track interviews
- Pipeline → Quick notes access

**JSONB Examples:**

`interview_schedule`:

```json
[
  {
    "date": "2025-11-20T14:00:00Z",
    "type": "Phone Screen",
    "interviewer": "Jane Smith",
    "duration": 30,
    "notes": "Technical screening, prepare coding challenge"
  }
]
```

`application_history`:

```json
[
  {
    "date": "2025-11-15",
    "event": "Applied via company website",
    "notes": "Used tailored resume"
  },
  {
    "date": "2025-11-18",
    "event": "Phone screen scheduled",
    "notes": "HR initial call"
  }
]
```

---

### `companies`

**Purpose:** Shared company database

**Columns:**

- `id` - Company ID (UUID)
- `name` - Company name (required, unique)
- `domain` - Company domain (unique)
- `description` - Company description
- `industry` - Industry
- `company_size` - 1-10, 11-50, ..., 10000+
- `founded_year` - Year founded
- `headquarters_location` - HQ location
- `website`, `linkedin_url`, `careers_page` - URLs
- `company_data` - JSON (benefits, locations, techStack, recentNews, departments, fundingInfo)
- `research_cache` - JSON (cached AI research)
- `research_last_updated` - When research was done
- `logo_url` - Company logo
- `is_verified` - Data verified
- `created_at`, `updated_at`

**Where it's used:**

- Job pipeline → Display company info
- Company research → Fetch/cache company data
- Job details → Show company details

**Note:** Shared across users (not user_id filtered)

---

### `user_company_notes`

**Purpose:** User's private notes about companies

**Columns:**

- `id` - Note ID
- `user_id` - Links to profiles
- `company_id` - Links to companies
- `personal_notes` - User's thoughts
- `pros`, `cons` - Company pros/cons
- `culture_notes` - Culture observations
- `interview_tips` - Interview advice
- `contacts` - JSON array of contacts
- `application_count` - Number of jobs applied to
- `is_favorite`, `is_blacklisted` - Flags
- `created_at`, `updated_at`

**Where it's used:**

- Company research view
- Job details (if linked to company)

---

## Document Management

### `templates`

**Purpose:** Resume/cover letter templates

**Columns:**

- `id` - Template ID
- `user_id` - NULL for system templates, user ID for custom
- `name` - Template name (required)
- `category` - resume/cover-letter
- `subtype` - chronological/functional/hybrid/creative/academic/executive/simple
- `layout` - JSON (columns, margins, pageSize, headerFooter, sectionOrder)
- `schema` - JSON (maxSections, customSections, optionalSections, requiredSections)
- `features` - JSON (atsOptimized, customizable, photoSupport, skillsHighlight, portfolioSupport)
- `metadata` - JSON (tags, description, industryFocus, experienceLevel)
- `version` - Template version number
- `author` - system/user
- `is_default`, `is_public` - Flags
- `created_at`, `updated_at`

**Where it's used:**

- AI workspace → Template selection
- Resume generation → Structure definition
- Document creation → Layout

**System templates:**

- Chronological Resume
- Functional Resume
- Hybrid Resume
- Creative Resume
- Academic Resume

---

### `themes`

**Purpose:** Visual styling for documents

**Columns:**

- `id` - Theme ID
- `user_id` - NULL for system, user ID for custom
- `name` - Theme name
- `category` - professional/creative/modern/classic/minimal
- `colors` - JSON (primary, secondary, accent, text, background, border)
- `typography` - JSON (fontFamily, fontSize, fontWeight, lineHeight)
- `spacing` - JSON (section, subsection, item, compact)
- `effects` - JSON (borderRadius, dividerStyle, shadowEnabled)
- `metadata` - JSON (tags, description, previewImage)
- `author` - system/user
- `is_default`, `is_public`
- `created_at`, `updated_at`

**Where it's used:**

- AI workspace → Theme selection
- Resume preview → Styling
- PDF export → Visual formatting

---

### `documents`

**Purpose:** User's created resumes/cover letters

**Columns:**

- `id` - Document ID
- `user_id` - Links to profiles
- `type` - resume/cover-letter
- `status` - draft/final/archived
- `name` - Document name (required)
- `description` - Document description
- `template_id`, `theme_id` - Links to templates/themes (required)
- `template_overrides`, `theme_overrides` - JSON customizations
- `content` - JSON (current document content)
- `current_version_id` - Links to document_versions
- `job_id` - Optional link to target job
- `target_role`, `target_company`, `target_industry` - Context
- `context_notes` - Generation notes
- `tags`, `folder`, `color` - Organization
- `rating`, `user_notes` - User feedback
- `total_versions`, `total_edits`, `times_exported`, `times_used` - Stats
- `word_count`
- `is_default`, `is_pinned`, `is_archived`
- `created_at`, `last_edited_at`, `last_generated_at`

**Where it's used:**

- AI workspace → Document list
- Document editor → Edit/preview
- Export → PDF/Word generation
- Version history → Track changes

---

### `document_versions`

**Purpose:** Version history for documents

**Columns:**

- `id` - Version ID
- `document_id` - Links to documents
- `user_id` - Links to profiles
- `version_number` - Auto-incrementing (1, 2, 3, ...)
- `content` - JSON snapshot of this version
- `template_id`, `theme_id` - Template/theme at time of version
- `template_overrides`, `theme_overrides` - Customizations
- `job_id`, `generation_session_id` - Context
- `name`, `description`, `tags`, `color`, `notes` - Metadata
- `change_type` - ai-generated/manual-edit/template-change/theme-change/merge/restore/import
- `changed_sections` - Array of sections modified
- `change_summary` - Description of changes
- `parent_version_id` - Previous version (for branching)
- `branch_name`, `merge_source_id` - Version control
- `word_count`, `character_count`, `ats_score`
- `status` - active/archived/deleted
- `is_pinned`, `is_archived`
- `created_at`, `created_by`

**Where it's used:**

- Version history → View past versions
- Restore → Revert to previous version
- Compare → See what changed

---

### `document_jobs`

**Purpose:** Link documents to job applications

**Columns:**

- `id` - Link ID
- `document_id` - Links to documents
- `version_id` - Specific version used (optional)
- `job_id` - Links to jobs
- `user_id` - Links to profiles
- `status` - planned/submitted/interview/offer/rejected
- `submitted_at`, `response_received_at`
- `outcome`, `notes`
- `created_at`, `updated_at`

**Where it's used:**

- Track which resume was used for which job
- See outcome of each application

---

### `export_history`

**Purpose:** Track document exports

**Columns:**

- `id` - Export ID
- `user_id`, `document_id`, `version_id`
- `format` - pdf/docx/html/txt/json
- `file_name`, `file_size_bytes`
- `storage_path`, `storage_url` - If file saved
- `export_options` - JSON (watermark, pageNumbers, etc.)
- `status` - completed/failed
- `error_message`
- `created_at`, `expires_at`
- `download_count`, `last_downloaded_at`

**Where it's used:**

- Download history
- Re-download previous exports
- Track export usage

---

## AI & Analytics

### `analytics_cache`

**Purpose:** Cache AI analysis results

**Columns:**

- `id` - Cache entry ID
- `user_id` - Links to profiles
- `analytics_type` - document-match-score/skills-gap/company-research/interview-prep/salary-research/ats-analysis
- `document_id`, `job_id`, `company_name` - Context keys
- `data` - JSON (analysis results)
- `match_score`, `ats_score` - Extracted scores
- `metadata` - JSON (model, source, confidence)
- `generated_at`, `expires_at` - Cache timing (7 day default)
- `last_accessed_at`, `access_count` - Usage stats
- `profile_version` - Invalidate when profile changes
- `created_at`, `updated_at`

**Where it's used:**

- Job matching → Cache match scores
- Skills gap analysis → Cache recommendations
- Avoid regenerating same analysis

**Cache Strategy:**

- Check cache before calling AI
- Return cached if not expired
- Invalidate when profile changes
- Set expiry to 7 days

---

### `generation_sessions`

**Purpose:** Track AI generation requests

**Columns:**

- `id` - Session ID
- `user_id` - Links to profiles
- `generation_type` - resume/cover-letter
- `status` - in-progress/completed/failed/cancelled
- `template_id`, `theme_id`, `job_id` - Context
- `options` - JSON (tone, style, length, focusAreas, customInstructions)
- `model` - AI model used (gpt-4)
- `prompt_template`, `prompt_variables` - Prompt used
- `result_version_id` - Links to document_versions (output)
- `generated_content` - JSON (AI output)
- `error_message`, `error_details` - If failed
- `tokens_used`, `generation_time_ms`, `cost_cents` - Metrics
- `started_at`, `completed_at`
- `user_rating`, `user_feedback` - User feedback
- `created_at`, `updated_at`

**Where it's used:**

- Track AI usage
- Monitor costs
- Debug generation issues
- Analytics dashboard (future feature)

---

## Indexes For Performance

```sql
-- User data queries (most common)
CREATE INDEX idx_skills_user ON skills(user_id);
CREATE INDEX idx_employment_user ON employment(user_id);
CREATE INDEX idx_education_user ON education(user_id);
CREATE INDEX idx_jobs_user ON jobs(user_id);

-- Job status filtering
CREATE INDEX idx_jobs_status ON jobs(user_id, job_status) WHERE is_archived = false;

-- Analytics cache lookups
CREATE INDEX idx_analytics_lookup ON analytics_cache(user_id, job_id, analytics_type, expires_at);

-- Document searches
CREATE INDEX idx_documents_user_type ON documents(user_id, type, status);
```

---

This covers all tables, their purposes, and where they're used in FlowATS!
