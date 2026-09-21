"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardShell } from "../../components/layout/dashboard-shell";
import { AppSidebar } from "../../components/layout/app-sidebar";
import { AppHeader } from "../../components/layout/app-header";
import { ProtectedRoute } from "../../features/auth/protected-route";
import { useAuth } from "../../features/auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { InspectionRecord } from "../../types";

// Super Admin Feature Slices
import { PlatformOverview } from "../../features/platform/platform-overview";
import { TenantDirectory } from "../../features/platform/tenant-directory";
import { TenantDrilldown } from "../../features/platform/tenant-drilldown";
import { TenantProvisionForm } from "../../features/platform/tenant-provision-form";
import { HealthDiagnostics } from "../../features/platform/health-diagnostics";

// Organization Admin Feature Slices
import { OrgOverview } from "../../features/organization/org-overview";
import { TeamRoster } from "../../features/organization/team-roster";
import { SettingsPanel } from "../../features/organization/settings-panel";
import { NotificationInbox } from "../../features/organization/notification-inbox";

// Supervisor Feature Slices
import { SupervisorTriage } from "../../features/audits/supervisor-triage";

// Inspector Feature Slices
import { InspectorHUD } from "../../features/execution/inspector-hud";
import { useVoiceSession } from "../../features/execution/use-voice-session";

// Shared Feature Slices
import { SiteList } from "../../features/facilities/site-list";
import { TemplateList } from "../../features/templates/template-list";
import { ManualList } from "../../features/knowledge/manual-list";
import { AuditHistory } from "../../features/audits/audit-history";
import { AuditReportModal } from "../../features/audits/audit-report-modal";

const SIDEBAR_STORAGE_KEY = "sonura_sidebar_collapsed";

