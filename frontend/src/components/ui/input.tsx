"use client";

import React, { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
  helperText?: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  isPassword = false,
  type = "text",
  className = "",
  disabled = false,
  id,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full space-y-1 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-mono text-slate-300 block">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={effectiveType}
          disabled={disabled}
          className={`w-full border rounded-xl py-2.5 text-xs font-mono transition-all placeholder-slate-500 focus:outline-none ${
            icon ? "pl-10" : "pl-3.5"
          } ${
            isPassword ? "pr-10" : "pr-3.5"
          } ${
            disabled
              ? "bg-slate-950/70 border-slate-800/80 text-slate-500 cursor-not-allowed select-none opacity-80"
              : error
              ? "bg-slate-900/80 border-rose-500/70 text-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30"
              : "bg-slate-900/80 border-white/10 text-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
          } ${className}`}
          {...props}
        />

        {isPassword && !disabled && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-slate-500 hover:text-slate-300 cursor-pointer transition-colors p-0.5 flex items-center justify-center"
            title={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

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