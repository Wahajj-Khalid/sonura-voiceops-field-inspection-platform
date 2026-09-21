"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, CheckCircle2, Trash2, Edit3, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ConfirmationModal } from "../../components/ui/confirmation-modal";
import { TemplateBuilderModal } from "./template-builder-modal";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { ChecklistTemplateItem } from "../../types";

export const TemplateList: React.FC = () => {
  const { authFetch, user } = useAuth();
  const [templates, setTemplates] = useState<ChecklistTemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetTemplate, setTargetTemplate] = useState<ChecklistTemplateItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChecklistTemplateItem | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/templates/`);
      if (res.ok) setTemplates(await res.json());
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleCreateOrUpdate = async (data: { title: string; category: string; questions: string[] }) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const payloadItems = data.questions.map((q, idx) => ({
      item_id: String(idx + 1),
      question: q,
      status: "pending",
      flagged: false,
    }));

    try {
      if (targetTemplate) {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/templates/${targetTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            category: data.category,
            items: payloadItems,
          }),
        });
        if (res.ok) {
          await fetchTemplates();
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          setErrorMessage(err.detail || "Failed to update template.");
        }
      } else {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/templates/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: data.title,
            category: data.category,
            items: payloadItems,
          }),
        });
        if (res.ok) {
          await fetchTemplates();
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          setErrorMessage(err.detail || "Failed to create template.");
        }
      }
    } catch (e) {
      setErrorMessage("Network error saving template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTarget) return;
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/templates/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTemplates();
        setDeleteTarget(null);
      }
    } catch (err) {
      setErrorMessage("Failed to delete template.");
    }
  };

  const isOrgAdminOrSuper = user?.role === "org_admin" || user?.role === "super_admin";

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Checklists
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Create and customize operational verification protocols for field inspections.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setTargetTemplate(null);
              setIsModalOpen(true);
            }}
          >
            New Checklist Template
          </Button>

          <button
            onClick={fetchTemplates}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh templates"
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
        {templates.map((tmpl) => (
          <Card key={tmpl.id} className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="violet">{tmpl.category}</Badge>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetTemplate(tmpl);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    title="Edit Template"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {isOrgAdminOrSuper && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(tmpl)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors cursor-pointer"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="text-base font-bold text-white mb-2 font-sans">{tmpl.title}</h3>
              <p className="text-xs text-slate-400 font-sans">{(tmpl.items || []).length} Checkpoint Questions</p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-semibold flex items-center font-sans">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active in Workspace
              </span>
              <span className="text-[11px] text-slate-500">
                {tmpl.created_at ? new Date(tmpl.created_at).toLocaleDateString() : "Active"}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <TemplateBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        templateToEdit={targetTemplate}
        isLoading={isSubmitting}
      />

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTemplate}
        title={`Delete Template ${deleteTarget?.title}`}
        message={`Are you sure you want to delete ${deleteTarget?.title}? Any site units bound to this template will retain past verified audit records.`}
        confirmText="Delete Protocol"
        variant="danger"
      />
    </div>
  );
};