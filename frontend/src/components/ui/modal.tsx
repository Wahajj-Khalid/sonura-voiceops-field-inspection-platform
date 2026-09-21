"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = "max-w-4xl",
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 print:p-0 print:static print:inset-auto">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity print:hidden cursor-pointer" 
      />

      <div 
        ref={modalRef}
        className={`relative w-full ${maxWidth} rounded-2xl bg-[#090d16] border border-white/10 shadow-2xl overflow-hidden z-10 print:bg-white print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none`}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 z-20 p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-white/5 print:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="max-h-[88vh] overflow-y-auto overflow-x-hidden p-5 sm:p-7 custom-modal-scrollbar print:max-h-none print:overflow-visible print:p-0">
          {children}
        </div>
      </div>
    </div>
  );
};