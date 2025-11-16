# Shared Layouts

Core layout components that structure the application's UI hierarchy.

## Structure

```
layouts/
├── AppShell.tsx       # Main layout wrapper (top bar + sidebar + content + system layer)
├── GlobalTopBar.tsx   # Global navigation bar with workspace switcher
└── SystemLayer.tsx    # Global UI layer (notifications, modals, overlays)
```

## Files

### `AppShell.tsx`

**Purpose**: Main layout wrapper that structures every page in the application.

**Component Interface**:

```tsx
type AppShellProps = {
  sidebar?: React.ReactNode; // Optional sidebar slot
  children?: React.ReactNode; // Main content area
};
```

**Layout Structure**:

```
┌──────────────────────────────────────┐
│ GlobalTopBar (sticky)                 │
├─────────┬────────────────────────────┤
│         │                             │
│ Sidebar │ Main Content Area           │
│ (280px) │ (Container maxWidth="xl")   │
│         │                             │
│         │                             │
└─────────┴────────────────────────────┘
SystemLayer (absolute, bottom)
```

**Responsive Behavior**:

- **Desktop** (md+): Sidebar 280px wide, content grows to fill
- **Mobile** (< md): Sidebar hidden (0px), content full width

**Usage Locations**: 3 workspace layouts

**Import Pattern**:

```tsx
import AppShell from "@shared/layouts/AppShell";
import ProfileSidebar from "./ProfileSidebar";

export default function ProfileLayout() {
  return (
    <AppShell sidebar={<ProfileSidebar />}>
      <Outlet /> {/* Nested routes render here */}
    </AppShell>
  );
}
```

**Why this pattern?**

- ✅ Consistent layout across all workspaces
- ✅ Sidebar slot allows workspace-specific navigation
- ✅ `SystemLayer` at bottom ensures global notifications appear on every page
- ✅ Single source of truth for app structure

---

### `GlobalTopBar.tsx`

**Purpose**: Global navigation bar with workspace switcher, quick actions, theme toggle, and profile menu.

**Features**:

- ✅ Sticky app bar with glassmorphism effect
- ✅ Logo and workspace branding (changes based on route)
- ✅ Workspace switcher menu (Profile, Jobs, AI)
- ✅ Quick action buttons (New Job, Resume, Cover Letter)
- ✅ Theme toggle (light/dark mode)
- ✅ Profile menu with avatar
- ✅ Mobile drawer navigation
- ✅ Avatar loading with caching (via `useAvatar` hook)

**Workspace Detection**:

```ts
const currentWorkspace = useMemo(() => {
  if (location.pathname.startsWith("/ai")) return "AI";
  if (location.pathname.startsWith("/jobs")) return "JOBS";
  return "PROFILE";
}, [location.pathname]);
```

**Navigation Structure**:

```
WORKSPACE_ITEMS:           PROFILE_TOOL_ITEMS:      JOBS_TOOL_ITEMS:       AI_TOOL_ITEMS:
- Profile Workspace        - Dashboard              - Pipeline             - AI Home
- Jobs Workspace           - Education              - New Job              - Resume Editor
- AI Workspace             - Employment             - Documents            - Cover Letter
                           - Projects               - Saved Searches       - Job Match
                           - Skills                 - Analytics            - Company Research
                           - Certifications
```

**Visual Styling**:

- Glassmorphism with backdrop blur
- Opacity increases slightly on scroll
- Border bottom for depth
- AI workspace gets special highlight (blue glow on logo)

**Mobile Behavior**:

- Desktop: Full menu with dropdowns
- Mobile: Hamburger menu → right-side drawer

**Usage Locations**: Rendered by `AppShell` (appears on every page)

**Import Pattern**:

```tsx
import GlobalTopBar from "./GlobalTopBar";

// Rendered in AppShell
<GlobalTopBar />;
```

**Performance Optimization**:

- Avatar URLs cached in localStorage (1-hour TTL)
- Real-time avatar updates via Supabase subscription
- Memoized workspace detection
- Stable callbacks with `useCallback`

---

### `SystemLayer.tsx`

**Purpose**: Global UI layer for notifications, modals, and overlays that should appear above all content.

**Features**:

- ✅ Global `ErrorSnackbar` (connected to `useErrorHandler`)
- ✅ Sprint task snackbar (commented out for demo)
- ✅ Future: Global modals, confirm dialogs, loading overlays

