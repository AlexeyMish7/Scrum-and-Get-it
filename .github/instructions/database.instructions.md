# Database Schema Instructions

## Overview

PostgreSQL database hosted on Supabase with Row Level Security (RLS) policies. All tables enforce user-level isolation - users can only access their own data.

**Database Statistics (as of 2025-11-30):**

- **25+ tables** with data in production
- **8 custom ENUM types** for data validation
- **25+ database functions** (including RLS helpers, cleanup jobs, company research)
- **20+ triggers** for auto-updating timestamps and maintaining data integrity
- **Shared company data** - Companies table accessible to all users (no user_id isolation)
- **Team collaboration** - Team tables support multi-user access with role-based permissions

---

## Core Concepts

### Row Level Security (RLS)

**What it does:** Automatically filters queries to show only user's data
**How it works:** Supabase checks JWT token and enforces `user_id` matching

**Example:**

```sql
-- User A queries jobs table
SELECT * FROM jobs;

-- RLS automatically adds WHERE clause:
SELECT * FROM jobs WHERE user_id = 'user-a-uuid';
```

**Policy Pattern:**

```sql
-- Allow users to see only their own jobs
CREATE POLICY "Users can view their own jobs"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own jobs
CREATE POLICY "Users can insert their own jobs"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update only their own jobs
CREATE POLICY "Users can update their own jobs"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete only their own jobs
CREATE POLICY "Users can delete their own jobs"
  ON jobs FOR DELETE
  USING (auth.uid() = user_id);
```

### Migrations

**Location:** `db/migrations/`
**Naming:** `YYYY-MM-DD_description.sql`

**Examples:**

- `2025-11-18_seed_default_templates.sql`
- `2025-11-11_add_resume_draft_versioning.sql`

**How to apply:**

1. Copy migration SQL
2. Open Supabase SQL Editor
3. Paste and run
4. Verify with SELECT queries

## Custom Types (ENUMs)

```sql
-- Proficiency levels for skills
CREATE TYPE proficiency_level_enum AS ENUM (
  'beginner',
  'intermediate',
  'advanced',
  'expert'
);

-- Education levels
CREATE TYPE education_level_enum AS ENUM (
  'high_school',
  'associate',
  'bachelor',
  'master',
  'phd',
  'other'
);

-- Experience levels for profiles and jobs
CREATE TYPE experience_level_enum AS ENUM (
  'entry',
  'mid',
  'senior',
  'executive'
);

-- Project status
CREATE TYPE project_status_enum AS ENUM (
  'planned',
  'ongoing',
  'completed'
);

-- Certification verification status
CREATE TYPE verification_status_enum AS ENUM (
  'unverified',
  'pending',
  'verified',
  'rejected'
);

-- Team member roles (UC-108)
CREATE TYPE team_role_enum AS ENUM (
  'admin',
  'mentor',
  'candidate'
);

-- Team invitation status
CREATE TYPE invitation_status_enum AS ENUM (
  'pending',
  'accepted',
  'declined',
  'expired',
  'cancelled'
);

-- Team subscription tiers
CREATE TYPE subscription_tier_enum AS ENUM (
  'free',
  'starter',
  'professional',
  'enterprise'
);

-- Document review status (UC-110)
CREATE TYPE review_status_enum AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'expired',
  'cancelled'
);

-- Document review types
CREATE TYPE review_type_enum AS ENUM (
  'feedback',
  'approval',
  'peer_review',
  'mentor_review'
);

-- Review access levels
CREATE TYPE review_access_enum AS ENUM (
  'view',
  'comment',
  'suggest',
  'approve'
);

-- Comment types for reviews
CREATE TYPE comment_type_enum AS ENUM (
  'comment',
  'suggestion',
  'praise',
  'change_request',
  'question',
  'approval',
  'rejection'
);
```

---

## Table Dependency Hierarchy

```
auth.users (Supabase managed)
  └─ profiles (1:1) - Extended user info
      ├─ skills (1:many) - User's technical/soft skills
      ├─ employment (1:many) - Work history
      ├─ education (1:many) - Educational background
      ├─ projects (1:many) - Portfolio projects
      ├─ certifications (1:many) - Professional certifications
      ├─ jobs (1:many) - Job opportunities tracking
      │   ├─ job_notes (1:1 optional) - Personal notes per job
      │   ├─ analytics_cache (many) - AI match scores
      │   └─ document_jobs (many) - Documents used for applications
      ├─ documents (1:many) - Resumes/cover letters
      │   ├─ document_versions (1:many) - Git-like versioning
      │   ├─ export_history (1:many) - PDF/DOCX exports
      │   ├─ document_jobs (many) - Links to job applications
      │   └─ document_reviews (many) - Review requests (UC-110)
      ├─ generation_sessions (1:many) - AI generation tracking
      ├─ analytics_cache (1:many) - Cached AI analysis
      ├─ user_company_notes (1:many) - Private company notes
      └─ team membership (via team_members)

companies (shared data - NO user_id)
  ├─ jobs (many) - Jobs link to companies
  ├─ user_company_notes (many) - User-specific notes about companies
  └─ company_research_cache (1:1) - Volatile research data

templates (system + user)
  ├─ documents (many)
  ├─ document_versions (many)
  └─ generation_sessions (many)

themes (system + user)
  ├─ documents (many)
  ├─ document_versions (many)
  └─ generation_sessions (many)

teams (UC-108: Team Account Management)
  ├─ team_members (many) - User memberships with roles
  ├─ team_invitations (many) - Pending invitations
  ├─ team_member_assignments (many) - Mentor-candidate pairings
  ├─ team_activity_log (many) - Audit trail
  ├─ team_messages (many) - Internal communication
  ├─ team_subscriptions (1:1) - Billing status
  ├─ team_settings (1:1) - Configuration
  └─ mentor_feedback (many) - UC-109: Mentor feedback
      └─ mentee_goals (many) - UC-109: Candidate goals

document_reviews (UC-110: Collaborative Review)
  └─ review_comments (many) - Threaded comments
```

