"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, AlertCircle, Search } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
}

export interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  helperText?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  searchable?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Select an option",
  error,
  helperText,
  icon,
  disabled = false,
  searchable = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
      if (searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, searchable]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div ref={containerRef} className={`w-full space-y-1 text-left relative ${className}`}>
      {label && (
        <label className="text-xs font-mono text-slate-300 block">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full border rounded-xl py-2.5 px-3.5 text-xs text-slate-200 flex items-center justify-between transition-all font-mono cursor-pointer ${
            icon ? "pl-10" : "pl-3.5"
          } ${
            disabled
              ? "bg-slate-950/70 border-slate-800/80 text-slate-500 cursor-not-allowed select-none opacity-80"
              : isOpen
              ? "bg-slate-900 border-violet-500 ring-1 ring-violet-500/30"
              : error
              ? "bg-slate-900/80 border-rose-500/70 hover:border-rose-500"
              : "bg-slate-900/80 border-white/10 hover:border-violet-500/50 hover:bg-slate-900"
          }`}
        >
          {icon && (
            <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}

          <span className={`truncate pr-2 ${selectedOption ? "text-slate-200" : "text-slate-500"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <div className="pl-2 shrink-0 flex items-center">
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-violet-400" : ""
              }`}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-[#090d16]/98 border border-violet-500/40 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden font-mono text-xs p-1.5 space-y-1 max-h-64 overflow-y-auto">
            {searchable && (
              <div className="p-1 pb-1.5 border-b border-slate-800 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search options..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}

            <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-violet-600/25 text-violet-300 font-bold border border-violet-500/30"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block truncate">{option.label}</span>
                        {option.description && (
                          <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                            {option.description}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-violet-400 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-center text-slate-500 text-[11px] italic">
                  No matching options found.
                </div>
              )}
            </div>
          </div>
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