"use client";

import React from "react";
import { Menu, LogOut, Bell } from "lucide-react";
import { AuthUser, UserRole } from "../../types";

interface AppHeaderProps {
  user: AuthUser | null;
  activeRole: UserRole;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
  onOpenNotifications?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  onOpenMobileSidebar,
  onLogout,
  onOpenNotifications,
}) => {
  const displayTitle = user?.role === "super_admin" ? "Sonura" : user?.organization || "Sonura";

  return (
    <header className="sticky top-0 z-30 px-4 md:px-6 py-3.5 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-[#06080d]/80">
      <div className="flex items-center space-x-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 bg-slate-900 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <span className="text-base font-bold text-white font-sans tracking-tight">
          {displayTitle}
        </span>
      </div>

      <div className="flex items-center space-x-2.5">
        {onOpenNotifications && (
          <button
            onClick={onOpenNotifications}
            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-violet-500/50 flex items-center justify-center text-slate-400 hover:text-violet-300 transition-all cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          onClick={onLogout}
          className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center text-xs text-slate-400 hover:text-rose-400 transition-all cursor-pointer font-mono"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};