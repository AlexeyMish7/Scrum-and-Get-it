# Profile Workspace Types

> TypeScript type definitions for the profile workspace. Each section has DB row types and UI-friendly types.

---

## Type Files

| File               | Section                 |
| ------------------ | ----------------------- |
| `profile.ts`       | Core profile            |
| `education.ts`     | Education entries       |
| `employment.ts`    | Employment history      |
| `skill.ts`         | Skills with proficiency |
| `project.ts`       | Portfolio projects      |
| `certification.ts` | Certifications          |
| `document.ts`      | Document references     |

---

## Profile Types

**File:** `types/profile.ts`

```typescript
// UI shape for the profile form
interface ProfileData {
  fullName: string; // Combined first + last name
  email: string;
  phone: string;
  city: string;
  state: string;
  headline: string; // professional_title
  bio: string; // summary
  industry: string;
  experience: string; // experience_level (capitalized)
}

// DB row shape for mapping functions
type ProfileRow = Record<string, unknown>;
```

---

## Education Types

**File:** `types/education.ts`

```typescript
// Database row
type DbEducationRow = {
  id?: string;
  user_id?: string | null;
  degree_type?: string | null;
  institution_name?: string | null;
  field_of_study?: string | null;
  graduation_date?: string | null; // SQL date
  start_date?: string | null; // SQL date
  gpa?: number | null;
  honors?: string | null;
  enrollment_status?: string | null; // "enrolled" | "graduated"
  education_level?: string | null;
  metadata?: { privateGpa?: boolean } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// UI entry for display
type EducationEntry = {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM or undefined for ongoing
  gpa?: number;
  gpaPrivate?: boolean;
  honors?: string;
  active?: boolean; // Currently enrolled
  created_at?: string | null;
  updated_at?: string | null;
};

// Form input shape
type EducationFormData = {
  degree?: string;
  institution?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  gpa?: number;
  gpaPrivate?: boolean;
  honors?: string;
  active?: boolean;
};
```

---

## Employment Types

**File:** `types/employment.ts`

```typescript
// Database row
type EmploymentRow = {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  location?: string | null;
  start_date: string; // ISO date (YYYY-MM-DD)
  end_date?: string | null;
  job_description?: string | null;
  current_position: boolean;
  created_at: string;
  updated_at: string;
};

// Form input shape
type EmploymentFormData = {
  jobTitle: string;
  companyName: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;
  isCurrent: boolean;
  description?: string;
};
```

---

## Skill Types

**File:** `types/skill.ts`

```typescript
// Database row
type DbSkillRow = {
  id?: string;
  user_id?: string;
  skill_name?: string;
  proficiency_level?:
    | "beginner"
    | "intermediate"
    | "advanced"
    | "expert"
    | string;
  skill_category?: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

// UI item with ordering support
type SkillItem = {
  id?: string;
  name: string;
  category: string;
  level: string | number; // "Beginner" or 1-4
  position?: number; // For drag-and-drop
  meta?: Record<string, unknown> | null;
};

// Compact UI skill for charts/summaries
type UiSkill = {
  id: string;
  name: string;
  level: number; // 1-4
};

// Drag-and-drop types (from @hello-pangea/dnd)
type Skill = {
  id: string;
  name: string;
  level: number;
  position?: number;
};

type Category = {
  id: string;
  name: string;
  skills: Skill[];
};
```

### Proficiency Level Values

| Numeric | String         | Label        |
| ------- | -------------- | ------------ |
| 1       | `beginner`     | Beginner     |
| 2       | `intermediate` | Intermediate |
| 3       | `advanced`     | Advanced     |
| 4       | `expert`       | Expert       |

---

## Project Types

**File:** `types/project.ts`

```typescript
// Database row
type ProjectRow = {
  id: string;
  user_id: string;
  proj_name: string;
  proj_description?: string | null;
  role?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  tech_and_skills?: string[] | null;
  project_url?: string | null;
  team_size?: number | null;
  team_details?: string | null;
  industry_proj_type?: string | null;
  proj_outcomes?: string | null;
  status?: "planned" | "ongoing" | "completed" | null;
  media_path?: string | null;
  meta?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

// UI-friendly format
interface Project {
  id: string;
  projectName: string;
  description: string;
  role: string;
  startDate: string;
  endDate: string;
  technologies: string; // Comma-separated from array
  projectUrl?: string;
  teamSize: string;
  outcomes: string;
  industry: string;
  status: "Completed" | "Ongoing" | "Planned";
  mediaPath?: string | null; // Storage path
  mediaUrl?: string | null; // Resolved signed URL
  previewShape?: "rounded" | "circle";
}
```

### Status Values

| DB Value    | UI Display |
| ----------- | ---------- |
| `planned`   | Planned    |
| `ongoing`   | Ongoing    |
| `completed` | Completed  |

---

## Certification Types

**File:** `types/certification.ts`

```typescript
// Database row
type CertificationRow = {
  id: string;
  user_id: string;
  name: string;
  issuing_org?: string | null;
  category?: string | null;
  certification_id?: string | null;
  date_earned?: string | null;
  expiration_date?: string | null;
  does_not_expire?: boolean | null;
  verification_status?: string | null;
  verification_url?: string | null;
  media_path?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// UI-friendly format
type Certification = {
  id: string;
  name: string;
  organization: string; // issuing_org
  category: string;
  dateEarned: string;
  expirationDate?: string;
  doesNotExpire: boolean;
  certId?: string; // certification_id
  media_path?: string | null;
  mediaUrl?: string | null; // Resolved signed URL
  verification_status?: string | null;
};

// Form input shape
type NewCert = {
  name: string;
  organization: string;
  category: string;
  dateEarned: string;
  expirationDate?: string;
  doesNotExpire: boolean;
  certId?: string;
  file?: File | null;
};
```

---

## Document Types

**File:** `types/document.ts`

```typescript
// Referenced in Dashboard for recent activity
type DocumentRow = {
  id: string;
  name?: string;
  created_at?: string;
  // ... other document fields
};
```

---

## Type Conversion Patterns

### DB → UI Mapping

```typescript
function mapRowToEntry(row: DbRow): UIEntry {
  return {
    id: row.id,
    displayField: row.db_field ?? "",
    // Convert snake_case to camelCase
    // Handle null/undefined with defaults
  };
}
```

### UI → DB Mapping

```typescript
function mapEntryToRow(entry: UIEntry): DbRow {
  return {
    db_field: entry.displayField ?? null,
    // Convert camelCase to snake_case
    // Use null for empty strings if column allows NULL
  };
}
```

### Date Handling

```typescript
// DB stores: "2024-03-15" (YYYY-MM-DD)
// UI displays: "2024-03" (YYYY-MM) for month pickers

import { dbDateToYYYYMM, formatToSqlDate } from "@shared/utils/dateUtils";

// DB → UI
const displayDate = dbDateToYYYYMM(row.start_date);

// UI → DB
const sqlDate = formatToSqlDate(form.startDate);
```

### Boolean Handling

```typescript
// DB stores: null | true | false
// UI uses: boolean

doesNotExpire: Boolean(row.does_not_expire ?? false);
```

### Array Handling

```typescript
// DB stores: ["React", "TypeScript"] (ARRAY)
// UI displays: "React, TypeScript" (string)

technologies: row.tech_and_skills?.join(", ") ?? "";
```
