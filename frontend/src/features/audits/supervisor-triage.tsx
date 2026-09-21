"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Clock, 
  Users, 
  Check 
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { MetricCard } from "../../components/ui/metric-card";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";

interface SupervisorAuditItem {
  id: string;
  unit_id: string;
  title: string;
  inspector_id: string;
  status: string;
  priority: string;
  transcript_summary?: string;
  created_at: string;
  updated_at: string;
  items: Array<{ question: string; response?: string; status: string; flagged: boolean }>;
}

interface SupervisorTriageProps {
  onOpenReport: (unitId: string) => void;
}

export const SupervisorTriage: React.FC<SupervisorTriageProps> = ({ onOpenReport }) => {
  const { authFetch } = useAuth();
  const [audits, setAudits] = useState<SupervisorAuditItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAudits = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setAudits(data);
      }
    } catch (err) {
      console.error("Failed to load supervisor audits:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const handleQuickReview = async (unitId: string, newStatus: "approved" | "flagged") => {
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/${unitId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setActionSuccess(`Audit ${unitId} marked as ${newStatus.toUpperCase()}`);
        fetchAudits();
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Quick review failure:", err);
    }
  };

  const pendingAudits = audits.filter((a) => a.status === "in_progress" || a.status === "completed" || a.status === "pending");
  const flaggedAudits = audits.filter((a) => a.status === "flagged");
  const approvedAudits = audits.filter((a) => a.status === "approved");

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Reviews
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Triage queue to scrutinize voice telemetry, verify defect photos, and sign off certificates.
          </p>
        </div>

        <button
          onClick={fetchAudits}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Refresh queue"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4" />
          <span>{actionSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Pending Sign-Offs"
          value={String(pendingAudits.length)}
          subtitle="Waiting for supervisor review"
          icon={<Clock className="w-4 h-4 text-amber-400" />}
        />
        <MetricCard
          title="Flagged Defects"
          value={String(flaggedAudits.length)}
          subtitle="Requiring remediation"
          icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
        />
        <MetricCard
          title="Approved Certificates"
          value={String(approvedAudits.length)}
          subtitle="Compliance verified"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard
          title="Field Inspectors"
          value="8 On-Site"
          subtitle="Real-time WebRTC channels"
          icon={<Users className="w-4 h-4 text-cyan-400" />}
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-sans">Pending Review Queue ({pendingAudits.length})</h3>
          </div>
          <span className="text-xs text-slate-500">Sorted by completion timestamp</span>
        </div>

        <div className="divide-y divide-slate-800">
          {pendingAudits.length > 0 ? (
            pendingAudits.map((audit) => {
              const hasFlaggedItem = audit.items.some((i) => i.flagged);
              return (
                <div key={audit.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-white/5 transition-all">
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {hasFlaggedItem ? (
                        <AlertTriangle className="w-5 h-5 text-rose-400" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">
                          {audit.unit_id}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate font-sans">{audit.title}</h4>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span>Inspector: <strong className="text-slate-200">{audit.inspector_id}</strong></span>
                        <span>•</span>
                        <span>{audit.items.length} Checkpoints</span>
                        <span>•</span>
                        <span>{new Date(audit.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5">
                    <Button
                      variant="secondary"
                      onClick={() => handleQuickReview(audit.unit_id, "flagged")}
                      className="text-xs py-1.5 px-3 border-rose-500/30 hover:border-rose-500/60"
                    >
                      Flag
                    </Button>

                    <Button
                      variant="primary"
                      onClick={() => handleQuickReview(audit.unit_id, "approved")}
                      className="text-xs py-1.5 px-3"
                    >
                      Approve
                    </Button>

                    <button
                      onClick={() => onOpenReport(audit.unit_id)}
                      className="text-xs text-violet-400 hover:text-violet-300 font-bold inline-flex items-center px-3 py-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 transition-all cursor-pointer"
                    >
                      <span>Full Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              Review queue is clear. All field inspections have been signed off.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};