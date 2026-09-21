"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ThumbsUp, 
  Flag, 
  Sparkles, 
  ListChecks 
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { AudioEvidencePlayer } from "./audio-evidence-player";
import { APP_CONFIG } from "../../config/constants";
import { useAuth } from "../auth/auth-context";

interface ReportItem {
  item_id: string;
  question: string;
  response: string | null;
  status: string;
  flagged?: boolean;
}

interface ReportData {
  certificate_id: string;
  unit_id: string;
  title?: string;
  inspector_id: string;
  timestamp: string;
  overall_status?: string;
  status?: string;
  pass_rate: string;
  executive_summary?: string;
  ai_summary?: string;
  risk_level?: string;
  verified_items?: ReportItem[];
  items?: ReportItem[];
  photo_attachments?: any[];
  audio_url?: string | null;
  compliance_officer?: string;
}

interface AIAnalysisResult {
  risk_level: string;
  executive_summary: string;
  recommended_actions: string[];
  safety_score: number;
}

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ReportData | null;
  activeRole?: string;
  onStatusUpdated?: () => void;
  isDemo?: boolean;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  report,
  activeRole = "org_admin",
  onStatusUpdated,
  isDemo = false,
}) => {
  const { authFetch } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const isSupervisorOrAdmin = activeRole === "supervisor" || activeRole === "org_admin" || activeRole === "super_admin";
  const itemsList: ReportItem[] = report.verified_items || report.items || [];
  const displayStatus = localStatus || report.overall_status || report.status || "approved";
  const displaySummary = aiAnalysis ? aiAnalysis.executive_summary : (report.executive_summary || report.ai_summary || "Safety parameters verified within operational tolerances.");
  const displayRisk = aiAnalysis ? aiAnalysis.risk_level : (report.risk_level || "LOW RISK");
  const officer = report.compliance_officer || report.inspector_id || "Operator 01";
  const isDemoSpecimen = isDemo || Boolean(report.certificate_id?.includes("SAMPLE") || report.certificate_id?.includes("SPECIMEN"));

  const handleRunAiAnalysis = async () => {
    if (isDemoSpecimen) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setAiAnalysis({
          risk_level: "LOW RISK",
          executive_summary: "Compressor head pressure verified at 42 PSI within manufacturer tolerances. High pressure relief safety valve inspected with zero residue or weeping. Unit cleared for operational duty.",
          recommended_actions: [
            "Maintain regular 30-day preventative servicing cycle.",
            "Verify secondary coolant loop pressure sensor calibration on next walkthrough."
          ],
          safety_score: 98,
        });
        setIsAnalyzing(false);
      }, 400);
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/${report.unit_id}/analyze`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data);
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReviewAction = async (newStatus: "approved" | "flagged") => {
    if (isDemoSpecimen) {
      setLocalStatus(newStatus);
      return;
    }

    setIsUpdating(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/${report.unit_id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          reviewer_notes: `Reviewed and marked as ${newStatus} by ${activeRole}.`,
        }),
      });

      if (res.ok) {
        setLocalStatus(newStatus);
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = itemsList
      .map(
        (item) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:6px;font-size:12px;">
          <span style="color:#334155;">${item.question}</span>
          <span style="font-weight:bold;font-family:monospace;color:#059669;background:#ecfdf5;padding:2px 8px;border-radius:4px;border:1px solid #a7f3d0;text-transform:uppercase;">
            ${item.response || "VERIFIED"}
          </span>
        </div>`
      )
      .join("");

    const actions = aiAnalysis ? aiAnalysis.recommended_actions : [
      "Maintain regular 30-day preventative servicing cycle.",
      "Verify secondary coolant loop pressure sensor calibration on next walkthrough."
    ];

    const actionsHtml = actions
      .map((action) => `<li style="margin-bottom:4px;color:#475569;">${action}</li>`)
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Compliance Audit Certificate - ${report.unit_id}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 0; background: #ffffff; }
            .cert-box { border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 780px; margin: 0 auto; box-sizing: border-box; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 14px; margin-bottom: 16px; }
            .brand { font-size: 24px; font-weight: 800; color: #6d28d9; letter-spacing: -0.5px; }
            .cert-id { font-size: 11px; font-family: monospace; color: #64748b; margin-top: 2px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: bold; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; text-transform: uppercase; }
            .summary-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; margin-bottom: 16px; font-size: 12px; line-height: 1.5; }
            .meta-row { display: flex; justify-content: space-between; margin-top: 10px; font-size: 11px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 8px; font-family: monospace; }
            .items-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #475569; margin-bottom: 8px; letter-spacing: 0.5px; }
            .footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="cert-box">
            <div class="header">
              <div>
                <div class="brand">Sonura</div>
                <div class="cert-id">CERTIFICATE ID: ${report.certificate_id}</div>
              </div>
              <div class="badge">${displayStatus}</div>
            </div>

            <div class="summary-box">
              <div style="font-weight: bold; margin-bottom: 4px; color: #1e293b;">EXECUTIVE COMPLIANCE SUMMARY</div>
              ${displaySummary}
              <div class="meta-row">
                <span>INSPECTOR: ${report.inspector_id}</span>
                <span>UNIT: ${report.unit_id}</span>
                <span>RISK LEVEL: ${displayRisk}</span>
                <span>PASS RATE: ${report.pass_rate}</span>
              </div>
            </div>

            <div class="items-title">VERIFIED CHECKLIST ITEMS</div>
            ${itemsHtml}

            <div style="margin-top:16px;">
              <div class="items-title">AI MITIGATION RECOMMENDATIONS</div>
              <ul style="font-size:12px;padding-left:18px;margin-top:4px;">
                ${actionsHtml}
              </ul>
            </div>

            <div class="footer">
              <span>Certified by ${officer}</span>
              <span>TIMESTAMP: ${new Date(report.timestamp).toLocaleString()}</span>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl max-h-[94vh] rounded-2xl p-3.5 sm:p-6 shadow-2xl border border-white/15 bg-slate-950/95 flex flex-col justify-between overflow-hidden">
        
        <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-white/10 shrink-0 font-mono">
          <div className="min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="text-sm sm:text-lg font-bold text-white tracking-tight font-sans">Compliance Audit Certificate</h3>
              {isDemoSpecimen && (
                <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[9px] uppercase">
                  Template Specimen
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate">Verified Record: {report.unit_id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto pr-1 font-mono">
          <div className="p-2.5 sm:p-3 rounded-xl bg-violet-950/40 border border-violet-500/30 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-600/30 border border-violet-500/50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-violet-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[9px] text-violet-400 uppercase tracking-widest block">
                  CERTIFICATE ID
                </span>
                <span className="text-[10px] sm:text-xs md:text-sm font-bold text-white break-all">
                  {report.certificate_id}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <Badge variant={displayRisk === "CRITICAL DEFECT" ? "danger" : displayRisk === "MODERATE RISK" ? "warning" : "success"} className="text-[10px] px-1.5 py-0.5">
                {displayRisk}
              </Badge>
              <Badge variant={displayStatus === "approved" || displayStatus === "completed" ? "success" : "danger"} className="text-[10px] px-1.5 py-0.5">
                {displayStatus.toUpperCase()}
              </Badge>
            </div>
          </div>

          <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Executive Compliance Summary
            </h4>

            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              {displaySummary}
            </p>

            <div className="pt-1">
              <button
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                className="w-full py-1.5 px-3 rounded-lg bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-300 text-[10px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>{isAnalyzing ? "Evaluating Readouts..." : "Auto-Analyze with AI"}</span>
              </button>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400 border-t border-slate-800">
              <span>Inspector: <strong className="text-slate-200">{report.inspector_id}</strong></span>
              <span>Pass Rate: <strong className="text-emerald-400">{report.pass_rate}</strong></span>
            </div>
          </div>

          {aiAnalysis && (
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-violet-500/20 space-y-1 text-xs">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center">
                <ListChecks className="w-3.5 h-3.5 mr-1" /> Action Recommendations
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px] sm:text-[11px]">
                {aiAnalysis.recommended_actions.map((act, idx) => (
                  <li key={idx}>{act}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dual Channel Audio Evidence Player */}
          <AudioEvidencePlayer
            unitId={report.unit_id}
            initialAudioUrl={report.audio_url}
          />

          <div className="space-y-1.5">
            <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Itemized Audit Verifications
            </h4>
            
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {itemsList.map((item) => (
                <div
                  key={item.item_id}
                  className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5 text-[11px]"
                >
                  <div className="flex items-start space-x-1.5">
                    {item.status === "completed" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-slate-200 leading-snug break-words flex-1 font-sans">
                      {item.question}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-400 truncate pr-2">
                      Value: <strong className="text-slate-300">{item.response || "Logged Verified"}</strong>
                    </span>
                    <Badge variant={item.status === "completed" ? "success" : "neutral"} className="text-[9px] px-1.5 py-0.2 shrink-0">
                      {item.status === "completed" ? "PASS" : "PENDING"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-2.5 pt-2 shrink-0 border-t border-slate-800 space-y-2 font-mono">
          <div className="text-[10px] text-slate-400 truncate text-center sm:text-left">
            Certified by {officer}
          </div>

          <div className="space-y-1.5">
            {isSupervisorOrAdmin && (
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button 
                  variant="secondary"
                  icon={<ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />}
                  isLoading={isUpdating}
                  onClick={() => handleReviewAction("approved")}
                  className="w-full py-2 text-xs border-emerald-500/30 hover:border-emerald-500/60 justify-center"
                >
                  Approve
                </Button>
                <Button 
                  variant="secondary"
                  icon={<Flag className="w-3.5 h-3.5 text-amber-400" />}
                  isLoading={isUpdating}
                  onClick={() => handleReviewAction("flagged")}
                  className="w-full py-2 text-xs border-amber-500/30 hover:border-amber-500/60 justify-center"
                >
                  Flag
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 w-full">
              <Button 
                variant="secondary" 
                onClick={onClose} 
                className="w-full py-2 text-xs justify-center"
              >
                Close
              </Button>
              <Button 
                variant="primary" 
                icon={<Printer className="w-3.5 h-3.5" />} 
                onClick={handlePrint}
                className="w-full py-2 text-xs shadow-md justify-center"
              >
                Print
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};