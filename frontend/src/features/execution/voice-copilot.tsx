"use client";

import React, { useRef, useEffect } from "react";
import { Sparkles, MessageSquareQuote, PhoneOff, PhoneCall } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { AudioOrb } from "./audio-orb";
import { LiveMessage } from "./use-voice-session";

interface VoiceCopilotProps {
  connectionState: "disconnected" | "connecting" | "connected";
  isAgentSpeaking: boolean;
  liveMessages: LiveMessage[];
  onToggleCall: () => void;
}

export const VoiceCopilot: React.FC<VoiceCopilotProps> = ({
  connectionState,
  isAgentSpeaking,
  liveMessages,
  onToggleCall,
}) => {
  const dialogueEndRef = useRef<HTMLDivElement | null>(null);
  const isCallConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const isCallActive = isCallConnected ? true : isConnecting;

  useEffect(() => {
    dialogueEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages]);

  return (
    <Card className="flex flex-col justify-between space-y-4 font-mono">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h3 className="text-base font-bold text-white font-sans">Voice Copilot</h3>
          </div>
          <Badge variant={isCallConnected ? "success" : isConnecting ? "warning" : "neutral"}>
            {connectionState.toUpperCase()}
          </Badge>
        </div>

        <AudioOrb
          isActive={isCallConnected}
          isSpeaking={isAgentSpeaking}
          onToggle={onToggleCall}
        />

        <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 max-h-36 overflow-y-auto space-y-2">
          <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
            <MessageSquareQuote className="w-3.5 h-3.5 text-violet-400" />
            <span>Live Telemetry Dialogue</span>
          </div>

          {liveMessages.length === 0 ? (
            <p className="text-[11px] text-slate-500 font-mono italic">
              {isConnecting ? "Negotiating WebRTC audio session..." : "Awaiting voice session initiation..."}
            </p>
          ) : (
            liveMessages.map((msg) => (
              <div key={msg.id} className="text-xs leading-relaxed font-mono">
                <span className={msg.sender === "agent" ? "text-violet-400 font-bold" : "text-cyan-400 font-bold"}>
                  {msg.sender === "agent" ? "Sonura: " : "Tech: "}
                </span>
                <span className="text-slate-300">{msg.text}</span>
              </div>
            ))
          )}
          <div ref={dialogueEndRef} />
        </div>
      </div>

      <Button
        variant={isCallActive ? "danger" : "primary"}
        onClick={onToggleCall}
        icon={isCallActive ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
        className="w-full text-xs font-bold py-2.5 shadow-md justify-center"
      >
        {isCallConnected ? "Terminate Voice Session" : isConnecting ? "Cancel Connection" : "Start Voice Session"}
      </Button>
    </Card>
  );
};