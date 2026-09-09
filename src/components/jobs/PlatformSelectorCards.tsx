"use client";

import { Check, Layers } from "lucide-react";
import { JobPlatform, useJobStore } from "@/store/useJobStore";
import { motion } from "framer-motion";

interface PlatformInfo {
  id: JobPlatform;
  name: string;
  domain: string;
  tagline: string;
  accentColor: string;
  activeBorder: string;
  activeBg: string;
  badgeBg: string;
  iconBg: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    domain: "boards.greenhouse.io",
    tagline: "Top Tech & High-Growth Scale-Ups",
    accentColor: "from-emerald-500 to-teal-600",
    activeBorder: "border-emerald-500 shadow-emerald-500/15",
    activeBg: "bg-emerald-50/50",
    badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200",
    iconBg: "bg-emerald-600 text-white",
  },
  {
    id: "lever",
    name: "Lever",
    domain: "jobs.lever.co",
    tagline: "Modern Startups & Innovative Unicorns",
    accentColor: "from-indigo-500 to-blue-600",
    activeBorder: "border-indigo-500 shadow-indigo-500/15",
    activeBg: "bg-indigo-50/50",
    badgeBg: "bg-indigo-100 text-indigo-800 border-indigo-200",
    iconBg: "bg-indigo-600 text-white",
  },
  {
    id: "workable",
    name: "Workable",
    domain: "apply.workable.com",
    tagline: "Global Tech & Enterprise Leaders",
    accentColor: "from-teal-500 to-cyan-600",
    activeBorder: "border-teal-500 shadow-teal-500/15",
    activeBg: "bg-teal-50/50",
    badgeBg: "bg-teal-100 text-teal-800 border-teal-200",
    iconBg: "bg-teal-600 text-white",
  },
  {
    id: "wellfound",
    name: "Wellfound",
    domain: "wellfound.com/jobs",
    tagline: "Venture-Backed & YC Startups",
    accentColor: "from-orange-500 to-amber-600",
    activeBorder: "border-orange-500 shadow-orange-500/15",
    activeBg: "bg-orange-50/50",
    badgeBg: "bg-orange-100 text-orange-800 border-orange-200",
    iconBg: "bg-orange-600 text-white",
  },
];

export default function PlatformSelectorCards() {
  const { selectedPlatforms, togglePlatform, setSelectedPlatforms } = useJobStore();

  const handleSelectAll = () => {
    setSelectedPlatforms(["greenhouse", "lever", "workable", "wellfound"]);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              Target Job Platforms
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                {selectedPlatforms.length} Active
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              We query live direct boards via Brave Search API
            </p>
          </div>
        </div>

        {selectedPlatforms.length < 4 && (
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer self-start sm:self-auto"
          >
            Select all platforms
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);

          return (
            <motion.button
              key={platform.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => togglePlatform(platform.id)}
              className={`relative text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden ${
                isSelected
                  ? `${platform.activeBorder} ${platform.activeBg} shadow-lg bg-white`
                  : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white text-slate-500 opacity-70"
              }`}
            >
              {/* Active status checkmark indicator */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-all ${
                    isSelected
                      ? platform.iconBg
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {platform.name.charAt(0)}
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                      : "border-slate-300 bg-white"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <div>
                <div className="text-sm font-black text-slate-900 leading-tight">
                  {platform.name}
                </div>
                <div className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                  {platform.tagline}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-2">
                  {platform.domain}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
