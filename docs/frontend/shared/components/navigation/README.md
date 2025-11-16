# Navigation Components

Breadcrumb navigation and hierarchical page navigation components.

## Overview

Navigation components help users understand their current location in the app and navigate back through the hierarchy.

## Components

### Breadcrumbs.tsx

**Purpose**: Hierarchical navigation breadcrumbs showing the current page location.

**Features**:

- Automatic current page highlighting (last item not clickable)
- Material-UI Breadcrumbs component wrapper
- Supports custom separators
- Accessible navigation with proper ARIA labels
- Theme-aware styling
- Responsive (truncates on small screens)

**Usage**:

```tsx
import { Breadcrumbs } from "@shared/components/navigation";

function ProfilePage() {
  const paths = [
    { label: "Home", to: "/" },
    { label: "Profile", to: "/profile" },
    { label: "Education" }, // Current page (no 'to' prop)
  ];

  return (
    <div>
      <Breadcrumbs paths={paths} />
      {/* Page content */}
    </div>
  );
}
```

**Props**:

```tsx
interface BreadcrumbPath {
  label: string; // Display text
  to?: string; // React Router path (omit for current page)
}

interface BreadcrumbsProps {
  paths: BreadcrumbPath[];
  separator?: React.ReactNode; // Default: '/'
  maxItems?: number; // Collapse if more items (default: undefined)
}
```

**Styling**:

- Uses MUI's `Link` component for navigation
- Color: `text.primary` for links, `text.disabled` for current page
- Hover state: Underline on hover
- Mobile: Collapses to last 2 items if `maxItems` prop is set

---

## Examples

### Basic Three-Level Breadcrumbs

```tsx
<Breadcrumbs
  paths={[
    { label: "Home", to: "/" },
    { label: "Jobs", to: "/jobs" },
    { label: "Pipeline" },
  ]}
/>
```

**Renders**: Home / Jobs / Pipeline

---

### Custom Separator

```tsx
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

<Breadcrumbs paths={paths} separator={<ChevronRightIcon fontSize="small" />} />;
```

**Renders**: Home › Jobs › Pipeline

---

### Deep Hierarchy with Collapse

```tsx
<Breadcrumbs
  paths={[
    { label: "Home", to: "/" },
    { label: "Profile", to: "/profile" },
    { label: "Projects", to: "/profile/projects" },
    { label: "My Portfolio", to: "/profile/projects/123" },
    { label: "Edit Project" },
  ]}
  maxItems={3}
/>
```

**Renders**: Home / ... / My Portfolio / Edit Project

---

### Programmatic Breadcrumbs (from Route)

```tsx
import { useLocation } from "react-router-dom";

function AutoBreadcrumbs() {
  const location = useLocation();

  // Build breadcrumbs from pathname
  const paths = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      to:
        index < segments.length - 1
          ? "/" + segments.slice(0, index + 1).join("/")
          : undefined,
    }));
  }, [location.pathname]);

  return <Breadcrumbs paths={[{ label: "Home", to: "/" }, ...paths]} />;
}
```

---

## Accessibility

### Keyboard Navigation

- Tab: Move between breadcrumb links
- Enter/Space: Activate link
- Arrow keys: Not implemented (standard link behavior)

### Screen Readers

- Uses `<nav>` element with `aria-label="breadcrumb"`
- Current page has `aria-current="page"`
- Link text is descriptive (avoids "Click here")

### Focus Indicators

- Clear focus ring on keyboard navigation
- High contrast in both light and dark themes

---

## Common Patterns

### Breadcrumbs in Layout

Place breadcrumbs consistently at the top of each page:

```tsx
function ProfileLayout() {
  return (
    <Box>
      <AppShell sidebar={<ProfileSidebar />}>
        <Box sx={{ p: 3 }}>
          <Breadcrumbs paths={breadcrumbPaths} />
          <Typography variant="h4" sx={{ mt: 2, mb: 3 }}>
            Page Title
          </Typography>
          <Outlet />
        </Box>
      </AppShell>
    </Box>
  );
}
```

### Dynamic Breadcrumbs with Data

```tsx
function ProjectDetails() {
  const { id } = useParams();
  const { data: project } = useProject(id);

  const paths = useMemo(
    () => [
      { label: "Home", to: "/" },
      { label: "Profile", to: "/profile" },
      { label: "Projects", to: "/profile/projects" },
      { label: project?.name || "Loading..." },
    ],
    [project]
  );

  return (
    <div>
      <Breadcrumbs paths={paths} />
      {/* Project details */}
    </div>
  );
}
```

### Breadcrumbs with Icons

```tsx
import HomeIcon from "@mui/icons-material/Home";
import PersonIcon from "@mui/icons-material/Person";

<Breadcrumbs
  paths={[
    {
      label: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Home
        </Box>
      ),
      to: "/",
    },
    {
      label: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <PersonIcon fontSize="small" />
          Profile
        </Box>
      ),
    },
  ]}
/>;
```

---

## Removed Components

### BackButton.tsx ❌

**Status**: Deleted (0 usages found)

**Reason**: Browsers have built-in back buttons. Custom back buttons are:

- Redundant
- Can break expected browser behavior
- Hard to maintain consistent with browser history
- Confusing when history stack is complex

**Alternative**: Use breadcrumbs or explicit navigation links instead.

---

### NavTabs.tsx ❌

**Status**: Deleted (0 usages found)

**Reason**: Workspace-specific navigation moved to sidebars. Tabs were:

- Inconsistent with sidebar navigation pattern
- Not responsive on mobile
- Limited space for many nav items

**Alternative**: Use `WorkspaceSidebar` components or MUI Tabs directly if needed.

---

## Testing

### Unit Tests

```tsx
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Breadcrumbs } from "@shared/components/navigation";

test("renders breadcrumb links", () => {
  render(
    <BrowserRouter>
      <Breadcrumbs
        paths={[
          { label: "Home", to: "/" },
          { label: "Profile", to: "/profile" },
          { label: "Settings" },
        ]}
      />
    </BrowserRouter>
  );

  expect(screen.getByText("Home")).toHaveAttribute("href", "/");
  expect(screen.getByText("Profile")).toHaveAttribute("href", "/profile");
  expect(screen.getByText("Settings")).not.toHaveAttribute("href");
});

test("current page is not a link", () => {
  render(
    <BrowserRouter>
      <Breadcrumbs
        paths={[{ label: "Home", to: "/" }, { label: "Current Page" }]}
      />
    </BrowserRouter>
  );

  const current = screen.getByText("Current Page");
  expect(current.tagName).not.toBe("A");
  expect(current).toHaveAttribute("aria-current", "page");
});
```

### Integration Tests

```tsx
test("navigates when breadcrumb clicked", async () => {
  const user = userEvent.setup();

  render(
    <BrowserRouter>
      <Breadcrumbs
        paths={[
          { label: "Home", to: "/" },
          { label: "Profile", to: "/profile" },
          { label: "Settings" },
        ]}
      />
    </BrowserRouter>
  );

  await user.click(screen.getByText("Home"));

  // Assert navigation occurred
  expect(window.location.pathname).toBe("/");
});
```

---

## Related Documentation

- [Sidebar Components](../sidebars/README.md)
- [Complete Component Catalog](../../../../shared-components.md)
- [Layouts](../../layouts/README.md)
