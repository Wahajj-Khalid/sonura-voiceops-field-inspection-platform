/**
 * Sonura Central Application Constants
 * Single source of truth for app branding, browser tab titles, and workspace defaults.
 */

export const APP_CONFIG = {
  // Brand Identity
  name: "Sonura",
  appName: "Sonura",
  tabTitle: "Sonura: AI Field Inspection Platform",
  tagline: "Autonomous Voice AI Field Inspection and Compliance Platform",
  companyName: "Sonura Technologies Inc.",
  version: "1.0.0",

  // Workspace and Inspector Defaults
  defaultWorkspace: "Titan HVAC Services Inc.",
  defaultOrgId: "11111111-1111-1111-1111-111111111111",
  defaultUnitId: "BUILDING-4B",
  defaultInspectorId: "Operator 01",

  // Environment and Remote Gateways
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://sonura-qw29qnzq.livekit.cloud",

  // Storage Bucket Names
  storageBuckets: {
    photos: "inspection-photos",
    audio: "inspection-audio",
    documents: "rag-documents",
  },

  // 4 Distinct Role Demo Credentials
  demoAccounts: {
    superAdmin: {
      label: "Platform Super Admin",
      email: "admin@sonura.ai",
      pass: "sonura2026",
      role: "super_admin" as const,
      org: "Sonura Global Platform Operations",
    },
    clientOrgAdmin: {
      label: "Client Org Administrator",
      email: "john@titanhvac.com",
      pass: "sonura2026",
      role: "org_admin" as const,
      org: "Titan HVAC Services Inc.",
    },
    supervisor: {
      label: "Field Supervisor",
      email: "sarah@titanhvac.com",
      pass: "sonura2026",
      role: "supervisor" as const,
      org: "Titan HVAC Services Inc.",
    },
    inspector: {
      label: "Inspector",
      email: "op1@titanhvac.com",
      pass: "sonura2026",
      role: "inspector" as const,
      org: "Titan HVAC Services Inc.",
    },
  },

  // Plan Quota Defaults
  planQuotas: {
    pilot: {
      maxUsers: 5,
      maxSites: 2,
      maxAudits: 50,
      storageLimitMb: 100,
    },
    growth: {
      maxUsers: 25,
      maxSites: 15,
      maxAudits: 500,
      storageLimitMb: 1024,
    },
    enterprise: {
      maxUsers: 100,
      maxSites: 50,
      maxAudits: 5000,
      storageLimitMb: 10240,
    },
  },

  // Fleet Scale Options for Inquiries
  fleetScaleOptions: [
    { value: "1-10", label: "1 to 10 Site Units" },
    { value: "10-50", label: "10 to 50 Equipment Facilities" },
    { value: "50+", label: "50+ Critical Infrastructure Sites" },
  ],
} as const;