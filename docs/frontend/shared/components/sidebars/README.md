# Sidebar Components

Workspace-specific navigation sidebars built on a shared base component for consistency.

## Overview

Each workspace (Profile, AI, Jobs) has its own sidebar with navigation links specific to that workspace. All sidebars share common functionality through the `WorkspaceSidebar` base component.

## Architecture

### Base Component Pattern

```
WorkspaceSidebar (base)
  ├── AISidebar
  ├── JobsSidebar
  └── ProfileSidebar
```

**WorkspaceSidebar** provides:

- Drawer layout (permanent on desktop, temporary on mobile)
- Workspace header with icon and title
- Navigation list with active state highlighting
- Responsive behavior
- Theme integration
- Consistent spacing and styling

**Workspace-specific sidebars** provide:

- Navigation items (label, path, icon)
- Workspace branding (name, icon)
- Workspace-specific styling overrides

---

## Components

### WorkspaceSidebar.tsx

**Purpose**: Reusable base component for all workspace sidebars.

**Features**:

- Drawer-based layout
- Permanent mode (desktop): Always visible
- Temporary mode (mobile): Collapsible
- Active route highlighting
- Icon + label navigation items
- Workspace header section
- Theme-aware styling

**Props**:

```tsx
interface NavItem {
  label: string; // Display text
  to: string; // React Router path
  icon: React.ReactNode; // Icon element (usually MUI icon)
}

interface WorkspaceSidebarProps {
  workspaceName: string; // e.g., "AI Workspace"
  workspaceIcon: React.ReactNode; // Icon for workspace header
  navItems: NavItem[]; // Navigation links
  width?: number; // Sidebar width in pixels (default: 260)
}
```

**Not Used Directly**: This is a base component. Use workspace-specific sidebars instead.

---

### AISidebar.tsx

**Purpose**: Navigation for AI Workspace (resume/cover letter generation, job matching).

**Routes**:

```tsx
const navItems = [
  { label: "Dashboard", to: "/ai", icon: <DashboardIcon /> },
  { label: "Resume", to: "/ai/resume", icon: <DescriptionIcon /> },
  { label: "Cover Letter", to: "/ai/cover-letter", icon: <EmailIcon /> },
  { label: "Job Match", to: "/ai/job-match", icon: <WorkIcon /> },
  {
    label: "Company Research",
    to: "/ai/company-research",
    icon: <BusinessIcon />,
  },
  { label: "Templates", to: "/ai/templates", icon: <LibraryBooksIcon /> },
];
```

**Usage**:

```tsx
import { AISidebar } from "@shared/components/sidebars";

<AppShell sidebar={<AISidebar />}>{/* AI workspace content */}</AppShell>;
```

---

### JobsSidebar.tsx

**Purpose**: Navigation for Jobs Workspace (pipeline, analytics, documents).

**Routes**:

```tsx
const navItems = [
  { label: "Dashboard", to: "/jobs", icon: <DashboardIcon /> },
  { label: "Pipeline", to: "/jobs/pipeline", icon: <ViewKanbanIcon /> },
  { label: "New Job", to: "/jobs/new", icon: <AddIcon /> },
  { label: "Documents", to: "/jobs/documents", icon: <FolderIcon /> },
  {
    label: "Saved Searches",
    to: "/jobs/saved-searches",
    icon: <BookmarkIcon />,
  },
  { label: "Analytics", to: "/jobs/analytics", icon: <BarChartIcon /> },
  { label: "Automations", to: "/jobs/automations", icon: <SmartToyIcon /> },
];
```

**Usage**:

```tsx
import { JobsSidebar } from "@shared/components/sidebars";

<AppShell sidebar={<JobsSidebar />}>{/* Jobs workspace content */}</AppShell>;
```

---

### ProfileSidebar.tsx

**Purpose**: Navigation for Profile Workspace (personal info, employment, education, skills).

**Routes**:

```tsx
const navItems = [
  { label: "Dashboard", to: "/profile", icon: <DashboardIcon /> },
  { label: "Personal Info", to: "/profile/details", icon: <PersonIcon /> },
  { label: "Employment", to: "/profile/employment", icon: <WorkIcon /> },
  { label: "Education", to: "/profile/education", icon: <SchoolIcon /> },
  { label: "Skills", to: "/profile/skills", icon: <StarIcon /> },
  {
    label: "Certifications",
    to: "/profile/certifications",
    icon: <WorkspacePremiumIcon />,
  },
  { label: "Projects", to: "/profile/projects", icon: <FolderIcon /> },
  { label: "Settings", to: "/profile/settings", icon: <SettingsIcon /> },
];
```

**Usage**:

```tsx
import { ProfileSidebar } from "@shared/components/sidebars";

<AppShell sidebar={<ProfileSidebar />}>
  {/* Profile workspace content */}
</AppShell>;
```

---

## Adding New Routes

### To Existing Workspace

Update the corresponding sidebar's `navItems` array:

```tsx
// In AISidebar.tsx
const navItems = [
  // ...existing items
  {
    label: "New Feature",
    to: "/ai/new-feature",
    icon: <NewIcon />,
  },
];
```

Don't forget to:

1. Add the route to `router.tsx`
2. Create the page component
3. Update workspace documentation

---

### New Workspace (Advanced)

1. Create new sidebar component extending `WorkspaceSidebar`
2. Define navigation items
3. Create workspace layout
4. Add routes to router
5. Document the workspace

Example:

