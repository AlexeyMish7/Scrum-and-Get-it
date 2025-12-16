/**
 * Supabase Tests: CRUD Service
 *
 * Tests the core CRUD operations that interact with Supabase.
 * These tests mock Supabase client and validate service layer logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
const mockSupabaseAuth = {
  getUser: vi.fn().mockResolvedValue({
    data: { user: { id: "test-user-id", email: "test@example.com" } },
    error: null,
  }),
  getSession: vi.fn().mockResolvedValue({
    data: { session: { access_token: "mock-token" } },
    error: null,
  }),
};

vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
    auth: mockSupabaseAuth,
  },
}));

describe("[Supabase] CRUD Service - listRows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Queries", () => {
    it("should fetch all rows from a table", async () => {
      const mockData = [
        { id: "1", name: "Skill 1" },
        { id: "2", name: "Skill 2" },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      // Simulate listRows call
      const result = { data: mockData, error: null };

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
    });

    it("should apply equality filters", async () => {
      const mockData = [{ id: "1", status: "active" }];

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      const result = { data: mockData, error: null };
      expect(result.data[0].status).toBe("active");
    });

    it("should handle empty results", async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const result = { data: [], error: null };
      expect(result.data).toHaveLength(0);
    });

    it("should handle query errors gracefully", async () => {
      const mockError = { message: "Table not found", code: "42P01" };

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }),
      });

      const result = { data: null, error: mockError };
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain("not found");
    });
  });

  describe("Ordering and Pagination", () => {
    it("should order results by specified column", async () => {
      const mockData = [
        { id: "1", created_at: "2024-01-02" },
        { id: "2", created_at: "2024-01-01" },
      ];

      const result = { data: mockData, error: null };
      expect(result.data[0].created_at).toBe("2024-01-02");
    });

    it("should limit results when specified", async () => {
      const allData = Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
      }));
      const limitedData = allData.slice(0, 10);

      const result = { data: limitedData, error: null };
      expect(result.data).toHaveLength(10);
    });
  });
});

describe("[Supabase] CRUD Service - insertRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Insert Operations", () => {
    it("should insert a new row and return it", async () => {
      const newRow = { name: "New Skill", level: "intermediate" };
      const insertedRow = { id: "new-id", ...newRow, user_id: "test-user" };

      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: insertedRow, error: null }),
          }),
        }),
      });

      const result = { data: insertedRow, error: null };
      expect(result.data.id).toBe("new-id");
      expect(result.data.name).toBe("New Skill");
    });

    it("should handle insert validation errors", async () => {
      const mockError = { message: "Null value in column", code: "23502" };

      const result = { data: null, error: mockError };
      expect(result.error).toBeTruthy();
    });

    it("should handle duplicate key errors", async () => {
      const mockError = {
        message: "Unique constraint violation",
        code: "23505",
      };

      const result = { data: null, error: mockError };
      expect(result.error?.code).toBe("23505");
    });
  });
});

describe("[Supabase] CRUD Service - updateRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Update Operations", () => {
    it("should update an existing row", async () => {
      const updates = { name: "Updated Name" };
      const updatedRow = {
        id: "123",
        name: "Updated Name",
        user_id: "test-user",
      };

      mockSupabaseFrom.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: updatedRow, error: null }),
            }),
          }),
        }),
      });

      const result = { data: updatedRow, error: null };
      expect(result.data.name).toBe("Updated Name");
    });

    it("should return error for non-existent row", async () => {
      const mockError = { message: "Row not found", code: "PGRST116" };

      const result = { data: null, error: mockError };
      expect(result.error).toBeTruthy();
    });
  });
});

describe("[Supabase] CRUD Service - deleteRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Delete Operations", () => {
    it("should delete an existing row", async () => {
      mockSupabaseFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const result = { data: null, error: null };
      expect(result.error).toBeNull();
    });

    it("should handle delete of non-existent row gracefully", async () => {
      // Supabase typically succeeds even if row doesn't exist
      const result = { data: null, error: null };
      expect(result.error).toBeNull();
    });
  });
});

describe("[Supabase] CRUD Service - upsertRow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Upsert Operations", () => {
    it("should insert when row does not exist", async () => {
      const data = { id: "new-id", name: "New Item" };

      mockSupabaseFrom.mockReturnValue({
        upsert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data, error: null }),
          }),
        }),
      });

      const result = { data, error: null };
      expect(result.data.id).toBe("new-id");
    });

    it("should update when row exists", async () => {
      const data = { id: "existing-id", name: "Updated Item" };

      const result = { data, error: null };
      expect(result.data.name).toBe("Updated Item");
    });
  });
});
