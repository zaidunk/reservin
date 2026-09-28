import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { getCurrentSession, isStaffUser } from "../../lib/api/auth";
import { toAppError } from "../../lib/errors/app-error";
import { getSupabaseClient } from "../../lib/supabase/client";

type AuthContextValue = {
  session: Session | null;
  isStaff: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolveSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession) {
      setIsStaff(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsStaff(await isStaffUser(nextSession.user.id));
      setError(null);
    } catch (sessionError) {
      setIsStaff(false);
      setError(toAppError(sessionError).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await resolveSession(await getCurrentSession());
    } catch (sessionError) {
      setError(toAppError(sessionError).message);
      setIsLoading(false);
    }
  }, [resolveSession]);

  useEffect(() => {
    void refresh();

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const result = getSupabaseClient().auth.onAuthStateChange((_event, nextSession) => {
        queueMicrotask(() => void resolveSession(nextSession));
      });
      subscription = result.data.subscription;
    } catch (configurationError) {
      setError(toAppError(configurationError).message);
      setIsLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, [refresh, resolveSession]);

  const value = useMemo(
    () => ({ session, isStaff, isLoading, error, refresh }),
    [session, isStaff, isLoading, error, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
