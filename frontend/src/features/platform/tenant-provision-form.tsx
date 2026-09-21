"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Building2, UserPlus } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectOption } from "../../components/ui/select";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";

const PLAN_OPTIONS: SelectOption[] = [
  { value: "enterprise", label: "Enterprise Tier", description: "100 Users, 50 Sites, 5000 Audits, 10 GB" },
  { value: "growth", label: "Growth Tier", description: "25 Users, 15 Sites, 500 Audits, 1 GB" },
  { value: "pilot", label: "Pilot Tier", description: "5 Users, 2 Sites, 50 Audits, 100 MB" },
];

interface TenantProvisionFormProps {
  onSuccessNavigate: () => void;
}

export const TenantProvisionForm: React.FC<TenantProvisionFormProps> = ({ onSuccessNavigate }) => {
  const { authFetch } = useAuth();
  const [newOrgName, setNewOrgName] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newSelectedPlan, setNewSelectedPlan] = useState("enterprise");

  // Customizable Quota Inputs
  const [maxUsers, setMaxUsers] = useState(100);
  const [maxSites, setMaxSites] = useState(50);
  const [maxAudits, setMaxAudits] = useState(5000);
  const [storageMb, setStorageMb] = useState(10240);

  const [isProvisioning, setIsProvisioning] = useState(false);
  const [receipt, setReceipt] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePlanChange = (val: string) => {
    setNewSelectedPlan(val);
    const q = APP_CONFIG.planQuotas[val as keyof typeof APP_CONFIG.planQuotas];
    if (q) {
      setMaxUsers(q.maxUsers);
      setMaxSites(q.maxSites);
      setMaxAudits(q.maxAudits);
      setStorageMb(q.storageLimitMb);
    }
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newAdminEmail.trim() || !newAdminName.trim()) return;

    setIsProvisioning(true);
    setErrorMessage(null);

    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/organizations/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newOrgName.trim(),
          plan: newSelectedPlan,
          admin_name: newAdminName.trim(),
          admin_email: newAdminEmail.trim().toLowerCase(),
          max_users: maxUsers,
          max_sites: maxSites,
          max_audits: maxAudits,
          storage_limit_mb: storageMb,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReceipt(data);
      } else {
        setErrorMessage(data.detail || "Provisioning failed.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to platform gateway.");
    } finally {
      setIsProvisioning(false);
    }
  };

  return (
    <div className="w-full space-y-6 font-mono">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
          Provision New Tenant
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Create an isolated multi-tenant organization workspace with custom plan quotas and primary Org Admin credentials.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {receipt ? (
        <Card className="p-6 bg-slate-950 border border-emerald-500/40 space-y-4 text-xs">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Tenant Workspace Provisioned Successfully</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-slate-300">
            <div>Organization: <strong className="text-white font-sans">{receipt.org_name}</strong></div>
            <div>Tenant ID: <strong className="text-violet-400">{receipt.org_id}</strong></div>
            <div>Org Admin: <strong className="text-white font-sans">{receipt.admin_name}</strong> ({receipt.admin_email})</div>
            <div>Initial Password: <strong className="text-emerald-400">{receipt.default_password}</strong></div>
            <div>Plan Tier: <strong className="text-cyan-400 uppercase">{receipt.plan}</strong></div>
            <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800">
              Quotas: {receipt.quotas.max_users} Users • {receipt.quotas.max_sites} Sites • {receipt.quotas.max_audits} Audits • {receipt.quotas.storage_limit_mb} MB
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="primary"
              onClick={onSuccessNavigate}
              className="text-xs"
            >
              View in Tenant Directory
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 sm:p-8 bg-slate-950/90 border border-white/10 space-y-4">
          <form onSubmit={handleProvisionSubmit} className="space-y-4">
            <Input
              label="Organization Legal Entity Name"
              required
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="e.g. Apex Energy Infrastructure Corp"
              icon={<Building2 className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Org Admin Name"
                required
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="e.g. Rachel Vance"
                icon={<UserPlus className="w-4 h-4" />}
              />

              <Input
                label="Org Admin Work Email"
                type="email"
                required
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="rachel@apexenergy.com"
              />
            </div>

            <Select
              label="Subscription Plan Tier"
              options={PLAN_OPTIONS}
              value={newSelectedPlan}
              onChange={handlePlanChange}
            />

            <div className="pt-2 pb-1 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-sans">
                Customizable Resource Quotas
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input
                  label="Max Users"
                  type="number"
                  min={1}
                  required
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(Number(e.target.value))}
                />

                <Input
                  label="Max Sites"
                  type="number"
                  min={1}
                  required
                  value={maxSites}
                  onChange={(e) => setMaxSites(Number(e.target.value))}
                />

                <Input
                  label="Max Audits"
                  type="number"
                  min={1}
                  required
                  value={maxAudits}
                  onChange={(e) => setMaxAudits(Number(e.target.value))}
                />

                <Input
                  label="Storage (MB)"
                  type="number"
                  min={50}
                  required
                  value={storageMb}
                  onChange={(e) => setStorageMb(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" variant="primary" isLoading={isProvisioning} className="text-xs px-6 py-2.5">
                Provision Tenant Workspace
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};