import React from "react";
import Link from "next/link";
import { AnimatedLogo } from "./animated-logo";

export const QuicklinksSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5 w-full space-y-10">
      {/* Brand Header Centered */}
      <div className="flex flex-col items-center text-center space-y-3 max-w-lg mx-auto">
        <div className="flex items-center space-x-2.5">
          <AnimatedLogo />
          <span className="font-extrabold text-lg tracking-tight text-white font-sans">
            Sonura
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          Autonomous hands-free field inspections and compliance platform engineered for mission-critical operations.
        </p>
        <div className="pt-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Link Columns Centered with Responsive Wrapping */}
      <div className="flex flex-wrap justify-center items-start gap-8 sm:gap-12 md:gap-16 max-w-4xl mx-auto">
        {/* Column 1: Platform */}
        <div className="w-44 sm:w-48 text-left space-y-3 font-mono text-xs">
          <span className="font-bold text-white uppercase text-[11px] tracking-wider block font-sans">
            Platform
          </span>
          <ul className="space-y-2 text-slate-400 font-sans">
            <li><a href="#capabilities" className="hover:text-violet-400 transition-colors cursor-pointer block">LiveKit WebRTC Voice</a></li>
            <li><a href="#capabilities" className="hover:text-violet-400 transition-colors cursor-pointer block">Local Vector RAG</a></li>
            <li><a href="#capabilities" className="hover:text-violet-400 transition-colors cursor-pointer block">Gemini Vision Triage</a></li>
            <li><a href="#compliance" className="hover:text-violet-400 transition-colors cursor-pointer block">A4 Certificates</a></li>
            <li><a href="#pricing" className="hover:text-violet-400 transition-colors cursor-pointer block">Enterprise Pricing</a></li>
          </ul>
        </div>

        {/* Column 2: Solutions */}
        <div className="w-44 sm:w-48 text-left space-y-3 font-mono text-xs">
          <span className="font-bold text-white uppercase text-[11px] tracking-wider block font-sans">
            Solutions
          </span>
          <ul className="space-y-2 text-slate-400 font-sans">
            <li><a href="#contact" className="hover:text-violet-400 transition-colors cursor-pointer block">Industrial HVAC Systems</a></li>
            <li><a href="#contact" className="hover:text-violet-400 transition-colors cursor-pointer block">Electrical Substations</a></li>
            <li><a href="#contact" className="hover:text-violet-400 transition-colors cursor-pointer block">Power Generation Units</a></li>
            <li><a href="#contact" className="hover:text-violet-400 transition-colors cursor-pointer block">Equipment Manufacturing</a></li>
            <li><a href="#contact" className="hover:text-violet-400 transition-colors cursor-pointer block">Compliance Walkthroughs</a></li>
          </ul>
        </div>

        {/* Column 3: Security and Trust */}
        <div className="w-44 sm:w-48 text-left space-y-3 font-mono text-xs">
          <span className="font-bold text-white uppercase text-[11px] tracking-wider block font-sans">
            Security and Trust
          </span>
          <ul className="space-y-2 text-slate-400 font-sans">
            <li><a href="#security" className="hover:text-violet-400 transition-colors cursor-pointer block">Row-Level Security (RLS)</a></li>
            <li><a href="#security" className="hover:text-violet-400 transition-colors cursor-pointer block">Signed JWT RBAC Tokens</a></li>
            <li><a href="#security" className="hover:text-violet-400 transition-colors cursor-pointer block">Audio Storage Vault</a></li>
            <li><Link href="/login" className="hover:text-violet-400 transition-colors cursor-pointer block">Console Access Gateway</Link></li>
            <li><a href="mailto:contact@sonura.ai" className="hover:text-violet-400 transition-colors cursor-pointer block">Engineering Desk</a></li>
          </ul>
        </div>
      </div>
    </section>
  );
};