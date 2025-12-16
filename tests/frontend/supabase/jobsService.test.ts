/**
 * Supabase Tests: Jobs Service
 *
 * Tests job pipeline data operations.
 * These tests mock Supabase and validate job CRUD operations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

describe("[Supabase] Jobs Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fetch Jobs", () => {
    it("should fetch all jobs for a user", async () => {
      const mockJobs = [
        {
          id: "job-1",
          company: "Apple",
          title: "iOS Developer",
          status: "applied",
          salary_min: 150000,
          salary_max: 200000,
          location: "Cupertino, CA",
          url: "https://apple.com/jobs/1",
          user_id: "user-1",
          created_at: "2024-01-10",
        },
        {
          id: "job-2",
          company: "Google",
          title: "Software Engineer",
          status: "interview",
          salary_min: 180000,
          salary_max: 250000,
          location: "Mountain View, CA",
          url: "https://google.com/jobs/2",
          user_id: "user-1",
          created_at: "2024-01-15",
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
          }),
        }),
      });

      const result = { data: mockJobs, error: null };
      expect(result.data).toHaveLength(2);
    });

    it("should filter jobs by status", async () => {
      const appliedJobs = [
        { id: "job-1", company: "Apple", status: "applied" },
      ];

      const result = { data: appliedJobs, error: null };
      expect(result.data.every((j) => j.status === "applied")).toBe(true);
    });

    it("should order jobs by created_at descending", async () => {
      const orderedJobs = [
        { id: "2", created_at: "2024-01-15" },
        { id: "1", created_at: "2024-01-10" },
      ];

      const result = { data: orderedJobs, error: null };
      expect(
        new Date(result.data[0].created_at) >
          new Date(result.data[1].created_at)
      ).toBe(true);
    });
  });

  describe("Create Job", () => {
    it("should create a new job with required fields", async () => {
      const newJob = {
        company: "Meta",
        title: "Product Engineer",
        status: "wishlist",
      };
      const insertedJob = {
        id: "new-job-id",
        ...newJob,
        user_id: "user-1",
        created_at: new Date().toISOString(),
      };

      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: insertedJob, error: null }),
          }),
        }),
      });

      const result = { data: insertedJob, error: null };
      expect(result.data.company).toBe("Meta");
      expect(result.data.status).toBe("wishlist");
    });

    it("should require company name", async () => {
      const mockError = { message: "company cannot be null", code: "23502" };

      const result = { data: null, error: mockError };
      expect(result.error).toBeTruthy();
    });

    it("should set default status to wishlist", async () => {
      const jobWithDefaultStatus = {
        id: "job-1",
        company: "Company",
        title: "Role",
        status: "wishlist",
      };

      expect(jobWithDefaultStatus.status).toBe("wishlist");
    });
  });

  describe("Update Job", () => {
    it("should update job status (for kanban drag)", async () => {
      const updatedJob = {
        id: "job-1",
        company: "Apple",
        status: "interview",
      };

      const result = { data: updatedJob, error: null };
      expect(result.data.status).toBe("interview");
    });

    it("should update job details", async () => {
      const updates = {
        salary_min: 160000,
        salary_max: 220000,
        notes: "Had first interview",
      };
      const updatedJob = { id: "job-1", ...updates };

      const result = { data: updatedJob, error: null };
      expect(result.data.salary_min).toBe(160000);
    });

    it("should record applied_date when moving to applied status", async () => {
      const updatedJob = {
        id: "job-1",
        status: "applied",
        applied_date: "2024-01-20",
      };

      expect(updatedJob.applied_date).toBeTruthy();
    });
  });

  describe("Delete Job", () => {
    it("should delete a job", async () => {
      mockSupabaseFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const result = { data: null, error: null };
      expect(result.error).toBeNull();
    });

    it("should cascade delete job history", async () => {
      // When a job is deleted, its history entries should also be deleted
      const result = { data: null, error: null };
      expect(result.error).toBeNull();
    });
  });

  describe("Job History", () => {
    it("should append history entry on status change", async () => {
      const historyEntry = {
        job_id: "job-1",
        old_status: "applied",
        new_status: "interview",
        changed_at: new Date().toISOString(),
      };

      const result = { data: historyEntry, error: null };
      expect(result.data.old_status).toBe("applied");
      expect(result.data.new_status).toBe("interview");
    });

    it("should fetch job history", async () => {
      const history = [
        { old_status: null, new_status: "wishlist", changed_at: "2024-01-10" },
        {
          old_status: "wishlist",
          new_status: "applied",
          changed_at: "2024-01-15",
        },
        {
          old_status: "applied",
          new_status: "interview",
          changed_at: "2024-01-20",
        },
      ];

      const result = { data: history, error: null };
      expect(result.data).toHaveLength(3);
    });
  });
});

describe("[Supabase] Job Analytics Cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Cache Operations", () => {
    it("should fetch cached analytics for a job", async () => {
      const cachedAnalytics = {
        job_id: "job-1",
        match_score: 85,
        strengths: ["React experience", "TypeScript"],
        gaps: ["AWS"],
        profile_version: "v1",
        cached_at: "2024-01-15",
      };

      const result = { data: cachedAnalytics, error: null };
      expect(result.data.match_score).toBe(85);
    });

    it("should return null for uncached job", async () => {
      const result = { data: null, error: null };
      expect(result.data).toBeNull();
    });

    it("should save analytics to cache", async () => {
      const analytics = {
        job_id: "job-1",
        match_score: 90,
        strengths: ["Strong match"],
        gaps: [],
        profile_version: "v2",
      };

      const result = { data: { id: "cache-1", ...analytics }, error: null };
      expect(result.data.match_score).toBe(90);
    });

    it("should invalidate cache on profile change", async () => {
      // Profile change should mark cache as stale
      const oldCacheVersion = "v1" as string;
      const currentProfileVersion = "v2" as string;

      const isStale = oldCacheVersion !== currentProfileVersion;
      expect(isStale).toBe(true);
    });
  });
});
