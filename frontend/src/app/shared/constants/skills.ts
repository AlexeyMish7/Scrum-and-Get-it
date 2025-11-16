/**
 * SKILL CONSTANTS MODULE
 * Centralized skill-related constants and utilities for the entire application.
 *
 * Provides:
 * - Proficiency level and category option arrays (for UI selects/filters)
 * - Type-safe mappings between database enums and display labels
 * - Helper functions for bidirectional conversion
 *
 * Usage:
 * - Import constants for dropdowns: `SKILL_LEVEL_OPTIONS`, `SKILL_CATEGORY_OPTIONS`
 * - Use helpers for display: `formatProficiencyLevel()`, `parseProficiencyLevel()`
 */

import type { Skill } from "@shared/types/domain";

// Database proficiency levels (lowercase, matches DB enum)
export type ProficiencyLevel = Skill["proficiencyLevel"];

// UI display labels for proficiency levels (title case for display)
export const SKILL_LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
} as const;

// Array of display labels for UI dropdowns/selects
export const SKILL_LEVEL_OPTIONS = Object.values(SKILL_LEVEL_LABELS);

// Array of skill categories for UI dropdowns
export const SKILL_CATEGORY_OPTIONS = [
  "Technical",
  "Soft Skills",
  "Language",
  "Other",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORY_OPTIONS)[number];

/**
 * Convert database proficiency level to display label.
 * @param level - Database enum value ("beginner", "intermediate", etc.)
 * @returns Display-friendly label ("Beginner", "Intermediate", etc.)
 */
export function formatProficiencyLevel(
  level: ProficiencyLevel | string
): string {
  const normalized = level.toLowerCase() as ProficiencyLevel;
  return SKILL_LEVEL_LABELS[normalized] || level;
}

/**
 * Convert display label back to database enum value.
 * @param label - Display label ("Beginner", "Intermediate", etc.)
 * @returns Database enum value ("beginner", "intermediate", etc.)
 */
export function parseProficiencyLevel(label: string): ProficiencyLevel {
  const entry = Object.entries(SKILL_LEVEL_LABELS).find(
    ([, displayLabel]) => displayLabel === label
  );
  return (entry?.[0] as ProficiencyLevel) || "beginner";
}

/**
 * Convert numeric level (1-4) to display label.
 * Legacy support for components using numeric levels.
 * @param level - Numeric level (1=Beginner, 2=Intermediate, 3=Advanced, 4=Expert)
 * @returns Display label or "Unknown" if invalid
 */
export function formatNumericLevel(level: number): string {
  const levels = ["beginner", "intermediate", "advanced", "expert"];
  const proficiencyLevel = levels[level - 1] as ProficiencyLevel | undefined;
  return proficiencyLevel ? SKILL_LEVEL_LABELS[proficiencyLevel] : "Unknown";
}

/**
 * Convert display label to numeric level (1-4).
 * @param label - Display label ("Beginner", etc.)
 * @returns Numeric level (1-4)
 */
export function parseNumericLevel(label: string): number {
  const profLevel = parseProficiencyLevel(label);
  const levels: ProficiencyLevel[] = [
    "beginner",
    "intermediate",
    "advanced",
    "expert",
  ];
  return levels.indexOf(profLevel) + 1;
}
