"use client";

import React from "react";

interface DashboardShellProps {
  isSidebarCollapsed: boolean;
  headerSlot: React.ReactNode;
  sidebarSlot: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({
  isSidebarCollapsed,
  headerSlot,
  sidebarSlot,
  children,
}) => {
  return (
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white">
      {sidebarSlot}

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {headerSlot}

        <main className="p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};