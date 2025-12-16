-- Seed sample time tracking data for testing
-- This automatically uses the first user in your database

-- Insert sample data for the first user (easiest approach)
INSERT INTO job_time_entries (user_id, activity_type, duration_minutes, energy_level, outcome_type, created_at)
SELECT
  (SELECT id FROM public.profiles LIMIT 1) as user_id,
  activity,
  duration,
  energy,
  outcome,
  timestamp
FROM (VALUES
  -- Week 1 (most recent)
  ('applications', 45, 4, 'application_submitted', now() - interval '1 day'),
  ('applications', 60, 3, 'application_submitted', now() - interval '2 days'),
  ('networking', 30, 5, 'networking_connection', now() - interval '3 days'),
  ('research', 90, 4, null, now() - interval '4 days'),
  ('interview_prep', 120, 3, null, now() - interval '5 days'),

  -- Week 2
  ('applications', 50, 4, 'application_submitted', now() - interval '8 days'),
  ('applications', 55, 3, 'application_submitted', now() - interval '9 days'),
  ('networking', 40, 4, 'referral', now() - interval '10 days'),
  ('skill_building', 180, 2, null, now() - interval '11 days'),
  ('research', 75, 3, null, now() - interval '12 days'),

  -- Week 3
  ('applications', 40, 5, 'application_submitted', now() - interval '15 days'),
  ('interview_prep', 90, 4, 'interview', now() - interval '16 days'),
  ('networking', 35, 4, 'networking_connection', now() - interval '17 days'),
  ('applications', 65, 3, 'application_submitted', now() - interval '18 days'),
  ('research', 60, 3, null, now() - interval '19 days'),

  -- Week 4
  ('applications', 45, 2, 'application_submitted', now() - interval '22 days'),
  ('skill_building', 150, 2, null, now() - interval '23 days'),
  ('networking', 45, 3, 'networking_connection', now() - interval '24 days'),
  ('applications', 70, 4, 'application_submitted', now() - interval '25 days'),
  ('interview_prep', 100, 3, 'interview', now() - interval '26 days')
) AS sample_data(activity, duration, energy, outcome, timestamp);

-- Verify the data was inserted
SELECT
  p.email,
  t.activity_type,
  COUNT(*) as session_count,
  SUM(t.duration_minutes) as total_minutes,
  AVG(t.energy_level)::numeric(3,1) as avg_energy
FROM job_time_entries t
JOIN public.profiles p ON p.id = t.user_id
GROUP BY p.email, t.activity_type
ORDER BY total_minutes DESC;
