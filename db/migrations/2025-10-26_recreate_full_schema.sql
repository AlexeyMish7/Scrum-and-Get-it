-- WARNING: This migration DROPS existing public domain tables listed below.
-- Run only if you intend to delete existing data. BACKUP your database before running.
-- Purpose: Recreate a clean, opinionated schema for the ATS app in Supabase.

create extension if not exists pgcrypto;

-- =========================
-- DROP existing domain tables (public schema only)
-- =========================
-- Note: we intentionally do not drop auth.* or storage.* system tables.
drop table if exists public.education cascade;
drop table if exists public.projects cascade;
drop table if exists public.skills cascade;
drop table if exists public.certifications cascade;
drop table if exists public.employment cascade;
drop table if exists public.documents cascade;
drop table if exists public.profiles cascade;

-- =========================
-- ENUM types (idempotent)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'experience_level_enum') THEN
    CREATE TYPE experience_level_enum AS ENUM ('entry','mid','senior','executive');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'proficiency_level_enum') THEN
    CREATE TYPE proficiency_level_enum AS ENUM ('beginner','intermediate','advanced','expert');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status_enum') THEN
    CREATE TYPE project_status_enum AS ENUM ('planned','ongoing','completed');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_enum') THEN
    CREATE TYPE verification_status_enum AS ENUM ('unverified','pending','verified','rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'education_level_enum') THEN
    CREATE TYPE education_level_enum AS ENUM ('high_school','associate','bachelor','master','phd','other');
  END IF;
END$$;

-- =========================
-- profiles (one row per auth user)
-- =========================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  full_name text,
  email text unique,
  phone text,
  professional_title text,
  summary text,
  experience_level experience_level_enum,
  industry text,
  city text,
  state text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_select_own'
  ) then
    execute $SQL$
      create policy "profiles_select_own"
        on public.profiles
        for select
        using ( id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_insert_self'
  ) then
    execute $SQL$
      create policy "profiles_insert_self"
        on public.profiles
        for insert
        with check ( id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'profiles' and policyname = 'profiles_update_own'
  ) then
    execute $SQL$
      create policy "profiles_update_own"
        on public.profiles
        for update
        using ( id = auth.uid() );
    $SQL$;
  end if;
end$$;

create index if not exists idx_profiles_full_name on public.profiles(full_name);

-- =========================
-- documents (user uploaded files metadata)
-- =========================
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text check (kind in ('resume','cover_letter','portfolio','other')) default 'resume',
  file_name text not null,
  file_path text not null,
  mime_type text,
  bytes integer,
  meta jsonb,
  uploaded_at timestamptz default now()
);

alter table public.documents enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'documents' and policyname = 'docs_select_own'
  ) then
    execute $SQL$
      create policy "docs_select_own"
        on public.documents
        for select
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'documents' and policyname = 'docs_insert_own'
  ) then
    execute $SQL$
      create policy "docs_insert_own"
        on public.documents
        for insert
        with check ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'documents' and policyname = 'docs_update_own'
  ) then
    execute $SQL$
      create policy "docs_update_own"
        on public.documents
        for update
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'documents' and policyname = 'docs_delete_own'
  ) then
    execute $SQL$
      create policy "docs_delete_own"
        on public.documents
        for delete
        using ( user_id = auth.uid() );
    $SQL$;
  end if;
end$$;

create index if not exists idx_documents_user_uploaded_at on public.documents(user_id, uploaded_at desc);

-- =========================
-- employment
-- =========================
create table public.employment (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_title text not null,
  company_name text not null,
  location text,
  start_date date,
  end_date date,
  job_description text,
  current_position boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.employment enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employment' and policyname = 'employment_select_own'
  ) then
    execute $SQL$
      create policy "employment_select_own"
        on public.employment
        for select
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employment' and policyname = 'employment_insert_own'
  ) then
    execute $SQL$
      create policy "employment_insert_own"
        on public.employment
        for insert
        with check ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employment' and policyname = 'employment_update_own'
  ) then
    execute $SQL$
      create policy "employment_update_own"
        on public.employment
        for update
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'employment' and policyname = 'employment_delete_own'
  ) then
    execute $SQL$
      create policy "employment_delete_own"
        on public.employment
        for delete
        using ( user_id = auth.uid() );
    $SQL$;
  end if;
end$$;

create index if not exists idx_employment_user_start_date on public.employment(user_id, start_date desc);

-- =========================
-- certifications
-- =========================
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  issuing_org text,
  category text,
  date_earned date,
  expiration_date date,
  does_not_expire boolean default false,
  cert_id text,
  media_path text,
  verification_status verification_status_enum default 'unverified',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.certifications enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'certifications' and policyname = 'certs_select_own'
  ) then
    execute $SQL$
      create policy "certs_select_own"
        on public.certifications
        for select
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'certifications' and policyname = 'certs_insert_own'
  ) then
    execute $SQL$
      create policy "certs_insert_own"
        on public.certifications
        for insert
        with check ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'certifications' and policyname = 'certs_update_own'
  ) then
    execute $SQL$
      create policy "certs_update_own"
        on public.certifications
        for update
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'certifications' and policyname = 'certs_delete_own'
  ) then
    execute $SQL$
      create policy "certs_delete_own"
        on public.certifications
        for delete
        using ( user_id = auth.uid() );
    $SQL$;
  end if;
end$$;

create index if not exists idx_certs_user_date on public.certifications(user_id, date_earned desc);

