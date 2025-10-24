// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";

type AuthContextValue = {
  session: Session | null;
  signUpNewUser: (params: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<{ ok: true } | { ok: false; message: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ ok: true } | { ok: false; message: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type ProviderProps = { children: ReactNode };

export function AuthContextProvider({ children }: ProviderProps) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signUpNewUser: AuthContextValue["signUpNewUser"] = async ({
    email,
    password,
    firstName,
    lastName,
  }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            first_name: firstName ?? null,
            last_name: lastName ?? null,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return { ok: false, message: error.message };
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unexpected error";
      return { ok: false, message };
    }
  };

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

  const signOut: AuthContextValue["signOut"] = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// If your linter complains about “Fast refresh only works when a file only exports components”,
// either move this hook to a separate file OR disable the rule on the next line.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthContextProvider");
  return ctx;
}
