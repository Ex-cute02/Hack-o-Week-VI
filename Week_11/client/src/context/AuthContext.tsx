import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { authApi } from "../api/auth.api";
import { configureInterceptors } from "../api/client";

interface AuthContextType {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  // Keep ref in sync for Axios interceptor
  useEffect(() => {
    tokenRef.current = accessToken;
  }, [accessToken]);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const data = await authApi.refresh();
      setAccessToken(data.access_token);
      return data.access_token;
    } catch {
      setAccessToken(null);
      return null;
    }
  }, []);

  // Attempt silent refresh on mount
  useEffect(() => {
    refreshAccessToken().finally(() => setIsLoading(false));
  }, [refreshAccessToken]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAccessToken(data.access_token);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    await authApi.register(email, password);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    }
    setAccessToken(null);
  }, []);

  // Configure Axios interceptors
  useEffect(() => {
    configureInterceptors(
      () => tokenRef.current,
      refreshAccessToken,
      () => setAccessToken(null),
    );
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        isAuthenticated: !!accessToken,
        isLoading,
        login,
        register,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
