/**
 * DATE UTILITIES
 *
 * Centralized date formatting and parsing utilities for the application.
 * Organized by use case: SQL formatting, UI display, and sorting.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SQL DATE FORMATTING (Database Operations)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Convert user input (YYYY-MM or YYYY-MM-DD) to SQL date string (YYYY-MM-DD)
 * Used when saving dates to database
 *
 * @param value - User input date string
 * @returns SQL-formatted date string or null
 *
 * @example
 * formatToSqlDate('2024-03') → '2024-03-01'
 * formatToSqlDate('2024-03-15') → '2024-03-15'
 * formatToSqlDate(null) → null
 */
export function formatToSqlDate(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // YYYY-MM format → append day 01
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;

  // Partial YYYY-MM-* format → truncate to month
  if (/^\d{4}-\d{2}/.test(trimmed)) return `${trimmed.slice(0, 7)}-01`;

  return null;
}

/**
 * Convert database date string to YYYY-MM format for UI display
 * Used when displaying month-only dates in forms
 *
 * @param date - Database date string
 * @returns YYYY-MM formatted string or undefined
 *
 * @example
 * dbDateToYYYYMM('2024-03-15') → '2024-03'
 * dbDateToYYYYMM(null) → undefined
 */
export function dbDateToYYYYMM(date?: string | null): string | undefined {
  if (!date) return undefined;
  try {
    return new Date(date).toISOString().slice(0, 7);
  } catch {
    return undefined;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MONTH PARSING & SORTING (UI Operations)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Parse YYYY-MM string to milliseconds for sorting
 * Used for chronological sorting of month-based dates
 *
 * @param monthString - Month string in YYYY-MM format
 * @returns Milliseconds since epoch, or 0 if invalid
 *
 * @example
 * parseMonthToMs('2024-03') → 1709251200000
 * parseMonthToMs(null) → 0
 */
export function parseMonthToMs(monthString?: string | null): number {
  if (!monthString || String(monthString).trim() === "") return 0;

  // Append day '01' to parse month string
  const parsed = new Date(String(monthString) + "-01");
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

/**
 * Check if one month is strictly after another
 * Used for date range validation
 *
 * @param monthA - First month (YYYY-MM)
 * @param monthB - Second month (YYYY-MM)
 * @returns True if monthB is after monthA
 *
 * @example
 * isMonthAfter('2024-01', '2024-03') → true
 * isMonthAfter('2024-03', '2024-01') → false
 */
export function isMonthAfter(
  monthA?: string | null,
  monthB?: string | null
): boolean {
  const ams = parseMonthToMs(monthA);
  const bms = parseMonthToMs(monthB);
  return bms > ams;
}

/**
 * Convert any date string to milliseconds for sorting
 * More flexible than parseMonthToMs, handles full dates too
 *
 * @param dateString - Date string in any valid format
 * @returns Milliseconds since epoch, or 0 if invalid
 *
 * @example
 * dateToMs('2024-03-15') → 1710460800000
 * dateToMs('2024-03') → 1709251200000
 * dateToMs(undefined) → 0
 */
export function dateToMs(dateString?: string | undefined): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const timestamp = date.getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}
