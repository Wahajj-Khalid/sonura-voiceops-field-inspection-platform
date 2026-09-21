"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "../../config/constants";
import { AuthUser } from "../../types";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sonura_token");
        localStorage.removeItem("sonura_user");
      }
    } catch (e) {
      console.error("Storage clear error:", e);
    }
    if (typeof window !== "undefined") {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const storedToken = localStorage.getItem("sonura_token");
        const storedUser = localStorage.getItem("sonura_user");
        if (storedToken) {
          if (storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          }
        }
      }
    } catch (e) {
      console.error("Failed to restore session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const res = await fetch(`${APP_CONFIG.apiUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: pass }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || "Authentication failed." };
      }

      setToken(data.access_token);
      setUser(data.user);
      if (typeof window !== "undefined") {
        localStorage.setItem("sonura_token", data.access_token);
        localStorage.setItem("sonura_user", JSON.stringify(data.user));
        router.push("/dashboard");
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: "Network error connecting to backend gateway." };
    }
  };

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = token || (typeof window !== "undefined" ? localStorage.getItem("sonura_token") : null);
      
      const headers = new Headers(options.headers || {});
      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        console.warn("Session token expired or unauthorized. Logging out.");
        logout();
      }

      return response;
    },
    [token, logout]
  );

  return (
    <AuthContext.Provider value={{ user, token, login, logout, authFetch, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};