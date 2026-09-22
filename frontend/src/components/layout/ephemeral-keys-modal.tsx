"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, ShieldAlert, Check, Sparkles, Database } from "lucide-react";
import { Modal } from "../ui/modal";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface EphemeralKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeysUpdated?: () => void;
}

const SESSION_STORAGE_KEY = "sonura_ephemeral_session_keys";

export const EphemeralKeysModal: React.FC<EphemeralKeysModalProps> = ({
  isOpen,
  onClose,
  onKeysUpdated,
}) => {
  const [livekitUrl, setLivekitUrl] = useState("");
  const [livekitKey, setLivekitKey] = useState("");
  const [livekitSecret, setLivekitSecret] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setLivekitUrl(parsed.livekitUrl || "");
          setLivekitKey(parsed.livekitKey || "");
          setLivekitSecret(parsed.livekitSecret || "");
          setGeminiKey(parsed.geminiKey || "");
        }
      }
    } catch (e) {
      console.error("Failed to read session keys:", e);
    }
  }, [isOpen]);

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (typeof window !== "undefined") {
        const payload = { livekitUrl, livekitKey, livekitSecret, geminiKey };
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
        setIsSaved(true);
        if (onKeysUpdated) onKeysUpdated();
        setTimeout(() => {
          setIsSaved(false);
          onClose();
        }, 1000);
      }
    } catch (e) {
      console.error("Failed to save session keys:", e);
    }
  };

  const handleClearKeys = () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        setLivekitUrl("");
        setLivekitKey("");
        setLivekitSecret("");
        setGeminiKey("");
        if (onKeysUpdated) onKeysUpdated();
      }
    } catch (e) {
      console.error("Failed to clear session keys:", e);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-4 font-mono text-left">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 pr-10">
          <div className="flex items-center space-x-2 min-w-0">
            <KeyRound className="w-4 h-4 text-violet-400 shrink-0" />
            <h3 className="text-base font-bold text-white font-sans truncate">Live Testing Session Keys</h3>
          </div>
          <Badge variant="violet" className="shrink-0 text-[10px] px-2 py-0.5">
            EPHEMERAL ONLY
          </Badge>
        </div>

        <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-500/30 text-xs text-slate-300 space-y-2 font-sans">
          <div className="flex items-center space-x-1.5 text-violet-300 font-bold font-mono">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Encapsulated Database Privacy</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Database records and manual RAG queries are securely managed by your deployed Sonura Backend Gateway. You only need your own LiveKit credentials to stream voice audio.
          </p>
        </div>

        <form onSubmit={handleSaveKeys} className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              1. LiveKit WebRTC Audio Stream
            </span>
            <Input
              label="LiveKit WebSocket URL"
              type="text"
              value={livekitUrl}
              onChange={(e) => setLivekitUrl(e.target.value.trim())}
              placeholder="wss://your-project.livekit.cloud"
            />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Input
                label="API Key"
                type="text"
                value={livekitKey}
                onChange={(e) => setLivekitKey(e.target.value.trim())}
                placeholder="APIxxxxxxxxxxxx"
              />
              <Input
                label="API Secret"
                type="password"
                isPassword={true}
                value={livekitSecret}
                onChange={(e) => setLivekitSecret(e.target.value.trim())}
                placeholder="••••••••••••••••"
              />
            </div>
          </div>

          <div className="space-y-1 pt-2 border-t border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              2. Multimodal Vision Defect Triage (Optional)
            </span>
            <Input
              label="Google Gemini API Key"
              type="password"
              isPassword={true}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value.trim())}
              placeholder="AQ.Ab8xxxxxxxxxxxxxxxx"
              helperText="Optional: Leave blank to use server default vision credentials."
            />
          </div>

          <div className="pt-3 flex items-center justify-between border-t border-slate-800">
            <button
              type="button"
              onClick={handleClearKeys}
              className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Clear Session
            </button>

            <div className="flex items-center space-x-2">
              <Button variant="secondary" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="text-xs">
                {isSaved ? "Saved" : "Apply Session Keys"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};