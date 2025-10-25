/**
 * AuthContext
 *
 * High-level explanation (plain language):
 * - This file provides a small, shared place for the app to learn who the
 *   current user is and to start common auth actions (sign up, sign in,
 *   sign out, sign in with Google).
 * - When the app starts it asks Supabase: "is someone already signed in?" and
 *   keeps listening for changes (for example a sign-in in another browser tab).
 * - Components use the `useAuth()` hook to get the current user (or see that
 *   no one is signed in) and to call the helper functions.
 *
 * Why this helps:
 * - Centralizes where we check login state so every page behaves the same.
 * - Keeps token/session handling inside the Supabase SDK; components just ask
 *   "who is signed in now?" and react accordingly.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User, Provider } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

// Shape of the context value available to consumers
type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUpNewUser: (params: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<
    | { ok: true; requiresConfirmation?: boolean }
    | { ok: false; message: string }
  >;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signInWithOAuth: (
    provider: Provider
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
};

// Create the context; undefined by default to enforce provider usage
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Props for the provider (typed children prevents "implicitly any" errors)
type ProviderProps = { children: ReactNode };

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
      .then(({ data }) => {
        if (mounted) setSession(data.session ?? null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

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
