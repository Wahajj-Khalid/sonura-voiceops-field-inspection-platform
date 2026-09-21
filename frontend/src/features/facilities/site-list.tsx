"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ArrowRight, Plus, Trash2, Edit3, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ConfirmationModal } from "../../components/ui/confirmation-modal";
import { SiteFormModal } from "./site-form-modal";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { SiteItem, ChecklistTemplateItem } from "../../types";

interface SiteListProps {
  onSelectUnit?: (unitId: string) => void;
}

export const SiteList: React.FC<SiteListProps> = ({ onSelectUnit }) => {
  const { authFetch, user } = useAuth();
  const [sites, setSites] = useState<SiteItem[]>([]);
  const [templates, setTemplates] = useState<ChecklistTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetSite, setTargetSite] = useState<SiteItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SiteItem | null>(null);

  const fetchSitesAndTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sitesRes, tmplRes] = await Promise.all([
        authFetch(`${APP_CONFIG.apiUrl}/api/v1/sites/`),
        authFetch(`${APP_CONFIG.apiUrl}/api/v1/templates/`),
      ]);

      if (sitesRes.ok) setSites(await sitesRes.json());
      if (tmplRes.ok) setTemplates(await tmplRes.json());
    } catch (err) {
      setErrorMessage("Failed to load facilities and templates.");
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchSitesAndTemplates();
  }, [fetchSitesAndTemplates]);

  const handleCreateOrUpdate = async (data: { unit_id: string; title: string; assigned_inspector: string; bound_template_id: string }) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      if (targetSite) {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/sites/${targetSite.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await fetchSitesAndTemplates();
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          setErrorMessage(err.detail || "Failed to update facility site.");
        }
      } else {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/sites/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await fetchSitesAndTemplates();
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          setErrorMessage(err.detail || "Failed to register site facility.");
        }
      }
    } catch (e) {
      setErrorMessage("Network error saving site unit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSite = async () => {
    if (!deleteTarget) return;
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/sites/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchSitesAndTemplates();
        setDeleteTarget(null);
      }
    } catch (err) {
      setErrorMessage("Failed to delete site unit.");
    }
  };

  const isOrgAdminOrSuper = user?.role === "org_admin" || user?.role === "super_admin";

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Sites
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Register equipment facilities, assign inspectors, and bind standardized checklist templates.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isOrgAdminOrSuper && (
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setTargetSite(null);
                setIsModalOpen(true);
              }}
            >
              Register Facility Unit
            </Button>
          )}

          <button
            onClick={fetchSitesAndTemplates}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh sites"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sites.map((site) => (
          <Card key={site.id} className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                  {site.unit_id}
                </span>

                <div className="flex items-center space-x-1.5">
                  <Badge variant={site.status === "completed" || site.status === "approved" ? "success" : site.status === "in_progress" ? "info" : "warning"}>
                    {site.status.replace("_", " ").toUpperCase()}
                  </Badge>

                  {isOrgAdminOrSuper && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setTargetSite(site);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="Edit Site"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(site)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete Site"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-1.5 font-sans">{site.title}</h3>
              <p className="text-xs text-slate-400 font-sans">Assigned Inspector: {site.assigned_inspector}</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onSelectUnit && onSelectUnit(site.unit_id)}
                className="text-xs text-violet-400 hover:text-violet-300 font-bold inline-flex items-center cursor-pointer font-sans"
              >
                Launch Voice Session <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <SiteFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        siteToEdit={targetSite}
        templates={templates}
        isLoading={isSubmitting}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSite}
        title={`Delete Facility ${deleteTarget?.unit_id}`}
        message={`Are you sure you want to delete ${deleteTarget?.title}? All active checklist responses and inspection schedules for this unit will be permanently removed.`}
        confirmText="Delete Site"
        variant="danger"
      />
    </div>
  );
};