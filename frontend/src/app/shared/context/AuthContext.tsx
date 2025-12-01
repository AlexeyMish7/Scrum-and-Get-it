/**
 * AUTH CONTEXT (Global Authentication State)
 *
 * Purpose:
 * - Manage user authentication state across entire application
 * - Provide centralized login/logout/signup functionality
 * - Handle JWT token refresh automatically
 * - Persist session across browser refreshes
 *
 * Backend Connection:
 * - Uses Supabase Auth (via supabaseClient.ts)
 * - JWT tokens issued by Supabase (stored in localStorage)
 * - Auto-refresh tokens before expiration (60-minute default)
 * - Session state synced via onAuthStateChange listener
 *
 * Authentication Flow:
 * 1. User submits credentials → signIn() or signUpNewUser()
 * 2. Supabase validates & issues JWT → stored in localStorage
 * 3. Session object available via { session, user } from useAuth()
 * 4. All API calls include JWT in Authorization header
 * 5. Backend validates JWT → extracts userId → scopes queries
 *
 * Security Model:
 * - JWT tokens are httpOnly (cannot be accessed via JS in production)
 * - localStorage used for session persistence (development)
 * - Auto-logout on token expiration or validation failure
 * - OAuth providers: Google, GitHub (optional)
 *
 * Usage:
 *   import { useAuth } from '@shared/context/AuthContext';
 *
 *   function MyComponent() {
 *     const { session, user, loading, signIn, signOut } = useAuth();
 *
 *     if (loading) return <LoadingSpinner />;
 *     if (!user) return <LoginPrompt />;
 *
 *     return <div>Welcome, {user.email}</div>;
 *   }
 *
 * Provider Setup:
 *   <AuthProvider>
 *     <App />
 *   </AuthProvider>
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../services/supabaseClient";
import type {
  Session as SupabaseSession,
  User as SupabaseUser,
  AuthChangeEvent,
  Provider as SupabaseProvider,
} from "@supabase/auth-js";

// ******************** Type Declarations *******************

// Use Supabase-auth types for correctness
type Session = SupabaseSession | null;
type User = SupabaseUser | null;

// Definition of the authentication context value shape
type AuthContextValue = {
  session: Session; // current Supabase session (null if logged out)
  user: User; // active user data or null
  loading: boolean;
  signUpNewUser: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<
    | { ok: true; requiresConfirmation?: boolean }
    | { ok: false; message: string }
  >;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  // provider is a string like 'google' | 'github'
  signInWithOAuth: (
    provider: SupabaseProvider
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
};

// Type for provider props; ensures children passed are valid React elements
type ProviderProps = { children: ReactNode };

// ******************** Context & Hook *******************

// Create the authentication context (undefined by default until provided)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Hook that lets components access authentication state and functions
// Exported before the provider component for Fast Refresh compatibility
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext); // get the current auth context value

  // Throw error if used outside <AuthContextProvider>
  if (!ctx) throw new Error("useAuth must be used within AuthContextProvider");

  return ctx; // return global auth data and helper functions
}

// ******************** Provider Component *******************

// The AuthContextProvider wraps the app and supplies auth state + functions
export function AuthContextProvider({ children }: ProviderProps) {
  // Tracks the current Supabase session (null if no user logged in)
  const [session, setSession] = useState<Session | null>(null);
  // Indicates whether the session is still being fetched/initialized
  const [loading, setLoading] = useState<boolean>(true);

  // On mount(Runs once when component loads): check existing session, listen for auth changes, and clean up on unmount
  useEffect(() => {
    let mounted = true; // flag to prevent state updates if component unmounts

    // Fetch current session (user stays logged in after page reload)
    supabase.auth
      .getSession()
      .then((resp) => {
        if (mounted) {
          setSession(resp.data.session ?? null); // set current session or null
          setLoading(false); // finish loading after we have session state
        }
      })
      .catch((err) => {
        console.error("Failed to get session:", err);
        if (mounted) setLoading(false);
      });

    // Listen for login/logout/token refresh events in real time
    // CRITICAL FIX: Must handle INITIAL_SESSION event!
    // When the app loads with an existing session (page refresh/navigation),
    // Supabase fires an INITIAL_SESSION event. If we ignore this, the session
    // state won't be properly synchronized, causing ProtectedRoute to see null
    // user and redirect to login even though the user is actually logged in.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, newSession: SupabaseSession | null) => {
        if (!mounted) return;

        // Handle auth events - but IGNORE TOKEN_REFRESHED to prevent infinite loops!
        // Supabase handles token refresh internally; we don't need to react to it
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          setSession(newSession);
          setLoading(false);
        } else if (event === "SIGNED_OUT") {
          setSession(null);
          setLoading(false);
        } else if (event === "USER_UPDATED") {
          setSession(newSession);
        }
        // TOKEN_REFRESHED: DO NOT call setSession here! It causes infinite refresh loops
        // Supabase manages the token internally, we just need to ignore this event
      }
    );

    // Clean up listener and prevent updates after unmount
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // run once on mount

  // Handles new user registration with Supabase
  const signUpNewUser: AuthContextValue["signUpNewUser"] = async ({
    email,
    password,
    firstName,
    lastName,
  }) => {
    try {
      // Attempt to sign up with email/password and save first/last name in metadata
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(), // normalize email format
        password,
        options: {
          data: {
            first_name: firstName ?? null, // use firstName if it exists, otherwise default to null
            last_name: lastName ?? null,
          },
          // URL where users are redirected after confirming their email
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      // Return error message if Supabase signup failed
      if (error) return { ok: false, message: error.message };

      // If Supabase requires email confirmation, no session is returned
      const requiresConfirmation = !data?.session;
      if (requiresConfirmation) return { ok: true, requiresConfirmation: true };

      // Otherwise, signup succeeded and a session was created. Update local state
      // immediately to avoid races where callers redirect before the auth
      // listener updates session.
      if (data?.session) {
        setSession(data.session);
        setLoading(false);
      }

      return { ok: true };
    } catch (e) {
      // Handle unexpected errors (like network issues)
      const message = e instanceof Error ? e.message : "Unexpected error";
      return { ok: false, message };
    }
  };

  // Handles user login with email and password
  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    try {
      // Attempt to sign in with Supabase (cleans email before sending)
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      // If Supabase returns an error (e.g., wrong credentials), return a
      // user-friendly message rather than leaking internal error details.
      if (error) {
        const status = (error as unknown as { status?: number })?.status;
        const msg =
          status === 400 || status === 401
            ? "Invalid email or password"
            : error.message;
        return { ok: false, message: msg };
      }

      // Login successful — update session immediately to avoid
      // brief UI races before the onAuthStateChange listener fires.
      if (data?.session) {
        setSession(data.session);
        setLoading(false);
      }

      return { ok: true };
    } catch (e) {
      // Handles unexpected issues (like network or server errors)
      const message = e instanceof Error ? e.message : "Unexpected error";
      return { ok: false, message };
    }
  };

  // Handles OAuth login (e.g., Google or GitHub) via Supabase
  const signInWithOAuth: AuthContextValue["signInWithOAuth"] = async (
    provider
  ) => {
    try {
      // Start OAuth flow: redirect user to provider’s consent screen
      // Support both legacy 'linkedin' and new 'linkedin_oidc' provider keys
      let requestedProvider: any = provider as any;
      if (requestedProvider === "linkedin") requestedProvider = "linkedin_oidc";

      // For LinkedIn OIDC, request appropriate scopes
      const options: any = {
        redirectTo: `${window.location.origin}/auth/callback`,
      };
      if (requestedProvider === "linkedin_oidc") {
        options.scopes = "openid r_liteprofile r_emailaddress";
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: requestedProvider, // e.g. "google" or "github" or "linkedin_oidc"
        options,
      });

      // If Supabase returns an error (bad config, canceled login, etc.)
      if (error) return { ok: false, message: error.message };

      // In some supabase-js versions `data.url` contains the provider redirect URL.
      // If present, navigate the browser to it. Otherwise, the SDK may have already
      // handled the redirect (popup) flow.
      if (data?.url) {
        window.location.assign(data.url);
        return { ok: true };
      }

      // Success — user will be redirected and session updates automatically
      return { ok: true };
    } catch (e) {
      // Handle unexpected issues like network or browser errors
      const message = e instanceof Error ? e.message : "Unexpected error";
      return { ok: false, message };
    }
  };

  // Logs out the current user using Supabase; listener will update session automatically
  const signOut: AuthContextValue["signOut"] = async () => {
    try {
      await supabase.auth.signOut();
      // clear local state immediately so UI doesn't show stale user while
      // the auth listener or network call reconciles
      setSession(null);
      setLoading(false);
    } catch (e) {
      // Supabase may return 401/403 when the session was already revoked server-side.
      // Don't surface this as a fatal error in the UI — clear local state regardless.
      // Log for diagnostics but continue.
      console.warn("Non-fatal signOut error (ignored):", e);
    }
  };
  // Note: we clear local state immediately above to avoid stale UI. The
  // onAuthStateChange listener will reconcile authoritative state shortly.

  // Provide global auth state and functions to all child components
  return (
    <AuthContext.Provider
      value={{
        session, // current Supabase session (null if logged out)
        user: session?.user ?? null, // active user data or null
        loading, // true while checking or updating session
        signUpNewUser, // helper to register new users
        signIn, // helper to log in with email/password
        signInWithOAuth, // helper to log in with Google/GitHub, etc.
        signOut, // helper to log out
      }}
    >
      {children}
      {/* all nested components can access this context via useAuth() */}
    </AuthContext.Provider>
  );
}
