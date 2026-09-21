"use client";

import React from "react";
import { 
  Activity, 
  Building2, 
  ListChecks, 
  Users, 
  History, 
  BookOpen, 
  Settings, 
  ShieldAlert, 
  BarChart3, 
  Server, 
  UserPlus, 
  Mic, 
  Bell 
} from "lucide-react";
import { Sidebar } from "../ui/sidebar";
import { UserRole } from "../../types";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface AppSidebarProps {
  role?: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  role = "inspector",
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const getRoleDisplayName = () => {
    if (role === "super_admin") return "Super Administrator";
    if (role === "org_admin") return "Organization Admin";
    if (role === "supervisor") return "Field Supervisor";
    return "Inspector";
  };

  const getNavItems = (): NavItem[] => {
    if (role === "super_admin") {
      return [
        { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
        { id: "organizations", label: "Tenants", icon: <Building2 className="w-4 h-4" /> },
        { id: "provision", label: "New Tenant", icon: <UserPlus className="w-4 h-4" /> },
        { id: "health", label: "Diagnostics", icon: <Server className="w-4 h-4" /> },
        { id: "history", label: "Archive", icon: <History className="w-4 h-4" /> },
      ];
    }

    if (role === "supervisor") {
      return [
        { id: "triage", label: "Reviews", icon: <ShieldAlert className="w-4 h-4" /> },
        { id: "sites", label: "Sites", icon: <Building2 className="w-4 h-4" /> },
        { id: "checklists", label: "Checklists", icon: <ListChecks className="w-4 h-4" /> },
        { id: "manuals", label: "Manuals", icon: <BookOpen className="w-4 h-4" /> },
        { id: "history", label: "Archive", icon: <History className="w-4 h-4" /> },
        { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
      ];
    }

    if (role === "inspector") {
      return [
        { id: "hud", label: "Inspection", icon: <Mic className="w-4 h-4" /> },
        { id: "manuals", label: "Manuals", icon: <BookOpen className="w-4 h-4" /> },
        { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
      ];
    }

    // Default: org_admin
    return [
      { id: "overview", label: "Overview", icon: <Activity className="w-4 h-4" /> },
      { id: "sites", label: "Sites", icon: <Building2 className="w-4 h-4" /> },
      { id: "checklists", label: "Checklists", icon: <ListChecks className="w-4 h-4" /> },
      { id: "team", label: "Team", icon: <Users className="w-4 h-4" /> },
      { id: "manuals", label: "Manuals", icon: <BookOpen className="w-4 h-4" /> },
      { id: "history", label: "Archive", icon: <History className="w-4 h-4" /> },
      { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    ];
  };

  const navItems = getNavItems();
  const showSettings = role === "super_admin" || role === "org_admin";

  return (
    <Sidebar
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      isMobileOpen={isMobileOpen}
      onCloseMobile={onCloseMobile}
      roleBadgeText={getRoleDisplayName()}
      footerSlot={
        showSettings ? (
          <button
            type="button"
            onClick={() => {
              onTabChange("settings");
              onCloseMobile();
            }}
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer font-mono ${
              activeTab === "settings"
                ? "bg-violet-600/25 text-violet-300 border border-violet-500/40 shadow-lg shadow-violet-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>
        ) : null
      }
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onTabChange(item.id);
              onCloseMobile();
            }}
            className={`w-full flex items-center space-x-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer font-mono ${
              isActive
                ? "bg-violet-600/25 text-violet-300 border border-violet-500/40 shadow-lg shadow-violet-600/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            } ${isCollapsed ? "justify-center px-0" : ""}`}
          >
            <span className={`shrink-0 ${isActive ? "text-violet-400" : "text-slate-400"}`}>
              {item.icon}
            </span>
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </Sidebar>
  );
};