**Why this exists?**

**Problem**: Every page manually rendered `<ErrorSnackbar />`. Duplication, easy to forget, inconsistent.

**Solution**: Render once in `SystemLayer`, use `useErrorHandler` from any component.

**Current Content**:

```tsx
export default function SystemLayer() {
  const { notification, closeNotification } = useErrorHandler();

  return (
    <Box>
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
      {/* Sprint task overlay - disabled for demo */}
      {/* Global modals go here */}
    </Box>
  );
}
```

**Usage Locations**: Rendered by `AppShell` (bottom of every page)

**Import Pattern**:

```tsx
import SystemLayer from "./SystemLayer";

// Rendered in AppShell
<SystemLayer />;
```

**Future Extensions**:

- Global loading overlay (`<LoadingOverlay />`)
- Global confirmation dialog (`<GlobalConfirmDialog />`)
- Toast notifications (`<ToastContainer />`)
- Cookie consent banner (`<CookieBanner />`)

---

## Layout Hierarchy

```
main.tsx
├── ThemeContextProvider
│   ├── AuthContextProvider
│   │   ├── ConfirmDialogProvider
│   │   │   └── RouterProvider
│   │   │       └── Routes
│   │   │           ├── ProfileLayout
│   │   │           │   └── AppShell
│   │   │           │       ├── GlobalTopBar
│   │   │           │       ├── ProfileSidebar
│   │   │           │       ├── Outlet (profile pages)
│   │   │           │       └── SystemLayer
│   │   │           ├── JobsLayout
│   │   │           │   └── AppShell
│   │   │           │       ├── GlobalTopBar
│   │   │           │       ├── JobsSidebar
│   │   │           │       ├── Outlet (jobs pages)
│   │   │           │       └── SystemLayer
│   │   │           └── AiLayout
│   │   │               └── AppShell
│   │   │                   ├── GlobalTopBar
│   │   │                   ├── AISidebar
│   │   │                   ├── Outlet (AI pages)
│   │   │                   └── SystemLayer
```

**Key Points**:

1. `AppShell` wraps every workspace
2. `GlobalTopBar` appears on every page
3. `SystemLayer` renders global UI on every page
4. Each workspace provides its own sidebar
5. Nested routes render in `<Outlet />`

---

## Design Decisions

### Why AppShell pattern?

**Alternative 1**: Each page manually renders layout components.

- ❌ Duplication across 20+ pages
- ❌ Easy to forget GlobalTopBar or SystemLayer
- ❌ Inconsistent spacing/padding

**Alternative 2**: Layout route wrapper.

- ❌ Still duplicated across 3 workspaces
- ❌ Harder to customize per workspace

**AppShell Solution**:

- ✅ Single source of truth for layout structure
- ✅ Workspace-specific sidebars via slot pattern
- ✅ Consistent spacing, padding, responsiveness
- ✅ Easy to add global features (header, footer, etc.)

### Why separate GlobalTopBar?

**Could be inline in AppShell**: Yes, but:

- ❌ AppShell would be 500+ lines (too large)
- ❌ Harder to test navigation logic
- ❌ Harder to modify styling
- ✅ Separation of concerns (layout vs. navigation)

### Why SystemLayer?

**Before**: Every page rendered `<ErrorSnackbar />`.

```tsx
function JobsPage() {
  const { notification, closeNotification } = useErrorHandler();
  return (
    <>
      <JobsContent />
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </>
  );
}
```

**Problem**: Duplicated across 30+ pages. Easy to forget. Inconsistent z-index.

**After**: Render once in `SystemLayer`, accessible from anywhere.

```tsx
function JobsPage() {
  const { handleError, showSuccess } = useErrorHandler();
  // No need to render ErrorSnackbar - it's in SystemLayer!
  return <JobsContent />;
}
```

**Result**: 30+ fewer `<ErrorSnackbar />` components. Consistent behavior.

### Why glassmorphism in GlobalTopBar?

**Design Goals**:

- Modern, polished look
- Content visible beneath (depth)
- Lightweight feel (not heavy solid bar)

**Implementation**:

- `backdrop-filter: blur(16px)`
- Semi-transparent background
- Slight opacity increase on scroll
- Border bottom for definition

---

## Responsive Behavior

### Desktop (md and above)

