import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../supabaseClient";

// ******************** Type Declarations *******************

// Type definition for a user object returned from Supabase (ID, email, and optional metadata)
type User = {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown> | null;
};

//Type definition for a session that has user and optional expiration time
type Session = {
  user: User;
  expires_at?: string; // optional field for expiration time (if needed later)
} | null;

//Type definition for a provider string (e.g., "google", "github")
type Provider = string;

// Definition of the authentication context value shape --> blueprint for the global authentication object
type AuthContextValue = {
  // The current authentication session (null if no one is logged in)
  session: Session | null;

  // The currently logged-in user object (shortcut from session.user)
  user: User | null;

  // Indicates whether authentication state is still being checked or updated
  loading: boolean;

  // Registers a new user account; returns a Promise that resolves. to success (ok: true) or an error (ok: false with message)
  signUpNewUser: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<
    | { ok: true; requiresConfirmation?: boolean }
    | { ok: false; message: string }
  >;

  // Logs in an existing user with email and password; returns a Promise.
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>;

  // Logs in using an external OAuth provider (e.g., Google, GitHub);
  signInWithOAuth: (
    provider: Provider
  ) => Promise<{ ok: true } | { ok: false; message: string }>;

  // Logs the user out; returns a Promise that resolves when logout completes
  signOut: () => Promise<void>;
};

// Type for provider props; ensures children passed are valid React elements
type ProviderProps = { children: ReactNode };

// ******************** Component *******************

// Create the authentication context (undefined by default until provided)
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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
      .then(({ data }: { data: { session: Session | null } }) => {
        if (mounted) setSession(data.session ?? null); // set current session or null
      })
      .finally(() => {
        if (mounted) setLoading(false); // finish initial loading state
      });

    // Listen for login/logout/token refresh events in real time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        setSession(newSession); // update session when user logs in or out
        setLoading(false); // stop loading once event handled
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

      // Otherwise, signup succeeded and session was created
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
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      // If Supabase returns an error (e.g., wrong credentials), pass it back
      if (error) return { ok: false, message: error.message };

      // Login successful — Supabase automatically sets the session
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider, // e.g. "google" or "github"
        options: { redirectTo: `${window.location.origin}/auth/callback` }, // URL to return to after login
      });

      // If Supabase returns an error (bad config, canceled login, etc.)
      if (error) return { ok: false, message: error.message };

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
    } catch (e) {
      // Supabase may return 401/403 when the session was already revoked server-side.
      // Don't surface this as a fatal error in the UI — clear local state regardless.
      // Log for diagnostics but continue.
      console.warn("Non-fatal signOut error (ignored):", e);
    }
  };

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

// ******************** Custom Hook *******************

// Hook that lets components access authentication state and functions
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext); // get the current auth context value

  // Throw error if used outside <AuthContextProvider>
  if (!ctx) throw new Error("useAuth must be used within AuthContextProvider");

  return ctx; // return global auth data and helper functions
}
