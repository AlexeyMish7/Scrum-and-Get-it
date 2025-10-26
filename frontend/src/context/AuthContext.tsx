import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../supabaseClient";

// ******************** Type Declerations *******************

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

/**
 * Defines all values and helper functions exposed by the AuthContext.
 *
 * These values and methods are what other components can access through `useAuth()`.
 * Each function that performs a network request (like sign-in or sign-up)
 * returns a Promise, meaning it runs asynchronously and resolves later with a result.
 */
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

export function AuthContextProvider({ children }: ProviderProps) {
  // The live Supabase session; null means "no user"
  const [session, setSession] = useState<Session | null>(null);
  // Derived user and loading state
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * On mount:
   * 1) Seed state with current session (if any)
   * 2) Subscribe to auth changes (login/logout/token refresh)
   * 3) Unsubscribe on unmount to avoid leaks
   */
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        if (mounted) setSession(data.session ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, newSession: Session | null) => {
        setSession(newSession);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign up a new user.
   * - Normalizes email
   * - Stores first/last name in auth metadata
   * - If email confirm is enabled, Supabase will NOT return a session
   */
  const signUpNewUser: AuthContextValue["signUpNewUser"] = async ({
    email,
    password,
    firstName,
    lastName,
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName ?? null,
            last_name: lastName ?? null,
          },
          // If using confirm emails, this is where Supabase will send users back
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { ok: false, message: error.message };
      // If no session is returned, Supabase requires email confirmation
      const requiresConfirmation = !data?.session;
      if (requiresConfirmation) return { ok: true, requiresConfirmation: true };
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      return { ok: false, message };
    }
  };

  /**
   * Sign in with password.
   */
  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      return { ok: false, message };
    }
  };

  /**
   * Sign in with OAuth (e.g., Google). Redirects to provider consent screen.
   */
  const signInWithOAuth: AuthContextValue["signInWithOAuth"] = async (
    provider
  ) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      return { ok: false, message };
    }
  };

  /**
   * Sign out current user.
   */
  const signOut: AuthContextValue["signOut"] = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signUpNewUser,
        signIn,
        signInWithOAuth,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Convenience hook for consumers; forces usage under the provider
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContextProvider");
  return ctx;
}
