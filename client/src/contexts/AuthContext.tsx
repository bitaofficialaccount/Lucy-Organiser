import React, { createContext, useState, useEffect, useCallback } from "react";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const safeGetFromStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetInStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage not available, silently skip
  }
};

const safeRemoveFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage not available, silently skip
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to restore from localStorage if available
        const storedUser = safeGetFromStorage("lucy_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (err) {
            console.error("Failed to parse stored user:", err);
            safeRemoveFromStorage("lucy_user");
          }
        }

        // Always check with server
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          safeSetInStorage("lucy_user", JSON.stringify(userData));
        } else {
          setUser(null);
          safeRemoveFromStorage("lucy_user");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
    safeSetInStorage("lucy_user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    safeRemoveFromStorage("lucy_user");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
