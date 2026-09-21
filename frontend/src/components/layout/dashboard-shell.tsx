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
    <div className="min-h-screen bg-[#06080d] text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white w-full max-w-full overflow-x-hidden">
      {sidebarSlot}

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 w-full max-w-full overflow-x-hidden ${
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {headerSlot}

        <main className="p-2 sm:p-4 md:p-6 max-w-[1600px] w-full mx-auto space-y-4 sm:space-y-6 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};