```
┌────────────────────────────────────────┐
│ GlobalTopBar (full menu)               │
├─────────┬──────────────────────────────┤
│         │                               │
│ Sidebar │ Main Content                  │
│ 280px   │ (grows to fill)               │
│         │                               │
└─────────┴──────────────────────────────┘
```

### Mobile (< md)

```
┌────────────────────────────────────────┐
│ GlobalTopBar (hamburger menu)     [≡] │
├────────────────────────────────────────┤
│                                         │
│ Main Content (full width)               │
│ Sidebar hidden (0px)                    │
│                                         │
└────────────────────────────────────────┘
```

**Mobile Navigation**:

- Hamburger icon opens right-side drawer
- Drawer contains workspace switcher + tool items
- Close drawer to return to content

---

## Common Patterns

### Creating a new workspace layout

```tsx
import { Outlet } from "react-router-dom";
import AppShell from "@shared/layouts/AppShell";
import MySidebar from "./MySidebar";

export default function MyWorkspaceLayout() {
  return (
    <AppShell sidebar={<MySidebar />}>
      <Outlet />
    </AppShell>
  );
}
```

### Adding a global UI element

```tsx
// In SystemLayer.tsx
export default function SystemLayer() {
  const { notification, closeNotification } = useErrorHandler();
  const { showCookieBanner, closeCookieBanner } = useCookieConsent();

  return (
    <Box>
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
      {showCookieBanner && <CookieBanner onClose={closeCookieBanner} />}
      {/* More global UI here */}
    </Box>
  );
}
```

### Customizing GlobalTopBar per workspace

**Current approach**: Use `currentWorkspace` state to change branding:

```tsx
const highlightAi = currentWorkspace === "AI";

<Typography variant="h6" fontWeight={800}>
  {highlightAi ? "AI Workspace" : "Job Search Hub"}
</Typography>

<Box
  component="img"
  src={logo}
  sx={{
    filter: highlightAi
      ? "drop-shadow(0 0 12px rgba(63,123,255,0.45))" // Blue glow
      : "drop-shadow(0 4px 12px rgba(15,23,42,0.2))",  // Normal shadow
  }}
/>
```

---

## Workspace Layouts

### ProfileLayout (`workspaces/profile/ProfileLayout.tsx`)

```tsx
import AppShell from "@shared/layouts/AppShell";
import ProfileSidebar from "./ProfileSidebar";

export default function ProfileLayout() {
  return (
    <AppShell sidebar={<ProfileSidebar />}>
      <Outlet />
    </AppShell>
  );
}
```

**Sidebar Items**:

- Dashboard
- Education
- Employment
- Projects
- Skills
- Certifications
- Profile Details
- Delete Account

---

### JobsLayout (`workspaces/jobs/JobsLayout.tsx`)

```tsx
import AppShell from "@shared/layouts/AppShell";
import JobsSidebar from "./JobsSidebar";

export default function JobsLayout() {
  return (
    <AppShell sidebar={<JobsSidebar />}>
      <Outlet />
    </AppShell>
  );
}
```

**Sidebar Items**:

- Pipeline
- New Job
- Documents & Materials
- Saved Searches
- Analytics
- Automations
- Archived Jobs

---

### AiLayout (`workspaces/ai/AiLayout.tsx`)

```tsx
import AppShell from "@shared/layouts/AppShell";
import AISidebar from "./AISidebar";

export default function AiLayout() {
  return (
    <AppShell sidebar={<AISidebar />}>
      <Outlet />
    </AppShell>
  );
}
```

**Sidebar Items**:

- AI Dashboard
- Resume Generator
- Cover Letter Writer
- Job Matching
- Company Research
- Templates Hub

---

## Styling Tokens

GlobalTopBar uses design tokens from the theme:

```ts
const appBarCfg = (theme as any).designTokens?.palette.appBar;
const appBarBgBase = appBarCfg?.bg ?? theme.palette.background.default;
const appBarOpacity = appBarCfg?.glassOpacity ?? 0.85;
const appBarBlur = appBarCfg?.blur ?? 16;
const appBarColor = appBarCfg?.color ?? theme.palette.text.primary;
const appBarBorder = appBarCfg?.border ?? theme.palette.divider;
```

**Fallbacks**: If design tokens not defined, falls back to MUI theme palette.

---

## Performance Considerations

### GlobalTopBar optimizations

1. **Avatar caching**:

   - Signed URLs cached in localStorage (1-hour TTL)
   - Reduces Supabase Storage API calls
   - Re-fetches 10 seconds before expiry