---

### User & Profile System

**auth.users** (Supabase managed)

- Authentication table
- Contains email, password hash, metadata
- Referenced by `profiles.id`

**profiles** (public schema)

- Extended user information
- One-to-one with `auth.users`
- Contains name, title, contact, summary

```sql
CREATE TABLE public.profiles (
  id uuid NOT NULL,                      -- FK to auth.users(id)
  first_name text NOT NULL,
  last_name text NOT NULL,
  full_name text,                        -- Computed: first + last
  email text NOT NULL UNIQUE,
  phone text,
  professional_title text,               -- "Software Engineer"
  summary text,                          -- Professional bio
  experience_level USER-DEFINED,         -- enum: entry/mid/senior
  industry text,
  city text,
  state text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

**Key Points:**

- `id` is UUID from auth.users (not auto-generated)
- `full_name` can be computed column or trigger
- `metadata` is flexible JSON for future fields
- `updated_at` should have trigger to auto-update

---

### Profile Data Tables (User's Resume Content)

**skills**

```sql
CREATE TABLE public.skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,                          -- FK to profiles
  skill_name text NOT NULL,                       -- "JavaScript"
  proficiency_level USER-DEFINED NOT NULL,        -- enum: beginner/intermediate/advanced/expert
  skill_category text NOT NULL DEFAULT 'Technical'::text,  -- Technical/Soft/Language/Tool/Framework/Other
  years_of_experience numeric,
  last_used_date date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT skills_pkey PRIMARY KEY (id),
  CONSTRAINT skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

**employment**