function DashboardContent() {
  const { user, logout, authFetch } = useAuth();
  const userRole = user?.role || "inspector";

  const getDefaultTab = () => {
    if (userRole === "super_admin") return "overview";
    if (userRole === "org_admin") return "overview";
    if (userRole === "supervisor") return "triage";
    return "hud";
  };

  const [activeTab, setActiveTab] = useState<string>(getDefaultTab());
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(APP_CONFIG.defaultUnitId);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Responsive sidebar: Open by default on > 768px, closed by default on <= 768px
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any>(null);

  // Initialize responsive sidebar state and load user preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setIsSidebarCollapsed(true);
      } else {
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (stored !== null) {
          setIsSidebarCollapsed(stored === "true");
        } else {
          setIsSidebarCollapsed(false);
        }
      }
    }
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const nextState = !prev;
      if (typeof window !== "undefined" && window.innerWidth > 768) {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextState));
      }
      return nextState;
    });
  };

  const {
    connectionState,
    isAgentSpeaking,
    liveMessages,
    latestItemUpdate,
    auditSubmittedTrigger,
    startSession,
    endSession,
  } = useVoiceSession();

  const isCallConnected = connectionState === "connected";

  const fetchInspection = useCallback(async () => {
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/${selectedUnitId}`);
      if (res.ok) {
        const data = await res.json();
        setInspection(data);
      }
    } catch (err) {
      console.error("Failed to load inspection record:", err);
    }
  }, [authFetch, selectedUnitId]);

  useEffect(() => {
    fetchInspection();
  }, [fetchInspection]);

  useEffect(() => {
    if (auditSubmittedTrigger) {
      fetchInspection();
    }
  }, [auditSubmittedTrigger, fetchInspection]);

  useEffect(() => {
    if (latestItemUpdate && inspection) {
      setInspection((prev) => {
        if (!prev) return prev;
        const updated = prev.items.map((item) => {
          if (item.item_id === latestItemUpdate.item_id) {
            return {
              ...item,
              response: latestItemUpdate.response,
              status: "completed" as const,
            };
          }
          return item;
        });
        return { ...prev, items: updated };
      });
    }
  }, [latestItemUpdate]);

  const handleOpenReportForUnit = async (unitId: string) => {
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/inspections/${unitId}/report`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setIsReportModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch report:", err);
    }
  };

  const handleVoiceToggle = () => {
    if (isCallConnected) {
      endSession();
    } else {
      startSession(selectedUnitId);
    }
  };

  const handleDefectDetected = (data: any) => {
    fetchInspection();
    const announcement =
      data.analysis?.suggested_voice_announcement ||
      `Visual defect logged. ${data.analysis?.defect_summary || "Flagged for supervisor review."}`;

    liveMessages.push({
      id: Date.now().toString(),
      sender: "agent",
      text: announcement,
      time: new Date().toLocaleTimeString(),
    });
  };

  return (
    <DashboardShell
      isSidebarCollapsed={isSidebarCollapsed}
      sidebarSlot={
        <AppSidebar
          role={userRole}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setSelectedTenantId(null);
            setActiveTab(tab);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      }
      headerSlot={
        <AppHeader
          user={user}
          activeRole={userRole}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={logout}
          onOpenNotifications={() => setActiveTab("notifications")}
        />
      }
    >
      {/* 1. SUPER ADMIN FIRST-CLASS VIEWS */}
      {userRole === "super_admin" && (
        <>
          {activeTab === "overview" && !selectedTenantId && <PlatformOverview />}
          {activeTab === "organizations" && !selectedTenantId && (
            <TenantDirectory onSelectTenant={(orgId) => setSelectedTenantId(orgId)} />
          )}
          {activeTab === "organizations" && selectedTenantId && (
            <TenantDrilldown
              orgId={selectedTenantId}
              onBack={() => setSelectedTenantId(null)}
              onOpenReport={handleOpenReportForUnit}
            />
          )}
          {activeTab === "provision" && (
            <TenantProvisionForm onSuccessNavigate={() => setActiveTab("organizations")} />
          )}
          {activeTab === "health" && <HealthDiagnostics />}
          {activeTab === "history" && <AuditHistory onOpenReport={handleOpenReportForUnit} />}
          {activeTab === "settings" && <SettingsPanel />}
        </>
      )}

      {/* 2. FIELD SUPERVISOR VIEWS */}
      {userRole === "supervisor" && (
        <>
          {activeTab === "triage" && <SupervisorTriage onOpenReport={handleOpenReportForUnit} />}
          {activeTab === "sites" && (
            <SiteList onSelectUnit={(unitId) => { setSelectedUnitId(unitId); setActiveTab("hud"); }} />
          )}
          {activeTab === "checklists" && <TemplateList />}
          {activeTab === "manuals" && <ManualList />}
          {activeTab === "history" && <AuditHistory onOpenReport={handleOpenReportForUnit} />}
          {activeTab === "notifications" && <NotificationInbox />}
        </>
      )}

      {/* 3. INSPECTOR VIEWS */}
      {userRole === "inspector" && (
        <>
          {activeTab === "hud" && (
            <InspectorHUD
              unitId={selectedUnitId}
              inspection={inspection}
              connectionState={connectionState}
              isAgentSpeaking={isAgentSpeaking}
              liveMessages={liveMessages}
              onToggleCall={handleVoiceToggle}
              onDefectDetected={handleDefectDetected}
              onOpenReport={handleOpenReportForUnit}
              onSelectUnit={(unitId) => setSelectedUnitId(unitId)}
              onRefreshInspection={fetchInspection}
            />
          )}
          {activeTab === "manuals" && <ManualList />}
          {activeTab === "notifications" && <NotificationInbox />}
        </>
      )}

      {/* 4. ORGANIZATION ADMIN VIEWS */}
      {userRole === "org_admin" && (
        <>
          {activeTab === "overview" && <OrgOverview onNavigateTab={(tab) => setActiveTab(tab)} />}
          {activeTab === "sites" && (
            <SiteList onSelectUnit={(unitId) => { setSelectedUnitId(unitId); setActiveTab("hud"); }} />
          )}
          {activeTab === "checklists" && <TemplateList />}
          {activeTab === "team" && <TeamRoster />}
          {activeTab === "manuals" && <ManualList />}
          {activeTab === "history" && <AuditHistory onOpenReport={handleOpenReportForUnit} />}
          {activeTab === "notifications" && <NotificationInbox />}
          {activeTab === "settings" && <SettingsPanel />}
        </>
      )}

      <AuditReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        report={reportData}
        activeRole={userRole}
        onStatusUpdated={fetchInspection}
      />
    </DashboardShell>
  );
}

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}