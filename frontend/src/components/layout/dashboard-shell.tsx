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
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex selection:bg-violet-500 selection:text-white relative w-full overflow-x-hidden">
      {sidebarSlot}

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 min-w-0 w-full ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        {headerSlot}

        <main className="p-3 sm:p-5 md:p-6 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6 flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};