```sql
CREATE TABLE public.employment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_title text NOT NULL,                        -- "Senior Developer"
  company_name text NOT NULL,
  location text,
  start_date date NOT NULL,                       -- Required
  end_date date,                                  -- NULL if current_position
  current_position boolean NOT NULL DEFAULT false,
  job_description text,
  achievements ARRAY DEFAULT ARRAY[]::text[],     -- Array of bullet points
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT employment_pkey PRIMARY KEY (id),
  CONSTRAINT employment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

**education**

```sql
CREATE TABLE public.education (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  institution_name text NOT NULL,
  degree_type text,                               -- "Bachelor's", "Master's"
  field_of_study text,
  education_level USER-DEFINED,                   -- enum
  start_date date NOT NULL,
  graduation_date date,                           -- NULL if enrolled
  enrollment_status text DEFAULT 'graduated'::text,  -- enrolled/graduated/transferred/dropped
  gpa numeric CHECK (gpa IS NULL OR gpa >= 0 AND gpa <= 4),
  honors text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT education_pkey PRIMARY KEY (id),
  CONSTRAINT education_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

**projects**

```sql
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  proj_name text NOT NULL,
  proj_description text,
  role text,                                      -- "Lead Developer"
  start_date date NOT NULL,
  end_date date,
  status USER-DEFINED NOT NULL DEFAULT 'planned'::project_status_enum,  -- planned/active/completed
  tech_and_skills ARRAY DEFAULT ARRAY[]::text[],  -- ["React", "Node.js"]
  industry_proj_type text,
  team_size integer CHECK (team_size IS NULL OR team_size >= 0),
  team_details text,
  project_url text,
  media_path text,                                -- Storage path for images
  proj_outcomes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

**certifications**

```sql
CREATE TABLE public.certifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,                             -- "AWS Certified Developer"
  issuing_org text,                               -- "Amazon Web Services"
  category text,
  certification_id text,                          -- Credential ID
  date_earned date,
  expiration_date date,
  does_not_expire boolean NOT NULL DEFAULT false,
  verification_status USER-DEFINED NOT NULL DEFAULT 'unverified'::verification_status_enum,
  verification_url text,
  media_path text,                                -- Storage path for cert image
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT certifications_pkey PRIMARY KEY (id),
  CONSTRAINT certifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

---

### Job Tracking Tables

**jobs** - Job opportunities user is tracking

```sql
CREATE TABLE public.jobs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,  -- Auto-increment (not UUID!)
  user_id uuid NOT NULL,
  company_id uuid,                                   -- FK to companies (optional)

  -- Job details
  job_title text NOT NULL,
  company_name text,                                 -- Denormalized for performance
  job_description text,
  industry text,
  job_type text CHECK (...),                         -- full-time/part-time/contract/internship/freelance
  experience_level text CHECK (...),                 -- entry/mid/senior/executive/internship

  -- Location
  street_address text,
  city_name text,
  state_code text,
  zipcode text,
  remote_type text CHECK (...),                      -- onsite/remote/hybrid

  -- Compensation
  start_salary_range bigint,
  end_salary_range bigint,
  benefits ARRAY DEFAULT ARRAY[]::text[],

  -- Source & metadata
  job_link text,
  posted_date date,
  application_deadline date,
  source text CHECK (...),                           -- manual/imported-url/linkedin/indeed/etc

  -- Skills
  required_skills ARRAY DEFAULT ARRAY[]::text[],
  preferred_skills ARRAY DEFAULT ARRAY[]::text[],

  -- Status tracking
  job_status text NOT NULL DEFAULT 'Interested'::text CHECK (...),  -- Interested/Applied/Phone Screen/Interview/Offer/Rejected/Accepted/Declined
  status_changed_at timestamp with time zone NOT NULL DEFAULT now(),

  -- AI analytics
  match_score integer CHECK (match_score IS NULL OR match_score >= 0 AND match_score <= 100),

  -- Organization
  is_favorite boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  archive_reason text CHECK (...),                   -- filled/expired/not-interested/rejected/accepted-other/other

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT jobs_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
```

**Key Points:**

- `id` is **bigint** (auto-increment), not UUID
- `company_name` is denormalized (duplicates companies.name for query performance)
- `job_status` drives the Kanban board columns
- `status_changed_at` tracks when job moved between stages
- `match_score` populated by AI job matching service

**job_notes** - Personal notes about each job

```sql
CREATE TABLE public.job_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id bigint NOT NULL,                          -- FK to jobs

  -- Contacts
  recruiter_name text,
  recruiter_email text,
  recruiter_phone text,
  hiring_manager_name text,
  hiring_manager_email text,
  hiring_manager_phone text,

  -- Personal assessment
  personal_notes text,
  red_flags text,
  pros text,
  cons text,

  -- Interview tracking
  interview_schedule jsonb DEFAULT '[]'::jsonb,    -- Array of interview objects
  follow_ups jsonb DEFAULT '[]'::jsonb,            -- Follow-up tasks
  questions_to_ask ARRAY DEFAULT ARRAY[]::text[],
  interview_notes text,
  interview_feedback text,

  -- Negotiation
  salary_negotiation_notes text,

  -- History
  application_history jsonb DEFAULT '[]'::jsonb,   -- Timeline of events

  -- Rating & outcome
  rating integer CHECK (rating IS NULL OR rating >= 1 AND rating <= 5),
  offer_details jsonb,
  rejection_reason text,
  rejection_date date,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT job_notes_pkey PRIMARY KEY (id),
  CONSTRAINT job_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT job_notes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
```

**JSONB Structures:**

`interview_schedule`:

```json
[
  {
    "date": "2025-11-20T14:00:00Z",
    "type": "Phone Screen",
    "interviewer": "John Smith",
    "duration": 30,
    "notes": "Technical screening"
  }
]
```

`application_history`:

```json
[
  {
    "date": "2025-11-15T10:00:00Z",
    "event": "Applied",
    "notes": "Submitted via company website"
  },
  {
    "date": "2025-11-18T09:00:00Z",
    "event": "Phone Screen Scheduled",
    "notes": "Meeting with recruiter"
  }
]
```

---

### Document Management (Resumes/Cover Letters)

**templates** - Resume/cover letter templates

```sql
CREATE TABLE public.templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,                                    -- NULL = system template
  name text NOT NULL,                              -- "Modern Chronological"
  category text NOT NULL CHECK (...),              -- resume/cover-letter
  subtype text NOT NULL CHECK (...),               -- chronological/functional/hybrid/creative/academic/executive/simple

  -- Layout configuration
  layout jsonb NOT NULL DEFAULT '{...}'::jsonb,    -- columns, margins, pageSize, headerFooter, sectionOrder

  -- Schema definition
  schema jsonb NOT NULL DEFAULT '{...}'::jsonb,    -- maxSections, customSections, optionalSections, requiredSections

  -- Features
  features jsonb NOT NULL DEFAULT '{...}'::jsonb,  -- atsOptimized, customizable, photoSupport, skillsHighlight, portfolioSupport

  -- Metadata
  metadata jsonb DEFAULT '{...}'::jsonb,           -- tags, description, industryFocus, experienceLevel

  version integer NOT NULL DEFAULT 1,
  author text NOT NULL DEFAULT 'user'::text CHECK (...),  -- system/user
  is_default boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT templates_pkey PRIMARY KEY (id),
  CONSTRAINT templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

**JSONB Structures:**

`layout`:

```json
{
  "columns": 1,
  "margins": { "top": 0.75, "left": 0.75, "right": 0.75, "bottom": 0.75 },
  "pageSize": "letter",
  "headerFooter": { "showHeader": false, "showFooter": false },
  "sectionOrder": ["header", "summary", "experience", "education", "skills"]
}
```

`schema`:

```json
{
  "requiredSections": ["header", "experience"],
  "optionalSections": ["summary", "projects", "certifications"],
  "customSections": true,
  "maxSections": null
}
```

**themes** - Visual styling for documents

```sql
CREATE TABLE public.themes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,                                    -- NULL = system theme
  name text NOT NULL,                              -- "Professional Blue"
  category text CHECK (...),                       -- professional/creative/modern/classic/minimal

  -- Color palette
  colors jsonb NOT NULL DEFAULT '{...}'::jsonb,

  -- Typography
  typography jsonb NOT NULL DEFAULT '{...}'::jsonb,

  -- Spacing
  spacing jsonb NOT NULL DEFAULT '{...}'::jsonb,

  -- Effects
  effects jsonb DEFAULT '{...}'::jsonb,

  metadata jsonb DEFAULT '{...}'::jsonb,
  author text NOT NULL DEFAULT 'user'::text CHECK (...),
  is_default boolean NOT NULL DEFAULT false,
  is_public boolean NOT NULL DEFAULT false,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT themes_pkey PRIMARY KEY (id),
  CONSTRAINT themes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

`colors`:

```json
{
  "primary": "#2563eb",
  "secondary": "#64748b",
  "accent": "#0ea5e9",
  "text": "#1e293b",
  "textSecondary": "#64748b",
  "background": "#ffffff",
  "surface": "#f8fafc",
  "border": "#e2e8f0"
}
```

`typography`:

```json
{
  "fontFamily": {
    "heading": "Inter",
    "body": "Inter",
    "mono": "JetBrains Mono"
  },
  "fontSize": {
    "name": 24,
    "heading": 16,
    "subheading": 14,
    "body": 11,
    "caption": 9
  },
  "fontWeight": {
    "heading": 700,
    "subheading": 600,
    "emphasis": 500,
    "body": 400
  },
  "lineHeight": {
    "tight": 1.2,
    "normal": 1.5,
    "relaxed": 1.75
  }
}
```

**documents** - User's created resumes/cover letters

```sql
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (...),                  -- resume/cover-letter
  status text NOT NULL DEFAULT 'draft'::text CHECK (...),  -- draft/final/archived

  name text NOT NULL,                              -- "Software Engineer Resume"
  description text,

  -- Template & theme references
  template_id uuid NOT NULL,
  theme_id uuid NOT NULL,
  template_overrides jsonb DEFAULT '{}'::jsonb,    -- Custom layout changes
  theme_overrides jsonb DEFAULT '{}'::jsonb,       -- Custom color/font changes

  -- Current content
  content jsonb NOT NULL DEFAULT '{}'::jsonb,      -- Latest document data
  current_version_id uuid,                         -- FK to document_versions

  -- Context (for AI generation)
  job_id bigint,                                   -- FK to jobs (optional)
  target_role text,
  target_company text,
  target_industry text,
  context_notes text,

  -- Organization
  tags ARRAY DEFAULT ARRAY[]::text[],
  folder text,
  color text,
  rating integer CHECK (...),                      -- 1-5 stars
  user_notes text,

  -- Stats
  total_versions integer NOT NULL DEFAULT 0,
  total_edits integer NOT NULL DEFAULT 0,
  times_exported integer NOT NULL DEFAULT 0,
  times_used integer NOT NULL DEFAULT 0,
  word_count integer DEFAULT 0,

  is_default boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_edited_at timestamp with time zone NOT NULL DEFAULT now(),
  last_generated_at timestamp with time zone,

  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id),
  CONSTRAINT documents_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id),
  CONSTRAINT documents_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT documents_current_version_fkey FOREIGN KEY (current_version_id) REFERENCES public.document_versions(id)
);
```

**document_versions** - Version history for documents

```sql
CREATE TABLE public.document_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  user_id uuid NOT NULL,
  version_number integer NOT NULL,                 -- 1, 2, 3, ...

  -- Version content
  content jsonb NOT NULL,
  template_id uuid NOT NULL,
  theme_id uuid NOT NULL,
  template_overrides jsonb DEFAULT '{}'::jsonb,
  theme_overrides jsonb DEFAULT '{}'::jsonb,

  -- Generation context
  job_id bigint,
  generation_session_id uuid,                      -- FK to generation_sessions

  -- Version metadata
  name text NOT NULL,
  description text,
  tags ARRAY DEFAULT ARRAY[]::text[],
  color text,
  notes text,

  -- Change tracking
  change_type text NOT NULL CHECK (...),           -- ai-generated/manual-edit/template-change/theme-change/merge/restore/import
  changed_sections ARRAY DEFAULT ARRAY[]::text[],  -- ["experience", "skills"]
  change_summary text,

  -- Version tree (for branching/merging)
  parent_version_id uuid,                          -- Previous version
  branch_name text,
  merge_source_id uuid,

  -- Analytics
  word_count integer DEFAULT 0,
  character_count integer DEFAULT 0,
  ats_score integer CHECK (...),                   -- 0-100

  status text NOT NULL DEFAULT 'active'::text CHECK (...),  -- active/archived/deleted
  is_pinned boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,                        -- FK to profiles

  CONSTRAINT document_versions_pkey PRIMARY KEY (id),
  CONSTRAINT document_versions_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT document_versions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT document_versions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id),
  CONSTRAINT document_versions_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id),
  CONSTRAINT document_versions_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT document_versions_parent_version_id_fkey FOREIGN KEY (parent_version_id) REFERENCES public.document_versions(id),
  CONSTRAINT document_versions_merge_source_id_fkey FOREIGN KEY (merge_source_id) REFERENCES public.document_versions(id),
  CONSTRAINT document_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT document_versions_generation_session_fkey FOREIGN KEY (generation_session_id) REFERENCES public.generation_sessions(id)
);
```

---

### AI & Analytics Tables

**analytics_cache** - Cached AI analysis results

```sql
CREATE TABLE public.analytics_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analytics_type text NOT NULL CHECK (...),        -- document-match-score/skills-gap/company-research/interview-prep/salary-research/ats-analysis

  -- Context keys (what this analysis is for)
  document_id uuid,
  job_id bigint,
  company_name text,

  -- Analysis results
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  match_score integer CHECK (...),                 -- 0-100
  ats_score integer CHECK (...),                   -- 0-100

  -- Metadata
  metadata jsonb DEFAULT '{...}'::jsonb,           -- model, source, confidence
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),

  -- Cache statistics
  last_accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  access_count integer NOT NULL DEFAULT 0,

  -- Profile versioning (invalidate cache when profile changes)
  profile_version text,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT analytics_cache_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT analytics_cache_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT analytics_cache_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
```

**Cache Key Strategy:**

- Match analysis: `user_id + job_id + analytics_type = "document-match-score"`
- Skills gap: `user_id + job_id + analytics_type = "skills-gap"`
- Expires after 7 days or when profile changes

**data JSONB Structure (match analysis):**

```json
{
  "matchScore": 85,
  "breakdown": {
    "skills": {
      "score": 90,
      "matched": ["JavaScript", "React", "Node.js"],
      "missing": ["GraphQL", "AWS"]
    },
    "experience": {
      "score": 80,
      "relevant": ["3 years React development", "Led team of 5"]
    },
    "education": {
      "score": 85,
      "requirement": "Bachelor's in Computer Science"
    }
  },
  "strengths": ["Strong frontend skills", "Leadership experience"],
  "gaps": ["Missing cloud experience"],
  "recommendations": ["Learn AWS", "Get certified in GraphQL"]
}
```

**generation_sessions** - Track AI generation requests

```sql
CREATE TABLE public.generation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  generation_type text NOT NULL CHECK (...),       -- resume/cover-letter
  status text NOT NULL DEFAULT 'in-progress'::text CHECK (...),  -- in-progress/completed/failed/cancelled

  -- Input context
  template_id uuid,
  theme_id uuid,
  job_id bigint,
  options jsonb NOT NULL DEFAULT '{...}'::jsonb,   -- tone, style, length, focusAreas, customInstructions

  -- AI configuration
  model text DEFAULT 'gpt-4'::text,
  prompt_template text,
  prompt_variables jsonb DEFAULT '{}'::jsonb,

  -- Output
  result_version_id uuid,                          -- FK to document_versions
  generated_content jsonb,

  -- Error tracking
  error_message text,
  error_details jsonb,

  -- Performance metrics
  tokens_used integer,
  generation_time_ms integer,
  cost_cents integer,

  -- Timestamps
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,

  -- User feedback
  user_rating integer CHECK (...),                 -- 1-5
  user_feedback text,

  CONSTRAINT generation_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT generation_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT generation_sessions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.templates(id),
  CONSTRAINT generation_sessions_theme_id_fkey FOREIGN KEY (theme_id) REFERENCES public.themes(id),
  CONSTRAINT generation_sessions_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT generation_sessions_result_version_fkey FOREIGN KEY (result_version_id) REFERENCES public.document_versions(id)
);
```

---

### Company Data Tables

**companies** - Shared company database

```sql
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  domain text UNIQUE,
  description text,
  industry text,
  company_size text CHECK (...),                   -- 1-10/11-50/51-200/201-500/501-1000/1001-5000/5001-10000/10000+
  founded_year integer CHECK (...),
  headquarters_location text,

  -- URLs
  website text,
  linkedin_url text,
  careers_page text,

  -- Structured data
  company_data jsonb DEFAULT '{...}'::jsonb,       -- culture, leadership, products, benefits, locations, techStack, departments, fundingInfo

  logo_url text,
  is_verified boolean NOT NULL DEFAULT false,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
```

**company_research_cache** - Volatile company research data

```sql
CREATE TABLE public.company_research_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,                 -- FK to companies

  -- Volatile research data (news, events, funding - expires after 7 days)
  research_data jsonb NOT NULL DEFAULT '{...}'::jsonb,

  -- Metadata
  metadata jsonb DEFAULT '{...}'::jsonb,           -- model, source, confidence
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + '7 days'::interval),

  -- Cache statistics
  last_accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  access_count integer NOT NULL DEFAULT 0,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT company_research_cache_pkey PRIMARY KEY (id),
  CONSTRAINT company_research_cache_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);
```

**Key Points:**

- `companies` table: Persistent company data (name, industry, size, culture, leadership, products)
- `company_research_cache` table: Volatile data (news, recent events, funding rounds) with 7-day TTL
- Cache linked to companies via `company_id` FK
- Shared across all users (no `user_id` column in either table)
- Use `get_company_research(company_name)` function to get combined data
- Use `upsert_company_info()` to save/update persistent data
- Use `save_company_research()` to save/update volatile cache
- Use `get_user_companies(user_id)` to get companies from user's employment history

**Database Functions:**

```sql
-- Get distinct company names from user's employment history
-- Used for quick-select in company research UI
SELECT * FROM get_user_companies('user-uuid');
-- Returns: [{ company_name: "Google" }, { company_name: "Microsoft" }, ...]

-- Get combined company data (persistent + volatile)
SELECT * FROM get_company_research('Google');
-- Returns: Combined JSONB with company info + cached research

-- Save/update persistent company info (returns company_id)
SELECT upsert_company_info(
  'Google',                    -- company_name
  'Technology',                -- industry
  '100000+',                   -- size
  'Mountain View, CA',         -- location
  1998,                        -- founded_year
  'https://google.com',        -- website
  'Organize world information', -- mission
  'Search engine company',     -- description
  '{}'::jsonb                  -- company_data
);

-- Save/update volatile research cache (linked to company_id)
SELECT save_company_research(
  'company-uuid',              -- company_id
  '{"news": [...], "events": [...]}'::jsonb,  -- research_data
  '{"model": "gpt-4"}'::jsonb  -- metadata
);
```

**user_company_notes** - User's private notes about companies

```sql
CREATE TABLE public.user_company_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,

  personal_notes text,
  pros text,
  cons text,
  culture_notes text,
  interview_tips text,

  contacts jsonb DEFAULT '[]'::jsonb,              -- Array of contact objects

  application_count integer NOT NULL DEFAULT 0,    -- How many jobs applied to
  is_favorite boolean NOT NULL DEFAULT false,
  is_blacklisted boolean NOT NULL DEFAULT false,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT user_company_notes_pkey PRIMARY KEY (id),
  CONSTRAINT user_company_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_company_notes_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
```

---

### Export & History Tables

**export_history** - Track document exports

```sql
CREATE TABLE public.export_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL,
  version_id uuid NOT NULL,

  format text NOT NULL CHECK (...),                -- pdf/docx/html/txt/json
  file_name text NOT NULL,
  file_size_bytes integer,

  -- Storage (if files are saved)
  storage_path text,
  storage_url text,

  export_options jsonb DEFAULT '{...}'::jsonb,     -- watermark, pageNumbers, includeFooter, includeHeader

  status text NOT NULL DEFAULT 'completed'::text CHECK (...),  -- completed/failed
  error_message text,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  download_count integer NOT NULL DEFAULT 0,
  last_downloaded_at timestamp with time zone,

  CONSTRAINT export_history_pkey PRIMARY KEY (id),
  CONSTRAINT export_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT export_history_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT export_history_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.document_versions(id)
);
```

**document_jobs** - Link documents to job applications

```sql
CREATE TABLE public.document_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  version_id uuid,
  job_id bigint NOT NULL,
  user_id uuid NOT NULL,

  status text NOT NULL DEFAULT 'planned'::text CHECK (...),  -- planned/submitted/interview/offer/rejected
  submitted_at timestamp with time zone,
  response_received_at timestamp with time zone,
  outcome text,
  notes text,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT document_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT document_jobs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
  CONSTRAINT document_jobs_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.document_versions(id),
  CONSTRAINT document_jobs_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT document_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

---

## Custom Types (ENUMs)

```sql
-- User-defined types (check actual schema for exact values)
CREATE TYPE proficiency_level_enum AS ENUM ('Beginner', 'Intermediate', 'Advanced', 'Expert');
CREATE TYPE education_level_enum AS ENUM ('High School', 'Associate', 'Bachelor', 'Master', 'Doctorate');
CREATE TYPE verification_status_enum AS ENUM ('unverified', 'pending', 'verified', 'expired');
CREATE TYPE project_status_enum AS ENUM ('planned', 'active', 'completed', 'archived');
CREATE TYPE team_role_enum AS ENUM ('admin', 'mentor', 'candidate');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');
CREATE TYPE review_status_enum AS ENUM ('pending', 'in_progress', 'completed', 'expired', 'cancelled');
CREATE TYPE review_type_enum AS ENUM ('feedback', 'approval', 'peer_review', 'mentor_review');
```

---

## Team Management Tables (UC-108, UC-109)

### teams - Team accounts for collaborative coaching

```sql
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES profiles(id),
  settings jsonb DEFAULT '{...}'::jsonb,  -- allow_member_invites, notification_preferences
  total_members integer DEFAULT 1,
  total_candidates integer DEFAULT 0,
  total_mentors integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### team_members - User membership with roles

```sql
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  role team_role_enum NOT NULL DEFAULT 'candidate',  -- admin/mentor/candidate
  invited_by uuid REFERENCES profiles(id),
  joined_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  custom_permissions jsonb DEFAULT '{...}'::jsonb,
  UNIQUE (team_id, user_id)
);
```

### team_invitations - Pending team invitations

```sql
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  invited_by uuid NOT NULL REFERENCES profiles(id),
  invitee_email text NOT NULL,
  invitee_user_id uuid REFERENCES profiles(id),
  role team_role_enum DEFAULT 'candidate',
  invitation_token text NOT NULL UNIQUE,
  status invitation_status_enum DEFAULT 'pending',
  expires_at timestamptz DEFAULT (now() + '7 days'::interval),
  created_at timestamptz DEFAULT now()
);
```

### team_member_assignments - Mentor-candidate pairings

```sql
CREATE TABLE public.team_member_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  mentor_id uuid NOT NULL REFERENCES profiles(id),
  candidate_id uuid NOT NULL REFERENCES profiles(id),
  assigned_by uuid NOT NULL REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_users CHECK (mentor_id != candidate_id)
);
```

### mentor_feedback - Mentor coaching feedback (UC-109)

```sql
CREATE TABLE public.mentor_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  mentor_id uuid NOT NULL REFERENCES profiles(id),
  candidate_id uuid NOT NULL REFERENCES profiles(id),
  feedback_type text NOT NULL,  -- application/interview/resume/cover_letter/general/goal/milestone
  feedback_text text NOT NULL,
  related_job_id bigint REFERENCES jobs(id),
  related_document_id uuid REFERENCES document_versions(id),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

### mentee_goals - Candidate goal tracking (UC-109)

```sql
CREATE TABLE public.mentee_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id),
  candidate_id uuid NOT NULL REFERENCES profiles(id),
  mentor_id uuid REFERENCES profiles(id),
  goal_type text NOT NULL,  -- weekly_applications/monthly_applications/interview_prep/resume_update/networking/skill_development/custom
  title text NOT NULL,
  description text,
  target_value integer,
  current_value integer DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  due_date date,
  status text DEFAULT 'active',  -- active/completed/missed/cancelled
  created_at timestamptz DEFAULT now()
);
```

---

## Document Review Tables (UC-110)

### document_reviews - Review requests

```sql
CREATE TABLE public.document_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES documents(id),
  version_id uuid REFERENCES document_versions(id),
  owner_id uuid NOT NULL REFERENCES profiles(id),
  reviewer_id uuid NOT NULL REFERENCES profiles(id),
  team_id uuid REFERENCES teams(id),
  review_type review_type_enum DEFAULT 'feedback',
  access_level review_access_enum DEFAULT 'comment',
  status review_status_enum DEFAULT 'pending',
  due_date timestamptz,
  is_approved boolean,
  request_message text,
  total_comments integer DEFAULT 0,
  unresolved_comments integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_owner_reviewer CHECK (owner_id != reviewer_id)
);
```

### review_comments - Threaded comments on documents

```sql
CREATE TABLE public.review_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES document_reviews(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  parent_comment_id uuid REFERENCES review_comments(id),
  comment_text text NOT NULL,
  comment_type comment_type_enum DEFAULT 'comment',
  section_path text,  -- e.g., "experience.0.bullets.2"
  selection_range jsonb,  -- { start: number, end: number }
  is_resolved boolean DEFAULT false,
  resolved_by uuid REFERENCES profiles(id),
  resolution_note text,
  created_at timestamptz DEFAULT now()
);
```

---

## Common Query Patterns

### Get User's Profile with All Data

```sql
-- Profile
SELECT * FROM profiles WHERE id = 'user-uuid';

