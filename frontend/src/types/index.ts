export type InspectionStatus = "pending" | "in_progress" | "completed" | "approved" | "flagged" | "failed";
export type PriorityLevel = "low" | "medium" | "high" | "critical";
export type UserRole = "super_admin" | "org_admin" | "supervisor" | "inspector";
export type NotificationType = "info" | "warning" | "success" | "danger";

export interface InspectionItem {
  item_id: string;
  question: string;
  response?: string | null;
  status: InspectionStatus;
  flagged: boolean;
  notes?: string;
}

export interface PhotoAttachment {
  id: string;
  storage_path: string;
  signed_url: string;
  defect_summary?: string;
  severity?: "LOW" | "MEDIUM" | "CRITICAL";
  timestamp?: string;
}

export interface InspectionRecord {
  id: string;
  org_id?: string;
  title: string;
  unit_id: string;
  inspector_id: string;
  status: InspectionStatus;
  priority: PriorityLevel;
  items: InspectionItem[];
  transcript_summary?: string | null;
  audio_url?: string | null;
  photo_attachments?: PhotoAttachment[];
  created_at: string;
  updated_at: string;
}

export interface SiteItem {
  id: string;
  org_id: string;
  unit_id: string;
  title: string;
  status: string;
  assigned_inspector: string;
  bound_template_id?: string | null;
  created_at: string;
}

export interface TeamMemberItem {
  id: string;
  org_id: string;
  name: string;
  email: string;
  role: string;
  audits_count: number;
  is_active: boolean;
  created_at: string;
}

export interface TeamMemberSafetyCheck {
  can_delete_or_suspend: boolean;
  assigned_active_sites: string[];
  warning_message?: string | null;
}

export interface ChecklistTemplateItem {
  id: string;
  org_id: string;
  title: string;
  category: string;
  items: Array<{ item_id: string; question: string; status?: string; flagged?: boolean; notes?: string }>;
  created_at: string;
}

export interface OrganizationQuotas {
  max_users: number;
  max_sites: number;
  max_audits: number;
  storage_limit_mb: number;
}

export interface OrganizationUsage {
  users_used: number;
  users_limit: number;
  sites_used: number;
  sites_limit: number;
  audits_used: number;
  audits_limit: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  templates_count: number;
}

export interface OrganizationItem {
  id: string;
  name: string;
  plan: string;
  is_active?: boolean;
  suspension_reason?: string | null;
  max_users?: number;
  max_sites?: number;
  max_audits?: number;
  storage_limit_mb?: number;
  members_count: number;
  sites_count: number;
  audits_count?: number;
  created_at: string;
}

export interface TelemetryData {
  total_organizations: number;
  total_sites: number;
  total_users: number;
  total_inspections: number;
  total_vector_chunks: number;
  system_uptime: string;
  active_webrtc_channels: number;
}

export interface RAGManualItem {
  manual_title: string;
  category: string;
  chunks: number;
}

export interface RAGChunk {
  id: string;
  page_number: number;
  content: string;
  category: string;
}

export interface RAGQueryResult {
  answer: string;
  confidence_score: number;
  sources: Array<{ manual: string; page: number }>;
}

export interface NotificationItem {
  id: string;
  org_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  org_id: string;
}