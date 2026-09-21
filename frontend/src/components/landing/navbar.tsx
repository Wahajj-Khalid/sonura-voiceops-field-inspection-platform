"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { AnimatedLogo } from "./animated-logo";

interface NavbarProps {
  onSearchOpen: () => void;
  onScrollToTop: (e: React.MouseEvent) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchOpen, onScrollToTop }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#06080d]/90 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 sm:space-x-8 shrink-0">
          <a
            href="#"
            onClick={onScrollToTop}
            className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer shrink-0"
          >
            <AnimatedLogo />
            <span className="font-extrabold text-base sm:text-lg tracking-tight text-white group-hover:text-violet-300 transition-colors">
              Sonura
            </span>
          </a>

          <nav className="hidden lg:flex items-center space-x-5 xl:space-x-6 text-xs font-medium text-slate-300 pl-4 border-l border-white/10 whitespace-nowrap font-mono">
            <a href="#capabilities" className="hover:text-violet-400 transition-colors cursor-pointer">
              Platform Capabilities
            </a>
            <a href="#security" className="hover:text-violet-400 transition-colors cursor-pointer">
              Security and Architecture
            </a>
            <a href="#compliance" className="hover:text-violet-400 transition-colors cursor-pointer">
              Compliance Verification
            </a>
            <a href="#pricing" className="hover:text-violet-400 transition-colors cursor-pointer">
              Pricing and Tiers
            </a>
          </nav>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
          <button
            onClick={onSearchOpen}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/5 transition-all cursor-pointer inline-flex items-center justify-center shrink-0"
            title="Search documentation"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <a
            href="#contact"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer hidden md:inline-block whitespace-nowrap font-mono"
          >
            Contact Us
          </a>

          <span className="text-white/20 select-none font-light hidden md:inline-block">
            |
          </span>

          <Link href="/login" className="shrink-0">
            <button className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-500 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-[11px] sm:text-xs tracking-wide shadow-lg shadow-violet-600/40 hover:shadow-violet-500/60 transition-all cursor-pointer border border-violet-400/30 whitespace-nowrap font-mono">
              Sign In
            </button>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-white/5 lg:hidden cursor-pointer shrink-0"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4 text-violet-400" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#06080d]/95 backdrop-blur-2xl px-5 py-4 space-y-3 font-mono text-xs">
          <a
            href="#capabilities"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-violet-400"
          >
            Platform Capabilities
          </a>
          <a
            href="#security"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-violet-400"
          >
            Security and Architecture
          </a>
          <a
            href="#compliance"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-violet-400"
          >
            Compliance Verification
          </a>
          <a
            href="#pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-violet-400"
          >
            Pricing and Tiers
          </a>
          <a
            href="#contact"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block py-2 text-slate-300 hover:text-violet-400"
          >
            Contact Solutions Engineering
          </a>
        </div>
      )}
    </header>
  );
};