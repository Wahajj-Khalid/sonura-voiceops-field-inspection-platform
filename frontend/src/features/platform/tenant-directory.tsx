"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Building2, 
  Search, 
  Trash2, 
  Edit3, 
  Check, 
  PauseCircle, 
  PlayCircle, 
  RefreshCw 
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { Input } from "../../components/ui/input";
import { Select, SelectOption } from "../../components/ui/select";
import { ConfirmationModal, ConfirmationVariant } from "../../components/ui/confirmation-modal";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { OrganizationItem } from "../../types";

const PLAN_FILTER_OPTIONS: SelectOption[] = [
  { value: "all", label: "All Subscription Plans" },
  { value: "enterprise", label: "Enterprise Tier" },
  { value: "growth", label: "Growth Tier" },
  { value: "pilot", label: "Pilot Tier" },
];

const PLAN_OPTIONS: SelectOption[] = [
  { value: "enterprise", label: "Enterprise Tier", description: "100 Users, 50 Sites, 5000 Audits, 10 GB" },
  { value: "growth", label: "Growth Tier", description: "25 Users, 15 Sites, 500 Audits, 1 GB" },
  { value: "pilot", label: "Pilot Tier", description: "5 Users, 2 Sites, 50 Audits, 100 MB" },
];

interface TenantDirectoryProps {
  onSelectTenant: (orgId: string) => void;
}