-- Skills
SELECT * FROM skills WHERE user_id = 'user-uuid' ORDER BY proficiency_level DESC;

-- Employment
SELECT * FROM employment WHERE user_id = 'user-uuid' ORDER BY start_date DESC;

-- Education
SELECT * FROM education WHERE user_id = 'user-uuid' ORDER BY start_date DESC;

-- Projects
SELECT * FROM projects WHERE user_id = 'user-uuid' ORDER BY start_date DESC;
```

### Get All Jobs in Pipeline

```sql
SELECT
  j.*,
  c.name as company_full_name,
  c.logo_url,
  jn.personal_notes,
  jn.rating
FROM jobs j
LEFT JOIN companies c ON j.company_id = c.id
LEFT JOIN job_notes jn ON j.id = jn.job_id AND jn.user_id = j.user_id
WHERE j.user_id = 'user-uuid'
  AND j.is_archived = false
ORDER BY j.status_changed_at DESC;
```

### Get Cached Match Analysis

```sql
SELECT *
FROM analytics_cache
WHERE user_id = 'user-uuid'
  AND job_id = 123
  AND analytics_type = 'document-match-score'
  AND expires_at > NOW()
ORDER BY generated_at DESC
LIMIT 1;
```

### Get Document with Latest Version

```sql
SELECT
  d.*,
  dv.content as version_content,
  dv.version_number,
  t.name as template_name,
  th.name as theme_name
