"use client";

import React, { useState, useEffect } from "react";
import { Building2, User, ListChecks } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectOption } from "../../components/ui/select";
import { SiteItem, ChecklistTemplateItem, TeamMemberItem } from "../../types";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";

interface SiteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { unit_id: string; title: string; assigned_inspector: string; bound_template_id: string }) => Promise<void>;
  siteToEdit?: SiteItem | null;
  templates: ChecklistTemplateItem[];
  isLoading?: boolean;
}

const DRAFT_STORAGE_KEY = "sonura_site_form_draft";

export const SiteFormModal: React.FC<SiteFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  siteToEdit,
  templates,
  isLoading = false,
}) => {
  const { authFetch } = useAuth();
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [unitId, setUnitId] = useState("");
  const [title, setTitle] = useState("");
  const [inspector, setInspector] = useState("Operator 01");
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/team/`);
        if (res.ok) setMembers(await res.json());
      } catch (err) {
        console.error("Failed to load team members for site form:", err);
      }
    };
    if (isOpen) {
      loadTeamMembers();
    }
  }, [authFetch, isOpen]);

  useEffect(() => {
    if (siteToEdit) {
      setUnitId(siteToEdit.unit_id);
      setTitle(siteToEdit.title);
      setInspector(siteToEdit.assigned_inspector);
      setTemplateId(siteToEdit.bound_template_id || "");
    } else {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setUnitId(parsed.unitId || "");
          setTitle(parsed.title || "");
          setInspector(parsed.inspector || "Operator 01");
          setTemplateId(parsed.templateId || (templates.length > 0 ? templates[0].id : ""));
          return;
        }
      } catch (e) {
        // Fallback to empty
      }
      setUnitId("");
      setTitle("");
      setInspector("Operator 01");
      setTemplateId(templates.length > 0 ? templates[0].id : "");
    }
  }, [siteToEdit, templates, isOpen]);

  // Persist draft for newly created sites
  useEffect(() => {
    if (!siteToEdit && isOpen) {
      const draft = { unitId, title, inspector, templateId };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  }, [unitId, title, inspector, templateId, siteToEdit, isOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId.trim() || !title.trim()) return;

    await onSubmit({
      unit_id: unitId.trim().toUpperCase(),
      title: title.trim(),
      assigned_inspector: inspector.trim(),
      bound_template_id: templateId,
    });

    if (!siteToEdit) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setUnitId("");
    setTitle("");
    setInspector("Operator 01");
    setTemplateId(templates.length > 0 ? templates[0].id : "");
  };

  const inspectorOptions: SelectOption[] = members
    .filter((m) => m.is_active)
    .map((m) => ({
      value: m.name,
      label: m.name,
      description: `${m.role} • ${m.email}`,
    }));

  if (inspectorOptions.length === 0) {
    inspectorOptions.push({ value: "Operator 01", label: "Operator 01", description: "Default Inspector" });
  }

  const templateOptions: SelectOption[] = templates.map((t) => ({
    value: t.id,
    label: `${t.title} (${t.category})`,
    description: `${(t.items || []).length} Verification Checkpoints`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="space-y-4 font-mono">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 pr-8">
          <div>
            <h3 className="text-base font-bold text-white font-sans">
              {siteToEdit ? `Edit Site Unit: ${siteToEdit.unit_id}` : "Register New Site Facility"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {siteToEdit ? "Modify facility details and assigned personnel." : "Add an equipment unit and bind it to an audit protocol."}
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          <Input
            label="Unit Identifier Tag"
            required
            disabled={Boolean(siteToEdit)}
            value={unitId}
            onChange={(e) => setUnitId(e.target.value.toUpperCase())}
            placeholder="e.g. BOILER-4B"
            icon={<Building2 className="w-4 h-4" />}
          />

          <Input
            label="Facility Description Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Primary High-Pressure Boiler Room"
          />

          <Select
            label="Assigned Lead Inspector"
            options={inspectorOptions}
            value={inspector}
            onChange={setInspector}
            searchable={true}
            icon={<User className="w-4 h-4" />}
          />

          <Select
            label="Bind Checklist Audit Template"
            options={templateOptions}
            value={templateId}
            onChange={setTemplateId}
            searchable={true}
            icon={<ListChecks className="w-4 h-4" />}
          />

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            {!siteToEdit && (unitId || title) ? (
              <button
                type="button"
                onClick={clearDraft}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear Draft
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <Button variant="secondary" onClick={handleClose} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="text-xs">
                {siteToEdit ? "Save Changes" : "Register Facility"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};