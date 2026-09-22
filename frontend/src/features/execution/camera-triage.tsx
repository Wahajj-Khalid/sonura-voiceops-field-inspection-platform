"use client";

import React, { useState, useRef } from "react";
import { Camera, Upload, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { APP_CONFIG } from "../../config/constants";
import { useAuth } from "../auth/auth-context";

interface CameraTriageProps {
  unitId: string;
  onDefectDetected?: (defectInfo: any) => void;
}

export const CameraTriage: React.FC<CameraTriageProps> = ({
  unitId,
  onDefectDetected,
}) => {
  const { authFetch } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastFinding, setLastFinding] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const liveCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleProcessFile = async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsAnalyzing(true);
    setLastFinding(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("unit_id", unitId);

    const headers: HeadersInit = {};
    try {
      if (typeof window !== "undefined") {
        const stored = sessionStorage.getItem("sonura_ephemeral_session_keys");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.geminiKey) {
            headers["x-custom-gemini-key"] = parsed.geminiKey;
          }
        }
      }
    } catch (e) {
      // Fallback
    }

    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/vision/analyze-photo`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setLastFinding(data.analysis);
        if (data.analysis ? data.analysis.error_message : false) {
          setErrorMessage(data.analysis.error_message);
        }
        if (onDefectDetected) {
          onDefectDetected(data);
        }
      } else {
        setErrorMessage(data.detail || "Defect analysis request failed.");
      }
    } catch (err) {
      setErrorMessage("Network error connecting to vision analysis service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      handleProcessFile(file);
    }
  };

  const clearResults = () => {
    setPreviewUrl(null);
    setLastFinding(null);
    setErrorMessage(null);
  };

  return (
    <Card className="flex flex-col justify-between space-y-4 font-mono w-full min-w-0">
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2 min-w-0">
            <Camera className="w-4 h-4 text-violet-400 shrink-0" />
            <h3 className="text-sm font-bold text-white font-sans truncate">Visual Defect Triage</h3>
          </div>
          <Badge variant="violet" className="shrink-0 text-[10px]">Gemini Vision AI</Badge>
        </div>

        <input
          type="file"
          ref={liveCameraInputRef}
          onChange={handleFileChange}
          accept="image/*"
          capture="environment"
          className="hidden"
        />

        <input
          type="file"
          ref={galleryInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <div
          onClick={() => galleryInputRef.current ? galleryInputRef.current.click() : null}
          className="mt-3 p-3.5 rounded-xl border-dashed border-2 border-slate-800 hover:border-violet-500/50 bg-slate-900/50 transition-all flex flex-col items-center justify-center cursor-pointer text-center min-h-[120px]"
        >
          {previewUrl ? (
            <div className="relative w-full h-28 rounded-lg overflow-hidden flex items-center justify-center bg-black">
              <img src={previewUrl} alt="Equipment Snapshot" className="object-contain h-full w-full" />
              {isAnalyzing ? (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center space-x-2 text-xs text-cyan-300">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Scanning Surface Faults...</span>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Camera className="w-6 h-6 text-slate-500 mb-1.5" />
              <span className="text-xs text-slate-300 font-semibold font-sans">Snap Photo or Select Image</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Detect cracks, leaks, corrosion, or wear</span>
            </>
          )}
        </div>

        {errorMessage ? (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start space-x-2 font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-bold block">Vision Notice:</span>
              <span className="text-[11px] leading-snug break-words">{errorMessage}</span>
            </div>
          </div>
        ) : null}

        {lastFinding ? (
          <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 uppercase">AI FINDING</span>
              <div className="flex items-center space-x-1.5">
                <Badge variant={lastFinding.defect_detected ? "danger" : "success"}>
                  {lastFinding.defect_detected ? `${lastFinding.severity} DEFECT` : "CLEAR"}
                </Badge>
                <button
                  type="button"
                  onClick={clearResults}
                  className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors p-1 cursor-pointer"
                  title="Clear scan"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed font-sans break-words">
              {lastFinding.defect_summary}
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          variant="primary"
          icon={<Camera className="w-3.5 h-3.5" />}
          onClick={() => liveCameraInputRef.current ? liveCameraInputRef.current.click() : null}
          isLoading={isAnalyzing}
          className="text-xs py-2 px-2.5 shadow-md justify-center"
        >
          Take Live Photo
        </Button>

        <Button
          variant="secondary"
          icon={<Upload className="w-3.5 h-3.5" />}
          onClick={() => galleryInputRef.current ? galleryInputRef.current.click() : null}
          isLoading={isAnalyzing}
          className="text-xs py-2 px-2.5 justify-center"
        >
          Upload Image
        </Button>
      </div>
    </Card>
  );
};