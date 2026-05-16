"use client";

import { Heart, ExternalLink, MapPin, Building2, Clock, Zap, Lock, ArrowRight } from "lucide-react";
import { Job, useJobStore } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import UpgradeModal from "@/components/shared/UpgradeModal";

// Deterministic color from company name
function companyColor(name: string): string {
  const colors = [
    "from-blue-500 to-blue-600",
    "from-indigo-500 to-indigo-600",
    "from-emerald-500 to-emerald-600",
    "from-orange-500 to-orange-600",
    "from-rose-500 to-rose-600",
    "from-amber-500 to-amber-600",
    "from-violet-500 to-violet-600",
    "from-teal-500 to-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// Time ago
function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

interface JobCardProps {
  job: Job;
  index: number;
  onApply: () => void;
}

export default function JobCard({ job, index, onApply }: JobCardProps) {
  const { saveJob, unsaveJob, savedJobs, savedJobIds } = useJobStore();
  const { isPremium } = useSubscriptionStore();
  const resumeSkills = useResumeStore((s) => s.data.skills);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const premium = isPremium();
  const isSaved = savedJobIds.has(job.id);
  
  // Simple heuristic for match if we don't have server-side score
  const matchPercent = useMemo(() => {
    if (!job.skills?.length || !resumeSkills?.length) return 0;
    const resumeSet = new Set(resumeSkills.map(s => s.toLowerCase().trim()));
    const matches = job.skills.filter(s => resumeSet.has(s.toLowerCase().trim()));
    return Math.round((matches.length / job.skills.length) * 100);
  }, [job.skills, resumeSkills]);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      const savedEntry = savedJobs.find((sj) => sj.metadata?.id === job.id);
      if (savedEntry) unsaveJob(savedEntry.id);
    } else {
      saveJob(job);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.06 }}
        onClick={onApply}
        className="group relative p-8 rounded-[40px] bg-white border border-slate-200/60 hover:border-blue-400 hover:shadow-[0_30px_60px_-20px_rgba(30,58,138,0.15)] transition-all duration-500 cursor-pointer"
      >
        <div className="relative z-10">
          {/* Top row: Avatar + Save */}
          <div className="flex items-start justify-between mb-8">
            <div className="relative">
              {job.companyLogo ? (
                <div className="w-16 h-16 rounded-[22px] bg-white border border-slate-100 p-2.5 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                  <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className={`w-16 h-16 rounded-[22px] bg-gradient-to-br ${companyColor(job.company)} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {job.company.charAt(0)}
                </div>
              )}
              {isSaved && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full border-[3px] border-white flex items-center justify-center shadow-lg">
                  <Heart className="w-2.5 h-2.5 text-white fill-current" />
                </div>
              )}
            </div>

            <button
              onClick={handleToggleSave}
              className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                isSaved
                  ? "bg-rose-50 border-rose-100 text-rose-500"
                  : "bg-slate-50 border-slate-100 text-slate-300 hover:text-rose-500 hover:border-rose-200"
              }`}
            >
              <Heart className={`w-5 h-5 ${isSaved ? "fill-current" : ""}`} />
            </button>
          </div>

          {/* Job Title & Company */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight mb-2">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-400 font-bold uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              {job.company}
            </div>
          </div>

          {/* Meta Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-[10px] text-slate-500 font-bold uppercase tracking-widest border border-slate-100">
              <MapPin className="w-3 h-3" />
              {job.location}
            </span>
            {job.isRemote && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                Remote
              </span>
            )}
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
              {job.source}
            </span>
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between pt-6 border-t border-dashed border-slate-100">
            <div className="flex items-center gap-3">
              {premium ? (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                  matchPercent >= 80 ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                }`}>
                  <Zap className="w-3 h-3 fill-current" />
                  {matchPercent}% Match
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsUpgradeModalOpen(true); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100"
                >
                  <Lock className="w-3 h-3" />
                  Unlock Fit
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {timeAgo(job.postedAt)}
            </div>
          </div>

          {/* Hover Arrow */}
          <div className="absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300">
            <ArrowRight className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </motion.div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        reason="Skill Match Scoring is a Premium feature. See exactly how well you fit every job!"
      />
    </>
  );
}
