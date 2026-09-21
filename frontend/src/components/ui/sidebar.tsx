"use client";

import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Logo } from "./logo";
import { APP_CONFIG } from "../../config/constants";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  roleBadgeText: string;
  children: React.ReactNode;
  footerSlot?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  roleBadgeText,
  children,
  footerSlot,
}) => {
  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen z-40 bg-[#06080d] border-r border-white/10 flex flex-col justify-between p-4 transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-5">
          <div className="px-1">
            {isCollapsed ? (
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="relative flex items-center justify-center group mx-auto cursor-pointer"
                >
                  <div className="group-hover:hidden">
                    <Logo size="md" />
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/50 hidden group-hover:flex items-center justify-center transition-all shadow-lg shadow-violet-500/30">
                    <ChevronRight className="w-5 h-5 text-white animate-pulse" />
                  </div>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Logo size="md" />
                    <span className="font-extrabold text-xl tracking-tight text-white font-sans">
                      {APP_CONFIG.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={onToggleCollapse}
                      className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-violet-400" />
                    </button>

                    <button
                      type="button"
                      onClick={onCloseMobile}
                      className="lg:hidden text-slate-400 hover:text-white p-1 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="w-full font-mono">
                  <div className="px-3 py-1.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-[10px] font-semibold text-violet-300 flex items-center justify-between">
                    <span className="uppercase tracking-wider truncate">{roleBadgeText}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0 ml-1" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav className="space-y-1 font-mono">
            {children}
          </nav>
        </div>

        {footerSlot && <div className="pt-4 border-t border-slate-800/80">{footerSlot}</div>}
      </aside>
    </>
  );
};