"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import type { NervousModePayload } from "@shared/types/qa";

interface QANervousModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: NervousModePayload | null;
  onStartPractice?: () => void;
}

export default function QANervousModeModal({
  isOpen,
  onClose,
  data,
  onStartPractice,
}: QANervousModeModalProps) {
  if (!isOpen || !data) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[36px] shadow-2xl border border-slate-100 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/80 to-blue-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg">Take a Breath</h3>
                <p className="text-xs text-slate-500 font-medium">
                  3 simple things to ground yourself before speaking
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
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 text-left">
            {/* 3 Things to Remember */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-800 block">
                Remember These 3 Truths
              </span>

              <div className="space-y-2.5">
                {data.threeThingsToRemember.map((fact, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                    <p className="text-xs sm:text-sm text-teal-950 font-medium leading-relaxed">
                      {fact}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Strongest Example */}
            {data.strongestExample && (
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                  Your Go-To Career Story
                </span>
                <p className="text-xs sm:text-sm text-slate-800 font-bold">
                  {data.strongestExample.role}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {data.strongestExample.story}
                </p>
              </div>
            )}

            {/* Main Role Objective */}
            <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 text-xs text-blue-950 space-y-1">
              <span className="font-bold text-blue-900 block">What {data.companyName} needs most:</span>
              <p className="text-slate-700">{data.employerTopNeed}</p>
            </div>
          </div>

          {/* Footer with Practice Trigger */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              Close
            </button>

            {onStartPractice && (
              <button
                onClick={() => {
                  onClose();
                  onStartPractice();
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-600/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                Practise First Question
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
