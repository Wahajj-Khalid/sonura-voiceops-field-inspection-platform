"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Edit3, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Modal } from "../../components/ui/modal";
import { Select, SelectOption } from "../../components/ui/select";
import { TeamMemberModal } from "./team-member-modal";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { TeamMemberItem, TeamMemberSafetyCheck } from "../../types";

export const TeamRoster: React.FC = () => {
  const { authFetch } = useAuth();
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetMember, setTargetMember] = useState<TeamMemberItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [safetyTarget, setSafetyTarget] = useState<TeamMemberItem | null>(null);
  const [safetyCheck, setSafetyCheck] = useState<TeamMemberSafetyCheck | null>(null);
  const [reassignInspector, setReassignInspector] = useState<string>("");
  const [isExecutingDelete, setIsExecutingDelete] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/team/`);
      if (res.ok) setMembers(await res.json());
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateOrUpdate = async (data: { name: string; email: string; role: string }) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (targetMember) {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/team/${targetMember.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.name, role: data.role }),
        });
        if (res.ok) {
          await fetchMembers();
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          setErrorMessage(err.detail || "Failed to update member.");
        }
      } else {
        const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/team/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          await fetchMembers();
          setIsModalOpen(false);
        } else {
          const err = await res.json();
          setErrorMessage(err.detail || "Failed to invite member.");
        }
      }
    } catch (e) {
      setErrorMessage("Network error processing member request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateDelete = async (member: TeamMemberItem) => {
    setSafetyTarget(member);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/team/${member.id}/safety-check`);
      if (res.ok) {
        const checkData = await res.json();
        setSafetyCheck(checkData);
        const available = members.filter((m) => m.id !== member.id && m.is_active);
        if (available.length > 0) {
          setReassignInspector(available[0].name);
        }
      }
    } catch (e) {
      console.error("Safety check failed:", e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!safetyTarget) return;
    setIsExecutingDelete(true);

    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/team/${safetyTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reassign_to_inspector: reassignInspector || null }),
      });

      if (res.ok) {
        await fetchMembers();
        setSafetyTarget(null);
        setSafetyCheck(null);
      } else {
        const err = await res.json();
        setErrorMessage(err.detail || "Failed to remove member.");
      }
    } catch (e) {
      setErrorMessage("Network error deleting member.");
    } finally {
      setIsExecutingDelete(false);
    }
  };

  const otherInspectorsOptions: SelectOption[] = members
    .filter((m) => safetyTarget && m.id !== safetyTarget.id && m.is_active)
    .map((m) => ({ value: m.name, label: `${m.name} (${m.role})` }));

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Team
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Manage technician roster, assign supervisor authorizations, and oversee member permissions.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setTargetMember(null);
              setIsModalOpen(true);
            }}
          >
            Invite Team Member
          </Button>

          <button
            onClick={fetchMembers}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh roster"
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

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-slate-800">
          {members.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-violet-500/40 flex items-center justify-center font-bold text-xs text-violet-300 shrink-0">
                  {member.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate font-sans">{member.name}</h4>
                  <p className="text-xs text-slate-400 truncate">{member.email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-400 hidden sm:inline">{member.audits_count} Audits</span>
                <Badge variant={member.role === "Org Admin" ? "violet" : member.role === "Supervisor" ? "info" : "neutral"}>
                  {member.role}
                </Badge>

                <button
                  type="button"
                  onClick={() => {
                    setTargetMember(member);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                  title="Edit Member"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>

                {member.role !== "Org Admin" && (
                  <button
                    type="button"
                    onClick={() => handleInitiateDelete(member)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Remove Member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        memberToEdit={targetMember}
        isLoading={isSubmitting}
      />

      {safetyTarget && safetyCheck && (
        <Modal isOpen={Boolean(safetyTarget)} onClose={() => setSafetyTarget(null)} maxWidth="max-w-md">
          <div className="space-y-4 font-mono">
            <div className="flex items-center space-x-2 text-amber-400 pb-2 border-b border-slate-800">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-white font-sans">Removal Safety Check</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Are you sure you want to remove <strong className="text-white">{safetyTarget.name}</strong> from your organization?
            </p>

            {!safetyCheck.can_delete_or_suspend && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-2 text-xs">
                <span className="font-bold text-amber-300 block font-sans">Active Site Assignments Detected:</span>
                <ul className="list-disc list-inside text-slate-300 space-y-0.5 text-[11px]">
                  {safetyCheck.assigned_active_sites.map((site, idx) => (
                    <li key={idx}>{site}</li>
                  ))}
                </ul>

                <div className="pt-2">
                  <Select
                    label="Reassign Active Sites To:"
                    options={otherInspectorsOptions}
                    value={reassignInspector}
                    onChange={setReassignInspector}
                  />
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end space-x-2.5 border-t border-slate-800">
              <Button variant="secondary" onClick={() => setSafetyTarget(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="danger"
                isLoading={isExecutingDelete}
                onClick={handleConfirmDelete}
                className="text-xs"
              >
                Confirm Removal
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};