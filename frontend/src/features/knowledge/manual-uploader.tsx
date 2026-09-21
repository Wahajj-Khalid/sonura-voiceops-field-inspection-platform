"use client";

import React, { useRef, useState } from "react";
import { Upload, FileText, Sparkles, CheckCircle2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";

interface ManualUploaderProps {
  onUploadComplete: () => void;
}

export const ManualUploader: React.FC<ManualUploaderProps> = ({ onUploadComplete }) => {
  const { authFetch } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("manual_title", file.name.replace(".pdf", ""));
    formData.append("category", "HVAC");

    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/rag/manuals/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadSuccess(`Successfully indexed "${data.manual_title}" into ${data.chunks_indexed} vector chunks.`);
        onUploadComplete();
        setTimeout(() => setUploadSuccess(null), 4000);
      } else {
        setUploadError("PDF parsing failed. Verify that file is a standard text-based PDF.");
      }
    } catch (err) {
      setUploadError("Network error uploading technical manual.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card
      onClick={() => fileInputRef.current?.click()}
      className="border-dashed border-2 border-violet-500/30 hover:border-violet-500/60 transition-all flex flex-col items-center justify-center py-10 text-center cursor-pointer font-mono"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.txt"
        className="hidden"
      />

      <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-3">
        <Upload className="w-6 h-6 text-violet-400" />
      </div>

      <h3 className="text-sm font-bold text-white mb-1 font-sans">Click or drag and drop equipment PDF manuals</h3>
      <p className="text-xs text-slate-400 mb-4 max-w-sm">
        PDFs are parsed with pypdf and vectorized into 384-dimensional dense embeddings stored in Supabase PGVector.
      </p>

      {uploadSuccess && (
        <div className="mb-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {uploadError && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {uploadError}
        </div>
      )}

      <Button
        isLoading={isUploading}
        onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        className="py-2 px-4 text-xs"
      >
        {isUploading ? "Vectorizing In-Memory..." : "Select Equipment PDF"}
      </Button>
    </Card>
  );
};