"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { UserRole } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children,
  allowedRoles
}) => {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#06080d] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <span>Verifying Sonura Security Credentials...</span>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-[#06080d] flex flex-col items-center justify-center p-6 text-center font-mono">
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-md mb-6">
          Your current role ({user.role}) does not have authorization to view this operational tier.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
};