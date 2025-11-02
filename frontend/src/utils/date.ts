// Small date helpers used by education components

// Convert YYYY-MM or YYYY-MM-DD (user input) into SQL date string (YYYY-MM-DD) or null
export function formatToSqlDate(v?: string | null): string | null {
  if (!v) return null;
  const trimmed = String(v).trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}/.test(trimmed)) return `${trimmed.slice(0, 7)}-01`;
  return null;
}

// Convert a DB date string into YYYY-MM for UI (or undefined)
export function dbDateToYYYYMM(d?: string | null): string | undefined {
  if (!d) return undefined;
  try {
    return new Date(d).toISOString().slice(0, 7);
  } catch {
    return undefined;
  }
}

// Convert YYYY-MM (or other date) to milliseconds for sorting
export function dateToMs(s?: string | undefined): number {
  if (!s) return 0;
  const d = new Date(s);
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}
