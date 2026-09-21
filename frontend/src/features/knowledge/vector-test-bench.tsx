"use client";

import React, { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAuth } from "../auth/auth-context";
import { APP_CONFIG } from "../../config/constants";
import { RAGQueryResult } from "../../types";

export const VectorTestBench: React.FC = () => {
  const { authFetch } = useAuth();
  const [testQuery, setTestQuery] = useState("");
  const [queryResult, setQueryResult] = useState<RAGQueryResult | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  const handleRunTestQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim()) return;

    setIsQuerying(true);
    try {
      const res = await authFetch(`${APP_CONFIG.apiUrl}/api/v1/rag/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery.trim(), top_k: 2 }),
      });

      if (res.ok) {
        const data = await res.json();
        setQueryResult(data);
      }
    } catch (err) {
      console.error("Failed to execute RAG query:", err);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <Card className="flex flex-col justify-between space-y-4 font-mono">
      <div>
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-sans">Live Semantic Search Test Bench</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1 mb-3">
          Test semantic vector queries against your tenant-isolated PGVector knowledge base in real time.
        </p>

        <form onSubmit={handleRunTestQuery} className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="e.g. What is the standard PSI operating range?"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>
          <Button type="submit" variant="primary" isLoading={isQuerying} className="py-2 px-4 text-xs">
            Query
          </Button>
        </form>

        {queryResult && (
          <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-cyan-400 border-b border-slate-800 pb-1">
              <span>Cosine Similarity: {(queryResult.confidence_score * 100).toFixed(1)}%</span>
              <span>{queryResult.sources.length} Matches Found</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed font-sans">
              {queryResult.answer}
            </p>
          </div>
        )}
      </div>

      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800">
        Executes RPC function match_manual_sections with tenant isolation filter.
      </div>
    </Card>
  );
};