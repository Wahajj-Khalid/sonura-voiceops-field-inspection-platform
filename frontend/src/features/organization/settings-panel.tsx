"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Webhook, CheckCircle2, Save, Shield, Mic, Activity } from "lucide-react";
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
  const [voiceModel, setVoiceModel] = useState("aura-asteria-en");
  const [speechSpeed, setSpeechSpeed] = useState("1.0");
  const [webhookUrl, setWebhookUrl] = useState("https://primary-production.up.railway.app/webhook/sonura-audit");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sonura_settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.voiceModel) setVoiceModel(parsed.voiceModel);
        if (parsed.speechSpeed) setSpeechSpeed(parsed.speechSpeed);
        if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl);
      }
    } catch (e) {
      console.error("Failed to restore settings:", e);
    }
  }, []);

  const handleSave = () => {
    try {
      const settingsPayload = { voiceModel, speechSpeed, webhookUrl };
      localStorage.setItem("sonura_settings", JSON.stringify(settingsPayload));
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
            Configure neural voice copilot settings and outbound webhook automation triggers.
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

      {isSaved && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center space-x-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Operational parameters persisted successfully.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-white font-sans">Voice Copilot Engine Settings</h3>
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

          <div className="pt-2 text-[11px] text-slate-500">
            Powered by Deepgram Nova-2 and Groq Cloud inference.
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
            <Webhook className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-sans">Automation Webhook Triggers</h3>
          </div>

          <Input
            label="Target Webhook URL (n8n, Zapier, or Slack Dispatcher)"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-n8n-instance.com/webhook/audit"
            icon={<Webhook className="w-4 h-4" />}
            helperText="Dispatches an asynchronous JSON payload when an inspector logs a failure or a supervisor signs off."
          />

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
            <span className="font-semibold text-slate-300 block font-sans">Active Event Triggers:</span>
            <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
              <Badge variant="warning">ON_AUDIT_FLAGGED</Badge>
              <Badge variant="success">ON_AUDIT_COMPLETED</Badge>
              <Badge variant="info">ON_DEFECT_DETECTED</Badge>
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