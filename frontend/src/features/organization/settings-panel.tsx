"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Webhook, CheckCircle2, Save, Shield, Mic, Activity, Lock, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Select, SelectOption } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { APP_CONFIG } from "../../config/constants";
import { useAuth } from "../auth/auth-context";

const VOICE_MODEL_OPTIONS: SelectOption[] = [
  { value: "aura-asteria-en", label: "Aura Asteria (Clear, Confident Female)" },
  { value: "aura-luna-en", label: "Aura Luna (Calm, Precise Tone)" },
  { value: "aura-stella-en", label: "Aura Stella (Warm, Direct Tone)" },
  { value: "aura-arcas-en", label: "Aura Arcas (Neutral, Authoritative Male)" },
];

const SPEECH_SPEED_OPTIONS: SelectOption[] = [
  { value: "0.9", label: "0.9x (Deliberate, Slow Cadence)" },
  { value: "1.0", label: "1.0x (Standard Operational Cadence)" },
  { value: "1.1", label: "1.1x (Fast Field Verification)" },
];

export const SettingsPanel: React.FC = () => {
  const { user } = useAuth();
  const orgKey = user?.org_id || "default_org";
  const storageKey = `sonura_settings_${orgKey}`;

  const [voiceModel, setVoiceModel] = useState("aura-asteria-en");
  const [speechSpeed, setSpeechSpeed] = useState("1.0");
  const [webhookUrl, setWebhookUrl] = useState("https://primary-production.up.railway.app/webhook/sonura-audit");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.voiceModel) setVoiceModel(parsed.voiceModel);
        if (parsed.speechSpeed) setSpeechSpeed(parsed.speechSpeed);
      }
    } catch (e) {
      console.error("Failed to restore settings:", e);
    }
  }, [storageKey]);

  const handleSave = () => {
    try {
      const settingsPayload = { voiceModel, speechSpeed };
      localStorage.setItem(storageKey, JSON.stringify(settingsPayload));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Settings
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Configure tenant-specific voice copilot parameters and view automation integration status.
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Save className="w-4 h-4" />}
          onClick={handleSave}
        >
          {isSaved ? "Settings Saved" : "Save Configurations"}
        </Button>
      </div>

      {isSaved ? (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Operational voice parameters persisted for {user?.organization || "your workspace"}.</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white font-sans">Voice Copilot Engine Settings</h3>
            </div>
            <Badge variant="violet">ACTIVE IN WORKSPACE</Badge>
          </div>

          <Select
            label="Deepgram Neural TTS Voice Model"
            options={VOICE_MODEL_OPTIONS}
            value={voiceModel}
            onChange={setVoiceModel}
            icon={<Mic className="w-4 h-4" />}
          />

          <Select
            label="Conversational Speech Speed Ratio"
            options={SPEECH_SPEED_OPTIONS}
            value={speechSpeed}
            onChange={setSpeechSpeed}
            icon={<Activity className="w-4 h-4" />}
          />

          <div className="pt-2 text-[11px] text-slate-400">
            Settings apply across all active field inspections under {user?.organization || "this organization"}.
          </div>
        </Card>

        {/* Disabled Webhook Integration Panel */}
        <Card className="space-y-4 opacity-75 border-slate-800/80 bg-slate-950/40 relative select-none">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400">
              <Webhook className="w-4 h-4" />
              <h3 className="text-sm font-bold text-slate-300 font-sans">Automation Webhook Triggers</h3>
            </div>
            <Badge variant="neutral">COMING IN V1.2</Badge>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Outbound webhooks are currently undergoing automated sandbox staging and will be enabled in release 1.2.</span>
          </div>

          <Input
            label="Target Webhook URL"
            type="url"
            disabled={true}
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/audit"
            icon={<Lock className="w-4 h-4 text-slate-600" />}
            helperText="Feature locked. Enterprise n8n and Slack webhook routing in progress."
          />

          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs space-y-1 opacity-60">
            <span className="font-semibold text-slate-400 block font-sans">Planned Event Handlers:</span>
            <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
              <Badge variant="neutral">ON_AUDIT_FLAGGED</Badge>
              <Badge variant="neutral">ON_AUDIT_COMPLETED</Badge>
              <Badge variant="neutral">ON_DEFECT_DETECTED</Badge>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Shield className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white font-sans">Tenant Security and Isolation Context</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1 font-sans">TENANT WORKSPACE</span>
              <span className="text-white font-bold">{user?.organization || APP_CONFIG.defaultWorkspace}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1 font-sans">DATA ISOLATION</span>
              <span className="text-emerald-400 font-bold">Supabase Row-Level Security</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1 font-sans">RAG VECTOR MEMORY</span>
              <span className="text-violet-400 font-bold">384-Dim Local FastEmbed</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};