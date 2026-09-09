"use client";

import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface QAGenerationErrorProps {
  errorMessage?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export default function QAGenerationError({
  errorMessage = "We couldn't finish preparing your questions right now.",
  onRetry,
  isRetrying = false,
}: QAGenerationErrorProps) {
  return (
    <div className="min-h-[420px] flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto bg-white rounded-[40px] border border-slate-100 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-6 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>

      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
        We couldn't finish your preparation
      </h3>
      <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
        {errorMessage}. Your application details and career history are safe. Please try again.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Retrying..." : "Try Again"}
        </button>

        <Link
          href="/jobs/history"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>
      </div>
    </div>
  );
}
