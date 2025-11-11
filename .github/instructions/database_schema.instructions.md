---
applyTo: "**"
---

# Database Schema — ATS Tracker (current reference)

-- WARNING: This schema snapshot is for developer context ONLY and must NOT be executed directly.
-- Table order here is illustrative; always rely on idempotent files in `db/migrations/` for real changes.

Below is the consolidated view of user‑owned and AI‑related tables after recent Sprint 2 additions (`ai_artifacts`, `job_materials`, status history trigger). It merges information from the base recreate migration and incremental migrations (Nov 2–7).

```sql
CREATE TABLE public.ai_artifacts (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	job_id bigint,
	kind text NOT NULL CHECK (kind = ANY (ARRAY['resume','cover_letter','skills_optimization','company_research','match','gap_analysis'])),
	title text,
	prompt text,
	model text,
	content jsonb NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT ai_artifacts_pkey PRIMARY KEY (id),
	CONSTRAINT ai_artifacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
	CONSTRAINT ai_artifacts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL
);

CREATE TABLE public.certifications (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	name text NOT NULL,
	issuing_org text,
	category text,
	date_earned date,
	expiration_date date,
	does_not_expire boolean DEFAULT false,
	cert_id text,
	media_path text,
	verification_status USER-DEFINED DEFAULT 'unverified'::verification_status_enum,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now(),
	CONSTRAINT certifications_pkey PRIMARY KEY (id),
	CONSTRAINT certifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.documents (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	kind text DEFAULT 'resume' CHECK (kind IN ('resume','cover_letter','portfolio','other')),
	file_name text NOT NULL,
	file_path text NOT NULL,
	mime_type text,
	bytes integer,
	meta jsonb,
	uploaded_at timestamptz DEFAULT now(),
	project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
	CONSTRAINT documents_pkey PRIMARY KEY (id),
	CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.education (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	institution_name text NOT NULL,
	degree_type text,
	field_of_study text,
	graduation_date date,
	gpa numeric CHECK (gpa IS NULL OR gpa BETWEEN 0 AND 4),
	enrollment_status text DEFAULT 'not_enrolled',
	education_level USER-DEFINED,
	honors text,
	meta jsonb,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now(),
	start_date date NOT NULL,
	CONSTRAINT education_pkey PRIMARY KEY (id),
	CONSTRAINT education_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.employment (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	job_title text NOT NULL,
	company_name text NOT NULL,
	location text,
	start_date date NOT NULL,
	end_date date,
	job_description text,
	current_position boolean NOT NULL DEFAULT false,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT employment_pkey PRIMARY KEY (id),
	CONSTRAINT employment_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE TABLE public.job_materials (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	job_id bigint NOT NULL,
	resume_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
	resume_artifact_id uuid REFERENCES public.ai_artifacts(id) ON DELETE SET NULL,
	cover_document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
	cover_artifact_id uuid REFERENCES public.ai_artifacts(id) ON DELETE SET NULL,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT job_materials_pkey PRIMARY KEY (id),
	CONSTRAINT job_materials_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
	CONSTRAINT job_materials_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE
);

CREATE TABLE public.job_notes (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid,
	job_id bigint,
	created_at timestamptz NOT NULL DEFAULT now(),
	personal_notes text,
	recruiter_name text,
	recruiter_email text,
	recruiter_phone text,
	hiring_manager_name text,
	hiring_manager_email text,
	hiring_manager_phone text,
	application_history jsonb,
	salary_negotiation_notes text,
	interview_notes text,
	interview_feedback text,
	updated_at timestamptz,
	CONSTRAINT job_notes_pkey PRIMARY KEY (id),
	CONSTRAINT job_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL,
	CONSTRAINT job_notes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE
);

CREATE TABLE public.jobs (
	id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id uuid,
	created_at timestamptz NOT NULL DEFAULT now(),
	job_title text,
	company_name text,
	street_address text,
	city_name text,
	state_code text,
	zipcode text,
	start_salary_range bigint,
	end_salary_range bigint,
	job_link text,
	application_deadline date,
	job_description text,
	industry text,
	job_type text,
	job_status text,
	status_changed_at timestamptz DEFAULT now(),
	CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE public.profiles (
	id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	first_name text NOT NULL,
	last_name text NOT NULL,
	full_name text,
	email text NOT NULL UNIQUE,
	phone text,
	professional_title text,
	summary text,
	experience_level USER-DEFINED,
	industry text,
	city text,
	state text,
	meta jsonb,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.projects (
	id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
	proj_name text NOT NULL,
	proj_description text,
	role text,
	start_date date NOT NULL,
	end_date date,
	tech_and_skills text[],
	project_url text,
	team_size integer CHECK (team_size IS NULL OR team_size >= 0),
	team_details text,
	industry_proj_type text,
	proj_outcomes text,
	status USER-DEFINED DEFAULT 'planned',
	media_path text,
	meta jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.skills (
	id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
	user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
	skill_name text NOT NULL,
	proficiency_level USER-DEFINED NOT NULL DEFAULT 'beginner',
	skill_category text NOT NULL DEFAULT 'Technical',
	meta jsonb,
	created_at timestamptz DEFAULT now(),
	updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.cover_letter_drafts (
	id uuid NOT NULL DEFAULT gen_random_uuid(),
	user_id uuid NOT NULL,
	name text NOT NULL,
	template_id text NULL DEFAULT 'formal'::text,
	job_id bigint NULL,
	company_name text NULL,
	job_title text NULL,
	content jsonb NOT NULL DEFAULT '{}'::jsonb,
	metadata jsonb NOT NULL DEFAULT '{"tone": "formal", "length": "standard", "culture": "corporate"}'::jsonb,
	company_research jsonb NULL DEFAULT '{}'::jsonb,
	version integer NOT NULL DEFAULT 1,
	is_active boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	last_accessed_at timestamptz NULL DEFAULT now(),
	CONSTRAINT cover_letter_drafts_pkey PRIMARY KEY (id),
	CONSTRAINT cover_letter_drafts_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE SET NULL,
	CONSTRAINT cover_letter_drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_user_id ON public.cover_letter_drafts USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_job_id ON public.cover_letter_drafts USING btree (job_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_updated_at ON public.cover_letter_drafts USING btree (updated_at desc);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_is_active ON public.cover_letter_drafts USING btree (is_active) WHERE (is_active = true);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_template ON public.cover_letter_drafts USING btree (template_id);
CREATE INDEX IF NOT EXISTS idx_cover_letter_drafts_company ON public.cover_letter_drafts USING btree (company_name);

CREATE TRIGGER cover_letter_drafts_updated_at_trigger BEFORE
	UPDATE ON cover_letter_drafts FOR EACH ROW
	EXECUTE FUNCTION update_cover_letter_drafts_updated_at();
```