-- =========================
-- skills
-- =========================
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  proficiency_level proficiency_level_enum,
  skill_category text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.skills enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'skills' and policyname = 'skills_select_own'
  ) then
    execute $SQL$
      create policy "skills_select_own"
        on public.skills
        for select
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'skills' and policyname = 'skills_insert_own'
  ) then
    execute $SQL$
      create policy "skills_insert_own"
        on public.skills
        for insert
        with check ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'skills' and policyname = 'skills_update_own'
  ) then
    execute $SQL$
      create policy "skills_update_own"
        on public.skills
        for update
        using ( user_id = auth.uid() );
    $SQL$;
  end if;
end$$;

create index if not exists idx_skills_user_name on public.skills(user_id, skill_name);

-- =========================
-- projects
-- =========================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  proj_name text not null,
  proj_description text,
  role text,
  start_date date,
  end_date date,
  tech_and_skills text[],
  project_url text,
  team_size integer,
  team_details text,
  industry_proj_type text,
  proj_outcomes text,
  status project_status_enum default 'planned',
  media_path text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_select_own'
  ) then
    execute $SQL$
      create policy "projects_select_own"
        on public.projects
        for select
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_insert_own'
  ) then
    execute $SQL$
      create policy "projects_insert_own"
        on public.projects
        for insert
        with check ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_update_own'
  ) then
    execute $SQL$
      create policy "projects_update_own"
        on public.projects
        for update
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'projects' and policyname = 'projects_delete_own'
  ) then
    execute $SQL$
      create policy "projects_delete_own"
        on public.projects
        for delete
        using ( user_id = auth.uid() );
    $SQL$;
  end if;
end$$;

create index if not exists idx_projects_user_start_date on public.projects(user_id, start_date desc);

-- =========================
-- education
-- =========================
create table public.education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  institution_name text not null,
  degree_type text,
  field_of_study text,
  graduation_date date,
  gpa numeric(4,2),
  enrollment_status text,
  education_level education_level_enum,
  honors text,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.education enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'education' and policyname = 'education_select_own'
  ) then
    execute $SQL$
      create policy "education_select_own"
        on public.education
        for select
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'education' and policyname = 'education_insert_own'
  ) then
    execute $SQL$
      create policy "education_insert_own"
        on public.education
        for insert
        with check ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'education' and policyname = 'education_update_own'
  ) then
    execute $SQL$
      create policy "education_update_own"
        on public.education
        for update
        using ( user_id = auth.uid() );
    $SQL$;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'education' and policyname = 'education_delete_own'
  ) then
    execute $SQL$
      create policy "education_delete_own"
        on public.education
        for delete
        using ( user_id = auth.uid() );
    $SQL$;
  end if;
end$$;

create index if not exists idx_education_user_graddate on public.education(user_id, graduation_date desc);

-- =========================
-- updated_at trigger function and triggers for tables that have updated_at
-- =========================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach triggers where appropriate
drop trigger if exists trg_set_updated_at_profiles on public.profiles;
create trigger trg_set_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_set_updated_at_employment on public.employment;
create trigger trg_set_updated_at_employment
  before update on public.employment
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_set_updated_at_certifications on public.certifications;
create trigger trg_set_updated_at_certifications
  before update on public.certifications
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_set_updated_at_skills on public.skills;
create trigger trg_set_updated_at_skills
  before update on public.skills
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_set_updated_at_projects on public.projects;
create trigger trg_set_updated_at_projects
  before update on public.projects
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_set_updated_at_education on public.education;
create trigger trg_set_updated_at_education
  before update on public.education
  for each row execute procedure public.set_updated_at();

-- =========================
-- Storage buckets (idempotent)
-- =========================
insert into storage.buckets (id, name, public)
values
  ('resumes', 'resumes', false),
  ('projects', 'projects', false),
  ('certifications', 'certifications', false)
on conflict (id) do nothing;

-- Storage object policies (owner-only access) for private buckets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes_read_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "resumes_read_own"
        ON storage.objects
        FOR SELECT
        USING (
          bucket_id = 'resumes' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'resumes_write_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "resumes_write_own"
        ON storage.objects
        FOR INSERT
        WITH CHECK (
          bucket_id = 'resumes' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

  -- projects bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'projects_read_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "projects_read_own"
        ON storage.objects
        FOR SELECT
        USING (
          bucket_id = 'projects' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'projects_write_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "projects_write_own"
        ON storage.objects
        FOR INSERT
        WITH CHECK (
          bucket_id = 'projects' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

  -- certifications bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'certs_read_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "certs_read_own"
        ON storage.objects
        FOR SELECT
        USING (
          bucket_id = 'certifications' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'certs_write_own'
  ) THEN
    EXECUTE $SQL$
      CREATE POLICY "certs_write_own"
        ON storage.objects
        FOR INSERT
        WITH CHECK (
          bucket_id = 'certifications' AND (split_part(name,'/',1))::uuid = auth.uid()
        );
    $SQL$;
  END IF;
END$$;

-- =========================
-- Helpful views (optional)
-- =========================
create or replace view public.vw_profile_with_counts as
select p.*, 
  (select count(*) from public.employment e where e.user_id = p.id) as employment_count,
  (select count(*) from public.skills s where s.user_id = p.id) as skills_count,
  (select count(*) from public.projects r where r.user_id = p.id) as projects_count
from public.profiles p;

grant select on public.vw_profile_with_counts to authenticated;

-- =========================
-- END
-- =========================
