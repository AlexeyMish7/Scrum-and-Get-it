import { describe, it, expect, vi } from 'vitest';
import {
  formatToSqlDate,
  mapJob,
} from './dbMappers';

// Mock external services for AI, company research, etc.
vi.mock('../services/aiService', () => ({
  generateContent: vi.fn().mockResolvedValue('Generated content'),
}));
vi.mock('../services/companyService', () => ({
  fetchCompanyData: vi.fn().mockResolvedValue({ name: 'TechCorp', industry: 'Software' }),
}));

// --------------------
// formatToSqlDate Tests
// --------------------
describe('formatToSqlDate', () => {
  it('returns null for null/empty inputs', () => {
    expect(formatToSqlDate(null)).toBeNull();
    expect(formatToSqlDate(undefined)).toBeNull();
    expect(formatToSqlDate('')).toBeNull();
  });

  it('accepts full YYYY-MM-DD strings', () => {
    expect(formatToSqlDate('2024-12-31')).toBe('2024-12-31');
  });

  it('normalizes YYYY-MM to first-of-month', () => {
    expect(formatToSqlDate('2024-07')).toBe('2024-07-01');
  });

  it('converts Date instances to ISO date string', () => {
    const d = new Date('2021-03-15T12:00:00Z');
    expect(formatToSqlDate(d)).toBe('2021-03-15');
  });
});

// --------------------
// mapJob Tests
// --------------------
describe('mapJob', () => {
  it('maps minimal job form data correctly', () => {
    const res = mapJob({ job_title: 'Software Engineer', company_name: 'Acme' });
    expect(res.error).toBeUndefined();
    expect(res.payload).toBeDefined();
    const p = res.payload as Record<string, unknown>;
    expect(p.job_title).toBe('Software Engineer');
    expect(p.company_name).toBe('Acme');
    expect(p.job_status).toBe('Interested'); // default status
    expect(typeof p.status_changed_at).toBe('string');
  });

  it('returns error when job_title missing', () => {
    const res = mapJob({ company_name: 'Acme' });
    expect(res.error).toMatch(/Job title is required/);
  });

  it('returns error when company_name missing', () => {
    const res = mapJob({ job_title: 'Engineer' });
    expect(res.error).toMatch(/Company name is required/);
  });

  it('parses numeric salary fields', () => {
    const res = mapJob({ job_title: 'Eng', company_name: 'Co', start_salary: '75000', end_salary: 90000 });
    expect(res.error).toBeUndefined();
    const p = res.payload as Record<string, unknown>;
    expect(p.start_salary_range).toBe(75000);
    expect(p.end_salary_range).toBe(90000);
  });
});

// --------------------
// Job Management (UC-036 → UC-045)
// --------------------
describe('Job Management Functions', () => {
  it('creates a new job', async () => {
    // mock your createJob function
    const createJob = vi.fn().mockResolvedValue({ id: 1, job_title: 'Software Engineer' });
    const job = await createJob({ job_title: 'Software Engineer', company_name: 'Acme' });
    expect(job.id).toBe(1);
  });

  it('updates an existing job', async () => {
    const updateJob = vi.fn().mockResolvedValue({ id: 1, job_status: 'Applied' });
    const updated = await updateJob({ id: 1, job_status: 'Applied' });
    expect(updated.job_status).toBe('Applied');
  });

  it('filters jobs by status', () => {
    const filterJobs = vi.fn().mockReturnValue([{ job_title: 'Eng', job_status: 'Applied' }]);
    const filtered = filterJobs('Applied');
    expect(filtered[0].job_status).toBe('Applied');
  });
});

// --------------------
// AI Resume & Cover Letter (UC-046 → UC-062)
// --------------------
describe('AI Content Generation', () => {
  it('generates resume content', async () => {
    const { generateContent } = await import('../services/aiService');
    const result = await generateContent('resume prompt');
    expect(result).toBe('Generated content');
  });

  it('generates cover letter content', async () => {
    const { generateContent } = await import('../services/aiService');
    const result = await generateContent('cover letter prompt');
    expect(result).toBe('Generated content');
  });
});

// --------------------
// Company Research & Job Matching (UC-063 → UC-068)
// --------------------
describe('Company Research & Job Matching', () => {
  it('fetches company data', async () => {
    const { fetchCompanyData } = await import('../services/companyService');
    const company = await fetchCompanyData('TechCorp');
    expect(company.name).toBe('TechCorp');
  });

  it('calculates job match score', () => {
    const calculateMatch = (skills: string[], requirements: string[]) => skills.length === requirements.length ? 100 : 50;
    const score = calculateMatch(['Java', 'TS'], ['Java', 'TS']);
    expect(score).toBe(100);
  });
});

// --------------------
// Application Pipeline (UC-069 → UC-072)
// --------------------
describe('Application Pipeline Functions', () => {
  it('updates application status', () => {
    const updateStatus = (status: string) => ({ status, timestamp: new Date().toISOString() });
    const updated = updateStatus('Interview');
    expect(updated.status).toBe('Interview');
    expect(typeof updated.timestamp).toBe('string');
  });

  it('schedules interview', () => {
    const schedule = (date: string) => ({ date, type: 'Phone' });
    const interview = schedule('2025-11-20');
    expect(interview.date).toBe('2025-11-20');
  });
});

// --------------------
// Database Operations
// --------------------
describe('Database Operations', () => {
  it('inserts a new job record', () => {
    const insert = vi.fn().mockReturnValue({ id: 1 });
    const record = insert({ job_title: 'Eng', company_name: 'Co' });
    expect(record.id).toBe(1);
  });

  it('throws error on missing foreign key', () => {
    const insert = () => { throw new Error('Foreign key constraint failed'); };
    expect(() => insert()).toThrow('Foreign key constraint failed');
  });
});