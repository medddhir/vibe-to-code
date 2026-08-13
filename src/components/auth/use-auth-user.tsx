"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthUserStatus = "error" | "guest" | "loading" | "ready" | "unavailable";

type AuthUserContextValue = {
  signOut: () => Promise<boolean>;
  status: AuthUserStatus;
  user: User | null;
};

const AuthUserContext = createContext<AuthUserContextValue | null>(null);

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthUserStatus>(
    configured && supabase ? "loading" : "unavailable",
  );

  useEffect(() => {
    if (!configured || !supabase) return;

    let active = true;
    // This client-side lookup controls display state only. Every private API
    // independently validates the user on the server with getUser().
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setStatus("error");
        return;
      }

      setUser(data.session?.user ?? null);
      setStatus(data.session?.user ? "ready" : "guest");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setStatus(session?.user ? "ready" : "guest");
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [configured, supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return false;

    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (!error) {
      setUser(null);
      setStatus("guest");
    }
    return !error;
  }, [supabase]);

  const value = useMemo(
    () => ({ signOut, status, user }),
    [signOut, status, user],
  );

  return (
    <AuthUserContext.Provider value={value}>
      {children}
    </AuthUserContext.Provider>
  );
}

export function useAuthUser() {
  const value = useContext(AuthUserContext);
  if (!value) {
    throw new Error("useAuthUser must be used inside AuthUserProvider");
  }
  return value;
}
