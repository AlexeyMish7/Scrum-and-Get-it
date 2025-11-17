/**
 * SHARED UTILITIES FOR GENERATION ROUTES
 *
 * Helper functions used across multiple AI generation endpoints.
 */

/**
 * Build a short preview for UI
 *
 * WHAT: Extracts meaningful preview text from generated content
 * WHY: Provide quick content summary without sending full payload to UI
 *
 * Inputs:
 * - content: unknown - Generated AI content (can be string, object, array)
 *
 * Outputs:
 * - string | null - Preview text (max 400 chars) or null if content invalid
 *
 * Logic:
 * - String content → truncate to 400 chars
 * - Object with bullets array → extract first 3 bullets
 * - Other objects → stringify and truncate
 * - Invalid/empty → return null
 */
export function makePreview(content: unknown): string | null {
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
      Array.isArray(content.bullets)
    ) {
      return content.bullets
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
