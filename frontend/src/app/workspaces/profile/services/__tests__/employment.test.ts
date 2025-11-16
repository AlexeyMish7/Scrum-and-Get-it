/**
 * Unit Tests for employmentService
 *
 * Tests cover:
 * - Employment listing with proper ordering
 * - Employment creation
 * - Employment updates
 * - Employment deletion
 * - User scoping via withUser
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import employmentService from "../employment";
import * as crud from "@shared/services/crud";

// Mock the crud service
vi.mock("@shared/services/crud", () => ({
  withUser: vi.fn(),
}));

describe("employmentService", () => {
  const mockUserId = "123e4567-e89b-12d3-a456-426614174000";
  let mockUserCrud: {
    listRows: ReturnType<typeof vi.fn>;
    insertRow: ReturnType<typeof vi.fn>;
    updateRow: ReturnType<typeof vi.fn>;
    deleteRow: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserCrud = {
      listRows: vi.fn(),
      insertRow: vi.fn(),
      updateRow: vi.fn(),
      deleteRow: vi.fn(),
    };

    vi.mocked(crud.withUser).mockReturnValue(mockUserCrud as never);
  });

  describe("listEmployment", () => {
    it("should list employment entries ordered by start_date descending", async () => {
      const mockEmploymentRows = [
        {
          id: "emp-1",
          user_id: mockUserId,
          job_title: "Senior Engineer",
          company_name: "Tech Corp",
          location: "San Francisco, CA",
          start_date: "2020-01-01",
          end_date: null,
          job_description: "Building amazing things",
          current_position: true,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "emp-2",
          user_id: mockUserId,
          job_title: "Junior Developer",
          company_name: "Startup Inc",
          location: "Austin, TX",
          start_date: "2018-06-01",
          end_date: "2019-12-31",
          job_description: "Learning and growing",
          current_position: false,
          created_at: "2024-01-02",
          updated_at: "2024-01-02",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockEmploymentRows,
        error: null,
      });

      const result = await employmentService.listEmployment(mockUserId);

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.listRows).toHaveBeenCalledWith("employment", "*", {
        order: { column: "start_date", ascending: false },
      });
      expect(result.data).toEqual(mockEmploymentRows);
      expect(result.error).toBeNull();
    });

    it("should handle empty employment list", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await employmentService.listEmployment(mockUserId);

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("should handle database errors", async () => {
      const mockError = { message: "Database error", code: "DB_ERROR" };
      mockUserCrud.listRows.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await employmentService.listEmployment(mockUserId);

      expect(result.error).toEqual(mockError);
    });
  });

  describe("insertEmployment", () => {
    it("should insert employment with correct payload", async () => {
      const employmentPayload = {
        job_title: "Product Manager",
        company_name: "Big Company",
        location: "New York, NY",
        start_date: "2023-03-01",
        end_date: null,
        job_description: "Managing products",
        current_position: true,
      };

      const mockInsertedRow = {
        id: "new-emp-1",
        user_id: mockUserId,
        ...employmentPayload,
        created_at: "2024-11-15",
        updated_at: "2024-11-15",
      };

      mockUserCrud.insertRow.mockResolvedValue({
        data: mockInsertedRow,
        error: null,
      });

      const result = await employmentService.insertEmployment(
        mockUserId,
        employmentPayload
      );

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.insertRow).toHaveBeenCalledWith(
        "employment",
        employmentPayload,
        "*"
      );
      expect(result.data).toEqual(mockInsertedRow);
      expect(result.error).toBeNull();
    });

    it("should handle partial payload", async () => {
      const partialPayload = {
        job_title: "Consultant",
        company_name: "Consulting Firm",
        start_date: "2022-01-01",
      };

      const mockInsertedRow = {
        id: "new-emp-2",
        user_id: mockUserId,
        ...partialPayload,
        location: null,
        end_date: null,
        job_description: null,
        current_position: false,
        created_at: "2024-11-15",
        updated_at: "2024-11-15",
      };

      mockUserCrud.insertRow.mockResolvedValue({
        data: mockInsertedRow,
        error: null,
      });

      const result = await employmentService.insertEmployment(
        mockUserId,
        partialPayload
      );

      expect(result.data).toEqual(mockInsertedRow);
      expect(result.error).toBeNull();
    });

    it("should handle insertion errors", async () => {
      const employmentPayload = {
        job_title: "Test Position",
        company_name: "Test Company",
        start_date: "2023-01-01",
      };

      const mockError = { message: "Insert failed", code: "INSERT_ERROR" };
      mockUserCrud.insertRow.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await employmentService.insertEmployment(
        mockUserId,
        employmentPayload
      );

      expect(result.error).toEqual(mockError);
    });
  });

  describe("updateEmployment", () => {
    it("should update employment entry correctly", async () => {
      const employmentId = "emp-123";
      const updatePayload = {
        job_title: "Lead Engineer",
        end_date: "2024-11-15",
        current_position: false,
      };

      const mockUpdatedRow = {
        id: employmentId,
        user_id: mockUserId,
        job_title: "Lead Engineer",
        company_name: "Tech Corp",
        location: "San Francisco, CA",
        start_date: "2020-01-01",
        end_date: "2024-11-15",
        job_description: "Building amazing things",
        current_position: false,
        created_at: "2024-01-01",
        updated_at: "2024-11-15",
      };

      mockUserCrud.updateRow.mockResolvedValue({
        data: mockUpdatedRow,
        error: null,
      });

      const result = await employmentService.updateEmployment(
        mockUserId,
        employmentId,
        updatePayload
      );

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.updateRow).toHaveBeenCalledWith(
        "employment",
        updatePayload,
        { eq: { id: employmentId } }
      );
      expect(result.data).toEqual(mockUpdatedRow);
      expect(result.error).toBeNull();
    });

    it("should handle update errors", async () => {
      const employmentId = "emp-123";
      const updatePayload = { job_title: "Updated Title" };
      const mockError = { message: "Update failed", code: "UPDATE_ERROR" };

      mockUserCrud.updateRow.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await employmentService.updateEmployment(
        mockUserId,
        employmentId,
        updatePayload
      );

      expect(result.error).toEqual(mockError);
    });
  });

  describe("deleteEmployment", () => {
    it("should delete employment entry", async () => {
      const employmentId = "emp-to-delete";

      mockUserCrud.deleteRow.mockResolvedValue({
        error: null,
      });

      const result = await employmentService.deleteEmployment(
        mockUserId,
        employmentId
      );

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.deleteRow).toHaveBeenCalledWith("employment", {
        eq: { id: employmentId },
      });
      expect(result.error).toBeNull();
    });

    it("should handle deletion errors", async () => {
      const employmentId = "emp-to-delete";
      const mockError = { message: "Delete failed", code: "DELETE_ERROR" };

      mockUserCrud.deleteRow.mockResolvedValue({
        error: mockError,
      });

      const result = await employmentService.deleteEmployment(
        mockUserId,
        employmentId
      );

      expect(result.error).toEqual(mockError);
    });
  });
});
