import React from "react";
import { Check } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/5 font-mono">
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <Badge variant="violet">Transparent Deployment</Badge>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
          Enterprise Deployment and Pricing
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Predictable scaling designed for facilities management, electrical utilities, and industrial field agencies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier 1: Pilot */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Badge variant="neutral">EVALUATION</Badge>
            <div>
              <h3 className="text-xl font-bold text-white font-sans">Pilot</h3>
              <p className="text-xs text-slate-400 mt-1">Single facility evaluation tier</p>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-white font-sans">Free</span>
              <span className="text-xs text-slate-400">/ 30-day trial</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300 font-sans">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>2 Active Site Units</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Up to 5 Field Inspectors</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Standard Voice Checklists</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>FastEmbed Local Vector RAG</span>
              </div>
            </div>
          </div>

          <a href="#contact" className="w-full block">
            <Button variant="primary" className="w-full text-xs font-bold">
              Contact for Pilot Access
            </Button>
          </a>
        </div>

        {/* Tier 2: Enterprise */}
        <div className="relative p-6 rounded-2xl bg-gradient-to-b from-violet-950/40 via-slate-900/90 to-[#06080d] border-2 border-violet-500/70 flex flex-col justify-between space-y-6 shadow-2xl shadow-violet-600/20">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-3 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-lg shadow-violet-600/50">
              Most Popular
            </span>
          </div>

          <div className="space-y-4 pt-1">
            <Badge variant="violet">ENTERPRISE SCALE</Badge>
            <div>
              <h3 className="text-xl font-bold text-white font-sans">Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1">Multi-site fleet operations</p>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-white font-sans">$149</span>
              <span className="text-xs text-slate-400">/ site / month</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300 font-sans">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Unlimited Site Facilities</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Unlimited Inspector Seats</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Gemini Multimodal Defect Triage</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Supabase Private Audio Vault</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>n8n and Slack Webhook Automation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Printable A4 Certificate Generation</span>
              </div>
            </div>
          </div>

          <a href="#contact" className="w-full block">
            <Button variant="primary" className="w-full text-xs font-bold shadow-lg shadow-violet-600/40">
              Contact for Enterprise Deployment
            </Button>
          </a>
        </div>

        {/* Tier 3: Custom */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <Badge variant="info">DEDICATED</Badge>
            <div>
              <h3 className="text-xl font-bold text-white font-sans">Custom</h3>
              <p className="text-xs text-slate-400 mt-1">Air-gapped and high security</p>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-extrabold text-white font-sans">Custom</span>
              <span className="text-xs text-slate-400">/ annual SLA</span>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs text-slate-300 font-sans">
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>On-Premise Air-Gapped Deployment</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Fine-Tuned Domain LLM Inference</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Custom Regulatory Certificate Forms</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Dedicated Solutions Engineer</span>
              </div>
            </div>
          </div>

          <a href="#contact" className="w-full block">
            <Button variant="primary" className="w-full text-xs font-bold">
              Contact for Custom Architecture
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};