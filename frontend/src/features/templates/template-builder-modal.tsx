"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Plus, ListChecks } from "lucide-react";
import { Modal } from "../../components/ui/modal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select, SelectOption } from "../../components/ui/select";
import { ChecklistTemplateItem } from "../../types";

const CATEGORY_OPTIONS: SelectOption[] = [
  { value: "HVAC", label: "HVAC and Pressure Systems" },
  { value: "Electrical", label: "Electrical and Power Substation" },
  { value: "Cooling", label: "Refrigeration and Coolant Loop" },
  { value: "Safety", label: "Fire Suppression and Life Safety" },
];

interface TemplateBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; category: string; questions: string[] }) => Promise<void>;
  templateToEdit?: ChecklistTemplateItem | null;
  isLoading?: boolean;
}

const DRAFT_STORAGE_KEY = "sonura_template_form_draft";

export const TemplateBuilderModal: React.FC<TemplateBuilderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  templateToEdit,
  isLoading = false,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("HVAC");
  const [questions, setQuestions] = useState<string[]>([
    "Main operating pressure reading within acceptable bounds?",
    "Visual check for debris or component wear?",
  ]);
  const [newQuestionInput, setNewQuestionInput] = useState("");

  useEffect(() => {
    if (templateToEdit) {
      setTitle(templateToEdit.title);
      setCategory(templateToEdit.category);
      setQuestions(templateToEdit.items.map((i) => i.question));
    } else {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          setTitle(parsed.title || "");
          setCategory(parsed.category || "HVAC");
          setQuestions(parsed.questions || [
            "Main operating pressure reading within acceptable bounds?",
            "Visual check for debris or component wear?",
          ]);
          return;
        }
      } catch (e) {
        // Fallback
      }
      setTitle("");
      setCategory("HVAC");
      setQuestions([
        "Main operating pressure reading within acceptable bounds?",
        "Visual check for debris or component wear?",
      ]);
    }
    setNewQuestionInput("");
  }, [templateToEdit, isOpen]);

  useEffect(() => {
    if (!templateToEdit && isOpen) {
      const draft = { title, category, questions };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    }
  }, [title, category, questions, templateToEdit, isOpen]);

  const handleAddQuestion = () => {
    if (!newQuestionInput.trim()) return;
    setQuestions([...questions, newQuestionInput.trim()]);
    setNewQuestionInput("");
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || questions.length === 0) return;

    await onSubmit({ title: title.trim(), category, questions });

    if (!templateToEdit) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setTitle("");
    setCategory("HVAC");
    setQuestions([
      "Main operating pressure reading within acceptable bounds?",
      "Visual check for debris or component wear?",
    ]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-4 font-mono">
        <div className="pb-2 border-b border-slate-800 pr-8">
          <h3 className="text-base font-bold text-white font-sans">
            {templateToEdit ? `Edit Template: ${templateToEdit.title}` : "Create Checklist Protocol"}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Define standard verification questions spoken verbally by the voice copilot.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-3.5">
          <Input
            label="Template Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Turbine Exhaust Walkthrough Protocol"
            icon={<ListChecks className="w-4 h-4" />}
          />

          <Select
            label="Equipment Category"
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={setCategory}
          />

          <div>
            <label className="text-xs text-slate-300 block mb-1.5">Checklist Checkpoint Questions</label>
            <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto pr-1">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-slate-300 truncate pr-2 font-sans">{idx + 1}. {q}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newQuestionInput}
                onChange={(e) => setNewQuestionInput(e.target.value)}
                placeholder="Add another verification question..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans"
              />
              <Button type="button" variant="secondary" onClick={handleAddQuestion} className="py-2 px-3 text-xs">
                Add
              </Button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            {!templateToEdit && (title || questions.length > 2) ? (
              <button
                type="button"
                onClick={clearDraft}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Clear Draft
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <Button variant="secondary" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isLoading} className="text-xs">
                {templateToEdit ? "Save Protocol" : "Create Template"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};