2. **Memoized values**:

   - `currentWorkspace` computed once per route change
   - `toolItems` only recalculated when workspace changes
   - Stable callbacks with `useCallback`

3. **Real-time updates**:
   - Supabase subscription for profile changes
   - Only subscribes when user logged in
   - Unsubscribes on unmount

### SystemLayer optimizations

1. **Single ErrorSnackbar**:

   - One instance instead of 30+
   - Reduces React component tree size
   - Consistent z-index (always on top)

2. **Sprint task snackbar**:
   - Commented out for demo (performance win)
   - Re-enable when needed for development

---

## Verification

**Type check**:

```powershell
npm run typecheck
```

**Find layout usage**:

```powershell
# AppShell usage
grep -r "AppShell" frontend/src

# GlobalTopBar should only be in AppShell
grep -r "GlobalTopBar" frontend/src

# SystemLayer should only be in AppShell
grep -r "SystemLayer" frontend/src
```

**Test responsive behavior**:

1. Open app in browser
2. Resize to mobile (< 900px)
3. Verify sidebar hides, hamburger appears
4. Click hamburger → drawer opens
5. Navigate to page → drawer closes

---

## Future Enhancements

### Potential additions

1. **Footer component** (`GlobalFooter.tsx`):

   - Copyright notice
   - Links (Privacy, Terms, Help)
   - Social media links

2. **Breadcrumbs in AppShell**:

   - Show navigation path
   - Quick back button
   - Workspace > Section > Page

3. **GlobalSearch overlay**:

   - Cmd+K shortcut
   - Search jobs, documents, pages
   - Quick navigation

4. **Workspace switcher keyboard shortcuts**:

   - Cmd+1 → Profile
   - Cmd+2 → Jobs
   - Cmd+3 → AI

5. **Persistent sidebar state**:
   - Remember collapsed/expanded
   - Save in localStorage
   - Per-workspace preference

---

## Migration Notes

### Before AppShell pattern

Each workspace had duplicated layout code:

```tsx
function ProfileWorkspace() {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <GlobalTopBar />
      <Box sx={{ display: "flex", flex: 1 }}>
        <Box component="nav" sx={{ width: { xs: 0, md: 280 } }}>
          <ProfileSidebar />
        </Box>
        <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
          <Container maxWidth="xl">
            <Outlet />
          </Container>
        </Box>
      </Box>
      <SystemLayer />
    </Box>
  );
}
```

**Problem**: Duplicated across 3 workspaces (90+ lines each).

### After AppShell pattern

```tsx
function ProfileLayout() {
  return (
    <AppShell sidebar={<ProfileSidebar />}>
      <Outlet />
    </AppShell>
  );
}
```

**Result**: 90 lines → 7 lines. Single source of truth.

---

## Troubleshooting

### Sidebar not showing on mobile

**Issue**: Sidebar slot is `width: { xs: 0, md: 280 }`.

**Solution**: Mobile navigation is in GlobalTopBar's hamburger menu (intentional).

### ErrorSnackbar not appearing

**Check**:

1. Is `SystemLayer` rendered in `AppShell`? ✅
2. Is `useErrorHandler` called correctly? ✅
3. Is `notification.open` set to `true`?
4. Is z-index correct? (Should be auto-calculated by MUI)

### Avatar not loading

**Check**:

1. Is `user.id` defined?
2. Is `meta.avatar_path` set in profile?
3. Is Supabase Storage bucket accessible?
4. Check browser console for 403/404 errors

### Theme toggle not working

**Check**:

1. Is `ThemeContextProvider` wrapping the app?
2. Is `useThemeContext` imported correctly?
3. Check localStorage for `app.theme.mode` key

---

## Summary

**Layouts provide**:

- ✅ Consistent structure across all pages
- ✅ Global navigation (workspace switcher, profile menu)
- ✅ Global UI layer (notifications, modals)
- ✅ Responsive behavior (mobile drawer)
- ✅ Performance optimizations (caching, memoization)
- ✅ Single source of truth for layout patterns

**Key files**:

- `AppShell.tsx` — Main wrapper (top bar + sidebar + content + system layer)
- `GlobalTopBar.tsx` — Navigation bar
- `SystemLayer.tsx` — Global UI elements

**Philosophy**: Write once, use everywhere. Keep it simple, keep it consistent.
