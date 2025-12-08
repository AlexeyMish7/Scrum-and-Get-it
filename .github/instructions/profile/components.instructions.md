# Profile Workspace Components

> UI components for the profile workspace including dialogs, dashboard widgets, and page components.

---

## Component Organization

```
components/
├── dialogs/           # Add/Edit dialogs for each section
├── LinkedIn/          # LinkedIn OAuth integration
└── profile/           # Dashboard widgets and visualizations
```

---

## Dialog Components

**Location:** `components/dialogs/`

### AddEducationDialog

Opens a modal form to add new education entry.

**Props:**

- `open: boolean` - Dialog visibility
- `onClose: () => void` - Close handler
- `onSave: (data: EducationFormData) => Promise<void>` - Save handler

**Fields:**

- Institution name (required)
- Degree type (required)
- Field of study
- Start date (month picker)
- End date or "Currently enrolled" checkbox
- GPA with "Keep private" option
- Honors

### AddEmploymentDialog

Modal form for new employment entry.

**Props:**

- `open: boolean`
- `onClose: () => void`
- `onSave: (data: EmploymentFormData) => Promise<void>`

**Fields:**

- Job title (required)
- Company name (required)
- Location
- Start date
- End date or "Current position" checkbox
- Description (rich text optional)

### AddProjectDialog

Modal form for new portfolio project.

**Props:**

- `open: boolean`
- `onClose: () => void`
- `onSave: (data: ProjectFormData) => Promise<void>`

**Fields:**

- Project name (required)
- Description
- Your role
- Start/end dates
- Technologies (comma-separated or chips)
- Project URL
- Team size
- Outcomes
- Industry/type
- Status (Planned/Ongoing/Completed)
- Media upload

### AddSkillDialog

Modal form for new skill.

**Props:**

- `open: boolean`
- `onClose: () => void`
- `onSave: (data: SkillFormData) => Promise<void>`

**Fields:**

- Skill name (required)
- Category (Technical, Soft Skills, Tools, etc.)
- Proficiency level (Beginner/Intermediate/Advanced/Expert)

### Dialog UX & Cache Defaults (Sprint 4)

- Use `useUnifiedCacheUtils().invalidateAll()` after any add/edit/delete so every profile section refetches from the unified cache.
- Guard duplicate submissions with `isSubmitting` and disable all dialog actions while async work is in flight (buttons show `Saving...` when applicable).
- Trim inputs before validation; surface user-facing validation with `showWarning`, and reserve `handleError` for API errors.
- Delete flows use `useConfirmDialog` with explicit title/message and disable buttons while deleting.
- Preserve legacy `window.dispatchEvent` events (e.g., `education:changed`, `skills:changed`) alongside React Query invalidation.

---

## LinkedIn Integration

**Location:** `components/LinkedIn/`

### LinkedInButton

OAuth button for LinkedIn profile import.

**Features:**

- Initiates OAuth flow
- Imports profile data on callback
- Populates education, employment, skills

---

## Dashboard Widgets

**Location:** `components/profile/`

### SummaryCards

Displays counts of profile sections.

```tsx
<SummaryCards
  counts={{
    employmentCount: 5,
    skillsCount: 12,
    educationCount: 2,
    projectsCount: 3,
  }}
/>
```

**Cards:**

- Employment History count
- Skills count
- Education count
- Projects count

### ProfileCompletion

Shows profile completeness percentage with tips.

**Features:**

- Progress bar (0-100%)
- Checklist of incomplete sections
- Links to complete each section

### CareerTimeline

Visual timeline of employment history.

**Props:**

- `events: CareerEvent[]` - Employment entries

**Display:**

- Vertical timeline
- Company logo/initials
- Job title and date range
- Description preview

### SkillsDistributionChart

Pie/donut chart of skills by category.

**Props:**

- `skills: { name: string; value: number }[]`

**Categories:**

- Technical
- Soft Skills
- Tools
- Languages
- Other

### RecentActivityTimeline

Shows recent profile/document changes.

**Props:**

- `activities: Activity[]`

**Activity Types:**

- Document created
- Profile updated
- Job application added
- Interview scheduled

### ProfileStrengthTips

AI-generated tips to improve profile.

**Features:**

- Calls `/api/generate/profile-tips` endpoint
- Displays actionable suggestions
- Links to relevant sections

### ExportProfileButton

Exports profile data in various formats.

**Options:**

- PDF resume
- JSON data export
- LinkedIn-compatible format

