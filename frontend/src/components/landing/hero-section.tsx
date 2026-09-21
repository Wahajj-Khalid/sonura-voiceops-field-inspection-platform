// frontend/src/components/landing/hero-section.tsx
import React from "react";
import Link from "next/link";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { CertificateSpecimenCard } from "./certificate-specimen-card";

interface HeroSectionProps {
  onOpenSampleModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenSampleModal }) => {
  return (
    <section className="relative pt-8 pb-12 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 xl:gap-14 items-center relative z-10">
        <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-[10px] sm:text-xs font-mono max-w-full truncate">
            <Sparkles className="w-3 h-3 text-violet-400 shrink-0" />
            <span className="truncate">Spatial Intelligence for Field Operations</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold text-white tracking-tight leading-tight font-sans">
            Hands-Free Field Audits Powered by Voice AI
          </h1>

          <p className="text-xs sm:text-base md:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl font-sans">
            Sonura empowers maintenance technicians and safety inspectors to execute dense checklists hands-free, query equipment manuals on the fly via local vector RAG, and automatically generate verifiable compliance certificates.
          </p>

          <div className="pt-2 pb-2">
            <Link href="/login" className="inline-block w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto px-7 py-3 text-xs font-bold tracking-wide shadow-xl shadow-violet-600/25">
                Launch Console
              </Button>
            </Link>
          </div>

          <div className="pt-4 sm:pt-6 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2.5 sm:gap-6 text-xs font-mono text-slate-400 border-t border-white/5">
            <div className="flex items-center space-x-2 text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Sub-200ms WebRTC Voice</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
              <span>Local FastEmbed Vector RAG</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Single-Page A4 Certification</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 w-full flex justify-center pt-2 lg:pt-0">
          <CertificateSpecimenCard onOpenModal={onOpenSampleModal} />
        </div>
      </div>
    </section>
  );
};