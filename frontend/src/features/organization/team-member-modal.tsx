"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Shield } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectOption } from "../../components/ui/select";
import { TeamMemberItem } from "../../types";

const ROLE_OPTIONS: SelectOption[] = [
  { value: "Inspector", label: "Inspector", description: "Hands-free voice HUD and camera photo defect triage" },
  { value: "Supervisor", label: "Supervisor", description: "Review queue, sign-off approval, and template builder" },
  { value: "Org Admin", label: "Org Admin", description: "Full workspace, user roster, and facility management" },
];

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; email: string; role: string }) => Promise<void>;
  memberToEdit?: TeamMemberItem | null;
  isLoading?: boolean;
}

const DRAFT_STORAGE_KEY = "sonura_member_form_draft";

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  memberToEdit,
  isLoading = false,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Inspector");

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setEmail(memberToEdit.email);
      setRole(memberToEdit.role);
    } else {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setName(parsed.name || "");
          setEmail(parsed.email || "");
          setRole(parsed.role || "Inspector");
          return;
        }
      } catch (e) {
        // Fallback
      }
      setName("");
      setEmail("");
      setRole("Inspector");
    }
  }, [memberToEdit, isOpen]);

  useEffect(() => {
    if (!memberToEdit && isOpen) {
      const draft = { name, email, role };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  }, [name, email, role, memberToEdit, isOpen]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    await onSubmit({ name: name.trim(), email: email.trim().toLowerCase(), role });

    if (!memberToEdit) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setName("");
    setEmail("");
    setRole("Inspector");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4 font-mono">
        <div className="pb-2 border-b border-slate-800 pr-8">
          <h3 className="text-base font-bold text-white font-sans">
            {memberToEdit ? `Update Member: ${memberToEdit.name}` : "Invite New Team Member"}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {memberToEdit ? "Modify personnel name and system role." : "Provision an account for your organization."}
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          <Input
            label="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Rivera"
            icon={<User className="w-4 h-4" />}
          />

          <Input
            label="Corporate Work Email"
            type="email"
            required
            disabled={Boolean(memberToEdit)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@organization.com"
            icon={<Mail className="w-4 h-4" />}
            helperText={memberToEdit ? "Corporate email address is locked for existing records." : undefined}
          />

          <Select
            label="Assigned Authorization Role"
            options={ROLE_OPTIONS}
            value={role}
            onChange={setRole}
            icon={<Shield className="w-4 h-4" />}
          />

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            {!memberToEdit && (name || email) ? (
              <button
                type="button"
                onClick={clearDraft}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear Draft
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <Button variant="secondary" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="text-xs">
                {memberToEdit ? "Save Changes" : "Send Invitation"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};