### GenerateProfileTips

Trigger button for AI profile analysis.

**Features:**

- Loading state during generation
- Displays tips in modal or inline

---

## Page Components

### Dashboard (`pages/dashboard/Dashboard.tsx`)

Main profile overview page combining all widgets.

**Layout:**

```
┌─────────────────────────────────────────┐
│ Header (Avatar, Name, Email)            │
├──────────────────┬──────────────────────┤
│ Summary Cards    │ Profile Completion   │
├──────────────────┴──────────────────────┤
│ Career Timeline                          │
├─────────────────────────────────────────┤
│ Skills Chart      │ Recent Activity     │
├─────────────────────────────────────────┤
│ Profile Tips                             │
└─────────────────────────────────────────┘
```

**Data Loading:**

1. Fetch profile from DB
2. Fetch employment, skills, education, projects
3. Map to UI types
4. Calculate counts and completeness

### ProfileDetails (`pages/profile/ProfileDetails.tsx`)

Edit basic profile information.

**Sections:**

- Personal Info (name, email, phone)
- Location (city, state)
- Professional (headline, bio, industry, experience level)
- Avatar upload

### Settings (`pages/profile/Settings.tsx`)

Account settings page.

**Features:**

- Email preferences
- Notification settings
- Privacy controls
- Theme preferences

### DeleteAccount (`pages/profile/DeleteAccount.tsx`)

Account deletion flow.

**Steps:**

1. Confirmation prompt
2. Password verification
3. Data deletion
4. Logout and redirect

---

## Employment Pages

**Location:** `pages/employment/`

### EmploymentHistoryList

List view of all employment entries.

**Features:**

- Cards with job details
- Edit/Delete actions
- Add new button
- Sort by date

### EmploymentForm

Form component for add/edit.

**Props:**

- `initialData?: EmploymentRow` - For edit mode
- `onSubmit: (data) => Promise<void>`
- `onCancel: () => void`

### EditEmploymentModal

Modal wrapper for EmploymentForm.

---

## Education Pages

**Location:** `pages/education/`

### EducationOverview

List of education entries with CRUD.

**Features:**

- Card layout
- Degree, institution, dates
- GPA (if not private)
- Honors display
- Edit/Delete actions

---

## Skills Pages

**Location:** `pages/skills/`

### SkillsOverview

Drag-and-drop skill management.

**Features:**

- Grouped by category
- Proficiency level badges
- Reorder within categories
- Add/Edit/Delete actions
- Uses `@hello-pangea/dnd`

**Drag-Drop Implementation:**

```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  {categories.map((category) => (
    <Droppable droppableId={category.id}>
      {(provided) => (
        <div ref={provided.innerRef}>
          {category.skills.map((skill, index) => (
            <Draggable key={skill.id} draggableId={skill.id} index={index}>
              {(provided) => (
                <SkillCard
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                />
              )}
            </Draggable>
          ))}
        </div>
      )}
    </Droppable>
  ))}
</DragDropContext>
```

---

## Projects Pages

**Location:** `pages/projects/`

### ProjectPortfolio

Grid view of projects.

**Features:**

- Card with image preview
- Project name, status badge
- Technologies chips
- View details link

### ProjectDetails

Full project view.

**Sections:**

- Hero image
- Description
- Role and team
- Technologies used
- Outcomes
- Links

### AddProjectForm

Form for creating/editing projects.

**Features:**

- Media upload with preview
- Technology tag input
- Rich text description
- Status dropdown

---

## Certifications Pages

**Location:** `pages/certifications/`

### Certifications

List view with upload support.

**Features:**

- Card layout with cert image
- Organization and dates
- Expiration tracking
- Verification badge
- File upload for credentials

---

## Authentication Pages

**Location:** `pages/auth/`

### Login

Email/password login form.

**Features:**

- Email validation
- Password field
- "Forgot password" link
- "Register" link
- Social login options

### Register

New account creation.

**Fields:**

- First name, Last name
- Email
- Password (with strength indicator)
- Confirm password
- Terms acceptance

### ForgetPassword

Password reset request.

**Flow:**

1. Enter email
2. Receive reset link
3. Redirect to ResetPassword

### ResetPassword

Set new password.

**Features:**

- Token validation
- New password input
- Confirmation

### AuthCallback

Handles OAuth redirects.

**Flow:**

1. Parse callback params
2. Exchange code for session
3. Redirect to dashboard
