import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { api, TOKEN_KEY } from "@/src/api";
import type { AstrologerProfile } from "@/src/types";

type SessionContextValue = {
  profile: AstrologerProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<AstrologerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      setProfile(await api<AstrologerProfile>("/api/astrologer/profile"));
    } catch {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setToken = async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await refresh();
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setProfile(null);
  };

  return <SessionContext.Provider value={{ profile, loading, refresh, setToken, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
