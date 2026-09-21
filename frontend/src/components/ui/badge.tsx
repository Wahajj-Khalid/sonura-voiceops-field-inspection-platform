"use client";

import React from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "violet" | "neutral";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = "neutral",
  className = "" 
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: "bg-emerald-950/80 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-950/80 text-amber-400 border-amber-500/30",
    danger: "bg-rose-950/80 text-rose-400 border-rose-500/30",
    info: "bg-cyan-950/80 text-cyan-400 border-cyan-500/30",
    violet: "bg-violet-950/80 text-violet-300 border-violet-500/30",
    neutral: "bg-slate-900 text-slate-400 border-slate-800",
  };

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md border font-mono uppercase ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};