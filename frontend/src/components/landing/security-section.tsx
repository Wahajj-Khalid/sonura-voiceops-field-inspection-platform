import React from "react";
import { Lock, ShieldCheck, Cpu, Layers } from "lucide-react";
import { Badge } from "../ui/badge";

export const SecuritySection: React.FC = () => {
  return (
    <section id="security" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <Badge variant="info">Enterprise Grade</Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
          Security, Isolation, and Hexagonal Design
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-mono">
          Built upon Ports and Adapters architecture to ensure strict data isolation and zero third-party vendor lock-in.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#090d16]/80 border border-white/10 hover:border-emerald-500/40 transition-all space-y-2.5 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-emerald-400">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider font-sans">Row-Level Security</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ENFORCED
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Multi-tenant PostgreSQL policies enforce complete data partition between organizations and sites.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d16]/80 border border-white/10 hover:border-violet-500/40 transition-all space-y-2.5 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-violet-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider font-sans">Signed JWT RBAC</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
              HS256
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Cryptographic FastAPI HS256 tokens authenticate Super Admins, Supervisors, and Field Inspectors.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d16]/80 border border-white/10 hover:border-cyan-500/40 transition-all space-y-2.5 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Cpu className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider font-sans">Zero Key Leakage</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              ENCAPSULATED
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            LiveKit, Groq, and Gemini tokens remain strictly encapsulated within the backend server container.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d16]/80 border border-white/10 hover:border-amber-500/40 transition-all space-y-2.5 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-400">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider font-sans">Audio Vault</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              SIGNED URLS
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Full session recordings stored in Supabase Storage buckets with 1-hour private signed URLs.
          </p>
        </div>
      </div>
    </section>
  );
};