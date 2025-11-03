// Small date utilities for month-based strings (YYYY-MM)
// Keep logic minimal and well-documented for reuse across the app.
export function parseMonthToMs(s?: string | null): number {
  if (!s || String(s).trim() === "") return 0;
  // Expect input like '2022-09' (year-month). Append day '01' to parse.
  const parsed = new Date(String(s) + "-01");
  return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

// Return true if `b` is strictly after `a` (both YYYY-MM or similar).
export function isMonthAfter(a?: string | null, b?: string | null): boolean {
  const ams = parseMonthToMs(a);
  const bms = parseMonthToMs(b);
  return bms > ams;
}
