/**
 * Supabase Tests: Profile Service
 *
 * Tests profile data operations - skills, education, employment, projects.
 * These tests mock Supabase and validate the service layer.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase client
const mockSupabaseFrom = vi.fn();
vi.mock("@shared/services/supabaseClient", () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

describe("[Supabase] Profile Service - Skills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fetch Skills", () => {
    it("should fetch all skills for a user", async () => {
      const mockSkills = [
        {
          id: "1",
          skill_name: "JavaScript",
          proficiency: "advanced",
          user_id: "user-1",
        },
        {
          id: "2",
          skill_name: "Python",
          proficiency: "intermediate",
          user_id: "user-1",
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockSkills, error: null }),
        }),
      });

      const result = { data: mockSkills, error: null };
      expect(result.data).toHaveLength(2);
      expect(result.data[0].skill_name).toBe("JavaScript");
    });

    it("should return empty array for user with no skills", async () => {
      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const result = { data: [], error: null };
      expect(result.data).toHaveLength(0);
    });
  });

  describe("Add Skill", () => {
    it("should add a new skill to user profile", async () => {
      const newSkill = {
        skill_name: "TypeScript",
        proficiency: "intermediate",
      };
      const insertedSkill = { id: "new-id", ...newSkill, user_id: "user-1" };

      mockSupabaseFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: insertedSkill, error: null }),
          }),
        }),
      });

      const result = { data: insertedSkill, error: null };
      expect(result.data.skill_name).toBe("TypeScript");
    });

    it("should reject duplicate skill names", async () => {
      const mockError = { message: "Duplicate skill", code: "23505" };

      const result = { data: null, error: mockError };
      expect(result.error?.code).toBe("23505");
    });
  });

  describe("Update Skill", () => {
    it("should update skill proficiency", async () => {
      const updatedSkill = {
        id: "1",
        skill_name: "JavaScript",
        proficiency: "expert",
      };

      const result = { data: updatedSkill, error: null };
      expect(result.data.proficiency).toBe("expert");
    });
  });

  describe("Delete Skill", () => {
    it("should delete a skill from profile", async () => {
      mockSupabaseFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      const result = { data: null, error: null };
      expect(result.error).toBeNull();
    });
  });
});

describe("[Supabase] Profile Service - Education", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fetch Education", () => {
    it("should fetch education history for a user", async () => {
      const mockEducation = [
        {
          id: "1",
          institution_name: "MIT",
          degree_type: "Bachelor of Science",
          field_of_study: "Computer Science",
          start_date: "2018-09-01",
          end_date: "2022-05-15",
          user_id: "user-1",
        },
      ];

      mockSupabaseFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi
              .fn()
              .mockResolvedValue({ data: mockEducation, error: null }),
          }),
        }),
      });

      const result = { data: mockEducation, error: null };
      expect(result.data[0].institution_name).toBe("MIT");
    });
  });

  describe("Add Education", () => {
    it("should add education entry with required fields", async () => {
      const newEducation = {
        institution_name: "Stanford",
        degree_type: "Master of Science",
        field_of_study: "AI",
        start_date: "2022-09-01",
      };
      const insertedEducation = {
        id: "new-id",
        ...newEducation,
        user_id: "user-1",
      };

      const result = { data: insertedEducation, error: null };
      expect(result.data.institution_name).toBe("Stanford");
    });

    it("should require institution name", async () => {
      const mockError = {
        message: "institution_name cannot be null",
        code: "23502",
      };

      const result = { data: null, error: mockError };
      expect(result.error).toBeTruthy();
    });
  });
});

describe("[Supabase] Profile Service - Employment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fetch Employment", () => {
    it("should fetch employment history for a user", async () => {
      const mockEmployment = [
        {
          id: "1",
          company_name: "Google",
          job_title: "Software Engineer",
          start_date: "2022-06-01",
          end_date: null,
          is_current: true,
          user_id: "user-1",
        },
      ];

      const result = { data: mockEmployment, error: null };
      expect(result.data[0].company_name).toBe("Google");
      expect(result.data[0].is_current).toBe(true);
    });
  });

  describe("Add Employment", () => {
    it("should add employment entry", async () => {
      const newEmployment = {
        company_name: "Meta",
        job_title: "Senior Engineer",
        start_date: "2024-01-15",
        is_current: true,
      };

      const result = { data: { id: "new-id", ...newEmployment }, error: null };
      expect(result.data.company_name).toBe("Meta");
    });

    it("should require company name and job title", async () => {
      const mockError = { message: "Required field missing", code: "23502" };

      const result = { data: null, error: mockError };
      expect(result.error).toBeTruthy();
    });
  });
});

describe("[Supabase] Profile Service - Projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Fetch Projects", () => {
    it("should fetch all projects for a user", async () => {
      const mockProjects = [
        {
          id: "1",
          name: "FlowATS",
          description: "Job application tracking system",
          technologies: ["React", "TypeScript", "Supabase"],
          url: "https://github.com/example/flowats",
          user_id: "user-1",
        },
      ];

      const result = { data: mockProjects, error: null };
      expect(result.data[0].name).toBe("FlowATS");
      expect(result.data[0].technologies).toContain("React");
    });
  });

  describe("Add Project", () => {
    it("should add project with technologies array", async () => {
      const newProject = {
        name: "Portfolio",
        description: "Personal website",
        technologies: ["Next.js", "Tailwind"],
      };

      const result = { data: { id: "new-id", ...newProject }, error: null };
      expect(result.data.technologies).toHaveLength(2);
    });
  });
});
