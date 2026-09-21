"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, Send, CheckCircle2, Building2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectOption } from "../../components/ui/select";
import { ChecklistTile } from "./checklist-tile";
import { VoiceCopilot } from "./voice-copilot";
import { CameraTriage } from "./camera-triage";
import { InspectionRecord, SiteItem, InspectionItem } from "../../types";
import { LiveMessage } from "./use-voice-session";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";

interface InspectorHUDProps {
  unitId: string;
  inspection: InspectionRecord | null;
  connectionState: "disconnected" | "connecting" | "connected";
  isAgentSpeaking: boolean;
  liveMessages: LiveMessage[];
  onToggleCall: () => void;
  onDefectDetected: (data: any) => void;
  onOpenReport: (unitId: string) => void;
  onSelectUnit: (unitId: string) => void;
  onRefreshInspection?: () => void;
}

export const InspectorHUD: React.FC<InspectorHUDProps> = ({
  unitId,
  inspection,
  connectionState,
  isAgentSpeaking,
  liveMessages,
  onToggleCall,
  onDefectDetected,
  onOpenReport,
  onSelectUnit,
  onRefreshInspection,
}) => {
  const { authFetch } = useAuth();
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [isSubmittingAudit, setIsSubmittingAudit] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/sites/`);
        if (res.ok) {
          const data: SiteItem[] = await res.json();
          setSites(data);

          if (data.length > 0) {
            const hasCurrent = data.some((s) => s.unit_id === unitId);
            if (!hasCurrent) {
              onSelectUnit(data[0].unit_id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load facility sites for inspector HUD:", err);
      }
    };
    fetchSites();
  }, [authFetch]);

  const completedCount = inspection ? inspection.items.filter((i) => i.status === "completed").length : 0;
  const totalCount = inspection ? inspection.items.length : 0;
  const allCompleted = totalCount > 0 ? completedCount === totalCount : false;
  const passRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleUpdateItem = async (itemId: string, updatedFields: Partial<InspectionItem>) => {
    if (!inspection) return;

    const updatedItems = inspection.items.map((itm) =>
      itm.item_id === itemId ? { ...itm, ...updatedFields } : itm
    );

    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/${inspection.unit_id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: updatedItems,
          status: inspection.status,
        }),
      });

      if (res.ok) {
        inspection.items = updatedItems;
        if (onRefreshInspection) onRefreshInspection();
      }
    } catch (e) {
      console.error("Failed to persist updated checkpoint:", e);
    }
  };

  const handleSubmitAudit = async () => {
    if (!inspection) return;
    setIsSubmittingAudit(true);

    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/${unitId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          notes: "Technician verified all checkpoints. Ready for supervisor review.",
        }),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        if (onRefreshInspection) onRefreshInspection();
        setTimeout(() => setSubmitSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to submit audit:", err);
    } finally {
      setIsSubmittingAudit(false);
    }
  };

  const siteOptions: SelectOption[] = sites.map((s) => ({
    value: s.unit_id,
    label: `${s.unit_id} - ${s.title}`,
    description: `Assigned: ${s.assigned_inspector} • Status: ${s.status.toUpperCase()}`,
  }));

  return (
    <div className="space-y-4 sm:space-y-6 font-mono w-full min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight font-sans truncate">
            Inspection
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans leading-relaxed">
            Hands-free voice walkthrough HUD with real-time checkpoint synchronization and defect capture.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 text-xs w-full md:w-auto shrink-0">
          <div className="w-full sm:w-60 min-w-0">
            <Select
              options={siteOptions}
              value={unitId}
              onChange={onSelectUnit}
              searchable={true}
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>

          <div className="p-2 sm:p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between sm:justify-start space-x-2 shrink-0">
            <span className="text-slate-400">Progress:</span>
            <strong className="text-emerald-400">{completedCount}/{totalCount} ({passRate}%)</strong>
          </div>
        </div>
      </div>

      {submitSuccess ? (
        <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Audit report submitted successfully for supervisor review.</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0">
        <Card className="lg:col-span-2 flex flex-col justify-between w-full min-w-0">
          <div className="w-full min-w-0">
            <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
              <div className="min-w-0 pr-2">
                <Badge variant="violet">{unitId}</Badge>
                <h3 className="text-base sm:text-lg font-bold text-white mt-1.5 sm:mt-2 font-sans truncate">
                  Equipment Checkpoints
                </h3>
              </div>

              <div className="shrink-0">
                <Badge
                  variant={
                    inspection?.status === "approved" ? "success" : inspection?.status === "completed" ? "success" : "info"
                  }
                >
                  {inspection ? inspection.status.toUpperCase() : "IN PROGRESS"}
                </Badge>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3 w-full min-w-0">
              {inspection ? (
                inspection.items.map((item) => (
                  <ChecklistTile
                    key={item.item_id}
                    item={item}
                    onUpdateItem={handleUpdateItem}
                  />
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Loading checklist items from Supabase database...
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400 w-full">
            <button
              type="button"
              onClick={() => onOpenReport(unitId)}
              className="text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center cursor-pointer font-sans"
            >
              Preview Certificate <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>

            {allCompleted ? (
              inspection?.status !== "completed" ? (
                inspection?.status !== "approved" ? (
                  <Button
                    variant="primary"
                    icon={<Send className="w-3.5 h-3.5" />}
                    isLoading={isSubmittingAudit}
                    onClick={handleSubmitAudit}
                    className="text-xs py-2 px-4 shadow-md w-full sm:w-auto justify-center"
                  >
                    Submit Audit for Review
                  </Button>
                ) : null
              ) : null
            ) : null}
          </div>
        </Card>

        <div className="flex flex-col space-y-4 sm:space-y-6 w-full min-w-0">
          <VoiceCopilot
            connectionState={connectionState}
            isAgentSpeaking={isAgentSpeaking}
            liveMessages={liveMessages}
            onToggleCall={onToggleCall}
          />

          <CameraTriage
            unitId={unitId}
            onDefectDetected={onDefectDetected}
          />
        </div>
      </div>
    </div>
  );
};