import React from "react";
import { FileCheck2, ShieldAlert, CheckCircle2, Volume2, Maximize2 } from "lucide-react";
import { Badge } from "../ui/badge";

interface CertificateSpecimenCardProps {
  onOpenModal: () => void;
}

export const CertificateSpecimenCard: React.FC<CertificateSpecimenCardProps> = ({ onOpenModal }) => {
  return (
    <div className="relative w-full max-w-lg mx-auto">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-violet-600/25 via-cyan-500/20 to-emerald-500/20 blur-xl opacity-75 pointer-events-none" />

      <div
        onClick={onOpenModal}
        className="relative w-full p-3.5 sm:p-5 md:p-6 bg-[#090d16]/95 border border-violet-500/40 hover:border-violet-400/80 rounded-2xl shadow-2xl backdrop-blur-md space-y-3 sm:space-y-4 cursor-default transition-colors duration-200"
        title="Interactive Specimen (Click anywhere to inspect)"
      >
        <div className="flex items-start justify-between pb-2.5 sm:pb-3 border-b border-slate-800 gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-violet-400" />
            </div>
            <div className="min-w-0 font-mono">
              <div className="flex items-center space-x-1.5 flex-wrap">
                <span className="text-[9px] sm:text-[11px] uppercase tracking-wider text-slate-400">
                  Certificate Specimen
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase px-1 py-0.2 bg-violet-500/20 text-violet-300 rounded border border-violet-500/30">
                  Template
                </span>
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-white block">
                CERT-SAMPLE-SPECIMEN-01
              </span>
            </div>
          </div>

          <Badge variant="success" className="shrink-0 text-[9px] sm:text-[10px] px-1.5 py-0.5">
            APPROVED
          </Badge>
        </div>

        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2 font-mono">
          <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
            <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <span className="text-[8px] sm:text-[10px] uppercase text-slate-400 block">AI Evaluation</span>
              <span className="text-[10px] sm:text-xs font-bold text-white block">
                LOW RISK (4/4 Pass)
              </span>
            </div>
          </div>
          <span className="text-[9px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-1.5 sm:px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
            100% PASS
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 min-w-0">
            <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase">Target Facility</span>
            <span className="font-bold text-slate-200 text-[10px] sm:text-[11px] block truncate">BUILDING-4B</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 min-w-0">
            <span className="text-[8px] sm:text-[9px] text-slate-500 block uppercase">Inspector Key</span>
            <span className="font-bold text-slate-200 text-[10px] sm:text-[11px] block truncate">OPERATOR-01</span>
          </div>
        </div>

        <div className="space-y-1.5 font-mono">
          <span className="text-[8px] sm:text-[10px] uppercase text-slate-400 block tracking-wider">
            Itemized Spoken Verification
          </span>

          <div className="space-y-1 sm:space-y-1.5 text-[9px] sm:text-[11px]">
            <div className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-1">
              <div className="flex items-center space-x-1.5 truncate">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">Suction Pressure: 42 PSI</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold shrink-0">PASS</span>
            </div>

            <div className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-1">
              <div className="flex items-center space-x-1.5 truncate">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">Safety Valve: Zero residue</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold shrink-0">PASS</span>
            </div>

            <div className="p-1.5 sm:p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-1">
              <div className="flex items-center space-x-1.5 truncate">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-300 truncate">Coolant Sight Glass: Full charge</span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold shrink-0">PASS</span>
            </div>
          </div>
        </div>

        <div className="p-2 rounded-xl bg-violet-950/30 border border-violet-500/20 flex items-center justify-between text-[9px] sm:text-[11px] font-mono">
          <div className="flex items-center space-x-1.5 truncate pr-1">
            <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400 shrink-0" />
            <span className="text-slate-300 truncate">Dual-Channel Audio Synced</span>
          </div>
          <div className="flex items-center space-x-0.5 shrink-0">
            <span className="w-1 h-2.5 bg-violet-400 rounded-full animate-pulse" />
            <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse" />
            <span className="w-1 h-2 bg-violet-400 rounded-full animate-pulse" />
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal();
          }}
          className="w-full py-2 sm:py-2.5 px-2 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[10px] sm:text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5"
        >
          <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="truncate">Inspect Printable Single-Page Certificate</span>
        </button>
      </div>
    </div>
  );
};