"use client";

import React from "react";

interface GlobalErrorProps {
  error: Error;
  reset: () => void;
}

export default function GlobalError({
  error,
  reset,
}: GlobalErrorProps) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#06080d] text-slate-100 flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4 font-mono max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-white font-sans">Platform Runtime Interruption</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            {error.message || "An unexpected execution error was encountered during page rendering."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs cursor-pointer transition-all"
          >
            Retry Session
          </button>
        </div>
      </body>
    </html>
  );
}