/**
 * Unit Tests for skillsService
 *
 * Tests cover:
 * - Skills listing and mapping
 * - Skill creation
 * - Skill updates with meta merging
 * - Skill deletion
 * - Batch updates with position tracking
 * - Meta data handling (position extraction from various formats)
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import skillsService from "../skills";
import crud from "@shared/services/crud";

// Mock the crud service
vi.mock("@shared/services/crud", () => ({
  default: {
    withUser: vi.fn(),
  },
}));

describe("skillsService", () => {
  const mockUserId = "123e4567-e89b-12d3-a456-426614174000";
  let mockUserCrud: {
    listRows: ReturnType<typeof vi.fn>;
    insertRow: ReturnType<typeof vi.fn>;
    updateRow: ReturnType<typeof vi.fn>;
    deleteRow: ReturnType<typeof vi.fn>;
    getRow: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockUserCrud = {
      listRows: vi.fn(),
      insertRow: vi.fn(),
      updateRow: vi.fn(),
      deleteRow: vi.fn(),
      getRow: vi.fn(),
    };

    vi.mocked(crud.withUser).mockReturnValue(mockUserCrud as never);
  });

  describe("listSkills", () => {
    it("should list and map skills correctly", async () => {
      const mockDbRows = [
        {
          id: "skill-1",
          skill_name: "JavaScript",
          proficiency_level: "expert",
          skill_category: "Technical",
          meta: { position: 1 },
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "skill-2",
          skill_name: "Communication",
          proficiency_level: "intermediate",
          skill_category: "Soft Skills",
          meta: { pos: 2 },
          created_at: "2024-01-02",
          updated_at: "2024-01-02",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await skillsService.listSkills(mockUserId);

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.listRows).toHaveBeenCalledWith(
        "skills",
        expect.stringContaining("skill_name")
      );
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toMatchObject({
        id: "skill-1",
        name: "JavaScript",
        category: "Technical",
        level: "Expert",
        position: 1,
      });
      expect(result.data?.[1]).toMatchObject({
        id: "skill-2",
        name: "Communication",
        category: "Soft Skills",
        level: "Intermediate",
        position: 2,
      });
    });

    it("should capitalize proficiency level", async () => {
      const mockDbRows = [
        {
          id: "skill-1",
          skill_name: "Python",
          proficiency_level: "beginner",
          skill_category: "Technical",
          meta: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await skillsService.listSkills(mockUserId);

      expect(result.data?.[0].level).toBe("Beginner");
    });

    it("should handle position in meta as string", async () => {
      const mockDbRows = [
        {
          id: "skill-1",
          skill_name: "React",
          proficiency_level: "advanced",
          skill_category: "Technical",
          meta: { position: "5" },
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await skillsService.listSkills(mockUserId);

      expect(result.data?.[0].position).toBe(5);
    });

    it("should handle position under different meta keys", async () => {
      const mockDbRows = [
        {
          id: "skill-1",
          skill_name: "Skill A",
          proficiency_level: "intermediate",
          skill_category: "Technical",
          meta: { order: 10 },
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await skillsService.listSkills(mockUserId);

      expect(result.data?.[0].position).toBe(10);
    });

    it("should handle missing position in meta", async () => {
      const mockDbRows = [
        {
          id: "skill-1",
          skill_name: "Skill B",
          proficiency_level: "expert",
          skill_category: "Technical",
          meta: { someOtherField: "value" },
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await skillsService.listSkills(mockUserId);

      expect(result.data?.[0].position).toBeUndefined();
    });

    it("should handle null meta", async () => {
      const mockDbRows = [
        {
          id: "skill-1",
          skill_name: "Skill C",
          proficiency_level: "beginner",
          skill_category: "Technical",
          meta: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRows,
        error: null,
      });

      const result = await skillsService.listSkills(mockUserId);

      expect(result.data?.[0].meta).toBeNull();
      expect(result.data?.[0].position).toBeUndefined();
    });

    it("should handle single row response", async () => {
      const mockDbRow = {
        id: "skill-1",
        skill_name: "TypeScript",
        proficiency_level: "expert",
        skill_category: "Technical",
        meta: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockUserCrud.listRows.mockResolvedValue({
        data: mockDbRow,
        error: null,
      });

      const result = await skillsService.listSkills(mockUserId);

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0].name).toBe("TypeScript");
    });

    it("should handle database errors", async () => {
      const mockError = { message: "Database error", code: "DB_ERROR" };
      mockUserCrud.listRows.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await skillsService.listSkills(mockUserId);

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe("createSkill", () => {
    it("should create skill and return mapped result", async () => {
      const skillPayload = {
        skill_name: "Node.js",
        proficiency_level: "advanced",
        skill_category: "Backend",
        meta: { position: 3 },
      };

      const mockCreatedRow = {
        id: "new-skill-1",
        ...skillPayload,
        created_at: "2024-11-15",
        updated_at: "2024-11-15",
      };

      mockUserCrud.insertRow.mockResolvedValue({
        data: mockCreatedRow,
        error: null,
      });

      const result = await skillsService.createSkill(mockUserId, skillPayload);

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.insertRow).toHaveBeenCalledWith(
        "skills",
        skillPayload,
        "*"
      );
      expect(result.error).toBeNull();
      expect(result.data).toMatchObject({
        id: "new-skill-1",
        name: "Node.js",
        category: "Backend",
        level: "Advanced",
        position: 3,
      });
    });

    it("should handle array response from insert", async () => {
      const skillPayload = {
        skill_name: "GraphQL",
        proficiency_level: "intermediate",
        skill_category: "Technical",
        meta: null,
      };

      const mockCreatedRow = {
        id: "new-skill-2",
        ...skillPayload,
        created_at: "2024-11-15",
        updated_at: "2024-11-15",
      };

      mockUserCrud.insertRow.mockResolvedValue({
        data: [mockCreatedRow],
        error: null,
      });

      const result = await skillsService.createSkill(mockUserId, skillPayload);

      expect(result.data?.name).toBe("GraphQL");
    });

    it("should handle creation errors", async () => {
      const skillPayload = {
        skill_name: "Test Skill",
        proficiency_level: "beginner",
        skill_category: "Technical",
        meta: null,
      };

      const mockError = { message: "Insert failed", code: "INSERT_ERROR" };
      mockUserCrud.insertRow.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await skillsService.createSkill(mockUserId, skillPayload);

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });
  });

  describe("updateSkill", () => {
    it("should update skill with meta merging", async () => {
      const skillId = "skill-123";
      const updatePayload = {
        proficiency_level: "expert",
        meta: { position: 5 },
      };

      const existingRow = {
        data: {
          id: skillId,
          meta: { position: 3, someOtherField: "keep this" },
        },
        error: null,
      };

      const mockUpdatedRow = {
        id: skillId,
        skill_name: "JavaScript",
        proficiency_level: "expert",
        skill_category: "Technical",
        meta: { position: 5, someOtherField: "keep this" },
        created_at: "2024-01-01",
        updated_at: "2024-11-15",
      };

      mockUserCrud.getRow.mockResolvedValue(existingRow);
      mockUserCrud.updateRow.mockResolvedValue({
        data: mockUpdatedRow,
        error: null,
      });

      const result = await skillsService.updateSkill(
        mockUserId,
        skillId,
        updatePayload
      );

      expect(mockUserCrud.getRow).toHaveBeenCalledWith("skills", "meta", {
        eq: { id: skillId },
        single: true,
      });
      expect(mockUserCrud.updateRow).toHaveBeenCalledWith(
        "skills",
        expect.objectContaining({
          proficiency_level: "expert",
          meta: { position: 5, someOtherField: "keep this" },
        }),
        { eq: { id: skillId } },
        "*"
      );
      expect(result.error).toBeNull();
      expect(result.data?.level).toBe("Expert");
    });

    it("should handle update without meta field", async () => {
      const skillId = "skill-123";
      const updatePayload = {
        skill_category: "Frontend",
      };

      const mockUpdatedRow = {
        id: skillId,
        skill_name: "React",
        proficiency_level: "advanced",
        skill_category: "Frontend",
        meta: null,
        created_at: "2024-01-01",
        updated_at: "2024-11-15",
      };

      mockUserCrud.updateRow.mockResolvedValue({
        data: mockUpdatedRow,
        error: null,
      });

      const result = await skillsService.updateSkill(
        mockUserId,
        skillId,
        updatePayload
      );

      expect(mockUserCrud.getRow).not.toHaveBeenCalled();
      expect(result.data?.category).toBe("Frontend");
    });

    it("should handle meta merge errors gracefully", async () => {
      const skillId = "skill-123";
      const updatePayload = {
        meta: { position: 7 },
      };

      const mockError = { message: "Row not found", code: "NOT_FOUND" };
      mockUserCrud.getRow.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await skillsService.updateSkill(
        mockUserId,
        skillId,
        updatePayload
      );

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });

    it("should handle array response from update", async () => {
      const skillId = "skill-123";
      const updatePayload = {
        skill_name: "Updated Skill",
      };

      const mockUpdatedRow = {
        id: skillId,
        skill_name: "Updated Skill",
        proficiency_level: "intermediate",
        skill_category: "Technical",
        meta: null,
        created_at: "2024-01-01",
        updated_at: "2024-11-15",
      };

      mockUserCrud.updateRow.mockResolvedValue({
        data: [mockUpdatedRow],
        error: null,
      });

      const result = await skillsService.updateSkill(
        mockUserId,
        skillId,
        updatePayload
      );

      expect(result.data?.name).toBe("Updated Skill");
    });
  });

  describe("deleteSkill", () => {
    it("should delete skill", async () => {
      const skillId = "skill-to-delete";

      mockUserCrud.deleteRow.mockResolvedValue({
        error: null,
      });

      const result = await skillsService.deleteSkill(mockUserId, skillId);

      expect(crud.withUser).toHaveBeenCalledWith(mockUserId);
      expect(mockUserCrud.deleteRow).toHaveBeenCalledWith("skills", {
        eq: { id: skillId },
      });
      expect(result.error).toBeNull();
    });

    it("should handle deletion errors", async () => {
      const skillId = "skill-to-delete";
      const mockError = { message: "Delete failed", code: "DELETE_ERROR" };

      mockUserCrud.deleteRow.mockResolvedValue({
        error: mockError,
      });

      const result = await skillsService.deleteSkill(mockUserId, skillId);

      expect(result.error).toEqual(mockError);
    });
  });

  describe("batchUpdateSkills", () => {
    it("should batch update skills with meta merging", async () => {
      const updates = [
        { id: "skill-1", skill_category: "Frontend", meta: { position: 1 } },
        { id: "skill-2", skill_category: "Backend", meta: { position: 2 } },
      ];

      const existingRows = [
        { id: "skill-1", meta: { oldField: "keep1" } },
        { id: "skill-2", meta: { oldField: "keep2" } },
      ];

      const updatedRows = [
        {
          id: "skill-1",
          skill_name: "React",
          proficiency_level: "expert",
          skill_category: "Frontend",
          meta: { position: 1, oldField: "keep1" },
          created_at: "2024-01-01",
          updated_at: "2024-11-15",
        },
        {
          id: "skill-2",
          skill_name: "Node.js",
          proficiency_level: "advanced",
          skill_category: "Backend",
          meta: { position: 2, oldField: "keep2" },
          created_at: "2024-01-02",
          updated_at: "2024-11-15",
        },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: existingRows,
        error: null,
      });

      mockUserCrud.updateRow
        .mockResolvedValueOnce({ data: updatedRows[0], error: null })
        .mockResolvedValueOnce({ data: updatedRows[1], error: null });

      const result = await skillsService.batchUpdateSkills(mockUserId, updates);

      expect(mockUserCrud.listRows).toHaveBeenCalledWith("skills", "id,meta", {
        in: { id: ["skill-1", "skill-2"] },
      });
      expect(mockUserCrud.updateRow).toHaveBeenCalledTimes(2);
      expect(result.error).toBeNull();
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0]).toMatchObject({
        id: "skill-1",
        category: "Frontend",
        position: 1,
      });
      expect(result.data?.[1]).toMatchObject({
        id: "skill-2",
        category: "Backend",
        position: 2,
      });
    });

    it("should handle error fetching existing rows", async () => {
      const updates = [{ id: "skill-1", meta: { position: 1 } }];
      const mockError = { message: "Fetch failed", code: "FETCH_ERROR" };

      mockUserCrud.listRows.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await skillsService.batchUpdateSkills(mockUserId, updates);

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });

    it("should handle error during batch update", async () => {
      const updates = [
        { id: "skill-1", meta: { position: 1 } },
        { id: "skill-2", meta: { position: 2 } },
      ];

      const existingRows = [
        { id: "skill-1", meta: {} },
        { id: "skill-2", meta: {} },
      ];

      mockUserCrud.listRows.mockResolvedValue({
        data: existingRows,
        error: null,
      });

      const mockError = { message: "Update failed", code: "UPDATE_ERROR" };
      mockUserCrud.updateRow.mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await skillsService.batchUpdateSkills(mockUserId, updates);

      expect(result.error).toEqual(mockError);
      expect(result.data).toBeNull();
    });

    it("should handle empty updates array", async () => {
      const updates: Array<{ id: string; meta?: Record<string, unknown> }> = [];

      mockUserCrud.listRows.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await skillsService.batchUpdateSkills(mockUserId, updates);

      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    });
  });
});
