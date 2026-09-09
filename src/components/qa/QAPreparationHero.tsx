"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Building2, 
  MapPin, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  ArrowLeft, 
  Clock, 
  Heart, 
  BookOpen, 
  MessageSquare,
  ChevronDown,
  Sparkle,
  SlidersHorizontal
} from "lucide-react";
import Link from "next/link";
import { STAGE_DEFINITIONS } from "@/services/qa/qaStageMapper";
import type { QAStageType, StageTransitionDiff } from "@shared/types/qa";

interface QAPreparationHeroProps {
  jobTitle: string;
  companyName: string;
  location?: string | null;
  activeStageType: QAStageType;
  onOpenWhatYouSent: () => void;
  onRefreshPreparation?: () => void;
  onOpenRefresh?: () => void;
  onOpenNervous?: () => void;
  onOpenStoryBank?: () => void;
  onOpenCheckIn?: () => void;
  isRefreshing?: boolean;
  recentDiff?: StageTransitionDiff | null;
}

export default function QAPreparationHero({
  jobTitle,
  companyName,
  location,
  activeStageType,
  onOpenWhatYouSent,
  onRefreshPreparation,
  onOpenRefresh,
  onOpenNervous,
  onOpenStoryBank,
  onOpenCheckIn,
  isRefreshing = false,
  recentDiff,
}: QAPreparationHeroProps) {
  const currentStageMeta = STAGE_DEFINITIONS[activeStageType] || STAGE_DEFINITIONS.general;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-sm space-y-4">
      {/* Top Bar: Breadcrumb + Clean Toolkit Dropdown */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/jobs/history"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Applications</span>
        </Link>

        {/* Consolidated Toolkit Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Interview Toolkit</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
              {onOpenRefresh && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenRefresh();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-bold">5-Min Pre-Interview Refresh</div>
                    <div className="text-[11px] text-slate-400 font-normal">Quick 3-point briefing before your call</div>
                  </div>
                </button>
              )}

              {onOpenNervous && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenNervous();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Heart className="w-4 h-4 text-teal-600 shrink-0" />
                  <div>
                    <div className="font-bold">Calming Nervous Mode</div>
                    <div className="text-[11px] text-slate-400 font-normal">3 grounding truths to eliminate anxiety</div>
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenWhatYouSent();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="font-bold">What You Sent</div>
                  <div className="text-[11px] text-slate-400 font-normal">Submitted resume snapshot & details</div>
                </div>
              </button>

              {onOpenStoryBank && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenStoryBank();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="font-bold">Career Story Bank</div>
                    <div className="text-[11px] text-slate-400 font-normal">Reusable STAR achievements</div>
                  </div>
                </button>
              )}

              {onOpenCheckIn && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenCheckIn();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-bold">Log Asked Questions</div>
                    <div className="text-[11px] text-slate-400 font-normal">Record questions you were asked</div>
                  </div>
                </button>
              )}

              {onRefreshPreparation && (
                <div className="pt-1 border-t border-slate-100 mt-1">
                  <button
                    type="button"
                    disabled={isRefreshing}
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRefreshPreparation();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 text-slate-500 shrink-0 ${isRefreshing ? "animate-spin" : ""}`} />
                    <div>
                      <div className="font-bold">{isRefreshing ? "Regenerating..." : "Regenerate Questions"}</div>
                      <div className="text-[11px] text-slate-400 font-normal">Update if your profile changed</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Role & Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
              {currentStageMeta.title}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {jobTitle}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-slate-600 text-xs font-semibold">
            <span className="flex items-center gap-1 text-slate-900 font-bold">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              {companyName}
            </span>
            {location && (
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {location}
              </span>
            )}
          </div>
        </div>

        {/* Compact Stage Focus Note */}
        <div className="bg-slate-50 rounded-2xl px-3.5 py-2.5 border border-slate-100 max-w-sm sm:text-right">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
            Stage Focus
          </span>
          <p className="text-xs text-slate-700 font-medium leading-snug">
            {currentStageMeta.description}
          </p>
        </div>
      </div>

      {/* Stage Change Banner (Only if advanced recently) */}
      {recentDiff && (
        <div className="p-3 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
          <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold">{recentDiff.message}</span>
            <span className="text-indigo-700 block mt-0.5">
              Your preparation answers were preserved and adapted for interview delivery.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
