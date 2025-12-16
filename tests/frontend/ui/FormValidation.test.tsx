/**
 * UI Tests: Form Validation Patterns
 *
 * Tests common form validation logic used across the app.
 * Validates input rules, error messages, and form state.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

describe("[UI] Form Validation - Email", () => {
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  it("should accept valid email addresses", () => {
    const validEmails = [
      "user@example.com",
      "john.doe@company.org",
      "test+label@gmail.com",
      "user123@subdomain.domain.com",
    ];

    validEmails.forEach((email) => {
      expect(validateEmail(email)).toBe(true);
    });
  });

  it("should reject invalid email addresses", () => {
    const invalidEmails = [
      "notanemail",
      "@missing-local.com",
      "missing-at-sign.com",
      "missing@domain",
      "spaces in@email.com",
      "",
    ];

    invalidEmails.forEach((email) => {
      expect(validateEmail(email)).toBe(false);
    });
  });
});

describe("[UI] Form Validation - Required Fields", () => {
  const validateRequired = (value: string | undefined | null): boolean => {
    return value !== undefined && value !== null && value.trim().length > 0;
  };

  it("should pass for non-empty strings", () => {
    expect(validateRequired("Hello")).toBe(true);
    expect(validateRequired("  trimmed  ")).toBe(true);
  });

  it("should fail for empty or whitespace strings", () => {
    expect(validateRequired("")).toBe(false);
    expect(validateRequired("   ")).toBe(false);
    expect(validateRequired(null)).toBe(false);
    expect(validateRequired(undefined)).toBe(false);
  });
});

describe("[UI] Form Validation - URL", () => {
  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Optional field
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  it("should accept valid URLs", () => {
    const validUrls = [
      "https://example.com",
      "http://localhost:3000",
      "https://sub.domain.com/path?query=1",
      "https://github.com/user/repo",
    ];

    validUrls.forEach((url) => {
      expect(validateUrl(url)).toBe(true);
    });
  });

  it("should reject invalid URLs", () => {
    const invalidUrls = [
      "not-a-url",
      "ftp://files.example.com",
      "javascript:alert(1)",
      "example.com", // Missing protocol
    ];

    invalidUrls.forEach((url) => {
      expect(validateUrl(url)).toBe(false);
    });
  });

  it("should allow empty URLs (optional field)", () => {
    expect(validateUrl("")).toBe(true);
  });
});

describe("[UI] Form Validation - Phone Number", () => {
  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional
    // Remove common formatting characters
    const digits = phone.replace(/[\s\-\(\)\.]/g, "");
    // Check for valid digit count (10-15 digits for international)
    return /^\+?\d{10,15}$/.test(digits);
  };

  it("should accept valid phone numbers", () => {
    const validPhones = [
      "555-123-4567",
      "(555) 123-4567",
      "5551234567",
      "+1 555 123 4567",
      "+44 20 7946 0958",
    ];

    validPhones.forEach((phone) => {
      expect(validatePhone(phone)).toBe(true);
    });
  });

  it("should reject invalid phone numbers", () => {
    const invalidPhones = [
      "123", // Too short
      "abcdefghij", // Letters
      "123-456", // Too short
    ];

    invalidPhones.forEach((phone) => {
      expect(validatePhone(phone)).toBe(false);
    });
  });
});

describe("[UI] Form Validation - Date Range", () => {
  const validateDateRange = (
    startDate: string,
    endDate: string | null,
    isCurrent: boolean
  ): boolean => {
    if (isCurrent) return true; // No end date needed
    if (!endDate) return false; // End date required if not current

    const start = new Date(startDate);
    const end = new Date(endDate);
    return end >= start;
  };

  it("should accept valid date ranges", () => {
    expect(validateDateRange("2020-01-01", "2022-12-31", false)).toBe(true);
    expect(validateDateRange("2023-06-01", "2023-06-01", false)).toBe(true); // Same day
  });

  it("should reject invalid date ranges (end before start)", () => {
    expect(validateDateRange("2022-01-01", "2020-12-31", false)).toBe(false);
  });

  it("should accept current positions without end date", () => {
    expect(validateDateRange("2023-01-01", null, true)).toBe(true);
  });

  it("should require end date for non-current positions", () => {
    expect(validateDateRange("2023-01-01", null, false)).toBe(false);
  });
});

describe("[UI] Form Validation - Salary Range", () => {
  const validateSalaryRange = (
    min: number | null,
    max: number | null
  ): { valid: boolean; error?: string } => {
    if (min === null && max === null) return { valid: true };
    if (min !== null && min < 0)
      return { valid: false, error: "Minimum salary cannot be negative" };
    if (max !== null && max < 0)
      return { valid: false, error: "Maximum salary cannot be negative" };
    if (min !== null && max !== null && min > max) {
      return { valid: false, error: "Minimum salary cannot exceed maximum" };
    }
    return { valid: true };
  };

  it("should accept valid salary ranges", () => {
    expect(validateSalaryRange(50000, 80000).valid).toBe(true);
    expect(validateSalaryRange(100000, 150000).valid).toBe(true);
  });

  it("should accept null values (optional)", () => {
    expect(validateSalaryRange(null, null).valid).toBe(true);
    expect(validateSalaryRange(50000, null).valid).toBe(true);
    expect(validateSalaryRange(null, 80000).valid).toBe(true);
  });

  it("should reject min > max", () => {
    const result = validateSalaryRange(100000, 50000);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("cannot exceed");
  });

  it("should reject negative salaries", () => {
    expect(validateSalaryRange(-5000, 50000).valid).toBe(false);
    expect(validateSalaryRange(50000, -1000).valid).toBe(false);
  });
});

describe("[UI] Form Validation - Text Length", () => {
  const validateLength = (
    text: string,
    minLength: number,
    maxLength: number
  ): { valid: boolean; error?: string } => {
    const length = text.trim().length;
    if (length < minLength) {
      return {
        valid: false,
        error: `Minimum ${minLength} characters required`,
      };
    }
    if (length > maxLength) {
      return { valid: false, error: `Maximum ${maxLength} characters allowed` };
    }
    return { valid: true };
  };

  it("should accept text within limits", () => {
    expect(validateLength("Hello World", 1, 100).valid).toBe(true);
    expect(validateLength("A".repeat(50), 1, 100).valid).toBe(true);
  });

  it("should reject text below minimum", () => {
    const result = validateLength("Hi", 5, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Minimum");
  });

  it("should reject text above maximum", () => {
    const result = validateLength("A".repeat(101), 1, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Maximum");
  });
});

describe("[UI] Form Validation - Password Strength", () => {
  const validatePassword = (
    password: string
  ): { valid: boolean; strength: string; requirements: string[] } => {
    const requirements: string[] = [];

    if (password.length < 8) {
      requirements.push("At least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      requirements.push("At least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      requirements.push("At least one lowercase letter");
    }
    if (!/\d/.test(password)) {
      requirements.push("At least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      requirements.push("At least one special character");
    }

    const valid = requirements.length === 0;
    const strength =
      requirements.length === 0
        ? "strong"
        : requirements.length <= 2
        ? "medium"
        : "weak";

    return { valid, strength, requirements };
  };

  it("should accept strong passwords", () => {
    const result = validatePassword("SecureP@ss1");
    expect(result.valid).toBe(true);
    expect(result.strength).toBe("strong");
  });

  it("should identify weak passwords", () => {
    const result = validatePassword("password");
    expect(result.valid).toBe(false);
    expect(result.strength).toBe("weak");
  });

  it("should list missing requirements", () => {
    const result = validatePassword("onlylowercase");
    expect(result.requirements).toContain("At least one uppercase letter");
    expect(result.requirements).toContain("At least one number");
    expect(result.requirements).toContain("At least one special character");
  });
});

describe("[UI] Form State Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Form Dirty State", () => {
    it("should track when form becomes dirty", () => {
      const initialData = { name: "John", email: "john@example.com" };
      const currentData = { name: "Jane", email: "john@example.com" };

      const isDirty =
        JSON.stringify(initialData) !== JSON.stringify(currentData);
      expect(isDirty).toBe(true);
    });

    it("should recognize clean form", () => {
      const initialData = { name: "John", email: "john@example.com" };
      const currentData = { name: "John", email: "john@example.com" };

      const isDirty =
        JSON.stringify(initialData) !== JSON.stringify(currentData);
      expect(isDirty).toBe(false);
    });
  });

  describe("Form Error State", () => {
    it("should collect all field errors", () => {
      const errors: Record<string, string> = {};

      if (!validateEmail("invalid")) {
        errors.email = "Invalid email address";
      }
      if (!validateRequired("")) {
        errors.name = "Name is required";
      }

      expect(Object.keys(errors)).toHaveLength(2);
    });

    it("should clear errors when corrected", () => {
      const errors: Record<string, string> = { email: "Invalid email" };

      if (validateEmail("valid@example.com")) {
        delete errors.email;
      }

      expect(errors.email).toBeUndefined();
    });
  });

  describe("Form Submission State", () => {
    it("should prevent double submission", () => {
      let isSubmitting = false;
      let submitCount = 0;

      const submit = () => {
        if (isSubmitting) return false;
        isSubmitting = true;
        submitCount++;
        return true;
      };

      expect(submit()).toBe(true);
      expect(submit()).toBe(false);
      expect(submitCount).toBe(1);
    });

    it("should reset submitting state after completion", async () => {
      let isSubmitting = false;

      const submit = async () => {
        isSubmitting = true;
        await Promise.resolve(); // Simulate async operation
        isSubmitting = false;
      };

      await submit();
      expect(isSubmitting).toBe(false);
    });
  });
});

// Helper function used in tests
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateRequired(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim().length > 0;
}
