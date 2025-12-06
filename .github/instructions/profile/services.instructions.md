# Profile Workspace Services

> Service layer for profile workspace. All services use the shared CRUD utility and map between DB rows and UI types.

---

## Service Files

| File                | Table            | Description                     |
| ------------------- | ---------------- | ------------------------------- |
| `profileService.ts` | `profiles`       | Core profile CRUD               |
| `education.ts`      | `education`      | Education entries               |
| `employment.ts`     | `employment`     | Job history                     |
| `skills.ts`         | `skills`         | Skills with ordering            |
| `projects.ts`       | `projects`       | Portfolio projects with media   |
| `certifications.ts` | `certifications` | Certifications with file upload |

---

## Profile Service

**File:** `services/profileService.ts`

### Functions

| Function                      | Description                   |
| ----------------------------- | ----------------------------- |
| `getProfile(userId)`          | Fetch profile row             |
| `upsertProfile(userId, data)` | Create or update profile      |
| `mapRowToProfile(row)`        | Convert DB row to ProfileData |

### ProfileData Shape

```typescript
interface ProfileData {
  fullName: string; // Combined first_name + last_name
  email: string;
  phone: string;
  city: string;
  state: string;
  headline: string; // Maps to professional_title
  bio: string; // Maps to summary
  industry: string;
  experience: string; // Maps to experience_level (capitalized)
}
```

### Field Mapping

| UI Field     | DB Column                  |
| ------------ | -------------------------- |
| `fullName`   | `first_name` + `last_name` |
| `headline`   | `professional_title`       |
| `bio`        | `summary`                  |
| `experience` | `experience_level`         |

---

## Education Service

**File:** `services/education.ts`

### Functions

| Function                               | Description               |
| -------------------------------------- | ------------------------- |
| `listEducation(userId)`                | Get all education entries |
| `createEducation(userId, payload)`     | Add new education         |
| `updateEducation(userId, id, payload)` | Update existing           |
| `deleteEducation(userId, id)`          | Remove entry              |

### Type Mapping

```typescript
// DB Row → UI Entry
{
  degree_type       → degree
  institution_name  → institution
  field_of_study    → fieldOfStudy
  start_date        → startDate (YYYY-MM format)
  graduation_date   → endDate (YYYY-MM or undefined)
  gpa               → gpa
  metadata.privateGpa → gpaPrivate
  honors            → honors
  enrollment_status → active (enrolled = true)
}
```

### Notes

- Uses `dbDateToYYYYMM()` for date conversion
- Orders by `graduation_date` descending
- Handles `enrolled` vs `graduated` status

---

## Employment Service

**File:** `services/employment.ts`

### Functions

| Function                                | Description     |
| --------------------------------------- | --------------- |
| `listEmployment(userId)`                | Get job history |
| `insertEmployment(userId, payload)`     | Add new job     |
| `updateEmployment(userId, id, payload)` | Update job      |
| `deleteEmployment(userId, id)`          | Remove job      |

### EmploymentRow Shape

```typescript
type EmploymentRow = {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  location?: string | null;
  start_date: string; // ISO date YYYY-MM-DD
  end_date?: string | null;
  job_description?: string | null;
  current_position: boolean;
  created_at: string;
  updated_at: string;
};
```

### Notes

- Orders by `start_date` descending (newest first)
- `current_position` tracks if still employed

---

## Skills Service

**File:** `services/skills.ts`

### Functions

| Function                                | Description            |
| --------------------------------------- | ---------------------- |
| `listSkills(userId)`                    | Get all skills         |
| `createSkill(userId, payload)`          | Add new skill          |
| `updateSkill(userId, id, payload)`      | Update skill           |
| `deleteSkill(userId, id)`               | Remove skill           |
| `updateSkillPositions(userId, updates)` | Batch update positions |

### SkillItem Shape

```typescript
type SkillItem = {
  id?: string;
  name: string;
  category: string;
  level: string | number; // "Beginner" or 1-4
  position?: number; // For drag-and-drop ordering
  meta?: Record<string, unknown> | null;
};
```

### Proficiency Levels

| Level | Numeric      | Label        |
| ----- | ------------ | ------------ |
| 1     | beginner     | Beginner     |
| 2     | intermediate | Intermediate |
| 3     | advanced     | Advanced     |
| 4     | expert       | Expert       |

