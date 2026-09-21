"use client";

import React, { useState, useEffect, useCallback } from "react";
import { History, Search, CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Select, SelectOption } from "../../components/ui/select";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";

interface AuditLogItem {
  id: string;
  unit_id: string;
  title: string;
  inspector_id: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  items: Array<{ status: string; flagged?: boolean }>;
}

interface AuditHistoryProps {
  onOpenReport: (unitId: string) => void;
}

const STATUS_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "approved", label: "Approved" },
  { value: "completed", label: "Completed" },
  { value: "in_progress", label: "In Progress" },
  { value: "flagged", label: "Flagged" },
];

export const AuditHistory: React.FC<AuditHistoryProps> = ({ onOpenReport }) => {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        setErrorMessage("Failed to load audit records from database.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to inspections service.");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.unit_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.inspector_id.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch ? log.status.toLowerCase() === statusFilter.toLowerCase() : false;
  });

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight font-sans">Audit Logs and Compliance Archive</h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical repository of all voice-verified field audits across your organization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by unit, title, or inspector..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>

          <div className="w-44">
            <Select
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>

          <button
            onClick={fetchAuditLogs}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-800">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              Loading audit logs from Supabase database...
            </div>
          ) : filteredLogs.length > 0 ? (
            filteredLogs.map((log) => {
              const completedItems = (log.items || []).filter((i) => i.status === "completed").length;
              const totalItems = (log.items || []).length;
              const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

              return (
                <div 
                  key={log.id} 
                  onClick={() => onOpenReport(log.unit_id)}
                  className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      {log.status === "approved" || log.status === "completed" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <History className="w-5 h-5 text-cyan-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 mb-0.5">
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">
                          {log.unit_id}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate font-sans">{log.title}</h4>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-400">
                        <span>Inspector: <strong className="text-slate-300">{log.inspector_id}</strong></span>
                        <span>•</span>
                        <span>Score: <strong className="text-emerald-400">{percentage}%</strong></span>
                        <span>•</span>
                        <span>{new Date(log.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge variant={log.status === "approved" || log.status === "completed" ? "success" : log.status === "in_progress" ? "info" : "warning"}>
                      {log.status.toUpperCase()}
                    </Badge>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenReport(log.unit_id);
                      }}
                      className="text-xs text-violet-400 hover:text-violet-300 font-bold inline-flex items-center px-3 py-1.5 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 transition-all cursor-pointer"
                    >
                      <span>Certificate</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              No historical audit records match your query.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};