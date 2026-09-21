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
    <header className="sticky top-0 z-30 px-3 sm:px-5 md:px-6 py-3 flex items-center justify-between border-b border-white/10 backdrop-blur-xl bg-[#06080d]/80 w-full min-w-0">
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1 pr-2">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden text-slate-400 hover:text-white p-1.5 rounded-lg border border-slate-800 bg-slate-900 cursor-pointer shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        <span className="text-xs sm:text-sm md:text-base font-bold text-white font-sans tracking-tight truncate block">
          {displayTitle}
        </span>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
        {onOpenNotifications ? (
          <button
            type="button"
            onClick={onOpenNotifications}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-violet-500/50 flex items-center justify-center text-slate-400 hover:text-violet-300 transition-all cursor-pointer shrink-0"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onLogout}
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 border border-slate-700 hover:border-rose-500/50 flex items-center justify-center text-xs text-slate-400 hover:text-rose-400 transition-all cursor-pointer font-mono shrink-0"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};