export const TenantDirectory: React.FC<TenantDirectoryProps> = ({ onSelectTenant }) => {
  const { authFetch } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [targetOrg, setTargetOrg] = useState<OrganizationItem | null>(null);
  const [planValue, setPlanValue] = useState("enterprise");
  const [maxUsers, setMaxUsers] = useState(25);
  const [maxSites, setMaxSites] = useState(15);
  const [maxAudits, setMaxAudits] = useState(500);
  const [storageMb, setStorageMb] = useState(1024);
  const [isSavingQuotas, setIsSavingQuotas] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: ConfirmationVariant;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    variant: "danger",
    action: async () => {},
  });

  const fetchOrganizations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/organizations/`);
      if (res.ok) setOrganizations(await res.json());
    } catch (err) {
      console.error("Failed to load organizations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const triggerSuspendOrg = (org: OrganizationItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Suspend ${org.name}`,
      message: `Are you sure you want to suspend ${org.name}? All technicians and administrators from this organization will be locked out until resumed.`,
      confirmText: "Suspend Tenant",
      variant: "warning",
      action: async () => {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/organizations/${org.id}/suspend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Administrative suspension by Platform Super Admin." }),
        });
        if (res.ok) {
          setStatusMessage(`Tenant ${org.name} suspended.`);
          fetchOrganizations();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setTimeout(() => setStatusMessage(null), 3000);
        }
      },
    });
  };

  const triggerResumeOrg = (org: OrganizationItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Resume ${org.name}`,
      message: `Restore platform access for ${org.name}? Members will be able to sign in immediately.`,
      confirmText: "Resume Access",
      variant: "success",
      action: async () => {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/organizations/${org.id}/resume`, {
          method: "POST",
        });
        if (res.ok) {
          setStatusMessage(`Tenant ${org.name} resumed.`);
          fetchOrganizations();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setTimeout(() => setStatusMessage(null), 3000);
        }
      },
    });
  };

  const triggerDeprovisionOrg = (org: OrganizationItem) => {
    setConfirmModal({
      isOpen: true,
      title: `Deprovision ${org.name}`,
      message: `Permanently delete ${org.name}? All associated sites, templates, and audits will be permanently purged. This action cannot be reversed.`,
      confirmText: "Purge Tenant Data",
      variant: "danger",
      action: async () => {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/organizations/${org.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setStatusMessage(`Successfully purged ${org.name}.`);
          fetchOrganizations();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          setTimeout(() => setStatusMessage(null), 3000);
        }
      },
    });
  };

  const handleOpenQuotaModal = (org: OrganizationItem) => {
    setTargetOrg(org);
    setPlanValue(org.plan);
    setMaxUsers(org.max_users || 25);
    setMaxSites(org.max_sites || 15);
    setMaxAudits(org.max_audits || 500);
    setStorageMb(org.storage_limit_mb || 1024);
    setIsQuotaModalOpen(true);
  };

  const handleSaveQuotas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOrg) return;
    setIsSavingQuotas(true);

    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/organizations/${targetOrg.id}/quotas`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planValue,
          max_users: maxUsers,
          max_sites: maxSites,
          max_audits: maxAudits,
          storage_limit_mb: storageMb,
        }),
      });

      if (res.ok) {
        setStatusMessage(`Updated quotas for ${targetOrg.name}.`);
        fetchOrganizations();
        setIsQuotaModalOpen(false);
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to update quotas:", err);
    } finally {
      setIsSavingQuotas(false);
    }
  };

  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (planFilter === "all") return matchesSearch;
    return matchesSearch ? org.plan.toLowerCase() === planFilter.toLowerCase() : false;
  });

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Tenants
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Directory of client organizations, subscription quotas, and tenant access controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>

          <div className="w-48">
            <Select
              options={PLAN_FILTER_OPTIONS}
              value={planFilter}
              onChange={setPlanFilter}
            />
          </div>

          <button
            onClick={fetchOrganizations}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh organizations"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center space-x-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-800">
          {filteredOrganizations.map((org: any) => (
            <div
              key={org.id}
              className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-white/5 transition-all"
            >
              <div
                onClick={() => onSelectTenant(org.id)}
                className="flex items-center space-x-3.5 min-w-0 cursor-pointer flex-1"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center font-bold text-xs text-violet-300 shrink-0">
                  <Building2 className="w-5 h-5 text-violet-400" />
                </div>

                <div className="min-w-0 font-mono">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white hover:text-violet-300 transition-colors truncate font-sans">
                      {org.name}
                    </h4>
                    <Badge variant={org.plan === "enterprise" ? "violet" : org.plan === "growth" ? "info" : "neutral"}>
                      {org.plan.toUpperCase()}
                    </Badge>
                    <Badge variant={org.is_active === false ? "danger" : "success"}>
                      {org.is_active === false ? "SUSPENDED" : "ACTIVE"}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400 mt-0.5">
                    <span>{org.members_count} / {org.max_users || 25} Users</span>
                    <span>•</span>
                    <span>{org.sites_count} / {org.max_sites || 15} Facilities</span>
                    <span>•</span>
                    <span>Created: {new Date(org.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 font-mono">
                <Button
                  variant="secondary"
                  onClick={() => onSelectTenant(org.id)}
                  className="text-xs py-1.5 px-3"
                >
                  Drill Down
                </Button>

                <button
                  onClick={() => handleOpenQuotaModal(org)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Edit Custom Quotas"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {org.is_active === false ? (
                  <button
                    onClick={() => triggerResumeOrg(org)}
                    className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Resume Organization Access"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => triggerSuspendOrg(org)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Suspend Organization"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                  </button>
                )}

                {org.id !== "11111111-1111-1111-1111-111111111111" && (
                  <button
                    onClick={() => triggerDeprovisionOrg(org)}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Deprovision Tenant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quota Customization Modal */}
      <Modal isOpen={isQuotaModalOpen} onClose={() => setIsQuotaModalOpen(false)} maxWidth="max-w-md">
        <div className="space-y-4 font-mono">
          <div className="pb-2 border-b border-slate-800">
            <h3 className="text-base font-bold text-white font-sans">Customize Tenant Quotas</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Organization: <strong className="text-slate-200 font-sans">{targetOrg?.name}</strong>
            </p>
          </div>

          <form onSubmit={handleSaveQuotas} className="space-y-3">
            <Select
              label="Subscription Tier"
              options={PLAN_OPTIONS}
              value={planValue}
              onChange={(val) => {
                setPlanValue(val);
                const q = APP_CONFIG.planQuotas[val as keyof typeof APP_CONFIG.planQuotas];
                if (q) {
                  setMaxUsers(q.maxUsers);
                  setMaxSites(q.maxSites);
                  setMaxAudits(q.maxAudits);
                  setStorageMb(q.storageLimitMb);
                }
              }}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Max User Seats"
                type="number"
                min={1}
                required
                value={maxUsers}
                onChange={(e) => setMaxUsers(Number(e.target.value))}
              />

              <Input
                label="Max Site Facilities"
                type="number"
                min={1}
                required
                value={maxSites}
                onChange={(e) => setMaxSites(Number(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Max Monthly Audits"
                type="number"
                min={1}
                required
                value={maxAudits}
                onChange={(e) => setMaxAudits(Number(e.target.value))}
              />

              <Input
                label="Storage Limit (MB)"
                type="number"
                min={50}
                required
                value={storageMb}
                onChange={(e) => setStorageMb(Number(e.target.value))}
              />
            </div>

            <div className="pt-3 flex justify-end space-x-2.5 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setIsQuotaModalOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSavingQuotas} className="text-xs">
                Save Quotas
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.action}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
      />
    </div>
  );
};