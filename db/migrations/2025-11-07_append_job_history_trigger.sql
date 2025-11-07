-- APPLIED IN SQL EDITOR -- 
-- Migration: append job status changes into job_notes.application_history
-- Purpose: when a job's job_status changes, append a history entry into the
-- job_notes table's application_history jsonb for that job. This is implemented
-- as a trigger so updates are atomic and server-side (avoids client races).

-- Drop previous function/trigger if present so migration is idempotent
drop trigger if exists jobs_app_history_trigger on public.jobs;
drop function if exists public.jobs_append_application_history() cascade;

create or replace function public.jobs_append_application_history()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as
$$
declare
  v_note_id uuid;
  v_entry jsonb;
begin
  -- Only run when job_status actually changed
  if (TG_OP = 'UPDATE') then
    if (coalesce(OLD.job_status::text, '') = coalesce(NEW.job_status::text, '')) then
      return NEW;
    end if;
  else
    return NEW;
  end if;

  -- Build a history entry object
  v_entry := jsonb_build_object(
    'from', OLD.job_status,
    'to', NEW.job_status,
    'changed_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'by', NEW.user_id
  );

  -- Try to find an existing job_notes row for this job (prefer the first)
  select id into v_note_id from public.job_notes where job_id = NEW.id limit 1;

  if found then
    -- Append to existing application_history array (create array if null)
    update public.job_notes
    set application_history = coalesce(application_history, '[]'::jsonb) || jsonb_build_array(v_entry),
        updated_at = now()
    where id = v_note_id;
  else
    -- Create a minimal note row with the single history entry
    insert into public.job_notes (user_id, job_id, application_history, created_at, updated_at)
    values (NEW.user_id, NEW.id, jsonb_build_array(v_entry), now(), now());
  end if;

  return NEW;
end;
$$;

-- Trigger fires after update on jobs when job_status changes
create trigger jobs_app_history_trigger
after update on public.jobs
for each row
when (old.job_status is distinct from new.job_status)
execute procedure public.jobs_append_application_history();

-- No public EXECUTE grant required; trigger calls the function internally.
