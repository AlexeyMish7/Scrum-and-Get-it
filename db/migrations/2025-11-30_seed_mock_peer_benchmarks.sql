-- ==========================================
-- Seed Mock Peer Benchmark Data for Testing
-- ==========================================
-- Purpose: Populate peer_benchmarks table with realistic mock data
-- so competitive positioning feature can be demonstrated immediately.
-- In production, this data would be computed from actual user metrics.

-- Insert mock peer benchmarks for Software industry
INSERT INTO public.peer_benchmarks (
  industry,
  experience_level,
  job_title_category,
  region,
  avg_applications_per_month,
  avg_response_rate,
  avg_interview_rate,
  avg_offer_rate,
  avg_time_to_first_interview_days,
  avg_time_to_offer_days,
  top_required_skills,
  top_missing_skills,
  avg_skills_per_profile,
  median_salary,
  sample_size,
  data_quality_score
) VALUES
  -- Entry-level Software Engineers
  (
    'Software',
    'entry',
    'Software Engineer',
    'United States',
    12.5,
    0.22,
    0.14,
    0.07,
    15,
    42,
    '[
      {"skill": "JavaScript", "frequency": 85},
      {"skill": "React", "frequency": 78},
      {"skill": "Git", "frequency": 92},
      {"skill": "SQL", "frequency": 65},
      {"skill": "REST APIs", "frequency": 70}
    ]'::jsonb,
    '[
      {"skill": "AWS", "frequency": 45},
      {"skill": "Docker", "frequency": 38},
      {"skill": "TypeScript", "frequency": 42},
      {"skill": "CI/CD", "frequency": 35},
      {"skill": "Testing", "frequency": 40}
    ]'::jsonb,
    14,
    75000,
    450,
    0.85
  ),
  
  -- Mid-level Software Engineers
  (
    'Software',
    'mid',
    'Software Engineer',
    'United States',
    10.2,
    0.25,
    0.17,
    0.09,
    12,
    38,
    '[
      {"skill": "JavaScript", "frequency": 88},
      {"skill": "React", "frequency": 82},
      {"skill": "Node.js", "frequency": 75},
      {"skill": "AWS", "frequency": 68},
      {"skill": "System Design", "frequency": 62}
    ]'::jsonb,
    '[
      {"skill": "Kubernetes", "frequency": 48},
      {"skill": "GraphQL", "frequency": 42},
      {"skill": "Microservices", "frequency": 45},
      {"skill": "Team Leadership", "frequency": 38},
      {"skill": "Architecture", "frequency": 40}
    ]'::jsonb,
    18,
    110000,
    380,
    0.88
  ),
  
  -- Senior Software Engineers
  (
    'Software',
    'senior',
    'Software Engineer',
    'United States',
    8.5,
    0.28,
    0.20,
    0.11,
    10,
    35,
    '[
      {"skill": "System Design", "frequency": 92},
      {"skill": "Architecture", "frequency": 88},
      {"skill": "Team Leadership", "frequency": 85},
      {"skill": "Cloud Infrastructure", "frequency": 80},
      {"skill": "Microservices", "frequency": 75}
    ]'::jsonb,
    '[
      {"skill": "Strategic Planning", "frequency": 42},
      {"skill": "Product Strategy", "frequency": 38},
      {"skill": "C-Suite Communication", "frequency": 35},
      {"skill": "Budget Management", "frequency": 30},
      {"skill": "Hiring", "frequency": 40}
    ]'::jsonb,
    22,
    155000,
    280,
    0.90
  ),
  
  -- Entry-level Finance
  (
    'Finance',
    'entry',
    'Analyst',
    'United States',
    10.0,
    0.18,
    0.11,
    0.05,
    18,
    55,
    '[
      {"skill": "Excel", "frequency": 95},
      {"skill": "Financial Modeling", "frequency": 82},
      {"skill": "Analysis", "frequency": 88},
      {"skill": "SQL", "frequency": 60},
      {"skill": "PowerPoint", "frequency": 75}
    ]'::jsonb,
    '[
      {"skill": "Python", "frequency": 45},
      {"skill": "Tableau", "frequency": 38},
      {"skill": "VBA", "frequency": 35},
      {"skill": "Bloomberg Terminal", "frequency": 42},
      {"skill": "Risk Management", "frequency": 30}
    ]'::jsonb,
    12,
    65000,
    320,
    0.82
  ),
  
  -- Mid-level Finance
  (
    'Finance',
    'mid',
    'Analyst',
    'United States',
    8.5,
    0.20,
    0.13,
    0.07,
    16,
    48,
    '[
      {"skill": "Financial Analysis", "frequency": 92},
      {"skill": "Risk Management", "frequency": 78},
      {"skill": "Excel", "frequency": 95},
      {"skill": "Compliance", "frequency": 65},
      {"skill": "Team Leadership", "frequency": 58}
    ]'::jsonb,
    '[
      {"skill": "Strategic Planning", "frequency": 40},
      {"skill": "Portfolio Management", "frequency": 38},
      {"skill": "Regulatory Knowledge", "frequency": 35},
      {"skill": "Advanced Analytics", "frequency": 42},
      {"skill": "Presentation Skills", "frequency": 35}
    ]'::jsonb,
    16,
    92000,
    260,
    0.85
  ),
  
  -- Entry-level Marketing
  (
    'Marketing',
    'entry',
    'Marketing Coordinator',
    'United States',
    11.0,
    0.20,
    0.12,
    0.06,
    16,
    50,
    '[
      {"skill": "Social Media", "frequency": 90},
      {"skill": "Content Creation", "frequency": 85},
      {"skill": "Analytics", "frequency": 70},
      {"skill": "SEO", "frequency": 65},
      {"skill": "Email Marketing", "frequency": 72}
    ]'::jsonb,
    '[
      {"skill": "Google Analytics", "frequency": 48},
      {"skill": "A/B Testing", "frequency": 40},
      {"skill": "Marketing Automation", "frequency": 42},
      {"skill": "Data Analysis", "frequency": 45},
      {"skill": "Campaign Strategy", "frequency": 38}
    ]'::jsonb,
    13,
    55000,
    290,
    0.80
  ),
  
  -- Mid-level Marketing
  (
    'Marketing',
    'mid',
    'Marketing Manager',
    'United States',
    9.0,
    0.22,
    0.14,
    0.08,
    14,
    45,
    '[
      {"skill": "Campaign Management", "frequency": 88},
      {"skill": "Data Analysis", "frequency": 82},
      {"skill": "Team Leadership", "frequency": 75},
      {"skill": "Budget Management", "frequency": 70},
      {"skill": "SEO/SEM", "frequency": 78}
    ]'::jsonb,
    '[
      {"skill": "Strategic Planning", "frequency": 45},
      {"skill": "Brand Management", "frequency": 40},
      {"skill": "Multi-channel Marketing", "frequency": 42},
      {"skill": "Stakeholder Management", "frequency": 38},
      {"skill": "Marketing Analytics", "frequency": 48}
    ]'::jsonb,
    17,
    80000,
    240,
    0.83
  );

-- Update last_computed_at timestamp
UPDATE public.peer_benchmarks SET last_computed_at = now();

-- Verify data was inserted
SELECT 
  industry,
  experience_level,
  job_title_category,
  sample_size,
  avg_applications_per_month,
  (avg_response_rate * 100)::numeric(5,1) as response_rate_pct,
  (avg_interview_rate * 100)::numeric(5,1) as interview_rate_pct,
  (avg_offer_rate * 100)::numeric(5,1) as offer_rate_pct
FROM public.peer_benchmarks
ORDER BY industry, experience_level;

COMMENT ON TABLE public.peer_benchmarks IS 'Mock peer benchmark data seeded for testing. In production, this would be computed from actual user metrics via nightly aggregation job.';
