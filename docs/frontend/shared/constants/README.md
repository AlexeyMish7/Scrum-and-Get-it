# Shared Constants

Centralized application-wide constants and enums for consistency across the codebase.

## Structure

```
constants/
├── index.ts        # Barrel export (re-exports all constants)
└── skills.ts       # Skill proficiency levels and categories
```

## Files

### `skills.ts`

**Purpose**: Centralize skill-related constants for proficiency levels and categories.

**Exports**:

- **Types**:

  - `ProficiencyLevel`: Union type `"beginner" | "intermediate" | "advanced" | "expert"`
  - `SkillCategory`: Union type `"Technical" | "Soft Skills" | "Language" | "Other"`

- **Constants**:

  - `SKILL_LEVEL_LABELS`: Mapping from DB enum to display label
    ```ts
    { beginner: "Beginner", intermediate: "Intermediate", ... }
    ```
  - `SKILL_LEVEL_OPTIONS`: Array of display labels for dropdowns
    ```ts
    ["Beginner", "Intermediate", "Advanced", "Expert"];
    ```
  - `SKILL_CATEGORY_OPTIONS`: Array of skill categories for dropdowns
    ```ts
    ["Technical", "Soft Skills", "Language", "Other"];
    ```

- **Utility Functions**:
  - `formatProficiencyLevel(level)` — Convert DB enum to display label (unused, available for future)
  - `parseProficiencyLevel(label)` — Convert display label to DB enum (unused, available for future)
  - `formatNumericLevel(level)` — Convert numeric level (1-4) to display label ✅ **ACTIVELY USED**
  - `parseNumericLevel(label)` — Convert display label to numeric level (1-4) (unused, available for future)

**Usage Locations** (3 files):

- `SkillsOverview.tsx` — Displays skill level with `formatNumericLevel()`
- `AddSkills.tsx` — Uses `formatNumericLevel()` for skill level display
- `SummaryCards.tsx` — Uses `SKILL_LEVEL_OPTIONS` and `SKILL_CATEGORY_OPTIONS` for filters

**Import Pattern**:

```ts
import {
  formatNumericLevel,
  SKILL_LEVEL_OPTIONS,
  SKILL_CATEGORY_OPTIONS,
} from "@shared/constants";
```

## Design Decisions

### Why separate skill constants?

1. **Single source of truth**: All skill-related enums and labels in one place
2. **Type safety**: TypeScript types derived from constants prevent typos
3. **Bidirectional conversion**: Formatters and parsers for UI ↔ DB translation
4. **Future-proof**: Unused parsers kept for eventual form submission needs

### Why numeric level helpers?

Legacy components use numeric levels (1-4) instead of string enums. The `formatNumericLevel()` and `parseNumericLevel()` functions bridge this gap until components migrate to string-based proficiency levels.

## Extension Guidelines

### Adding new constants

1. Create a new file (e.g., `certifications.ts`, `industries.ts`)
2. Export types, constants, and utility functions
3. Add to `index.ts` barrel export:
   ```ts
   export * from "./certifications";
   ```
4. Document in this README

### Migrating to string-based levels

Once all components use string-based proficiency levels directly:

1. Replace `formatNumericLevel()` calls with direct enum values
2. Remove numeric conversion functions
3. Update this documentation

## Verification

**Type check**:

```powershell
npm run typecheck
```

**Search for usage**:

```powershell
# Find all imports from constants
grep -r "from.*shared/constants" frontend/src
```
