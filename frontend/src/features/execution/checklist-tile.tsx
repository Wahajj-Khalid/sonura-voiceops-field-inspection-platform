"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertTriangle, Edit3, Check, X, Flag } from "lucide-react";
import { InspectionItem } from "../../types";
import { Badge } from "../../components/ui/badge";

interface ChecklistTileProps {
  item: InspectionItem;
  onUpdateItem?: (itemId: string, updatedFields: Partial<InspectionItem>) => void;
}

export const ChecklistTile: React.FC<ChecklistTileProps> = ({ item, onUpdateItem }) => {
  const isCompleted = item.status === "completed";
  const isFlagged = item.flagged;

  const [isEditing, setIsEditing] = useState(false);
  const [responseInput, setResponseInput] = useState(item.response || "");

  const handleSaveEdit = () => {
    if (onUpdateItem) {
      onUpdateItem(item.item_id, {
        response: responseInput.trim() || "Verified",
        status: "completed",
      });
    }
    setIsEditing(false);
  };

  const handleToggleFlag = () => {
    if (onUpdateItem) {
      onUpdateItem(item.item_id, {
        flagged: !isFlagged,
      });
    }
  };

  const hasLongResponse = Boolean(item.response ? item.response.length > 20 : false);

  return (
    <div className="p-3 sm:p-3.5 md:p-4 rounded-xl bg-slate-900/80 border border-slate-800 transition-all hover:border-violet-500/30 font-mono space-y-2 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-start space-x-2.5 min-w-0 flex-1">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
            {isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            ) : isFlagged ? (
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-semibold text-slate-200 font-sans leading-relaxed break-words">
              {item.question}
            </h4>
            {item.notes ? (
              <p className="text-[11px] text-slate-500 mt-0.5 break-words">{item.notes}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end space-x-1.5 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto">
          <div className="flex items-center space-x-1">
            {onUpdateItem ? (
              <button
                type="button"
                onClick={handleToggleFlag}
                className={`p-1 sm:p-1.5 rounded-lg border transition-all cursor-pointer ${
                  isFlagged 
                    ? "bg-rose-950/60 border-rose-500/40 text-rose-300" 
                    : "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-amber-300"
                }`}
                title={isFlagged ? "Remove Flag" : "Flag Checkpoint"}
              >
                <Flag className="w-3 h-3" />
              </button>
            ) : null}

            {onUpdateItem ? (
              <button
                type="button"
                onClick={() => {
                  setResponseInput(item.response || "");
                  setIsEditing(!isEditing);
                }}
                className="p-1 sm:p-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Edit Response"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {!hasLongResponse ? (
            <Badge 
              variant={isCompleted ? "success" : isFlagged ? "danger" : "neutral"} 
              className="shrink-0 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5"
            >
              {item.response || item.status}
            </Badge>
          ) : (
            <Badge 
              variant={isFlagged ? "danger" : "success"} 
              className="shrink-0 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5"
            >
              {isFlagged ? "FLAGGED" : "VERIFIED"}
            </Badge>
          )}
        </div>
      </div>

      {hasLongResponse ? (
        <div className="p-2 sm:p-2.5 rounded-lg bg-slate-950/90 border border-amber-500/30 text-amber-300 text-xs leading-relaxed font-sans break-words">
          <span className="font-bold font-mono text-[9px] sm:text-[10px] text-amber-400 uppercase tracking-wider block mb-0.5">
            Recorded Telemetry:
          </span>
          {item.response}
        </div>
      ) : null}

      {isEditing ? (
        <div className="pt-2 border-t border-slate-800 flex items-center space-x-1.5 sm:space-x-2">
          <input
            type="text"
            value={responseInput}
            onChange={(e) => setResponseInput(e.target.value)}
            placeholder="Type verified reading..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 font-sans min-w-0"
          />
          <button
            type="button"
            onClick={handleSaveEdit}
            className="px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0"
          >
            <Check className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs transition-all cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
};