"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Building2, 
  Users, 
  ListChecks, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { MetricCard } from "../../components/ui/metric-card";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { OrganizationUsage } from "../../types";

interface OrgOverviewProps {
  onNavigateTab: (tab: string) => void;
}

export const OrgOverview: React.FC<OrgOverviewProps> = ({ onNavigateTab }) => {
  const { authFetch } = useAuth();
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [orgData, setOrgData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOrgOverview = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/organizations/my-org`);
      if (res.ok) {
        const data = await res.json();
        setOrgData(data.organization);
        setUsage(data.usage);
      } else {
        setErrorMessage("Failed to load organization overview metrics.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to organization gateway.");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchOrgOverview();
  }, [fetchOrgOverview]);

  const sitesUsed = usage?.sites_used || 0;
  const sitesLimit = usage?.sites_limit || 15;
  const usersUsed = usage?.users_used || 0;
  const usersLimit = usage?.users_limit || 25;
  const auditsUsed = usage?.audits_used || 0;
  const auditsLimit = usage?.audits_limit || 500;
  const storageUsed = usage?.storage_used_mb || 45;
  const storageLimit = usage?.storage_limit_mb || 1024;
  const templatesCount = usage?.templates_count || 0;

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Badge variant="violet">EXECUTIVE WORKSPACE</Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5 font-sans">
            Executive Operations Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor plan quota limits, manage facility sites, define checklist templates, and oversee team operations.
          </p>
        </div>

        <button
          onClick={fetchOrgOverview}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <MetricCard
          title="Facility Sites"
          value={`${sitesUsed} / ${sitesLimit}`}
          subtitle="Registered equipment units"
          icon={<Building2 className="w-4 h-4 text-violet-400" />}
        />
        <MetricCard
          title="Team Members"
          value={`${usersUsed} / ${usersLimit}`}
          subtitle="Active member seats"
          icon={<Users className="w-4 h-4 text-cyan-400" />}
        />
        <MetricCard
          title="Checklist Templates"
          value={String(templatesCount)}
          subtitle="Voice inspection protocols"
          icon={<ListChecks className="w-4 h-4 text-emerald-400" />}
        />
        <MetricCard
          title="Field Audits"
          value={`${auditsUsed} / ${auditsLimit}`}
          subtitle="Monthly audit volume"
          icon={<CheckCircle2 className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Quota Progress Utilization Bars */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white font-sans">Subscription Resource Utilization</h3>
          <Badge variant="violet">{orgData?.plan?.toUpperCase() || "ENTERPRISE"} TIER</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>User Seats Quota:</span>
              <strong>{usersUsed} of {usersLimit}</strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div 
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((usersUsed / usersLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Site Facilities Quota:</span>
              <strong>{sitesUsed} of {sitesLimit}</strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div 
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((sitesUsed / sitesLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>Storage Quota:</span>
              <strong>{storageUsed} MB of {storageLimit} MB</strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Action Navigation Grid with Enhanced Themed Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-between space-y-4 hover:border-violet-500/50 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="text-base font-bold text-white font-sans">Facilities and Sites</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Register physical facilities, assign inspectors, and bind customized checklist templates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("sites")}
            className="w-full py-2.5 px-4 rounded-xl bg-violet-600/15 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-semibold font-sans transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm hover:shadow-violet-600/20"
          >
            <span>Manage Sites ({sitesUsed})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Card>

        <Card className="flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white font-sans">Checklist Builder</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Define standard operational checkpoints spoken verbally by the voice copilot.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("checklists")}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold font-sans transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm hover:shadow-emerald-600/20"
          >
            <span>Configure Protocols ({templatesCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Card>

        <Card className="flex flex-col justify-between space-y-4 hover:border-cyan-500/50 transition-colors">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-white font-sans">Team Members</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Invite technicians, assign supervisor authorizations, and oversee member permissions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab("team")}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-600/15 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold font-sans transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-sm hover:shadow-cyan-600/20"
          >
            <span>Manage Roster ({usersUsed})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Card>
      </div>
    </div>
  );
};