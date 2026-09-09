"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  ShieldCheck,
  Building2,
  Clock
} from "lucide-react";
import type { FiveMinuteRefreshPayload } from "@shared/types/qa";

interface QAFiveMinuteRefreshModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FiveMinuteRefreshPayload | null;
}

export default function QAFiveMinuteRefreshModal({
  isOpen,
  onClose,
  data,
}: QAFiveMinuteRefreshModalProps) {
  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[36px] shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/80 to-indigo-50/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">5-Minute Interview Refresh</h3>
                <p className="text-xs text-slate-500 font-medium">
                  High-yield briefing for <span className="font-bold text-slate-800">{data.jobTitle}</span> at <span className="font-bold text-blue-600">{data.companyName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-white/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-7 flex-1">
            {/* Section 1: Your 3 Strongest Selling Points */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>1. Your 3 Strongest Selling Points for this Role</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {data.topSellingPoints.map((point, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                      {point}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: 3 Most Likely Questions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>2. Top 3 Likely Questions to Face</span>
              </div>

              <div className="space-y-2">
                {data.topThreeQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Likely #{idx + 1}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {q.questionText}
                    </h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Best Real Career Example */}
            {data.bestCareerExample && (
              <div className="p-5 rounded-3xl bg-blue-50/40 border border-blue-100 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-800 block">
                  3. Your Strongest Verified Example to Share
                </span>
                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                  {data.bestCareerExample.role} at {data.bestCareerExample.company}
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {data.bestCareerExample.story}
                </p>
              </div>
            )}

            {/* Section 4: 1-2 Areas to Handle Carefully */}
            {data.criticalRisks && data.criticalRisks.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>4. Areas to Handle with Honest Framing</span>
                </div>

                <div className="space-y-2">
                  {data.criticalRisks.map((risk, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-xs text-rose-950 font-medium">
                      {risk}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Smart Questions to Ask Them */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>5. Smart Questions to Ask the Employer</span>
              </div>

              <div className="space-y-2">
                {data.questionsToAskEmployer.map((q, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100/70 text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
                    • {q}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md"
            >
              Ready for Interview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
