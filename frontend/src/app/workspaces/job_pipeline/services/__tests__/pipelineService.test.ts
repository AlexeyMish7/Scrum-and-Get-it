/**
 * PIPELINE SERVICE TESTS
 * Comprehensive test coverage for pipelineService kanban operations.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import pipelineService from "../pipelineService";
import * as crud from "@shared/services/crud";
import type { PipelineStage } from "@job_pipeline/types";
import type { JobRow } from "@shared/types/database";

// Mock the crud module
vi.mock("@shared/services/crud", () => ({
  withUser: vi.fn(),
}));

describe("pipelineService", () => {
  const mockUserId = "test-user-123";
  const mockJobId = 42;

  let mockUserCrud: {
    listRows: ReturnType<typeof vi.fn>;
    updateRow: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserCrud = {
      listRows: vi.fn(),
      updateRow: vi.fn(),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(crud.withUser).mockReturnValue(mockUserCrud as any);
  });

  describe("moveJob", () => {
    it("should update job status to new stage", async () => {
      const newStage: PipelineStage = "Interview";

      mockUserCrud.updateRow.mockResolvedValue({
        data: { id: mockJobId, job_status: newStage },
        error: null,
        status: null,
      });

      const result = await pipelineService.moveJob(
        mockUserId,
        mockJobId,
        newStage
      );

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.updateRow).toHaveBeenCalledWith(
        "jobs",
        expect.objectContaining({
          job_status: newStage,
          status_changed_at: expect.any(String),
        }),
        { eq: { id: mockJobId } },
        "*"
      );
      expect(result.data).toBeTruthy();
      expect(result.error).toBeNull();
    });

    it("should handle all pipeline stages", async () => {
      const stages: PipelineStage[] = [
        "Interested",
        "Applied",
        "Phone Screen",
        "Interview",
        "Offer",
        "Rejected",
      ];

      for (const stage of stages) {
        mockUserCrud.updateRow.mockResolvedValue({
          data: { id: mockJobId, job_status: stage },
          error: null,
          status: null,
        });

        const result = await pipelineService.moveJob(
          mockUserId,
          mockJobId,
          stage
        );

        expect(result.data).toBeTruthy();
        expect(mockUserCrud.updateRow).toHaveBeenCalledWith(
          "jobs",
          expect.objectContaining({ job_status: stage }),
          { eq: { id: mockJobId } },
          "*"
        );
      }
    });

    it("should handle errors", async () => {
      const mockError = { message: "Update failed", status: 500 };
      mockUserCrud.updateRow.mockResolvedValue({
        data: null,
        error: mockError,
        status: 500,
      });

      const result = await pipelineService.moveJob(
        mockUserId,
        mockJobId,
        "Applied"
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe("getJobsByStage", () => {
    it("should group jobs by pipeline stage", async () => {
      const mockJobs: Partial<JobRow>[] = [
        { id: 1, job_title: "Job 1", job_status: "Interested" },
        { id: 2, job_title: "Job 2", job_status: "Applied" },
        { id: 3, job_title: "Job 3", job_status: "Interview" },
        { id: 4, job_title: "Job 4", job_status: "Interested" },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockJobs,
        error: null,
        status: null,
      });

      const result = await pipelineService.getJobsByStage(mockUserId);

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(result.data).toBeTruthy();
      expect(result.data?.Interested).toHaveLength(2);
      expect(result.data?.Applied).toHaveLength(1);
      expect(result.data?.Interview).toHaveLength(1);
      expect(result.data?.["Phone Screen"]).toHaveLength(0);
    });

    it("should initialize all stages even if empty", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
        status: null,
      });

      const result = await pipelineService.getJobsByStage(mockUserId);

      expect(result.data).toBeTruthy();
      expect(result.data?.Interested).toEqual([]);
      expect(result.data?.Applied).toEqual([]);
      expect(result.data?.["Phone Screen"]).toEqual([]);
      expect(result.data?.Interview).toEqual([]);
      expect(result.data?.Offer).toEqual([]);
      expect(result.data?.Rejected).toEqual([]);
    });

    it("should handle jobs with null or undefined status", async () => {
      const mockJobs: Partial<JobRow>[] = [
        { id: 1, job_title: "Job 1", job_status: null },
        { id: 2, job_title: "Job 2", job_status: undefined },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockJobs,
        error: null,
        status: null,
      });

      const result = await pipelineService.getJobsByStage(mockUserId);

      // Jobs with null/undefined status should default to "Interested"
      expect(result.data?.Interested).toHaveLength(2);
    });

    it("should sort by status_changed_at descending", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
        status: null,
      });

      await pipelineService.getJobsByStage(mockUserId);

      expect(mockUserCrud.listRows).toHaveBeenCalledWith(
        "jobs",
        "*",
        expect.objectContaining({
          order: { column: "status_changed_at", ascending: false },
        })
      );
    });
  });

  describe("bulkUpdateStatus", () => {
    it("should update multiple jobs to same status", async () => {
      const jobIds = [1, 2, 3];
      const newStage: PipelineStage = "Applied";

      mockUserCrud.updateRow.mockResolvedValue({
        data: { job_status: newStage },
        error: null,
        status: null,
      });

      const result = await pipelineService.bulkUpdateStatus(
        mockUserId,
        jobIds,
        newStage
      );

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(3);
      expect(mockUserCrud.updateRow).toHaveBeenCalledTimes(3);
    });

    it("should handle partial failures", async () => {
      const jobIds = [1, 2, 3];

      // First two succeed, third fails
      mockUserCrud.updateRow
        .mockResolvedValueOnce({
          data: { id: 1, job_status: "Applied" },
          error: null,
          status: null,
        })
        .mockResolvedValueOnce({
          data: { id: 2, job_status: "Applied" },
          error: null,
          status: null,
        })
        .mockResolvedValueOnce({
          data: null,
          error: { message: "Update failed", status: 500 },
          status: 500,
        });

      const result = await pipelineService.bulkUpdateStatus(
        mockUserId,
        jobIds,
        "Applied"
      );

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("Failed to update 1 jobs");
      expect(result.data).toBeNull();
    });

    it("should handle empty job list", async () => {
      const result = await pipelineService.bulkUpdateStatus(
        mockUserId,
        [],
        "Applied"
      );

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
      expect(mockUserCrud.updateRow).not.toHaveBeenCalled();
    });
  });

  describe("getStageCounts", () => {
    it("should count jobs in each stage", async () => {
      const mockJobs: Partial<JobRow>[] = [
        { id: 1, job_status: "Interested" },
        { id: 2, job_status: "Interested" },
        { id: 3, job_status: "Applied" },
        { id: 4, job_status: "Interview" },
        { id: 5, job_status: "Interview" },
        { id: 6, job_status: "Interview" },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockJobs,
        error: null,
        status: null,
      });

      const result = await pipelineService.getStageCounts(mockUserId);

      expect(result.data).toBeTruthy();
      expect(result.data?.Interested).toBe(2);
      expect(result.data?.Applied).toBe(1);
      expect(result.data?.Interview).toBe(3);
      expect(result.data?.["Phone Screen"]).toBe(0);
    });

    it("should return zero counts for empty pipeline", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
        status: null,
      });

      const result = await pipelineService.getStageCounts(mockUserId);

      expect(result.data).toBeTruthy();
      Object.values(result.data ?? {}).forEach((count) => {
        expect(count).toBe(0);
      });
    });
  });

  describe("calculateDaysInStage", () => {
    it("should calculate days between status change and now", () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const job: Partial<JobRow> = {
        id: 1,
        status_changed_at: threeDaysAgo.toISOString(),
      };

      const days = pipelineService.calculateDaysInStage(job as JobRow);

      expect(days).toBe(3);
    });

    it("should return 0 for jobs with no status_changed_at", () => {
      const job: Partial<JobRow> = {
        id: 1,
        status_changed_at: null,
      };

      const days = pipelineService.calculateDaysInStage(job as JobRow);

      expect(days).toBe(0);
    });

    it("should return 0 for future dates", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const job: Partial<JobRow> = {
        id: 1,
        status_changed_at: tomorrow.toISOString(),
      };

      const days = pipelineService.calculateDaysInStage(job as JobRow);

      expect(days).toBe(0);
    });

    it("should handle same-day changes", () => {
      const job: Partial<JobRow> = {
        id: 1,
        status_changed_at: new Date().toISOString(),
      };

      const days = pipelineService.calculateDaysInStage(job as JobRow);

      expect(days).toBe(0);
    });
  });

  describe("optimisticMove", () => {
    it("should update job status in array without mutation", () => {
      const jobs: Partial<JobRow>[] = [
        { id: 1, job_title: "Job 1", job_status: "Interested" },
        { id: 2, job_title: "Job 2", job_status: "Applied" },
        { id: 3, job_title: "Job 3", job_status: "Interview" },
      ];

      const updated = pipelineService.optimisticMove(
        jobs as JobRow[],
        2,
        "Offer"
      );

      // Original array unchanged
      expect(jobs[1].job_status).toBe("Applied");

      // New array has updated status
      expect(updated[1].job_status).toBe("Offer");
      expect(updated[1].status_changed_at).toBeTruthy();

      // Other jobs unchanged
      expect(updated[0].job_status).toBe("Interested");
      expect(updated[2].job_status).toBe("Interview");
    });

    it("should not mutate original array", () => {
      const jobs: Partial<JobRow>[] = [
        { id: 1, job_title: "Job 1", job_status: "Interested" },
      ];

      const original = JSON.parse(JSON.stringify(jobs));
      pipelineService.optimisticMove(jobs as JobRow[], 1, "Applied");

      expect(jobs).toEqual(original);
    });

    it("should handle non-existent job ID gracefully", () => {
      const jobs: Partial<JobRow>[] = [
        { id: 1, job_title: "Job 1", job_status: "Interested" },
      ];

      const updated = pipelineService.optimisticMove(
        jobs as JobRow[],
        999,
        "Applied"
      );

      // No changes for non-existent ID
      expect(updated).toEqual(jobs);
    });
  });
});
