/**
 * Unit Tests for educationService
 *
 * Tests cover:
 * - Education entry listing with proper ordering
 * - Education creation with date formatting
 * - Education updates with GPA privacy handling
 * - Education deletion
 * - Row-to-Entry mapping with all edge cases
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import educationService from "../education";
import crud from "@shared/services/crud";

// Mock the crud service
vi.mock("@shared/services/crud", () => ({
  default: {
    withUser: vi.fn(),
  },
}));

// Mock date utilities
vi.mock("@shared/utils/date", () => ({
  dbDateToYYYYMM: vi.fn((date) => {
    if (!date) return null;
    if (typeof date === "string") {
      const parts = date.split("-");
      return `${parts[0]}-${parts[1]}`;
    }
    return null;
  }),
  formatToSqlDate: vi.fn((date) => {
    if (!date) return null;
    return date;
  }),
}));

describe("educationService", () => {
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

  describe("listEducation", () => {
    it("should list education entries with proper ordering", async () => {
      const mockDbRows = [
        {
          id: "edu-1",
          degree_type: "Bachelor's",
          institution_name: "MIT",
          field_of_study: "Computer Science",
          graduation_date: "2020-05-15",
          start_date: "2016-09-01",
          gpa: 3.8,
          honors: "Cum Laude",
          enrollment_status: "not_enrolled",
          meta: { privateGpa: false },
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "edu-2",
          degree_type: "Master's",
          institution_name: "Stanford",
          field_of_study: "AI",
          graduation_date: "2023-06-15",
          start_date: "2021-09-01",
          gpa: 3.9,
          honors: null,
          enrollment_status: "enrolled",
          meta: { privateGpa: true },
          created_at: "2024-01-02",
          updated_at: "2024-01-02",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await educationService.listEducation(mockUserId);

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.listRows).toHaveBeenCalledWith(
        "education",
        expect.any(String),
        { order: { column: "graduation_date", ascending: false } }
      );
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toMatchObject({
        id: "edu-1",
        degree: "Bachelor's",
        institution: "MIT",
        fieldOfStudy: "Computer Science",
        gpa: 3.8,
        gpaPrivate: false,
        honors: "Cum Laude",
        active: false,
      });
      expect(result.data?.[1]).toMatchObject({
        id: "edu-2",
        degree: "Master's",
        institution: "Stanford",
        fieldOfStudy: "AI",
        gpa: 3.9,
        gpaPrivate: true,
        active: true,
      });
    });

    it("should handle empty result array", async () => {
      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await educationService.listEducation(mockUserId);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });

    it("should handle single row result", async () => {
      const mockDbRow = {
        id: "edu-1",
        degree_type: "PhD",
        institution_name: "Harvard",
        field_of_study: "Physics",
        graduation_date: "2025-05-15",
        start_date: "2022-09-01",
        gpa: null,
        honors: null,
        enrollment_status: "enrolled",
        meta: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRow,
        error: null,
      });

      const result = await educationService.listEducation(mockUserId);

      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].degree).toBe("PhD");
    });

    it("should handle database errors", async () => {
      const mockError = { message: "Database error", code: "DB_ERROR" };
      mockUserCrud.listRows.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await educationService.listEducation(mockUserId);

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe("createEducation", () => {
    it("should create education entry with correct payload", async () => {
      const formData = {
        institution: "Yale University",
        degree: "Bachelor of Arts",
        fieldOfStudy: "History",
        startDate: "2020-09",
        endDate: "2024-05",
        gpa: 3.5,
        gpaPrivate: true,
        honors: "Dean's List",
        active: false,
      };

      const mockCreatedRow = {
        id: "new-edu-1",
        degree_type: "Bachelor of Arts",
        institution_name: "Yale University",
        field_of_study: "History",
        graduation_date: "2024-05",
        start_date: "2020-09",
        gpa: 3.5,
        honors: "Dean's List",
        enrollment_status: "not_enrolled",
        meta: { privateGpa: true },
        created_at: "2024-11-15",
        updated_at: "2024-11-15",
      };

      mockUserCrud.insertRow.mockResolvedValue({
        data: mockCreatedRow,
        error: null,
      });

      const result = await educationService.createEducation(
        mockUserId,
        formData
      );

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.insertRow).toHaveBeenCalledWith(
        "education",
        {
          institution_name: "Yale University",
          degree_type: "Bachelor of Arts",
          field_of_study: "History",
          graduation_date: "2024-05",
          start_date: "2020-09",
          gpa: 3.5,
          enrollment_status: "not_enrolled",
          honors: "Dean's List",
          meta: { privateGpa: true },
        },
        "*"
      );
      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        id: "new-edu-1",
        degree: "Bachelor of Arts",
        institution: "Yale University",
        fieldOfStudy: "History",
        gpa: 3.5,
        gpaPrivate: true,
        honors: "Dean's List",
        active: false,
      });
    });

    it("should handle active enrollment", async () => {
      const formData = {
        institution: "Berkeley",
        degree: "Master's",
        fieldOfStudy: "Data Science",
        startDate: "2023-09",
        endDate: undefined,
        gpa: undefined,
        gpaPrivate: false,
        honors: undefined,
        active: true,
      };

      const mockCreatedRow = {
        id: "new-edu-2",
        degree_type: "Master's",
        institution_name: "Berkeley",
        field_of_study: "Data Science",
        graduation_date: null,
        start_date: "2023-09",
        gpa: null,
        honors: null,
        enrollment_status: "enrolled",
        meta: { privateGpa: false },
        created_at: "2024-11-15",
        updated_at: "2024-11-15",
      };

      mockUserCrud.insertRow.mockResolvedValue({
        data: mockCreatedRow,
        error: null,
      });

      const result = await educationService.createEducation(
        mockUserId,
        formData
      );

      expect(mockUserCrud.insertRow).toHaveBeenCalledWith(
        "education",
        expect.objectContaining({
          enrollment_status: "enrolled",
        }),
        "*"
      );
      expect(result.data?.active).toBe(true);
    });

    it("should handle creation errors", async () => {
      const formData = {
        institution: "Test University",
        degree: "Test Degree",
        fieldOfStudy: "Test Field",
        startDate: "2020-09",
        endDate: "2024-05",
        gpa: undefined,
        gpaPrivate: false,
        honors: undefined,
        active: false,
      };

      const mockError = { message: "Insert failed", code: "INSERT_ERROR" };
      mockUserCrud.insertRow.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await educationService.createEducation(
        mockUserId,
        formData
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe("updateEducation", () => {
    it("should update education entry correctly", async () => {
      const educationId = "edu-123";
      const formData = {
        institution: "Updated University",
        degree: "Updated Degree",
        fieldOfStudy: "Updated Field",
        startDate: "2021-09",
        endDate: "2025-05",
        gpa: 3.7,
        gpaPrivate: false,
        honors: "Updated Honors",
        active: false,
      };

      const mockUpdatedRow = {
        id: educationId,
        degree_type: "Updated Degree",
        institution_name: "Updated University",
        field_of_study: "Updated Field",
        graduation_date: "2025-05",
        start_date: "2021-09",
        gpa: 3.7,
        honors: "Updated Honors",
        enrollment_status: "not_enrolled",
        meta: { privateGpa: false },
        created_at: "2024-01-01",
        updated_at: "2024-11-15",
      };

      mockUserCrud.updateRow.mockResolvedValue({
        data: mockUpdatedRow,
        error: null,
      });

      const result = await educationService.updateEducation(
        mockUserId,
        educationId,
        formData
      );

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.updateRow).toHaveBeenCalledWith(
        "education",
        expect.objectContaining({
          institution_name: "Updated University",
          degree_type: "Updated Degree",
          field_of_study: "Updated Field",
        }),
        { eq: { id: educationId } },
        "*"
      );
      expect(result.error).toBeNull();
      expect(result.data?.institution).toBe("Updated University");
    });

    it("should handle update errors", async () => {
      const educationId = "edu-123";
      const formData = {
        institution: "Test",
        degree: "Test",
        fieldOfStudy: "Test",
        startDate: "2020-09",
        endDate: "2024-05",
        gpa: undefined,
        gpaPrivate: false,
        honors: undefined,
        active: false,
      };

      const mockError = { message: "Update failed", code: "UPDATE_ERROR" };
      mockUserCrud.updateRow.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await educationService.updateEducation(
        mockUserId,
        educationId,
        formData
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe("deleteEducation", () => {
    it("should delete education entry", async () => {
      const educationId = "edu-to-delete";

      mockUserCrud.deleteRow.mockResolvedValue({
        error: null,
      });

      const result = await educationService.deleteEducation(
        mockUserId,
        educationId
      );

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.deleteRow).toHaveBeenCalledWith("education", {
        eq: { id: educationId },
      });
      expect(result.error).toBeNull();
    });

    it("should handle deletion errors", async () => {
      const educationId = "edu-to-delete";
      const mockError = { message: "Delete failed", code: "DELETE_ERROR" };

      mockUserCrud.deleteRow.mockResolvedValue({
        error: mockError,
      });

      const result = await educationService.deleteEducation(
        mockUserId,
        educationId
      );

      expect(result.error).toEqual(mockError);
    });
  });
});
