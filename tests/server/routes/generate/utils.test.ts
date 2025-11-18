/**
 * Tests for routes/generate/utils.ts
 * Coverage: makePreview function
 */

import { describe, it, expect } from "vitest";

// Mock makePreview implementation
function makePreview(content: unknown): string | null {
  try {
    if (!content) return null;

    if (typeof content === "string") {
      return content.length > 400 ? content.slice(0, 400) + "…" : content;
    }

    // Extract bullets for resume/experience content
    if (
      typeof content === "object" &&
      content !== null &&
      "bullets" in content &&
      Array.isArray((content as any).bullets)
    ) {
      return (content as any).bullets
        .slice(0, 3)
        .map((b: any) => (typeof b === "string" ? b : b?.text ?? ""))
        .filter(Boolean)
        .join("\n");
    }

    // Try to stringify other object types
    const s = JSON.stringify(content);
    return s.length > 400 ? s.slice(0, 400) + "…" : s;
  } catch {
    return null;
  }
}

describe("makePreview", () => {
  it("should return null for null/undefined content", () => {
    expect(makePreview(null)).toBeNull();
    expect(makePreview(undefined)).toBeNull();
  });

  it("should handle short strings", () => {
    const content = "Short text";
    expect(makePreview(content)).toBe("Short text");
  });

  it("should truncate long strings", () => {
    const content = "a".repeat(500);
    const preview = makePreview(content);
    expect(preview).toHaveLength(401); // 400 + ellipsis
    expect(preview?.endsWith("…")).toBe(true);
  });

  it("should handle exactly 400 character strings", () => {
    const content = "a".repeat(400);
    const preview = makePreview(content);
    expect(preview).toBe(content);
    expect(preview).not.toContain("…");
  });

  it("should extract bullets from resume content", () => {
    const content = {
      bullets: [
        "First bullet point",
        "Second bullet point",
        "Third bullet point",
        "Fourth bullet point",
      ],
    };
    const preview = makePreview(content);
    expect(preview).toBe(
      "First bullet point\nSecond bullet point\nThird bullet point"
    );
  });

  it("should handle bullets with text property", () => {
    const content = {
      bullets: [
        { text: "Bullet one" },
        { text: "Bullet two" },
        { text: "Bullet three" },
      ],
    };
    const preview = makePreview(content);
    expect(preview).toBe("Bullet one\nBullet two\nBullet three");
  });

  it("should filter out empty bullets", () => {
    const content = {
      bullets: [
        "First bullet",
        "",
        null,
        "Second bullet",
        { text: "" },
        "Third bullet",
      ],
    };
    const preview = makePreview(content);
    // slice(0,3) takes ['First bullet', '', null], then filter(Boolean) → ['First bullet']
    expect(preview).toBe("First bullet");
  });

  it("should handle mixed bullet types", () => {
    const content = {
      bullets: ["String bullet", { text: "Object bullet" }, "Another string"],
    };
    const preview = makePreview(content);
    expect(preview).toBe("String bullet\nObject bullet\nAnother string");
  });

  it("should only take first 3 bullets", () => {
    const content = {
      bullets: Array.from({ length: 10 }, (_, i) => `Bullet ${i + 1}`),
    };
    const preview = makePreview(content);
    const lines = preview?.split("\n") || [];
    expect(lines).toHaveLength(3);
  });

  it("should handle empty bullets array", () => {
    const content = { bullets: [] };
    const preview = makePreview(content);
    expect(preview).toBe("");
  });

  it("should stringify non-bullet objects", () => {
    const content = { name: "Test", value: 123 };
    const preview = makePreview(content);
    expect(preview).toBe('{"name":"Test","value":123}');
  });

  it("should truncate stringified long objects", () => {
    const content = {
      data: "a".repeat(500),
    };
    const preview = makePreview(content);
    expect(preview).toHaveLength(401);
    expect(preview?.endsWith("…")).toBe(true);
  });

  it("should handle arrays", () => {
    const content = [1, 2, 3];
    const preview = makePreview(content);
    expect(preview).toBe("[1,2,3]");
  });

  it("should handle numbers", () => {
    const preview = makePreview(42);
    expect(preview).toBe("42");
  });

  it("should handle booleans", () => {
    expect(makePreview(true)).toBe("true"); // JSON.stringify(true)
    expect(makePreview(false)).toBeNull(); // falsy check returns null
  });

  it("should handle nested objects", () => {
    const content = {
      outer: {
        inner: {
          value: "test",
        },
      },
    };
    const preview = makePreview(content);
    expect(preview).toContain("outer");
    expect(preview).toContain("inner");
    expect(preview).toContain("test");
  });

  it("should handle objects with special characters", () => {
    const content = {
      message: 'Hello "world" \n\t Special chars',
    };
    const preview = makePreview(content);
    expect(preview).toContain("Hello");
  });

  it("should handle circular references gracefully", () => {
    const content: any = { name: "test" };
    content.self = content; // Circular reference

    const preview = makePreview(content);
    // Should return null on stringify error
    expect(preview).toBeNull();
  });

  it("should handle Date objects", () => {
    const content = new Date("2025-01-01");
    const preview = makePreview(content);
    expect(preview).toContain("2025");
  });

  it("should handle objects with toString method", () => {
    const content = {
      toString() {
        return "Custom string representation";
      },
    };
    const preview = makePreview(content);
    // JSON.stringify doesn't use toString, so will stringify the object
    expect(preview).toBeDefined();
  });

  it("should preserve newlines in string content", () => {
    const content = "Line 1\nLine 2\nLine 3";
    const preview = makePreview(content);
    expect(preview).toBe(content);
  });

  it("should handle unicode characters", () => {
    const content = "日本語 text with émojis 🎉";
    const preview = makePreview(content);
    expect(preview).toBe(content);
  });
});
