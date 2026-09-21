"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [searchFilter, setSearchFilter] = useState("");

  const searchItems = [
    { title: "Real-Time Voice Copilot Architecture", href: "#capabilities", category: "#capabilities" },
    { title: "Local Vector RAG Manual Search", href: "#capabilities", category: "#capabilities" },
    { title: "Multi-Tenant PostgreSQL Row-Level Security", href: "#security", category: "#security" },
    { title: "Single-Page A4 Compliance Certificates", href: "#compliance", category: "#compliance" },
    { title: "Enterprise Pricing and Deployment Tiers", href: "#pricing", category: "#pricing" },
    { title: "Contact Solutions Engineering Desk", href: "#contact", category: "#contact" },
  ];

  const filtered = searchItems.filter((i) =>
    i.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-3.5 text-left p-1 font-mono">
        <div className="flex items-center space-x-2 pb-2.5 border-b border-slate-800">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-sm sm:text-base font-bold text-white font-sans">Quick Platform Navigation</h3>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search capabilities, security, or units..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
          />
        </div>

        <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
          {filtered.map((item) => (
            <a
              key={item.title}
              href={item.href}
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-lg bg-slate-900/60 hover:bg-violet-600/10 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 transition-colors cursor-pointer block"
            >
              <span className="text-slate-200 text-xs leading-snug font-sans">{item.title}</span>
              <span className="text-[10px] text-violet-400 shrink-0">{item.category}</span>
            </a>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto text-xs py-2">
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};