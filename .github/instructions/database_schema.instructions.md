---
applyTo: "**"
---

# Database Schema — ATS Tracker (Supabase)

Warning: Context-only reference. Do not execute this schema. Table order and constraints may not be valid for execution. Always consult `db/migrations/` for authoritative changes.

This document summarizes core entities, columns, constraints, and relationships used by the frontend and scripts. All user-owned tables scope data by `user_id` referencing `public.profiles(id)`. Use the shared CRUD helpers and `withUser(user.id)` when querying from the client.

Related dev notes:

- Migrations live under `db/migrations/`.
- Shared Supabase client: `@shared/services/supabaseClient`.
- CRUD helpers: `@shared/services/crud` (prefer these over raw queries).
- Auth/user context: `@shared/context/AuthContext`.

## Core Entities

### public.profiles

Primary user profile record, 1:1 with `auth.users`.

- id: uuid, PK, FK → `auth.users(id)`
- first_name: text NOT NULL
- last_name: text NOT NULL
- full_name: text (optional)
- email: text NOT NULL UNIQUE
- phone: text
- professional_title: text
- summary: text
- experience_level: USER-DEFINED (enum in DB)
- industry: text
- city: text
- state: text
- meta: jsonb (free-form profile metadata)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()

Relationships:

- Referenced by most user-owned tables via `user_id`.

### public.jobs

User-tracked job opportunities and application metadata.

- id: bigint IDENTITY, PK
- user_id: uuid, FK → `public.profiles(id)`
- created_at: timestamptz DEFAULT now()
- job_title: text
- company_name: text
- street_address: text
- city_name: text
- state_code: text
- zipcode: text
- start_salary_range: bigint
- end_salary_range: bigint
- job_link: text (original posting URL)
- application_deadline: date
- job_description: text
- industry: text
- job_type: text
- job_status: text (pipeline stage — e.g., Interested, Applied, Phone Screen, Interview, Offer, Rejected)

Notes:

- Use for job entry, pipeline management, deadlines, and analytics.

### public.employment

Work experience entries on a user's profile.

- id: uuid, PK DEFAULT gen_random_uuid()
- user_id: uuid, FK → `public.profiles(id)`
- job_title: text NOT NULL
- company_name: text NOT NULL
- location: text
- start_date: date NOT NULL
- end_date: date (nullable for current roles)
- job_description: text
- current_position: boolean NOT NULL DEFAULT false
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

### public.education

Education history entries.

- id: uuid, PK DEFAULT gen_random_uuid()
- user_id: uuid, FK → `public.profiles(id)`
- institution_name: text NOT NULL
- degree_type: text
- field_of_study: text
- graduation_date: date
- gpa: numeric CHECK (gpa IS NULL OR gpa BETWEEN 0 AND 4)
- enrollment_status: text DEFAULT 'not_enrolled'
- education_level: USER-DEFINED (enum)
- honors: text
- meta: jsonb
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()
- start_date: date NOT NULL

### public.skills

User skill entries with proficiency and category.

- id: uuid, PK DEFAULT gen_random_uuid()
- user_id: uuid, FK → `public.profiles(id)`
- skill_name: text NOT NULL
- proficiency_level: USER-DEFINED NOT NULL DEFAULT 'beginner' (enum)
- skill_category: text NOT NULL DEFAULT 'Technical'
- meta: jsonb
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()

### public.projects

Portfolio projects and related metadata.

- id: uuid, PK DEFAULT gen_random_uuid()
- user_id: uuid, FK → `public.profiles(id)`
- proj_name: text NOT NULL
- proj_description: text
- role: text
- start_date: date NOT NULL
- end_date: date
- tech_and_skills: ARRAY (DB native array type)
- project_url: text
- team_size: integer CHECK (team_size IS NULL OR team_size >= 0)
- team_details: text
- industry_proj_type: text
- proj_outcomes: text
- status: USER-DEFINED DEFAULT 'planned' (enum `project_status_enum`)
- media_path: text
- meta: jsonb
- created_at: timestamptz NOT NULL DEFAULT now()
- updated_at: timestamptz NOT NULL DEFAULT now()

Relationships:

- Referenced by `documents.project_id` (optional link to a project).

### public.documents

Uploaded user documents (resumes, cover letters, portfolios, other).

- id: uuid, PK DEFAULT gen_random_uuid()
- user_id: uuid, FK → `public.profiles(id)`
- kind: text DEFAULT 'resume' CHECK kind IN ('resume','cover_letter','portfolio','other')
- file_name: text NOT NULL
- file_path: text NOT NULL
- mime_type: text
- bytes: integer (size)
- meta: jsonb (e.g., version tags, AI prompts)
- uploaded_at: timestamptz DEFAULT now()
- project_id: uuid, FK → `public.projects(id)` (optional association)

### public.certifications

Professional certifications and badges.

- id: uuid, PK DEFAULT gen_random_uuid()
- user_id: uuid, FK → `public.profiles(id)`
- name: text NOT NULL
- issuing_org: text
- category: text
- date_earned: date
- expiration_date: date
- does_not_expire: boolean DEFAULT false
- cert_id: text (issuer-provided identifier)
- media_path: text (evidence or badge asset)
- verification_status: USER-DEFINED DEFAULT 'unverified' (enum `verification_status_enum`)
- created_at: timestamptz DEFAULT now()
- updated_at: timestamptz DEFAULT now()

## Relationships (summary)

- profiles 1↔1 auth.users (PK mirrors auth.users.id).
- profiles 1↔N jobs, employment, education, skills, projects, documents, certifications (all via `user_id`).
- projects 1↔N documents (optional via `documents.project_id`).

## Enums and USER-DEFINED Types (referenced)

These are defined in migrations and may vary by environment:

- `verification_status_enum` — e.g., unverified, pending, verified.
- `proficiency_level_enum` — e.g., beginner, intermediate, advanced, expert.
- `project_status_enum` — e.g., planned, in_progress, completed, archived.
- `education_level` — e.g., high_school, bachelors, masters, doctorate, other.

## Client Usage Guidance

- Always scope reads/writes by the current user: prefer `withUser(user.id)` from `@shared/services/crud`.
- Avoid storing secrets; rely on Supabase RLS to restrict access by `user_id`.
- Use typed selects and column lists in list/get calls to minimize payload.
- Prefer storing flexible extras in `meta` jsonb rather than adding ad-hoc columns.

## Notes & Caveats

- Timestamps default to `now()`; there are no universal triggers here. Update `updated_at` in app code where needed.
- Salary ranges in `jobs` are `bigint` (store minor units consistently if needed for currency math).
- The provided SQL in PRD context is non-executable order-wise; always apply real changes via files in `db/migrations/`.
- Frontend types can be derived or mapped via `@shared/services/dbMappers` when present.
