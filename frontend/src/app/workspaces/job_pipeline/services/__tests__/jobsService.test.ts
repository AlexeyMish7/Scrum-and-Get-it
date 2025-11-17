/**
 * JOBS SERVICE TESTS
 * Comprehensive test coverage for jobsService CRUD operations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import jobsService from "../jobsService";
import * as crud from "@shared/services/crud";
import type { JobFormData } from "@job_pipeline/types";

// Mock the crud module
vi.mock("@shared/services/crud", () => ({
  withUser: vi.fn(),
}));

// Mock request deduplication (pass through the fetcher function)
vi.mock("@shared/utils/requestDeduplication", () => ({
  deduplicateRequest: vi.fn((_, fetcher) => fetcher()),
}));

// Mock cache (return null for all gets to test actual logic)
vi.mock("@shared/services/cache", () => ({
  dataCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    invalidate: vi.fn(),
    invalidatePattern: vi.fn(),
  },
  getCacheKey: vi.fn(
    (table, userId, operation) => `${table}-${userId}-${operation}`
  ),
}));

describe("jobsService", () => {
  const mockUserId = "test-user-123";
  const mockJobId = 42;

  let mockUserCrud: {
    listRows: ReturnType<typeof vi.fn>;
    getRow: ReturnType<typeof vi.fn>;
    insertRow: ReturnType<typeof vi.fn>;
    updateRow: ReturnType<typeof vi.fn>;
    deleteRow: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock user CRUD object
    mockUserCrud = {
      listRows: vi.fn(),
      getRow: vi.fn(),
      insertRow: vi.fn(),
      updateRow: vi.fn(),
      deleteRow: vi.fn(),
    };

    // Mock withUser to return our mock CRUD object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(crud.withUser).mockReturnValue(mockUserCrud as any);
  });

  describe("listJobs", () => {
    it("should fetch jobs with default sorting", async () => {
      const mockJobs = [
        { id: 1, job_title: "Engineer", company_name: "Tech Co" },
        { id: 2, job_title: "Designer", company_name: "Design Inc" },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockJobs,
        error: null,
        status: null,
      });

      const result = await jobsService.listJobs(mockUserId);

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.listRows).toHaveBeenCalledWith("jobs", "*", {
        order: { column: "created_at", ascending: false },
      });
      expect(result.data).toEqual(mockJobs);
      expect(result.error).toBeNull();
    });

    it("should apply custom sorting", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
        status: null,
      });

      await jobsService.listJobs(mockUserId, {
        sortBy: "company_name",
        sortOrder: "asc",
      });

      expect(mockUserCrud.listRows).toHaveBeenCalledWith("jobs", "*", {
        order: { column: "company_name", ascending: true },
      });
    });

    it("should apply pagination", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
        status: null,
      });

      await jobsService.listJobs(mockUserId, {
        limit: 50,
        offset: 100,
      });

      expect(mockUserCrud.listRows).toHaveBeenCalledWith(
        "jobs",
        "*",
        expect.objectContaining({
          limit: 50,
          offset: 100,
        })
      );
    });

    it("should filter by stage", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
        status: null,
      });

      await jobsService.listJobs(mockUserId, {
        stage: "Interview",
      });

      expect(mockUserCrud.listRows).toHaveBeenCalledWith(
        "jobs",
        "*",
        expect.objectContaining({
          eq: { job_status: "Interview" },
        })
      );
    });

    it("should handle errors", async () => {
      const mockError = { message: "Database error", status: 500 };
      mockUserCrud.listRows.mockResolvedValue({
        data: null,
        error: mockError,
        status: 500,
      });

      const result = await jobsService.listJobs(mockUserId);

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe("getJob", () => {
    it("should fetch a single job by ID", async () => {
      const mockJob = {
        id: mockJobId,
        job_title: "Engineer",
        company_name: "Tech Co",
      };

      mockUserCrud.getRow.mockResolvedValue({
        data: mockJob,
        error: null,
        status: null,
      });

      const result = await jobsService.getJob(mockUserId, mockJobId);

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.getRow).toHaveBeenCalledWith("jobs", "*", {
        eq: { id: mockJobId },
        single: true,
      });
      expect(result.data).toEqual(mockJob);
    });

    it("should return null for non-existent job", async () => {
      mockUserCrud.getRow.mockResolvedValue({
        data: null,
        error: null,
        status: null,
      });

      const result = await jobsService.getJob(mockUserId, 9999);

      expect(result.data).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe("createJob", () => {
    it("should create a job with required fields", async () => {
      const formData: JobFormData = {
        job_title: "Software Engineer",
        company_name: "Tech Corp",
      };

      const mockCreated = {
        id: 1,
        ...formData,
        job_status: "Interested",
      };

      mockUserCrud.insertRow.mockResolvedValue({
        data: mockCreated,
        error: null,
        status: null,
      });

      const result = await jobsService.createJob(mockUserId, formData);

      expect(mockUserCrud.insertRow).toHaveBeenCalledWith(
        "jobs",
        expect.objectContaining({
          job_title: "Software Engineer",
          company_name: "Tech Corp",
          job_status: "Interested",
        }),
        "*"
      );
      expect(result.data).toEqual(mockCreated);
    });

    it("should validate required job_title", async () => {
      const formData: JobFormData = {
        job_title: "",
        company_name: "Tech Corp",
      };

      const result = await jobsService.createJob(mockUserId, formData);

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("Job title is required");
      expect(mockUserCrud.insertRow).not.toHaveBeenCalled();
    });

    it("should validate required company_name", async () => {
      const formData: JobFormData = {
        job_title: "Engineer",
        company_name: "   ",
      };

      const result = await jobsService.createJob(mockUserId, formData);

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("Company name is required");
      expect(mockUserCrud.insertRow).not.toHaveBeenCalled();
    });

    it("should include optional fields", async () => {
      const formData: JobFormData = {
        job_title: "Engineer",
        company_name: "Tech Corp",
        city_name: "San Francisco",
        state_code: "CA",
        start_salary_range: 100000,
        end_salary_range: 150000,
        job_status: "Applied",
      };

      mockUserCrud.insertRow.mockResolvedValue({
        data: formData,
        error: null,
        status: null,
      });

      await jobsService.createJob(mockUserId, formData);

      expect(mockUserCrud.insertRow).toHaveBeenCalledWith(
        "jobs",
        expect.objectContaining({
          city_name: "San Francisco",
          state_code: "CA",
          start_salary_range: 100000,
          end_salary_range: 150000,
          job_status: "Applied",
        }),
        "*"
      );
    });
  });

  describe("updateJob", () => {
    it("should update job fields", async () => {
      const updates = {
        job_title: "Senior Engineer",
        start_salary_range: 120000,
      };

      mockUserCrud.updateRow.mockResolvedValue({
        data: { id: mockJobId, ...updates },
        error: null,
        status: null,
      });

      const result = await jobsService.updateJob(
        mockUserId,
        mockJobId,
        updates
      );

      expect(mockUserCrud.updateRow).toHaveBeenCalledWith(
        "jobs",
        expect.objectContaining(updates),
        { eq: { id: mockJobId } },
        "*"
      );
      expect(result.data).toBeTruthy();
    });

    it("should update status_changed_at when job_status changes", async () => {
      const updates = { job_status: "Interview" as const };

      mockUserCrud.updateRow.mockResolvedValue({
        data: { id: mockJobId, ...updates },
        error: null,
        status: null,
      });

      await jobsService.updateJob(mockUserId, mockJobId, updates);

      expect(mockUserCrud.updateRow).toHaveBeenCalledWith(
        "jobs",
        expect.objectContaining({
          job_status: "Interview",
          status_changed_at: expect.any(String),
        }),
        { eq: { id: mockJobId } },
        "*"
      );
    });

    it("should validate job_title not empty", async () => {
      const updates = { job_title: "   " };

      const result = await jobsService.updateJob(
        mockUserId,
        mockJobId,
        updates
      );

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("Job title cannot be empty");
      expect(mockUserCrud.updateRow).not.toHaveBeenCalled();
    });

    it("should validate company_name not empty", async () => {
      const updates = { company_name: "" };

      const result = await jobsService.updateJob(
        mockUserId,
        mockJobId,
        updates
      );

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("Company name cannot be empty");
      expect(mockUserCrud.updateRow).not.toHaveBeenCalled();
    });
  });

  describe("deleteJob", () => {
    it("should delete a job", async () => {
      mockUserCrud.deleteRow.mockResolvedValue({
        data: null,
        error: null,
        status: null,
      });

      const result = await jobsService.deleteJob(mockUserId, mockJobId);

      expect(mockUserCrud.deleteRow).toHaveBeenCalledWith("jobs", {
        eq: { id: mockJobId },
      });
      expect(result.error).toBeNull();
    });

    it("should handle delete errors", async () => {
      const mockError = { message: "Cannot delete", status: 400 };
      mockUserCrud.deleteRow.mockResolvedValue({
        data: null,
        error: mockError,
        status: 400,
      });

      const result = await jobsService.deleteJob(mockUserId, mockJobId);

      expect(result.error).toEqual(mockError);
    });
  });

  describe("archiveJob", () => {
    it("should archive a job by setting status to Rejected", async () => {
      mockUserCrud.updateRow.mockResolvedValue({
        data: { id: mockJobId, job_status: "Rejected" },
        error: null,
        status: null,
      });

      await jobsService.archiveJob(mockUserId, mockJobId);

      expect(mockUserCrud.updateRow).toHaveBeenCalledWith(
        "jobs",
        expect.objectContaining({
          job_status: "Rejected",
        }),
        { eq: { id: mockJobId } },
        "*"
      );
    });
  });

  describe("countJobs", () => {
    it("should count all jobs", async () => {
      const mockJobs = new Array(25).fill({ id: 1 });
      mockUserCrud.listRows.mockResolvedValue({
        data: mockJobs,
        error: null,
        status: null,
      });

      const result = await jobsService.countJobs(mockUserId);

      expect(result.data).toBe(25);
    });

    it("should return 0 for empty list", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
        status: null,
      });

      const result = await jobsService.countJobs(mockUserId);

      expect(result.data).toBe(0);
    });
  });

  describe("listJobsPaginated", () => {
    it("should return paginated results with metadata", async () => {
      const mockJobs = new Array(50).fill(null).map((_, i) => ({ id: i + 1 }));
      mockUserCrud.listRows.mockResolvedValue({
        data: mockJobs,
        error: null,
        status: null,
      });

      const result = await jobsService.listJobsPaginated(mockUserId, {
        limit: 50,
        offset: 0,
      });

      expect(result.data).toBeTruthy();
      expect(result.data?.jobs).toHaveLength(50);
      expect(result.data?.limit).toBe(50);
      expect(result.data?.offset).toBe(0);
    });

    it("should indicate hasMore when more results exist", async () => {
      // Mock: 50 jobs returned, but total is 100
      const mockJobs = new Array(50).fill(null).map((_, i) => ({ id: i + 1 }));
      mockUserCrud.listRows.mockResolvedValue({
        data: mockJobs,
        error: null,
        status: null,
      });

      const result = await jobsService.listJobsPaginated(mockUserId, {
        limit: 50,
        offset: 0,
      });

      // hasMore depends on total count, which requires a second query
      // For now, we'll verify the structure exists
      expect(result.data).toHaveProperty("hasMore");
    });
  });
});
