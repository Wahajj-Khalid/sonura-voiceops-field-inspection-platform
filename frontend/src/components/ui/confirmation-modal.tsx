"use client";

import React from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Modal } from "./modal";
import { Button } from "./button";

export type ConfirmationVariant = "danger" | "warning" | "info" | "success";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationVariant;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) => {
  const getIcon = () => {
    if (variant === "danger") return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
    if (variant === "warning") return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
    if (variant === "success") return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
    return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
  };

  const getButtonVariant = () => {
    if (variant === "danger" || variant === "warning") return "danger";
    return "primary";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4 font-mono text-left">
        <div className="flex items-center space-x-2.5 pb-2 border-b border-slate-800">
          {getIcon()}
          <h3 className="text-base font-bold text-white font-sans">{title}</h3>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-mono">
          {message}
        </p>

        <div className="pt-3 flex items-center justify-end space-x-2.5 border-t border-slate-800">
          <Button variant="secondary" onClick={onClose} disabled={isLoading} className="text-xs">
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            isLoading={isLoading}
            onClick={onConfirm}
            className="text-xs"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};