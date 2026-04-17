import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type StreamingProvider = "netflix" | "prime";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  streamingProvider?: StreamingProvider;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: { user: AuthUser; token: string }) => void;
  logout: () => void;
  setStreamingProvider: (provider: StreamingProvider) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem("authToken"),
          AsyncStorage.getItem("user"),
        ]);
        if (cancelled) return;
        if (storedToken) setToken(storedToken);
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser) as AuthUser;
            setUser(parsed);
          } catch {
            
          }
        }
      } catch (e) {
        console.warn("[AuthContext] failed to hydrate auth state", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((payload: { user: AuthUser; token: string }) => {
    console.log("[AuthContext] login called with:", payload);
    setUser(payload.user);
    setToken(payload.token);
  }, []);

  const logout = useCallback(() => {
    console.log("[AuthContext] logout called");
    setUser(null);
    setToken(null);
  }, []);

  const setStreamingProvider = useCallback((streamingProvider: StreamingProvider) => {
    console.log("[AuthContext] setStreamingProvider:", streamingProvider);
    setUser((prev) => (prev ? { ...prev, streamingProvider } : null));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      login,
      logout,
      setStreamingProvider,
    }),
    [user, token, login, logout, setStreamingProvider]
  );

  console.log("[AuthContext] render, state:", { user, hasToken: !!token });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