### Position Storage

Skill ordering is stored in `metadata.position`:

```typescript
// Update preserves existing metadata keys
const toUpdate = {
  meta: {
    ...existingMeta,
    position: newPosition,
  },
};
```

---

## Projects Service

**File:** `services/projects.ts`

### Functions

| Function                                      | Description                |
| --------------------------------------------- | -------------------------- |
| `listProjects(userId)`                        | Get all projects           |
| `getProject(userId, id)`                      | Get single project         |
| `insertProject(userId, payload)`              | Create project             |
| `updateProject(userId, id, payload)`          | Update project             |
| `deleteProject(userId, id)`                   | Delete with file cleanup   |
| `uploadProjectImage(userId, projectId, file)` | Upload media               |
| `deleteProjectImage(userId, projectId)`       | Remove media               |
| `resolveMediaUrl(mediaPath)`                  | Get signed URL for display |

### Project Mapping

```typescript
// DB Row → UI Project
{
  proj_name         → projectName
  proj_description  → description
  role              → role
  start_date        → startDate
  end_date          → endDate
  tech_and_skills   → technologies (array → comma string)
  project_url       → projectUrl
  team_size         → teamSize
  proj_outcomes     → outcomes
  industry_proj_type → industry
  status            → status (capitalized)
  media_path        → mediaPath
  meta.previewShape → previewShape ("rounded" | "circle")
}
```

### Media Handling

Projects can have images stored in `projects` bucket:

```typescript
// Upload
const key = `${userId}/${projectId}/${Date.now()}_${file.name}`;
await supabase.storage.from("projects").upload(key, file);

// Get signed URL (1 hour expiry)
const { data } = await supabase.storage
  .from("projects")
  .createSignedUrl(mediaPath, 60 * 60);
```

### Cleanup on Delete

Deleting a project:

1. Removes associated documents from `documents` table
2. Removes files from `projects` storage bucket
3. Deletes the project row

---

## Certifications Service

**File:** `services/certifications.ts`

### Functions

| Function                                          | Description               |
| ------------------------------------------------- | ------------------------- |
| `listCertifications(userId)`                      | Get all certifications    |
| `getCertification(userId, id)`                    | Get single certification  |
| `insertCertification(userId, payload, file?)`     | Create with optional file |
| `updateCertification(userId, id, payload, file?)` | Update with optional file |
| `deleteCertification(userId, id)`                 | Delete with cleanup       |
| `resolveMediaUrl(mediaPath)`                      | Get signed URL            |

### Certification Mapping

```typescript
// DB Row → UI Certification
{
  name              → name
  issuing_org       → organization
  category          → category
  date_earned       → dateEarned
  expiration_date   → expirationDate
  does_not_expire   → doesNotExpire
  certification_id  → certId
  media_path        → media_path
  verification_status → verification_status
}
```

### File Upload Flow

1. Upload file to `certifications` bucket
2. Store path in `media_path` column
3. Create `documents` row linking to certification
4. Dispatch `documents:changed` event for UI updates

---

## Common Patterns

### Using withUser CRUD

All services use the user-scoped CRUD helper:

```typescript
import * as crud from "@shared/services/crud";

const userCrud = crud.withUser(userId);
const res = await userCrud.listRows("table", "*", options);
```

### Ensuring Profile Exists

Before inserting into FK-linked tables:

```typescript
const { data: profileData } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", userId)
  .single();

if (!profileData) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("profiles").insert({
    id: userId,
    first_name: user.user_metadata?.first_name || "User",
    last_name: user.user_metadata?.last_name || "",
    email: user.email || "",
  });
}
```

### Error Handling

Services return `{ data, error }` pattern:

```typescript
const res = await userCrud.insertRow("table", payload, "*");
if (res.error) return { data: null, error: res.error };
return { data: mapRowToUI(res.data), error: null };
```

### Date Conversion

Use shared utilities:

```typescript
import { dbDateToYYYYMM, formatToSqlDate } from "@shared/utils/dateUtils";

// DB → UI
const displayDate = dbDateToYYYYMM(row.start_date); // "2024-03"

// UI → DB
const sqlDate = formatToSqlDate("2024-03"); // "2024-03-01"
```
