"use client";

import React from "react";
import { Mic, MicOff } from "lucide-react";

interface AudioOrbProps {
  isActive: boolean;
  isSpeaking: boolean;
  onToggle: () => void;
}

export const AudioOrb: React.FC<AudioOrbProps> = ({ isActive, isSpeaking, onToggle }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 md:py-8">
      <div 
        onClick={onToggle}
        className="relative flex items-center justify-center cursor-pointer group"
      >
        <div 
          className={`w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 ${
            isActive ? "animate-orb-pulse opacity-90" : "opacity-30 group-hover:opacity-50 transition-opacity"
          }`} 
        />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-950 flex items-center justify-center border border-slate-700 shadow-2xl transition-transform group-hover:scale-105">
            {isActive ? (
              <Mic className="w-7 h-7 md:w-8 md:h-8 text-cyan-400 animate-pulse" />
            ) : (
              <MicOff className="w-7 h-7 md:w-8 md:h-8 text-slate-500 group-hover:text-slate-300" />
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-5 text-center font-medium font-mono">
        {isActive ? "Listening for technician telemetry..." : "Voice session paused. Click orb to activate."}
      </p>
    </div>
  );
};