FROM documents d
LEFT JOIN document_versions dv ON d.current_version_id = dv.id
LEFT JOIN templates t ON d.template_id = t.id
LEFT JOIN themes th ON d.theme_id = th.id
WHERE d.id = 'document-uuid'
  AND d.user_id = 'user-uuid';
```

---

## Indexes for Performance

```sql
-- Users frequently query by user_id
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_employment_user_id ON employment(user_id);
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- Analytics cache lookups
CREATE INDEX idx_analytics_cache_lookup
  ON analytics_cache(user_id, job_id, analytics_type, expires_at);

-- Job status filtering
CREATE INDEX idx_jobs_status ON jobs(user_id, job_status) WHERE is_archived = false;

-- Document searching
CREATE INDEX idx_documents_search ON documents(user_id, type, status);
```

---

## Triggers & Functions

### Auto-update timestamp

```sql
-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Repeat for all tables: skills, employment, education, jobs, documents, etc.
```

### Increment version number

```sql
CREATE OR REPLACE FUNCTION increment_document_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-increment version_number based on max for this document
  NEW.version_number = COALESCE(
    (SELECT MAX(version_number) FROM document_versions WHERE document_id = NEW.document_id),
    0
  ) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_version_number
  BEFORE INSERT ON document_versions
  FOR EACH ROW
  EXECUTE FUNCTION increment_document_version();
