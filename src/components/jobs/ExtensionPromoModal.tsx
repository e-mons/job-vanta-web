"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, DownloadCloud, Zap, Keyboard, ChevronRight } from "lucide-react";

interface ExtensionPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export default function ExtensionPromoModal({ isOpen, onClose, onContinue }: ExtensionPromoModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* Top Decorative Background */}
          <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

          <div className="relative pt-12 pb-8 px-8 sm:px-10 flex flex-col items-center text-center">
            {/* Floating Icon */}
            <div className="w-20 h-20 bg-white rounded-[24px] shadow-xl flex items-center justify-center mb-6 relative z-10 border-4 border-white">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-[20px]" />
              <Zap className="w-10 h-10 text-blue-600 relative z-10 fill-blue-600/20" />
            </div>

            <div className="space-y-3 mb-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Unlock Magic Apply
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                Don't waste time typing!
              </h2>
              <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
                Typing out your work history is exhausting. Install the free <strong className="text-slate-800">JobVanta Extension</strong> to auto-fill this application in exactly 1 second.
              </p>
            </div>

            {/* Contrast Box */}
            <div className="w-full grid grid-cols-2 gap-3 mb-8 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="p-4 rounded-xl bg-white flex flex-col items-center gap-2 shadow-sm border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Without</p>
                  <p className="text-sm font-bold text-slate-900">10+ Minutes</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white flex flex-col items-center gap-2 shadow-sm border border-blue-100 ring-1 ring-blue-500/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl" />
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center relative z-10">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-center relative z-10">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">With JobVanta</p>
                  <p className="text-sm font-bold text-blue-700">1 Second</p>
                </div>
              </div>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  window.open("https://github.com/jobvanta/extension", "_blank");
                }}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <DownloadCloud className="w-5 h-5" />
                Install Free Extension
              </button>
              
              <button
                onClick={onContinue}
                className="w-full py-3 px-6 rounded-2xl text-slate-500 hover:text-slate-800 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-1 group"
              >
                Skip, I like typing manually
                <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
