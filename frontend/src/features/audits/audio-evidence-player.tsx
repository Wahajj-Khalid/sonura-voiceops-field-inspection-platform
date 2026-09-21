"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, RotateCcw, Cloud, ShieldCheck } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { APP_CONFIG } from "../../config/constants";

interface AudioEvidencePlayerProps {
  unitId: string;
  initialAudioUrl?: string | null;
}

export const AudioEvidencePlayer: React.FC<AudioEvidencePlayerProps> = ({
  unitId,
  initialAudioUrl,
}) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isLoadingUrl, setIsLoadingUrl] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl);
      return;
    }

    const fetchSignedUrl = async () => {
      setIsLoadingUrl(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("sonura_token") : null;
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      try {
        const res = await fetch(`${APP_CONFIG.apiUrl}/api/v1/audio/signed-url/${unitId}`, {
          headers,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.signed_url) {
            setAudioUrl(data.signed_url);
          }
        }
      } catch (err) {
        console.error("Failed to load signed audio URL:", err);
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchSignedUrl();
  }, [unitId, initialAudioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);

    const isDurationUnset = !isFinite(duration) ? true : duration <= 0;
    if (isDurationUnset) {
      if (isFinite(audio.duration)) {
        if (audio.duration > 0) {
          setDuration(audio.duration);
        }
      }
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const isInfiniteDuration = !isFinite(audio.duration) ? true : audio.duration === Infinity;
    if (isInfiniteDuration) {
      audio.currentTime = 1e101;
      audio.ontimeupdate = () => {
        if (audio) {
          audio.ontimeupdate = null;
          if (isFinite(audio.duration)) {
            if (audio.duration > 0) {
              setDuration(audio.duration);
            }
          }
          audio.currentTime = 0;
        }
      };
    } else {
      if (isFinite(audio.duration)) {
        if (audio.duration > 0) {
          setDuration(audio.duration);
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const targetTime = Number(e.target.value);
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds) ? true : isNaN(seconds) ? true : seconds < 0) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  if (isLoadingUrl) {
    return (
      <Card className="p-4 border border-slate-800 bg-slate-900/50 font-mono text-xs">
        <div className="flex items-center space-x-2 text-slate-400">
          <Cloud className="w-4 h-4 text-violet-400 animate-pulse" />
          <span>Generating secure signed audio URL...</span>
        </div>
      </Card>
    );
  }

  if (!audioUrl) {
    return (
      <Card className="p-4 border border-slate-800 bg-slate-900/40 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs text-slate-400">Audio Compliance Recording</span>
          </div>
          <Badge variant="neutral">No Recording</Badge>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Inspection call audio will be archived here automatically once the live voice session concludes.
        </p>
      </Card>
    );
  }

  const isDurationValid = isFinite(duration) ? duration > 0 : false;
  const effectiveMax = isDurationValid ? duration : (currentTime > 0 ? currentTime + 10 : 100);

  return (
    <Card className="p-4 border border-slate-800 bg-slate-900/80 space-y-3 font-mono">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-sans">
            Verified Audio Evidence
          </h4>
        </div>
        <Badge variant="success">Supabase Signed Vault</Badge>
      </div>

      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-violet-600/30 shrink-0"
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={handleRestart}
          title="Restart Playback"
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 flex items-center space-x-2 min-w-0">
          <span className="text-[10px] text-slate-400 w-9 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={effectiveMax}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
          />
          <span className="text-[10px] text-slate-400 w-9 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer shrink-0"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </Card>
  );
};