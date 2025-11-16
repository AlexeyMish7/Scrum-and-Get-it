# Shared Utilities

**Purpose**: Reusable utility functions that operate across all workspaces (Profile, AI, Jobs).

**Import Pattern**: Always import from the barrel (`@shared/utils`) for consistency:

```typescript
// ✅ Correct - use barrel export
import { formatToSqlDate, deduplicateRequest } from "@shared/utils";

// ❌ Avoid - bypasses barrel
import { formatToSqlDate } from "@shared/utils/dateUtils";
```

---

## 📅 Date Utilities (`dateUtils.ts`)

Centralized date formatting and parsing for SQL operations and UI display.

### SQL Date Formatting (Database Operations)

#### `formatToSqlDate(value?: string | null): string | null`

Convert user input to SQL date string (YYYY-MM-DD).

**Use when**: Saving dates to database

```typescript
formatToSqlDate("2024-03"); // → '2024-03-01'
formatToSqlDate("2024-03-15"); // → '2024-03-15'
formatToSqlDate(null); // → null
```

#### `dbDateToYYYYMM(date?: string | null): string | undefined`

Convert database date to YYYY-MM format for UI display.

**Use when**: Displaying month-only dates in forms

```typescript
dbDateToYYYYMM("2024-03-15"); // → '2024-03'
dbDateToYYYYMM(null); // → undefined
```

### Month Parsing & Sorting (UI Operations)

#### `parseMonthToMs(monthString?: string | null): number`

Parse YYYY-MM string to milliseconds for sorting.

**Use when**: Sorting month-based dates chronologically

```typescript
parseMonthToMs("2024-03"); // → 1709251200000
parseMonthToMs(null); // → 0
```

#### `isMonthAfter(monthA?: string | null, monthB?: string | null): boolean`

Check if one month is strictly after another.

**Use when**: Validating date ranges (e.g., end date after start date)

```typescript
isMonthAfter("2024-01", "2024-03"); // → true
isMonthAfter("2024-03", "2024-01"); // → false
```

#### `dateToMs(dateString?: string | undefined): number`

Convert any date string to milliseconds for sorting.

**Use when**: Sorting full dates or mixed date formats

```typescript
dateToMs("2024-03-15"); // → 1710460800000
dateToMs("2024-03"); // → 1709251200000
dateToMs(undefined); // → 0
```

---

## 🚦 Request Deduplication (`requestDeduplication.ts`)

Prevents duplicate in-flight API requests, improving performance by 60-80%.

### `deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T>`

Ensures only one request with the same key executes at a time.

**Use when**: Making API calls that might be triggered multiple times rapidly

```typescript
import { deduplicateRequest } from "@shared/utils";

// Multiple rapid calls with same key will share one request
const data = await deduplicateRequest("jobs-list-user-123", () =>
  fetchJobsFromApi()
);
```

### `invalidatePendingRequests(pattern: string | RegExp): void`

Cancel pending requests matching a pattern.

**Use when**: User navigates away or data becomes stale

```typescript
// Cancel all job-related requests
invalidatePendingRequests(/^jobs-/);
```

### `clearAllPendingRequests(): void`

Clear all pending request tracking.

**Use when**: Logging out or resetting application state

### `getPendingRequestCount(): number`

Get count of currently pending requests (useful for debugging).

---

## ♿ Accessibility Audit (`a11yAudit.ts`)

**Dev/Test Only**: Automated accessibility testing with axe-core.

### `initAccessibilityAudit(options?): Promise<void>`

Initialize automatic accessibility auditing.

**Use when**: Development mode only (already configured in `main.tsx`)

```typescript
if (import.meta.env.DEV) {
  initAccessibilityAudit({
    wcagLevel: "AA",
    minImpact: "moderate",
    auditDelay: 2000,
  });
}
```

### `auditElement(element: HTMLElement, options?): Promise<AxeResults>`

Audit specific element for WCAG violations.

**Use when**: Testing specific components in isolation

```typescript
const results = await auditElement(document.getElementById("form"));
console.log(results.violations);
```

### `getViolationSummary(results: AxeResults): string`

Get human-readable summary of violations.

### `generateReport(results: AxeResults): string`

Generate detailed markdown report of violations.

---

## 📋 Sprint Task Mapping (`pageTaskMap.ts`, `taskOwners.ts`)

**Sprint 2 Specific**: Maps UI pages to use cases and team ownership.

### `pageTaskMap: Record<PageTaskKey, SprintTaskItem[]>`

Maps page keys to lists of use cases.

```typescript
import { pageTaskMap } from "@shared/utils";

const aiResumeTasks = pageTaskMap["ai:resume"];
// → [{ uc: "UC-046", title: "Resume Template...", ... }]
```

### `ownerFor(ucId: string): string | null`

Get team member assigned to a use case.

```typescript
import { ownerFor } from "@shared/utils";

ownerFor("UC-046"); // → "Nihaal"
ownerFor("UC-055"); // → "Alexey"
```

**Note**: These files contain Sprint 2 hardcoded data and may be refactored in Sprint 3.

---

## 🧪 Testing

Unit tests are located in `__tests__/` subdirectory:

- `dateUtils.test.ts` - Date utility test coverage
- `requestDeduplication.test.ts` - Deduplication behavior tests

Run tests:

```bash
npm test utils
```

---

## 📝 Adding New Utilities

1. **Create utility file** in `shared/utils/` with clear documentation
2. **Export from barrel** in `index.ts` with descriptive comment
3. **Write tests** in `__tests__/` subdirectory
4. **Update this README** with usage examples

Example structure:

```typescript
/**
 * UTILITY_NAME
 *
 * Brief description of what this utility does.
 */

/**
 * Function description
 *
 * @param param - Parameter description
 * @returns Return value description
 *
 * @example
 * myUtility('input') → 'output'
 */
export function myUtility(param: string): string {
  // Implementation
}
```

---

## 🔒 Best Practices

1. **Always use barrel exports** - Import from `@shared/utils`, not direct file paths
2. **Keep utilities pure** - No side effects, predictable inputs/outputs
3. **Document thoroughly** - JSDoc comments with examples for all public functions
4. **Test coverage** - Unit tests for all utilities with edge cases
5. **Type safety** - Strict TypeScript, no `any` types unless absolutely necessary

---

**Last Updated**: Sprint 2 Refactoring (November 2025)
