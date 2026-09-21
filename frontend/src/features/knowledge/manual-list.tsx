"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FileText, Eye, RefreshCw, X, AlertCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { ManualUploader } from "./manual-uploader";
import { VectorTestBench } from "./vector-test-bench";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { RAGManualItem, RAGChunk } from "../../types";

export const ManualList: React.FC = () => {
  const { authFetch } = useAuth();
  const [manuals, setManuals] = useState<RAGManualItem[]>([]);
  const [selectedManualChunks, setSelectedManualChunks] = useState<RAGChunk[]>([]);
  const [viewingManualTitle, setViewingManualTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChunks, setIsLoadingChunks] = useState(false);

  const fetchManuals = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/rag/manuals`);
      if (res.ok) setManuals(await res.json());
    } catch (err) {
      console.error("Failed to fetch manuals:", err);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchManuals();
  }, [fetchManuals]);

  const handleInspectChunks = async (manualTitle: string) => {
    setViewingManualTitle(manualTitle);
    setIsLoadingChunks(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/rag/manuals/${encodeURIComponent(manualTitle)}/chunks`);
      if (res.ok) {
        setSelectedManualChunks(await res.json());
      }
    } catch (e) {
      console.error("Failed to load chunks:", e);
    } finally {
      setIsLoadingChunks(false);
    }
  };

  const sanitizeChunkText = (text: string) => {
    return text.replace(/[♂|¶]/g, " ").replace(/\s+/g, " ").trim();
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
            Manuals
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-sans">
            Upload equipment PDF specifications and test real-time semantic vector retrieval.
          </p>
        </div>

        <button
          onClick={fetchManuals}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Refresh manuals"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ManualUploader onUploadComplete={fetchManuals} />
        <VectorTestBench />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white font-sans uppercase tracking-wider">
          Indexed Workspace Manuals ({manuals.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {manuals.length > 0 ? (
            manuals.map((m, idx) => (
              <Card 
                key={idx} 
                onClick={() => handleInspectChunks(m.manual_title)}
                className="flex items-center justify-between p-4 hover:border-violet-500/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs md:text-sm font-bold text-white truncate font-sans">{m.manual_title}</h4>
                    <div className="flex items-center space-x-3 mt-1 text-[11px] text-slate-400">
                      <span>{m.chunks} Vector Chunks</span>
                      <span>•</span>
                      <span>{m.category}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleInspectChunks(m.manual_title);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                    title="Inspect Vector Chunks"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <Badge variant="success" className="shrink-0 text-[10px]">Indexed</Badge>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic col-span-2">
              No indexed manuals found. Upload an equipment PDF manual to initialize local vector RAG.
            </p>
          )}
        </div>
      </div>

      {/* Vector Chunk Inspector Modal */}
      {viewingManualTitle && (
        <Modal isOpen={Boolean(viewingManualTitle)} onClose={() => setViewingManualTitle(null)} maxWidth="max-w-2xl">
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 pr-10">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white font-sans truncate">{viewingManualTitle}</h3>
                <span className="text-xs text-slate-400">Indexed Document Vector Chunks</span>
              </div>
              <Badge variant="violet" className="shrink-0">{selectedManualChunks.length} Chunks</Badge>
            </div>

            {isLoadingChunks ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                Retrieving vector chunks from Supabase PGVector...
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1.5">
                {selectedManualChunks.map((chunk, idx) => (
                  <div key={chunk.id || idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[10px] text-violet-400 pb-1 border-b border-slate-800/60">
                      <span>CHUNK #{idx + 1}</span>
                      <span>PAGE {chunk.page_number}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-sans text-xs break-words whitespace-pre-wrap pt-0.5">
                      {sanitizeChunkText(chunk.content)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};