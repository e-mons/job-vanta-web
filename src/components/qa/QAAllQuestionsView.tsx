"use client";

import { useState } from "react";
import { 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  ChevronRight, 
  Check 
} from "lucide-react";
import type { QAQuestion, QAAnswer, RiskGroupType } from "@shared/types/qa";

interface QAAllQuestionsViewProps {
  questions: (QAQuestion & { answer: QAAnswer | null; riskGroup?: RiskGroupType })[];
  onSelectQuestion: (index: number) => void;
  onToggleReview: (questionId: string, isReviewed: boolean) => Promise<void>;
}

export default function QAAllQuestionsView({
  questions,
  onSelectQuestion,
  onToggleReview,
}: QAAllQuestionsViewProps) {
  const [filter, setFilter] = useState<"all" | "prepare_first" | "strong" | "prepare" | "important">("all");

  const filteredQuestions = questions.filter((q) => {
    if (filter === "all") return true;
    if (filter === "prepare_first") return q.riskGroup === "important" || q.priority === "high";
    if (filter === "strong") return q.riskGroup === "strong";
    if (filter === "prepare") return q.riskGroup === "prepare";
    if (filter === "important") return q.riskGroup === "important";
    return true;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-sm space-y-5">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            All Questions ({questions.length})
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Select any question to view recommended answers and practice.
          </p>
        </div>

        {/* Filter Switcher */}
        <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "all" ? "bg-white text-slate-900 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter("prepare_first")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "prepare_first" ? "bg-white text-blue-600 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Priority
          </button>
          <button
            type="button"
            onClick={() => setFilter("strong")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "strong" ? "bg-white text-emerald-700 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Strong
          </button>
          <button
            type="button"
            onClick={() => setFilter("prepare")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "prepare" ? "bg-white text-amber-800 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Prepare
          </button>
          <button
            type="button"
            onClick={() => setFilter("important")}
            className={`px-3 py-1 rounded-lg transition-all ${
              filter === "important" ? "bg-white text-rose-700 shadow-xs" : "hover:text-slate-900"
            }`}
          >
            Important
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-2.5">
        {filteredQuestions.map((q, idx) => {
          const originalIndex = questions.findIndex((orig) => orig.id === q.id);
          const riskGroup = q.riskGroup || "prepare";

          return (
            <div
              key={q.id}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group cursor-pointer ${
                q.is_reviewed
                  ? "bg-slate-50/60 border-slate-200/80 hover:border-slate-300"
                  : "bg-white border-slate-200/70 hover:border-blue-300 hover:shadow-xs"
              }`}
              onClick={() => onSelectQuestion(originalIndex !== -1 ? originalIndex : idx)}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Review Toggle Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleReview(q.id, !q.is_reviewed);
                  }}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors mt-0.5 shrink-0 ${
                    q.is_reviewed
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                  }`}
                  title={q.is_reviewed ? "Marked as reviewed" : "Mark as reviewed"}
                >
                  <Check className="w-3.5 h-3.5" />
                </button>

                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Q{(originalIndex !== -1 ? originalIndex : idx) + 1} • {q.category.replace(/_/g, " ")}
                    </span>

                    {/* Risk Badge */}
                    {riskGroup === "strong" && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700">
                        Strong
                      </span>
                    )}
                    {riskGroup === "prepare" && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800">
                        Prepare
                      </span>
                    )}
                    {riskGroup === "important" && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700">
                        Priority
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                    {q.question_text || (q as any).questionText}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
                <span className="text-xs font-bold hidden sm:inline">Practice</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
