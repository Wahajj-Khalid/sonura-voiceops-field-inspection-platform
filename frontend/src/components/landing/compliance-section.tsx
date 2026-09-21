import React from "react";
import { Badge } from "../ui/badge";
import { CertificateSpecimenCard } from "./certificate-specimen-card";

interface ComplianceSectionProps {
  onOpenSampleModal: () => void;
}

export const ComplianceSection: React.FC<ComplianceSectionProps> = ({ onOpenSampleModal }) => {
  return (
    <section id="compliance" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <Badge variant="success">Legal and Regulatory Proof</Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight font-sans">
            Instantly Verifiable Single-Page Compliance Certificates
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
            As soon as a technician completes their hands-free voice inspection, Sonura compiles the responses, calculates risk parameters, embeds photo evidence, and generates an audit-ready single-page A4 certificate for supervisor approval.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-violet-400 font-bold block">STEP 01</span>
              <span className="text-slate-200 font-semibold block font-sans">Spoken Telemetry</span>
              <p className="text-[11px] text-slate-400">Zero hands required. Measurements transcribed in real time.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-cyan-400 font-bold block">STEP 02</span>
              <span className="text-slate-200 font-semibold block font-sans">RAG Spec Validation</span>
              <p className="text-[11px] text-slate-400">Tolerances verified against technical equipment manuals.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold block">STEP 03</span>
              <span className="text-slate-200 font-semibold block font-sans">AI Risk Assessment</span>
              <p className="text-[11px] text-slate-400">Autonomous evaluation assigns LOW, MODERATE, or CRITICAL.</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold block">STEP 04</span>
              <span className="text-slate-200 font-semibold block font-sans">Supervisor Sign-Off</span>
              <p className="text-[11px] text-slate-400">One-click sign-off and single-page A4 certificate output.</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 w-full">
          <CertificateSpecimenCard onOpenModal={onOpenSampleModal} />
        </div>
      </div>
    </section>
  );
};