```tsx
// AnalyticsSidebar.tsx
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import AnalyticsIcon from "@mui/icons-material/Analytics";

const navItems = [
  { label: "Overview", to: "/analytics", icon: <DashboardIcon /> },
  { label: "Reports", to: "/analytics/reports", icon: <AssessmentIcon /> },
];

export default function AnalyticsSidebar() {
  return (
    <WorkspaceSidebar
      workspaceName="Analytics"
      workspaceIcon={<AnalyticsIcon />}
      navItems={navItems}
    />
  );
}
```

---

## Responsive Behavior

### Desktop (≥960px)

- Sidebar is **permanent** (always visible)
- Width: 260px
- Pushes main content to the right
- Scrollable if content exceeds viewport height

### Mobile (<960px)

- Sidebar is **temporary** (drawer)
- Opens with hamburger menu
- Overlays main content
- Backdrop closes sidebar when clicked
- Swipe-to-close gesture support

---

## Active State Highlighting

The sidebar automatically highlights the current route:

- **Active item**: Bold text, primary color, background highlight
- **Inactive items**: Normal text, default color
- **Hover state**: Slight background color change

**How it works**:

```tsx
// WorkspaceSidebar.tsx
const location = useLocation();
const isActive = (path: string) => location.pathname === path;

<ListItemButton selected={isActive(item.to)} component={NavLink} to={item.to}>
  {/* ... */}
</ListItemButton>;
```

---

## Refactoring Impact

**Before Refactoring** (duplicated code):

- AISidebar: 85 lines
- JobsSidebar: 88 lines
- ProfileSidebar: 92 lines
- **Total**: 265 lines with ~70% duplication

**After Refactoring** (base component pattern):

- WorkspaceSidebar (base): 78 lines
- AISidebar: 25 lines
- JobsSidebar: 28 lines
- ProfileSidebar: 32 lines
- **Total**: 163 lines (-38% reduction)

**Benefits**:

- ✅ Single source of truth for sidebar logic
- ✅ Consistent behavior across workspaces
- ✅ Easier to maintain and update
- ✅ Faster to add new workspaces
- ✅ Bug fixes apply to all sidebars

---

## Customization

### Custom Width

```tsx
<WorkspaceSidebar
  workspaceName="Wide Workspace"
  workspaceIcon={<Icon />}
  navItems={items}
  width={320} // Wider sidebar
/>
```

### Custom Styling (Advanced)

Override styles in workspace-specific sidebar:

```tsx
export default function CustomSidebar() {
  return (
    <Box
      sx={{
        "& .MuiDrawer-paper": {
          borderRight: "2px solid",
          borderColor: "primary.main",
        },
      }}
    >
      <WorkspaceSidebar
        workspaceName="Custom"
        workspaceIcon={<Icon />}
        navItems={items}
      />
    </Box>
  );
}
```

---

## Testing

### Unit Tests

```tsx
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AISidebar } from "@shared/components/sidebars";

test("renders all navigation items", () => {
  render(
    <BrowserRouter>
      <AISidebar />
    </BrowserRouter>
  );

  expect(screen.getByText("Dashboard")).toBeInTheDocument();
  expect(screen.getByText("Resume")).toBeInTheDocument();
  expect(screen.getByText("Cover Letter")).toBeInTheDocument();
});

test("highlights active route", () => {
  window.history.pushState({}, "", "/ai/resume");

  render(
    <BrowserRouter>
      <AISidebar />
    </BrowserRouter>
  );

  const resumeLink = screen.getByText("Resume").closest("a");
  expect(resumeLink).toHaveClass("Mui-selected");
});
```

### Integration Tests

```tsx
test("navigates to route when item clicked", async () => {
  const user = userEvent.setup();

  render(
    <BrowserRouter>
      <AISidebar />
    </BrowserRouter>
  );

  await user.click(screen.getByText("Resume"));

  expect(window.location.pathname).toBe("/ai/resume");
});
```

---

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between sidebar items
- **Enter/Space**: Activate selected item
- **Arrow keys**: Move up/down list (native list behavior)

### Screen Readers

- Sidebar uses `<nav>` element
- Each item has descriptive text
- Active item announced as "selected"
- Icon labels included for context

### Focus Management

- First item receives focus when sidebar opens
- Focus trapped in sidebar when mobile drawer is open
- Focus returns to trigger button when drawer closes

---

## Common Patterns

### Sidebar in Layout

```tsx
function AiLayout() {
  return (
    <AppShell sidebar={<AISidebar />}>
      <Outlet />
    </AppShell>
  );
}
```

### Conditional Sidebar Items

```tsx
function ConditionalSidebar() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const navItems = [
    { label: "Dashboard", to: "/ai", icon: <DashboardIcon /> },
    // Conditionally add admin item
    ...(isAdmin
      ? [{ label: "Admin", to: "/ai/admin", icon: <AdminIcon /> }]
      : []),
  ];

  return (
    <WorkspaceSidebar
      workspaceName="AI"
      workspaceIcon={<SmartToyIcon />}
      navItems={navItems}
    />
  );
}
```

### Badge on Sidebar Item (e.g., notifications)

```tsx
const navItems = [
  {
    label: (
      <Badge badgeContent={5} color="error">
        <Typography>Notifications</Typography>
      </Badge>
    ),
    to: "/notifications",
    icon: <NotificationsIcon />,
  },
];
```

---

## Related Documentation

- [Navigation Components](../navigation/README.md)
- [AppShell Layout](../../layouts/AppShell.md)
- [Complete Component Catalog](../../../../shared-components.md)
