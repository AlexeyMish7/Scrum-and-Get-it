# Shared Context

Global React context providers for application-wide state management.

## Structure

```
context/
├── index.ts           # Barrel export (re-exports all contexts)
├── AuthContext.tsx    # Authentication state and operations
└── ThemeContext.tsx   # Theme mode and radius toggle
```

## Files

### `AuthContext.tsx`

**Purpose**: Manage user authentication state and operations using Supabase Auth.

**Exports**:

- `AuthContextProvider` — React provider component
- `useAuth()` — Hook to access auth state and functions

**Hook Interface**:

```ts
{
  session: Session | null; // Current Supabase session
  user: User | null; // Current user object
  loading: boolean; // True while checking session
  signUpNewUser: (params) => Promise<Result>;
  signIn: (email, password) => Promise<Result>;
  signInWithOAuth: (provider) => Promise<Result>;
  signOut: () => Promise<void>;
}
```

**Key Features**:

- ✅ Session persistence (survives page reload)
- ✅ Real-time auth state listener (`onAuthStateChange`)
- ✅ Proactive token refresh (every 30 minutes for demo stability)
- ✅ OAuth support (Google, GitHub)
- ✅ Email confirmation handling
- ✅ Immediate session updates (no race conditions)

**Usage Locations**: 47+ files across all workspaces (profile, ai, jobs)

**Import Pattern**:

```ts
import { useAuth } from "@context";

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();
  // ...
}
```

**Provider Setup** (`main.tsx`):

```tsx
<AuthContextProvider>
  <App />
</AuthContextProvider>
```

---

### `ThemeContext.tsx`

**Purpose**: Manage light/dark theme mode and UI radius preferences.

**Exports**:

- `ThemeContextProvider` — React provider component (wraps with MUI `ThemeProvider` + `CssBaseline`)
- `useThemeContext()` — Hook to access theme state and functions

**Hook Interface**:

```ts
{
  mode: "light" | "dark";           // Current theme mode
  setMode: (mode) => void;          // Set specific mode
  toggleMode: () => void;           // Toggle between light/dark
  radiusMode: "tiny" | "default";   // Border radius preference
  toggleRadiusMode: () => void;     // Toggle radius style
}
```

**Key Features**:

- ✅ Persists mode to localStorage (`app.theme.mode`, `app.theme.radiusMode`)
- ✅ System preference detection (respects OS dark mode)
- ✅ Auto-sync with system preference changes
- ✅ CSS variable injection for radius mode (`--radius-sm`, `--radius-md`, `--radius-lg`)
- ✅ Sets `data-theme` attribute and `colorScheme` on `<html>`

**Usage Locations**: 7 files (mostly auth pages: Login, Register, ForgetPassword, ResetPassword, AuthCallback, HomePage)

**Import Pattern**:

```ts
import { useThemeContext } from "@context";

function MyComponent() {
  const { mode, toggleMode, radiusMode, toggleRadiusMode } = useThemeContext();
  // ...
}
```

**Provider Setup** (`main.tsx`):

```tsx
<ThemeContextProvider>
  <App />
</ThemeContextProvider>
```

---

## Design Decisions

### Why context over other state management?

1. **React-native pattern**: Contexts are idiomatic for global app state
2. **Tree-wide access**: Any component can use `useAuth()` or `useThemeContext()`
3. **Encapsulation**: All auth/theme logic isolated in providers
4. **No prop drilling**: Avoids passing `user` or `theme` through every component

### Why export hooks before providers?

**Fast Refresh compatibility**: Vite's Fast Refresh requires hooks to be exported before components to maintain proper module boundaries. This prevents HMR warnings and ensures hooks update correctly during development.

### Why separate auth and theme contexts?

**Separation of concerns**: Authentication and theming are independent. Components can use one without the other.

### Why proactive token refresh in AuthContext?

**Demo stability**: Prevents token expiry during presentations/demos. Refreshes every 30 minutes to maintain valid session.

## Architecture Notes

### Provider Nesting (`main.tsx`)

```tsx
<ThemeContextProvider>
  <AuthContextProvider>
    <ConfirmDialogProvider>
      <RouterProvider router={router} />
    </ConfirmDialogProvider>
  </AuthContextProvider>
</ThemeContextProvider>
```

**Order matters**:

1. `ThemeContextProvider` outermost (MUI theme applied to everything)
2. `AuthContextProvider` next (auth state available everywhere)
3. `ConfirmDialogProvider` wraps router (dialogs can appear anywhere)

### Session Synchronization Pattern

Both contexts use **immediate state updates** to avoid race conditions:

**AuthContext**:

```ts
const { data } = await supabase.auth.signInWithPassword(...);
if (data?.session) {
  setSession(data.session);  // ← Immediate update
  setLoading(false);
}
```

**ThemeContext**:

```ts
useEffect(() => {
  persistMode(mode); // ← Immediate localStorage write
  document.documentElement.dataset.theme = mode; // ← Immediate DOM update
}, [mode]);
```

This ensures components see updated state immediately after operations complete, without waiting for async listeners.

## Extension Guidelines

### Adding a new context

1. Create `MyContext.tsx` in this folder
2. Follow the structure:

   ```tsx
   // Types
   interface MyContextValue { ... }

   // Context & Hook
   const MyContext = createContext<MyContextValue | undefined>(undefined);

   export function useMyContext() { ... }  // ← Export before provider!

   // Provider Component
   export function MyContextProvider({ children }) { ... }
   ```

3. Add to `index.ts`:
   ```ts
   export { MyContextProvider, useMyContext } from "./MyContext";
   ```
4. Add provider to `main.tsx` in appropriate nesting order
5. Document in this README

### Modifying existing context

1. Update interface (add new fields/methods)
2. Implement logic in provider component
3. Update this documentation
4. Run `npm run typecheck` to verify changes

## Common Patterns

### Protected component (requires auth)

```tsx
import { useAuth } from "@context";

function ProtectedComponent() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;

  return <div>Protected content for {user.email}</div>;
}
```

### Theme-aware component

```tsx
import { useThemeContext } from "@context";

function ThemedComponent() {
  const { mode, toggleMode } = useThemeContext();

  return (
    <Button onClick={toggleMode}>
      {mode === "dark" ? "🌙 Dark" : "☀️ Light"}
    </Button>
  );
}
```

## Verification

**Type check**:

```powershell
npm run typecheck
```

**Find all context usage**:

```powershell
# Auth usage
grep -r "useAuth" frontend/src

# Theme usage
grep -r "useThemeContext" frontend/src
```

**Check provider setup**:

```powershell
# Should see nested providers
cat frontend/src/main.tsx
```
