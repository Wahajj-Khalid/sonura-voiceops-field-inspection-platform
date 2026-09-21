"use client";

import React from "react";

export type ButtonVariant = "primary" | "danger" | "secondary" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading = false,
  icon,
  className = "",
  disabled,
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30",
    danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30",
    secondary: "bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800",
    ghost: "bg-transparent hover:bg-white/5 text-slate-400 hover:text-white",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        icon
      )}
      <span>{children}</span>
    </button>
  );
};