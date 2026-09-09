"use client";

import { CheckCircle2, Layers, List, Sparkles } from "lucide-react";
import type { ReadinessBreakdown, RiskRadarSummary } from "@shared/types/qa";

interface QAReadinessCardProps {
  readiness: ReadinessBreakdown;
  radar: RiskRadarSummary | null;
  onFilterGroup?: (group: "strong" | "prepare" | "important" | "all") => void;
  activeFilter?: string;
  currentIndex?: number;
  totalQuestions?: number;
  onSelectQuestion?: (index: number) => void;
  reviewedIndices?: number[];
  viewMode?: "single" | "all";
  onToggleViewMode?: (mode: "single" | "all") => void;
}

export default function QAReadinessCard({
  readiness,
  radar,
  onFilterGroup,
  activeFilter = "all",
  currentIndex = 0,
  totalQuestions = 0,
  onSelectQuestion,
  reviewedIndices = [],
  viewMode = "single",
  onToggleViewMode,
}: QAReadinessCardProps) {
  const strongCount = radar?.strongCount ?? readiness.strongCount;
  const prepareCount = radar?.prepareCount ?? readiness.prepareCount;
  const importantCount = radar?.importantCount ?? readiness.importantCount;
  const total = totalQuestions || readiness.totalQuestions || 1;
  const reviewed = readiness.reviewedCount || 0;
  const percent = Math.min(100, Math.round((reviewed / total) * 100));

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
      {/* Top Row: Progress + Percentage + View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Readiness Level & Progress Text */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Readiness:
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {readiness.readinessLevel}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {percent}% Ready
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
            <strong className="text-slate-800">{reviewed}</strong> of {total} reviewed
          </span>
        </div>

        {/* View Mode Toggle (Focus vs List) */}
        {onToggleViewMode && (
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-600 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onToggleViewMode("single")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === "single" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Focus Mode
            </button>
            <button
              type="button"
              onClick={() => onToggleViewMode("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                viewMode === "all" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              All Questions ({total})
            </button>
          </div>
        )}
      </div>

      {/* Sleek Progress Bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300 rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Bottom Row: Direct Question Stepper Pills & Quick Tag Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Interactive Question Stepper (1, 2, 3...) */}
        {total > 0 && onSelectQuestion && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
              Jump to:
            </span>
            {Array.from({ length: total }).map((_, idx) => {
              const isCurrent = idx === currentIndex && viewMode === "single";
              const isReviewed = reviewedIndices.includes(idx);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectQuestion(idx);
                    if (viewMode !== "single" && onToggleViewMode) {
                      onToggleViewMode("single");
                    }
                  }}
                  className={`w-7 h-7 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 scale-105"
                      : isReviewed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title={`Question ${idx + 1}${isReviewed ? " (Reviewed)" : ""}`}
                >
                  {isReviewed && !isCurrent ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    idx + 1
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Concise Status Pills */}
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {strongCount} Strong
          </span>

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {prepareCount} Prepare
          </span>

          {importantCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-900 border border-rose-100">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              {importantCount} Priority
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