```

---

## Development Guidelines for AI Assistant

### ✅ DO:

1. **Always filter by user_id** - RLS helps, but be explicit
2. **Use transactions for multi-table operations**
3. **Validate foreign keys exist** before inserting
4. **Handle NULL values** - Many fields are optional
5. **Use JSONB for flexible data** - But have a schema in mind
6. **Index frequently queried columns**
7. **Use migrations for schema changes** - Never edit production directly
8. **Test RLS policies** - Ensure users can't see others' data
9. **Clean up old cache entries** - Set expires_at appropriately
10. **Use prepared statements** - Prevent SQL injection (Supabase client handles this)

### ❌ DON'T:

1. **Don't hardcode UUIDs** - Use gen_random_uuid() or get from auth
2. **Don't skip foreign key constraints** - They prevent orphaned data
3. **Don't query without WHERE clause** - Always scope to user
4. **Don't mutate JSONB carelessly** - Validate structure
5. **Don't create circular foreign keys** - Causes issues with deletes
6. **Don't forget CASCADE rules** - Define ON DELETE behavior
7. **Don't skip CHECK constraints** - Validate at database level
8. **Don't store sensitive data unencrypted** - Use Supabase Vault if needed
9. **Don't create duplicate indexes** - Check existing first
10. **Don't bypass RLS in queries** - It's there for security

### Query Checklist

- [ ] Filtered by user_id (or relies on RLS)
- [ ] All JOINs have proper ON clauses
- [ ] NULL handling for optional fields
- [ ] Proper date/timestamp formatting
- [ ] LIMIT clause for large result sets
- [ ] Indexes exist for WHERE/JOIN columns
- [ ] Error handling for foreign key violations
- [ ] JSONB structure validated
- [ ] Transaction used for multi-step operations
- [ ] Migration tested before applying to production

---

## Quick Reference: Table Dependencies

```
auth.users (Supabase)
  └─ profiles (1:1)
      ├─ skills (1:many)
      ├─ employment (1:many)
      ├─ education (1:many)
      ├─ projects (1:many)
      ├─ certifications (1:many)
      ├─ jobs (1:many)
      │   ├─ job_notes (1:1 optional)
      │   ├─ analytics_cache (many)
      │   └─ document_jobs (many)
      ├─ documents (1:many)
      │   ├─ document_versions (1:many)
      │   ├─ export_history (1:many)
      │   ├─ document_jobs (many)
      │   └─ document_reviews (many) ← UC-110
      ├─ generation_sessions (1:many)
      ├─ analytics_cache (1:many)
      ├─ user_company_notes (1:many)
      └─ team_members (many) ← UC-108

companies (shared data)
  ├─ jobs (many)
  ├─ user_company_notes (many)
  └─ company_research_cache (1:1)

templates (system + user)
  ├─ documents (many)
  ├─ document_versions (many)
  └─ generation_sessions (many)

themes (system + user)
  ├─ documents (many)
  ├─ document_versions (many)
  └─ generation_sessions (many)

teams (UC-108)
  ├─ team_members (many)
  ├─ team_invitations (many)
  ├─ team_member_assignments (many)
  ├─ team_activity_log (many)
  ├─ team_messages (many)
  ├─ team_subscriptions (1:1)
  ├─ team_settings (1:1)
  ├─ mentor_feedback (many) ← UC-109
  └─ mentee_goals (many) ← UC-109

document_reviews (UC-110)
  └─ review_comments (many)
```

---

This is your database bible. When querying, always think about RLS, user_id filtering, and foreign key relationships. Keep data normalized but use JSONB for truly flexible structures. Test migrations before production!
