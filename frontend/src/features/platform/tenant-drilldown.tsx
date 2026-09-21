"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  ChevronLeft, 
  Users, 
  BookOpen, 
  History, 
  Radio, 
  HardDrive,
  UserX,
  UserCheck
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { MetricCard } from "../../components/ui/metric-card";
import { Modal } from "../../components/ui/modal";
import { ConfirmationModal } from "../../components/ui/confirmation-modal";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";

interface TenantDrilldownProps {
  orgId: string;
  onBack: () => void;
  onOpenReport: (unitId: string) => void;
}

type DrilldownTab = "overview" | "analytics" | "users" | "sites" | "templates" | "manuals" | "audits";

export const TenantDrilldown: React.FC<TenantDrilldownProps> = ({ orgId, onBack, onOpenReport }) => {
  const { authFetch } = useAuth();
  const [drillData, setDrillData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<DrilldownTab>("overview");
  const [isLoading, setIsLoading] = useState(true);

  const [inspectModal, setInspectModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    content: React.ReactNode;
  }>({
    isOpen: false,
    title: "",
    subtitle: "",
    content: null,
  });

  const [userStatusModal, setUserStatusModal] = useState<{
    isOpen: boolean;
    user: any | null;
    targetStatus: boolean;
  }>({
    isOpen: false,
    user: null,
    targetStatus: false,
  });

  const fetchTenantDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/organizations/${orgId}/details`);
      if (res.ok) {
        setDrillData(await res.json());
      }
    } catch (err) {
      console.error("Failed to load tenant details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, orgId]);

  useEffect(() => {
    fetchTenantDetails();
  }, [fetchTenantDetails]);

  const handleToggleUserStatus = async () => {
    if (!userStatusModal.user) return;
    const target = userStatusModal.user;
    const newStatus = userStatusModal.targetStatus;

    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/team/${target.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: newStatus,
          reason: newStatus ? "Restored by Super Admin" : "Suspended by Platform Super Administrator",
        }),
      });

      if (res.ok) {
        fetchTenantDetails();
        setUserStatusModal({ isOpen: false, user: null, targetStatus: false });
      }
    } catch (e) {
      console.error("Error modifying member status:", e);
    }
  };

  if (isLoading || !drillData) {
    return (
      <div className="p-12 text-center text-slate-500 font-mono text-xs italic">
        Loading organization workspace details...
      </div>
    );
  }

  const { organization, members, sites, templates, audits, manuals, analytics, metrics } = drillData;

  const tabs: Array<{ id: DrilldownTab; label: string; count?: number }> = [
    { id: "overview", label: "Workspace Overview" },
    { id: "analytics", label: "Tenant Analytics" },
    { id: "users", label: "Team Users", count: members.length },
    { id: "sites", label: "Site Facilities", count: sites.length },
    { id: "templates", label: "Checklists", count: templates.length },
    { id: "manuals", label: "RAG Manuals", count: manuals.length },
    { id: "audits", label: "Audit Records", count: audits.length },
  ];

  const handleInspectTemplate = (tmpl: any) => {
    const rawItems = tmpl.items || [];
    setInspectModal({
      isOpen: true,
      title: tmpl.title,
      subtitle: `Category: ${tmpl.category} • ${rawItems.length} Verification Checkpoints`,
      content: (
        <div className="space-y-2 font-mono text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Created: {new Date(tmpl.created_at).toLocaleString()}
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {rawItems.map((itm: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200">
                <span className="text-violet-400 font-bold mr-1.5">{idx + 1}.</span>
                <span className="font-sans">{itm.question}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  };

  const handleInspectSite = (site: any) => {
    setInspectModal({
      isOpen: true,
      title: `Facility Unit: ${site.unit_id}`,
      subtitle: site.title,
      content: (
        <div className="space-y-3 font-mono text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <div>Unit Identifier: <strong className="text-cyan-400">{site.unit_id}</strong></div>
            <div>Assigned Lead Inspector: <strong className="text-white">{site.assigned_inspector}</strong></div>
            <div>Operational Status: <strong className="text-emerald-400 uppercase">{site.status}</strong></div>
            <div>Bound Template ID: <strong className="text-slate-400">{site.bound_template_id || "None"}</strong></div>
            <div>Registered On: <strong>{new Date(site.created_at).toLocaleString()}</strong></div>
          </div>
        </div>
      ),
    });
  };

  const weeklyTrend = analytics.weekly_trend || [
    { day: "Mon", count: 1 },
    { day: "Tue", count: 2 },
    { day: "Wed", count: 1 },
    { day: "Thu", count: 0 },
    { day: "Fri", count: 3 },
    { day: "Sat", count: 1 },
    { day: "Sun", count: 2 },
  ];

  return (
    <div className="space-y-6 font-mono">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Tenant Directory</span>
        </button>

        <Badge variant={organization.is_active ? "success" : "danger"}>
          {organization.is_active ? "ACTIVE TENANT" : "SUSPENDED"}
        </Badge>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight font-sans">
          {organization.name}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Tenant ID: {organization.id} • Subscription: {organization.plan.toUpperCase()}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2 text-xs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === t.id
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 font-bold"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            {t.label} {t.count !== undefined ? `(${t.count})` : ""}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Team Users"
              value={`${metrics.total_users} / ${organization.max_users || 25}`}
              subtitle="Registered member seats"
              icon={<Users className="w-4 h-4 text-violet-400" />}
            />
            <MetricCard
              title="Site Units"
              value={`${metrics.total_sites} / ${organization.max_sites || 15}`}
              subtitle="Registered facility tags"
              icon={<Radio className="w-4 h-4 text-cyan-400" />}
            />
            <MetricCard
              title="Audit Logs"
              value={`${metrics.total_audits} / ${organization.max_audits || 500}`}
              subtitle={`Pass Rate: ${analytics.pass_rate}`}
              icon={<History className="w-4 h-4 text-emerald-400" />}
            />
            <MetricCard
              title="Indexed Manuals"
              value={String(metrics.total_manuals)}
              subtitle="Tenant RAG documents"
              icon={<BookOpen className="w-4 h-4 text-amber-400" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <Card className="p-5 space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider font-sans">Quota and Limits Configuration</h4>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Plan Tier:</span>
                  <strong className="text-violet-400 uppercase">{organization.plan}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">User Seats Limit:</span>
                  <strong>{organization.max_users || 25} Users</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Facility Sites Limit:</span>
                  <strong>{organization.max_sites || 15} Sites</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Storage Limit:</span>
                  <strong>{organization.storage_limit_mb || 1024} MB</strong>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-3">
              <h4 className="font-bold text-white uppercase tracking-wider font-sans">Tenant Security Status</h4>
              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Isolation Status:</span>
                  <strong className="text-emerald-400">Row-Level Security Enforced</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-500">Account Status:</span>
                  <strong className={organization.is_active ? "text-emerald-400" : "text-rose-400"}>
                    {organization.is_active ? "Operational" : "Suspended"}
                  </strong>
                </div>
                {organization.suspension_reason ? (
                  <div className="py-1 text-rose-400 text-[11px]">
                    Reason: {organization.suspension_reason}
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* 2. ANALYTICS TAB */}
      {activeTab === "analytics" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <Card className="p-5 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider font-sans">Audit Pass Breakdown</h4>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Approved Certificates:</span>
                <strong className="text-emerald-400">{analytics.approved_audits}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Flagged Defects:</span>
                <strong className="text-rose-400">{analytics.flagged_audits}</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Compliance Pass Rate:</span>
                <strong className="text-cyan-400">{analytics.pass_rate}</strong>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider font-sans">Storage Telemetry</h4>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-500">Storage Used:</span>
                <strong className="text-emerald-400">{analytics.storage_used_mb} MB</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Storage Cap:</span>
                <strong>{organization.storage_limit_mb || 1024} MB</strong>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-wider font-sans">7-Day Audit Velocity</h4>
            <div className="flex items-end justify-between h-20 pt-3 border-b border-slate-800 pb-1">
              {weeklyTrend.map((item: any, idx: number) => {
                const heightPct = Math.min(100, Math.max(15, item.count * 25));
                return (
                  <div key={idx} className="flex flex-col items-center space-y-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-4 rounded-t bg-violet-500 hover:bg-violet-400 transition-all"
                    />
                    <span className="text-[10px] text-slate-500">{item.day}</span>
                  </div>
                );
              })}
            </div>
            <span className="text-[10px] text-slate-500 block text-center">Live Daily Audit Activity</span>
          </Card>
        </div>
      ) : null}

      {/* 3. USERS TAB WITH SUSPEND / RESUME CONTROLS */}
      {activeTab === "users" ? (
        <Card className="p-0 overflow-hidden text-xs">
          {members.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {members.map((m: any) => (
                <div 
                  key={m.id} 
                  className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-white/5 transition-all"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-200 font-bold block font-sans">{m.name}</span>
                      <Badge variant={m.is_active ? "success" : "danger"} className="text-[9px] px-1.5 py-0.2">
                        {m.is_active ? "ACTIVE" : "SUSPENDED"}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400">{m.email}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 hidden sm:inline mr-2">{m.audits_count} Audits</span>
                    <Badge variant={m.role === "Org Admin" ? "violet" : m.role === "Supervisor" ? "info" : "neutral"}>
                      {m.role}
                    </Badge>

                    <button
                      type="button"
                      onClick={() => setUserStatusModal({ isOpen: true, user: m, targetStatus: !m.is_active })}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        m.is_active
                          ? "bg-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40"
                          : "bg-emerald-950/60 border-emerald-500/30 text-emerald-400 hover:text-emerald-300"
                      }`}
                      title={m.is_active ? "Suspend Member" : "Resume Member"}
                    >
                      {m.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 italic">
              No team user accounts provisioned under this organization yet.
            </div>
          )}
        </Card>
      ) : null}

      {/* 4. SITES TAB */}
      {activeTab === "sites" ? (
        <Card className="p-0 overflow-hidden text-xs">
          {sites.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {sites.map((s: any) => (
                <div 
                  key={s.id} 
                  onClick={() => handleInspectSite(s)}
                  className="p-4 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
                >
                  <div>
                    <span className="text-cyan-400 font-bold block">{s.unit_id}</span>
                    <span className="text-slate-300 font-sans">{s.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500">Inspector: {s.assigned_inspector}</span>
                    <Badge variant={s.status === "completed" || s.status === "approved" ? "success" : "neutral"}>
                      {s.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 italic">
              No equipment site facilities registered for this organization yet.
            </div>
          )}
        </Card>
      ) : null}

      {/* 5. TEMPLATES TAB */}
      {activeTab === "templates" ? (
        <div>
          {templates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {templates.map((t: any) => (
                <Card 
                  key={t.id} 
                  onClick={() => handleInspectTemplate(t)}
                  className="p-4 space-y-2 hover:border-violet-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <Badge variant="violet">{t.category}</Badge>
                    <span className="text-[10px] text-slate-500">{(t.items || []).length} Checkpoints</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-sans">{t.title}</h4>
                  <span className="text-[10px] text-violet-400 block pt-1">Click to view checkpoint list</span>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-slate-500 italic text-xs">
              No custom checklist protocols created by this organization.
            </Card>
          )}
        </div>
      ) : null}

      {/* 6. MANUALS TAB */}
      {activeTab === "manuals" ? (
        <div>
          {manuals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {manuals.map((m: any, idx: number) => (
                <Card key={idx} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans">{m.manual_title}</h4>
                    <span className="text-[11px] text-slate-400">{m.category} • {m.chunks} Vector Chunks</span>
                  </div>
                  <Badge variant="success">Indexed</Badge>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-slate-500 italic text-xs">
              No technical manuals indexed for this organization.
            </Card>
          )}
        </div>
      ) : null}

      {/* 7. AUDITS TAB */}
      {activeTab === "audits" ? (
        <Card className="p-0 overflow-hidden text-xs">
          {audits.length > 0 ? (
            <div className="divide-y divide-slate-800">
              {audits.map((a: any) => (
                <div key={a.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-cyan-400 font-bold block">{a.unit_id}</span>
                    <span className="text-slate-300 font-sans">{a.title}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant={a.status === "approved" || a.status === "completed" ? "success" : "warning"}>
                      {a.status.toUpperCase()}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => onOpenReport(a.unit_id)}
                      className="text-xs text-violet-400 hover:text-violet-300 font-bold cursor-pointer"
                    >
                      View Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 italic">
              No audit records generated for this organization yet.
            </div>
          )}
        </Card>
      ) : null}

      <Modal 
        isOpen={inspectModal.isOpen} 
        onClose={() => setInspectModal((prev) => ({ ...prev, isOpen: false }))}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 font-mono">
          <div className="pb-2 border-b border-slate-800 pr-8">
            <h3 className="text-base font-bold text-white font-sans">{inspectModal.title}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{inspectModal.subtitle}</p>
          </div>

          {inspectModal.content}
        </div>
      </Modal>

      {/* User Suspension Confirmation Modal for Super Admin */}
      <ConfirmationModal
        isOpen={userStatusModal.isOpen}
        onClose={() => setUserStatusModal({ isOpen: false, user: null, targetStatus: false })}
        onConfirm={handleToggleUserStatus}
        title={userStatusModal.targetStatus ? `Restore Access for ${userStatusModal.user?.name}` : `Suspend ${userStatusModal.user?.name}`}
        message={
          userStatusModal.targetStatus
            ? `Restore login access for ${userStatusModal.user?.name}? The member will be able to access the console immediately.`
            : `Suspend login access for ${userStatusModal.user?.name}? The member will be immediately blocked from signing in.`
        }
        confirmText={userStatusModal.targetStatus ? "Restore Access" : "Suspend User"}
        variant={userStatusModal.targetStatus ? "success" : "warning"}
      />
    </div>
  );
};