import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { api } from "@/src/api";

type User = { id: string; name: string; walletBalance: number; freeMinutesLeft: number; introOfferUsed: boolean };
type SessionContextValue = {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = await SecureStore.getItemAsync("astrowalla_access_token");
    if (!token) { setUser(null); setLoading(false); return; }
    try { setUser(await api<User>("/api/mobile/me")); }
    catch { await SecureStore.deleteItemAsync("astrowalla_access_token"); setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  const setToken = async (token: string) => { await SecureStore.setItemAsync("astrowalla_access_token", token); await refresh(); };
  const logout = async () => { await SecureStore.deleteItemAsync("astrowalla_access_token"); setUser(null); };
  return <SessionContext.Provider value={{ user, loading, refresh, setToken, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}
