// Simple feedback theme extractor (placeholder)
// Replace placeholder logic with embeddings/clustering or AI-backed extraction.

export function extractThemesFromText(text: string) {
  const themes: string[] = [];
  const lower = text.toLowerCase();
  if (lower.includes("communication") || lower.includes("articulate")) themes.push("communication");
  if (lower.includes("system design") || lower.includes("design")) themes.push("system-design");
  if (lower.includes("algorithms") || lower.includes("algorithms")) themes.push("algorithms");
  if (lower.includes("confidence") || lower.includes("nervous")) themes.push("confidence");
  if (lower.includes("team") || lower.includes("culture")) themes.push("culture-fit");
  return themes;
}
