/**
 * Unit Tests for profileService
 *
 * Tests cover:
 * - Profile data mapping (DB row → domain model)
 * - Profile fetching with proper user scoping
 * - Profile upsert with data normalization
 * - Error handling scenarios
 * - Edge cases (null values, empty strings, name splitting)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import profileService from "../profileService";
import crud from "@shared/services/crud";

// Mock the crud service
vi.mock("@shared/services/crud", () => ({
  default: {
    getUserProfile: vi.fn(),
    upsertRow: vi.fn(),
  },
}));

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("mapRowToProfile", () => {
    it("should map a complete DB row to ProfileData", () => {
      const dbRow = {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "555-1234",
        city: "New York",
        state: "NY",
        professional_title: "Senior Developer",
        summary: "Experienced developer with 10 years",
        industry: "Technology",
        experience_level: "senior",
      };

      const result = profileService.mapRowToProfile(dbRow);

      expect(result).toEqual({
        fullName: "John Doe",
        email: "john.doe@example.com",
        phone: "555-1234",
        city: "New York",
        state: "NY",
        headline: "Senior Developer",
        bio: "Experienced developer with 10 years",
        industry: "Technology",
        experience: "Senior",
      });
    });

    it("should handle null values gracefully", () => {
      const dbRow = {
        first_name: "Jane",
        last_name: null,
        email: "jane@example.com",
        phone: null,
        city: null,
        state: null,
        professional_title: null,
        summary: null,
        industry: null,
        experience_level: null,
      };

      const result = profileService.mapRowToProfile(dbRow);

      expect(result).toEqual({
        fullName: "Jane",
        email: "jane@example.com",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      });
    });

    it("should handle null row input", () => {
      const result = profileService.mapRowToProfile(null);

      expect(result).toEqual({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      });
    });

    it("should handle empty object", () => {
      const result = profileService.mapRowToProfile({});

      expect(result).toEqual({
        fullName: "",
        email: "",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      });
    });

    it("should capitalize experience level", () => {
      const dbRow = {
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
        experience_level: "intermediate",
      };

      const result = profileService.mapRowToProfile(dbRow);

      expect(result.experience).toBe("Intermediate");
    });

    it("should handle single name (no last name)", () => {
      const dbRow = {
        first_name: "Madonna",
        last_name: "",
        email: "madonna@example.com",
      };

      const result = profileService.mapRowToProfile(dbRow);

      expect(result.fullName).toBe("Madonna");
    });
  });

  describe("getProfile", () => {
    it("should call crud.getUserProfile with correct userId", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const mockProfile = {
        id: userId,
        first_name: "John",
        last_name: "Doe",
        email: "john@example.com",
      };

      vi.mocked(crud.getUserProfile).mockResolvedValue(mockProfile as never);

      const result = await profileService.getProfile(userId);

      expect(crud.getUserProfile).toHaveBeenCalledWith(userId);
      expect(crud.getUserProfile).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockProfile);
    });

    it("should handle errors from crud service", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const error = new Error("Database connection failed");

      vi.mocked(crud.getUserProfile).mockRejectedValue(error);

      await expect(profileService.getProfile(userId)).rejects.toThrow(
        "Database connection failed"
      );
    });
  });

  describe("upsertProfile", () => {
    it("should upsert profile with correct data transformation", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const profileData = {
        fullName: "Jane Smith",
        email: "JANE.SMITH@EXAMPLE.COM",
        phone: "555-5678",
        city: "San Francisco",
        state: "CA",
        headline: "Product Manager",
        bio: "Passionate about user experience",
        industry: "Technology",
        experience: "Senior",
      };

      const expectedPayload = {
        id: userId,
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@example.com", // Should be lowercase
        phone: "555-5678",
        city: "San Francisco",
        state: "CA",
        professional_title: "Product Manager",
        summary: "Passionate about user experience",
        industry: "Technology",
        experience_level: "senior", // Should be lowercase
      };

      vi.mocked(crud.upsertRow).mockResolvedValue({
        data: { id: userId },
        error: null,
      });

      await profileService.upsertProfile(userId, profileData);

      expect(crud.upsertRow).toHaveBeenCalledWith(
        "profiles",
        expectedPayload,
        "id"
      );
      expect(crud.upsertRow).toHaveBeenCalledTimes(1);
    });

    it("should handle multi-word last names correctly", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const profileData = {
        fullName: "Mary Anne Van Der Berg",
        email: "mary@example.com",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      };

      vi.mocked(crud.upsertRow).mockResolvedValue({
        data: { id: userId },
        error: null,
      });

      await profileService.upsertProfile(userId, profileData);

      const callArgs = vi.mocked(crud.upsertRow).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(callArgs.first_name).toBe("Mary");
      expect(callArgs.last_name).toBe("Anne Van Der Berg");
    });

    it("should handle single name (no spaces)", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const profileData = {
        fullName: "Prince",
        email: "prince@example.com",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      };

      vi.mocked(crud.upsertRow).mockResolvedValue({
        data: { id: userId },
        error: null,
      });

      await profileService.upsertProfile(userId, profileData);

      const callArgs = vi.mocked(crud.upsertRow).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(callArgs.first_name).toBe("Prince");
      expect(callArgs.last_name).toBe("");
    });

    it("should handle empty fullName gracefully", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const profileData = {
        fullName: "",
        email: "test@example.com",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      };

      vi.mocked(crud.upsertRow).mockResolvedValue({
        data: { id: userId },
        error: null,
      });

      await profileService.upsertProfile(userId, profileData);

      const callArgs = vi.mocked(crud.upsertRow).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(callArgs.first_name).toBe("");
      expect(callArgs.last_name).toBe("");
    });

    it("should trim and normalize email to lowercase", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const profileData = {
        fullName: "Test User",
        email: "  TEST.USER@EXAMPLE.COM  ",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      };

      vi.mocked(crud.upsertRow).mockResolvedValue({
        data: { id: userId },
        error: null,
      });

      await profileService.upsertProfile(userId, profileData);

      const callArgs = vi.mocked(crud.upsertRow).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(callArgs.email).toBe("test.user@example.com");
    });

    it("should handle null values in ProfileData", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const profileData = {
        fullName: "Test User",
        email: undefined as unknown as string,
        phone: null as unknown as string,
        city: null as unknown as string,
        state: null as unknown as string,
        headline: null as unknown as string,
        bio: null as unknown as string,
        industry: null as unknown as string,
        experience: null as unknown as string,
      };

      vi.mocked(crud.upsertRow).mockResolvedValue({
        data: { id: userId },
        error: null,
      });

      await profileService.upsertProfile(userId, profileData);

      const callArgs = vi.mocked(crud.upsertRow).mock.calls[0][1] as Record<
        string,
        unknown
      >;
      expect(callArgs.email).toBe(null);
      expect(callArgs.phone).toBe(null);
      expect(callArgs.city).toBe(null);
      expect(callArgs.state).toBe(null);
      expect(callArgs.professional_title).toBe(null);
      expect(callArgs.summary).toBe(null);
      expect(callArgs.industry).toBe(null);
      expect(callArgs.experience_level).toBe(null);
    });

    it("should handle errors from crud service", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const profileData = {
        fullName: "Test User",
        email: "test@example.com",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      };
      const error = new Error("Upsert failed");

      vi.mocked(crud.upsertRow).mockRejectedValue(error);

      await expect(
        profileService.upsertProfile(userId, profileData)
      ).rejects.toThrow("Upsert failed");
    });

    it("should return crud response on success", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const profileData = {
        fullName: "Test User",
        email: "test@example.com",
        phone: "",
        city: "",
        state: "",
        headline: "",
        bio: "",
        industry: "",
        experience: "",
      };
      const mockResponse = {
        data: { id: userId, email: "test@example.com" },
        error: null,
      };

      vi.mocked(crud.upsertRow).mockResolvedValue(mockResponse);

      const result = await profileService.upsertProfile(userId, profileData);

      expect(result).toEqual(mockResponse);
    });
  });
});
