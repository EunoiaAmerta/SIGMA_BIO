"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { UserSession } from "@/lib/types";

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, nisn: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load user from localStorage on mount (client-side only)
  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem("bioexplorer_user");
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error("[v0] Error parsing stored user:", e);
          localStorage.removeItem("bioexplorer_user");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, nisn: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate email and NISN format
      if (!email || !nisn) {
        throw new Error("Email and NISN are required");
      }

      // Simulate session creation
      const userSession: UserSession = {
        email,
        nisn,
        name: "", // Will be set from student data
        class: "",
        semester: "Semester Ganjil",
      };

      setUser(userSession);
      localStorage.setItem("bioexplorer_user", JSON.stringify(userSession));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      console.error("[v0] Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bioexplorer_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
