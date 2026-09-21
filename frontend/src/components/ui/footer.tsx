import React from "react";
import { Logo } from "./logo";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs font-mono text-slate-500 text-center sm:text-left">
        <div className="flex items-center justify-center space-x-2.5">
          <Logo size="sm" />
          <span className="font-bold text-slate-300">Sonura</span>
        </div>

        <div className="text-center">
          <span>Autonomous Safety and Compliance Infrastructure</span>
        </div>

        <div className="text-center">
          <span>v1.0.0 Stable</span>
        </div>
      </div>
    </footer>
  );
};