## Relationship Map (simplified)

- profiles ← auth.users (1:1)
- profiles → jobs, employment, education, skills, certifications, projects, documents, ai_artifacts, job_materials, job_notes (1:N via user_id)
- jobs → job_materials, job_notes, ai_artifacts (1:N)
- job_materials → documents (optional resumes/covers) & ai_artifacts (optional generated versions)
- ai_artifacts (optional) → jobs (many artifacts can reference the same job)
- documents (optional) → projects

## Versioning & Materials Logic

- Each generated resume / cover letter = one ai_artifacts row (immutable snapshot).
- `job_materials` holds a history of which resume/cover (document OR artifact) was associated with a job at a point in time.
- Latest selection per job derived from `v_job_current_materials` view (ordered by created_at DESC).
- Changing materials inserts a new `job_materials` row (no destructive updates), enabling analytics & rollback.

## Status History

- Trigger `jobs_app_history_trigger` (see migration: 2025-11-07_append_job_history_trigger.sql) appends transitions into `job_notes.application_history` for audit of pipeline movement.

## AI Artifacts Usage

- `content` stores structured generation (bullets, sections, scores, etc.).
- `metadata` holds auxiliary info (prompt snippet, confidence score, external references).
- All access is RLS-scoped; frontend calls must include authenticated session.

## RLS & Security Patterns

- Every user-owned table has policies: select/insert/update/delete restricted to `auth.uid()` = user_id.
- Artifacts & materials use ON DELETE SET NULL / CASCADE carefully to retain history without orphaned ownership references.

## Implementation Pointers

- Use `withUser(user.id)` helper for all CRUD (injects user_id equality).
- For attaching materials: insert into `job_materials` rather than updating a single row; fetch latest via view.
- For exporting documents: create `documents` row + optional storage object; link document id in `job_materials`.

## Extensibility Notes

- Add new AI kinds by extending the `kind` CHECK list and frontend type union, then creating orchestrator logic.
- Prefer storing flexible extras in jsonb (`metadata`, `meta`) over schema changes.
- Match & gap analysis artifacts can feed analytics later by aggregating over `ai_artifacts(kind='match')`.

## Client Usage Quick Guide

1. Generate content → orchestrator inserts ai_artifacts row.
2. User selects version → insert `job_materials` linking artifact (and/or exported document).
3. UI shows current materials via view or latest row query.
4. Pipeline status change → trigger appends history to `job_notes.application_history`.

## Non-Executable Reminder

Do NOT run this block as-is. Always apply changes through the migration files in `db/migrations/` which are idempotent and reviewed.
