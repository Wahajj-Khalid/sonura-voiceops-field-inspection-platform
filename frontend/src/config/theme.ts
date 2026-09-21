// frontend/src/config/theme.ts
/**
 * Sonura Design System Tokens: "Spatial Intelligence"
 * Single source of truth for color palettes, frosted glass surfaces, and accents.
 */

export const THEME = {
  colors: {
    // Canvas Background
    background: "#06080d",
    backgroundSurface: "#090d16",
    backgroundCard: "rgba(15, 23, 42, 0.45)",

    // Brand Accents
    hyperViolet: "#8b5cf6",
    electricIndigo: "#6366f1",
    vibrantEmerald: "#10b981",
    neonCyan: "#06b6d4",
    amberWarning: "#f59e0b",
    roseDanger: "#f43f5e",

    // Slate Scale
    slate950: "#020617",
    slate900: "#0f172a",
    slate800: "#1e293b",
    slate700: "#334155",
    slate400: "#94a3b8",
    slate300: "#cbd5e1",
    slate100: "#f1f5f9",
  },

  // Glassmorphic Surface Specifications
  surfaces: {
    frostedCard: "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 42, 0.45) 100%)",
    frostedCardBorder: "1px solid rgba(255, 255, 255, 0.12)",
    frostedCardHoverBorder: "1px solid rgba(139, 92, 246, 0.5)",
    backdropFilter: "blur(24px) saturate(180%)",
    modalBackdrop: "rgba(0, 0, 0, 0.82)",
  },

  // Badge Variant Mappings
  badges: {
    violet: {
      bg: "rgba(139, 92, 246, 0.15)",
      border: "rgba(139, 92, 246, 0.35)",
      text: "#c4b5fd",
    },
    success: {
      bg: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.35)",
      text: "#6ee7b7",
    },
    warning: {
      bg: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.35)",
      text: "#fde68a",
    },
    danger: {
      bg: "rgba(244, 63, 94, 0.15)",
      border: "rgba(244, 63, 94, 0.35)",
      text: "#fca5a5",
    },
    info: {
      bg: "rgba(6, 182, 212, 0.15)",
      border: "rgba(6, 182, 212, 0.35)",
      text: "#67e8f9",
    },
    neutral: {
      bg: "rgba(148, 163, 184, 0.12)",
      border: "rgba(148, 163, 184, 0.25)",
      text: "#cbd5e1",
    },
  },

  // Layout Constraints
  layout: {
    sidebarExpandedWidth: "w-64",
    sidebarCollapsedWidth: "w-20",
    maxContentWidth: "max-w-7xl",
  },
} as const;