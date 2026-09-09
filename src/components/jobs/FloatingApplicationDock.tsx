"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Maximize2, 
  X, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useAgentTrackerStore } from "@/store/useAgentTrackerStore";

export default function FloatingApplicationDock() {
  const {
    activeJob,
    status,
    isModalOpen,
    isMinimized,
    restore,
    reset,
  } = useAgentTrackerStore();

  // Show dock only if an active job exists, modal is closed or minimized, and status is not idle
  const isVisible = activeJob && !isModalOpen && status !== "idle";

  if (!isVisible) return null;

  const isCompleted = status === "submitted";
  const isNeedsInfo = status === "needs_info" || status === "action_required";
  const isFailed = status === "failed";

  const getStatusLabel = () => {
    switch (status) {
      case "checking":
        return "Checking Application...";
      case "needs_info":
        return "Information Needed!";
      case "queued":
        return "In Queue...";
      case "applying":
        return "Applying to Job...";
      case "action_required":
        return "Action Required!";
      case "submitted":
        return "Application Submitted!";
      case "failed":
        return "Application Paused";
      default:
        return "Processing...";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-40 max-w-md w-auto"
      >
        <div
          onClick={restore}
          className={`group flex items-center gap-3.5 p-3.5 pl-4 pr-3 rounded-full shadow-2xl border transition-all cursor-pointer select-none backdrop-blur-xl ${
            isCompleted
              ? "bg-emerald-950/90 border-emerald-500/40 text-white shadow-emerald-500/20 hover:scale-[1.02]"
              : isNeedsInfo
              ? "bg-amber-950/90 border-amber-500/50 text-white shadow-amber-500/20 hover:scale-[1.02] animate-bounce"
              : isFailed
              ? "bg-rose-950/90 border-rose-500/40 text-white shadow-rose-500/20 hover:scale-[1.02]"
              : "bg-slate-900/90 border-slate-700/80 text-white shadow-blue-500/10 hover:border-blue-500/60 hover:scale-[1.02]"
          }`}
        >
          {/* Animated Status Icon */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md ${
              isCompleted
                ? "bg-emerald-500 text-white"
                : isNeedsInfo
                ? "bg-amber-500 text-white"
                : isFailed
                ? "bg-rose-500 text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isNeedsInfo ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isFailed ? (
              <X className="w-5 h-5" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 pr-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black truncate max-w-[140px] sm:max-w-[180px]">
                {activeJob.company}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate">
                • {activeJob.title}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold">
              <span
                className={
                  isCompleted
                    ? "text-emerald-400"
                    : isNeedsInfo
                    ? "text-amber-300"
                    : isFailed
                    ? "text-rose-400"
                    : "text-blue-400"
                }
              >
                {getStatusLabel()}
              </span>
              <span className="text-[10px] text-slate-400 group-hover:text-white transition-colors">
                (Click to view)
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 pl-1 border-l border-white/10 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                restore();
              }}
              title="Expand tracker"
              className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            {isCompleted && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
                title="Dismiss"
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
