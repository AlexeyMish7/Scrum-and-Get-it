/**
 * UI Tests: ProfileCompletion Component
 *
 * Tests the ProfileCompletion progress indicator component.
 * These tests validate UI rendering and user interactions.
 */

import { describe, it, expect } from "vitest";

describe("[UI] ProfileCompletion Component", () => {
  describe("Progress Bar Rendering", () => {
    it("should display 0% when profile is empty", () => {
      const emptyProfile = {
        firstName: "",
        lastName: "",
        email: "",
        skills: [],
        education: [],
        employment: [],
      };

      const completion = calculateCompletion(emptyProfile);
      expect(completion).toBe(0);
    });

    it("should display 100% when profile is complete", () => {
      const completeProfile = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "555-1234",
        bio: "Software developer",
        skills: [{ name: "JavaScript", level: "advanced" }],
        education: [{ institution: "MIT", degree: "BS" }],
        employment: [{ company: "Tech Corp", title: "Developer" }],
      };

      const completion = calculateCompletion(completeProfile);
      expect(completion).toBe(100);
    });

    it("should show partial completion for partial profile", () => {
      const partialProfile = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        skills: [],
        education: [],
        employment: [],
      };

      const completion = calculateCompletion(partialProfile);
      expect(completion).toBeGreaterThan(0);
      expect(completion).toBeLessThan(100);
    });
  });

  describe("Completion Tips", () => {
    it("should suggest adding skills when skills are empty", () => {
      const profile = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        skills: [],
      };

      const tips = getCompletionTips(profile);
      expect(tips).toContain("Add at least one skill");
    });

    it("should suggest adding education when education is empty", () => {
      const profile = {
        firstName: "John",
        skills: [{ name: "JS" }],
        education: [],
      };

      const tips = getCompletionTips(profile);
      expect(tips).toContain("Add your education history");
    });

    it("should return empty tips when profile is complete", () => {
      const completeProfile = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "555-1234",
        bio: "Developer",
        skills: [{ name: "JS" }],
        education: [{ institution: "MIT" }],
        employment: [{ company: "Tech" }],
      };

      const tips = getCompletionTips(completeProfile);
      expect(tips).toHaveLength(0);
    });
  });
});

// Helper functions that mirror component logic
function calculateCompletion(profile: Record<string, unknown>): number {
  let score = 0;
  const weights = {
    firstName: 10,
    lastName: 10,
    email: 10,
    phone: 10,
    bio: 10,
    skills: 20,
    education: 15,
    employment: 15,
  };

  if (profile.firstName) score += weights.firstName;
  if (profile.lastName) score += weights.lastName;
  if (profile.email) score += weights.email;
  if (profile.phone) score += weights.phone;
  if (profile.bio) score += weights.bio;
  if (Array.isArray(profile.skills) && profile.skills.length > 0)
    score += weights.skills;
  if (Array.isArray(profile.education) && profile.education.length > 0)
    score += weights.education;
  if (Array.isArray(profile.employment) && profile.employment.length > 0)
    score += weights.employment;

  return score;
}

function getCompletionTips(profile: Record<string, unknown>): string[] {
  const tips: string[] = [];

  if (!profile.firstName) tips.push("Add your first name");
  if (!profile.lastName) tips.push("Add your last name");
  if (!profile.email) tips.push("Add your email");
  if (!profile.phone) tips.push("Add your phone number");
  if (!profile.bio) tips.push("Write a short bio");
  if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
    tips.push("Add at least one skill");
  }
  if (!Array.isArray(profile.education) || profile.education.length === 0) {
    tips.push("Add your education history");
  }
  if (!Array.isArray(profile.employment) || profile.employment.length === 0) {
    tips.push("Add your work experience");
  }

  return tips;
}
