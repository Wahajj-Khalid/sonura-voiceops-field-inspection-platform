import React from "react";
import { Mic, BookOpen, Camera, ChevronRight } from "lucide-react";
import { Badge } from "../ui/badge";

export const CapabilitiesSection: React.FC = () => {
  return (
    <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <Badge variant="violet">Core Architecture</Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
          Engineered for High-Consequence Field Environments
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-mono">
          From industrial manufacturing plants to power substations, Sonura eliminates manual form-filling on small screens.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#090d16]/80 border border-white/10 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-600/10 transition-all duration-300 space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Mic className="w-5 h-5 text-violet-400" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px]">
              LIVE DATA CHANNELS
            </span>
          </div>

          <h3 className="text-base font-bold text-white font-sans">Real-Time Voice Copilot</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ultra low-latency WebRTC audio pipeline using Deepgram Nova-2 and Aura combined with Groq for sub-200ms spoken checklist interaction.
          </p>

          <div className="pt-2 flex items-center justify-between text-[11px] text-violet-400 border-t border-slate-800/80">
            <span>Sub-50ms Data Channel Sync</span>
            <span className="flex items-center space-x-0.5">
              <span className="w-1 h-2.5 bg-violet-400 rounded-full animate-pulse" />
              <span className="w-1 h-3.5 bg-cyan-400 rounded-full animate-pulse" />
              <span className="w-1 h-2 bg-violet-400 rounded-full animate-pulse" />
            </span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#090d16]/80 border border-white/10 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-600/10 transition-all duration-300 space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-cyan-400" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px]">
              IN-MEMORY RETRIEVAL
            </span>
          </div>

          <h3 className="text-base font-bold text-white font-sans">Local Vector RAG Manuals</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            In-memory vector retrieval using FastEmbed and BAAI embeddings on Supabase PGVector. Ingest and query dense technical manuals with zero API cost.
          </p>

          <div className="pt-2 flex items-center justify-between text-[11px] text-cyan-400 border-t border-slate-800/80">
            <span>384-Dim In-Memory Index</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#090d16]/80 border border-white/10 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-600/10 transition-all duration-300 space-y-4 font-mono">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px]">
              GEMINI VISION ACTIVE
            </span>
          </div>

          <h3 className="text-base font-bold text-white font-sans">Multimodal Defect Triage</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Snap photos of cracked valves or corroded flanges. Gemini Vision triages structural defects and immediately instructs the voice agent to alert the technician.
          </p>

          <div className="pt-2 flex items-center justify-between text-[11px] text-emerald-400 border-t border-slate-800/80">
            <span>Automated Auto-Flagging</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </section>
  );
};