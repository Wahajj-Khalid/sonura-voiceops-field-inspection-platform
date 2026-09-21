"use client";

import React from "react";
import { AlertCircle } from "lucide-react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = "",
  id,
  rows = 3,
  ...props
}) => {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1 text-left">
      {label ? (
        <label htmlFor={textareaId} className="text-xs font-mono text-slate-300 block">
          {label}
        </label>
      ) : null}

      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full bg-slate-900/80 border rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all font-mono resize-none ${
          error
            ? "border-rose-500/70 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
            : "border-white/10 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
        } ${className}`}
        {...props}
      />

      {error ? (
        <div className="text-[10px] font-mono text-rose-400 flex items-center space-x-1 pt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <p className="text-[10px] font-mono text-slate-500 pt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};