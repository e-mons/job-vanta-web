"use client";

import { useState, useMemo } from "react";
import { 
  Heart, 
  ExternalLink, 
  MapPin, 
  Building2, 
  Clock, 
  Zap, 
  Lock, 
  ArrowRight, 
  Loader2, 
  Send,
  DollarSign,
  Briefcase,
  Award,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from "lucide-react";
import { Job, useJobStore } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import { useAgentTrackerStore } from "@/store/useAgentTrackerStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import UpgradeModal from "@/components/shared/UpgradeModal";
import CompanyLogo from "./CompanyLogo";
import { mapToCanonicalStatus, getApplicationStatusMeta } from "@/services/automation/types";

// Time ago helper
function timeAgo(date?: string): string {
  if (!date) return "Recently";
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (isNaN(seconds) || seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

// Platform badge config
const PLATFORM_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  greenhouse: {
    label: "Greenhouse",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  lever: {
    label: "Lever",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  workable: {
    label: "Workable",
    bg: "bg-teal-50 text-teal-700 border-teal-200",
    text: "text-teal-700",
    border: "border-teal-200",
  },
  wellfound: {
    label: "Wellfound",
    bg: "bg-orange-50 text-orange-700 border-orange-200",
    text: "text-orange-700",
    border: "border-orange-200",
  },
};

interface JobCardProps {
  job: Job;
  index: number;
  onApply?: () => void;
  onApplyNow?: () => void;
  isLocked?: boolean;
  onUpgradeClick?: () => void;
  matchSkills?: string[];
  applicationStatus?: string;
  onResolveMissing?: () => void;
}

export default function JobCard({
  job,
  index,
  onApply,
  onApplyNow,
  isLocked,
  onUpgradeClick,
  matchSkills,
  applicationStatus,
  onResolveMissing,
}: JobCardProps) {
  const { saveJob, unsaveJob, savedJobs, savedJobIds } = useJobStore();
  const { isPremium } = useSubscriptionStore();
  const globalResumeSkills = useResumeStore((s) => s.data.skills);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isTogglingSave, setIsTogglingSave] = useState(false);

  const premium = isPremium();
  const isSaved = job.saved_status || savedJobIds.has(job.id);
  const router = useRouter();

  // Application status: normalized through single canonical status model
  const currentAppStatus = applicationStatus || job.applied_status || "not_applied";
  const canonicalStatus = mapToCanonicalStatus(currentAppStatus);
  const statusMeta = getApplicationStatusMeta(canonicalStatus);

  // Match score determination (from DB or fallback computed)
  const matchPercentage = useMemo(() => {
    if (job.match_score && job.match_score > 0) return job.match_score;
    if (job.matchScore && job.matchScore > 0) return job.matchScore;

    const skillsToMatch = matchSkills || globalResumeSkills || [];
    const jobTags = job.tags || job.skills || [];
    if (!jobTags.length || !skillsToMatch.length) return 80;

    const resumeSet = new Set(skillsToMatch.map((s) => s.toLowerCase().trim()));
    const matches = jobTags.filter((s) => resumeSet.has(s.toLowerCase().trim()));
    const ratio = matches.length / Math.max(jobTags.length, 1);
    return Math.min(98, Math.max(70, Math.round(70 + ratio * 28)));
  }, [job.match_score, job.matchScore, job.tags, job.skills, globalResumeSkills, matchSkills]);

  const platformKey = (job.platform?.toLowerCase() || "greenhouse") as keyof typeof PLATFORM_CONFIG;
  const platform = PLATFORM_CONFIG[platformKey] || PLATFORM_CONFIG.greenhouse;

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTogglingSave) return;
    setIsTogglingSave(true);
    try {
      if (isSaved) {
        const savedEntry = savedJobs.find((sj) => sj.metadata?.id === job.id || sj.job_url === job.applyLink);
        if (savedEntry) {
          await unsaveJob(savedEntry.id);
        } else {
          await unsaveJob(job.id);
        }
      } else {
        await saveJob(job);
      }
    } catch (err) {
      console.error("Failed to toggle save state:", err);
    } finally {
      setIsTogglingSave(false);
    }
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canonicalStatus === "needs_info" && onResolveMissing) {
      onResolveMissing();
      return;
    }

    if (canonicalStatus === "queued" || canonicalStatus === "checking" || canonicalStatus === "applying" || canonicalStatus === "action_required") {
      useAgentTrackerStore.getState().restore();
      return;
    }

    if (canonicalStatus === "submitted") {
      router.push("/applications");
      return;
    }

    if (isLocked && onUpgradeClick) {
      onUpgradeClick();
    } else if (onApplyNow) {
      onApplyNow();
    } else if (onApply) {
      onApply();
    } else {
      const url = job.job_url || job.applyLink;
      if (url) window.open(url, "_blank");
    }
  };

  const jobTags = job.tags || job.skills || [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
        onClick={() => {
          if (canonicalStatus === "needs_info" && onResolveMissing) {
            onResolveMissing();
          } else if (canonicalStatus === "queued" || canonicalStatus === "checking" || canonicalStatus === "applying" || canonicalStatus === "action_required") {
            useAgentTrackerStore.getState().restore();
          } else if (canonicalStatus === "submitted") {
            router.push("/applications");
          } else if (isLocked && onUpgradeClick) {
            onUpgradeClick();
          } else if (onApplyNow) {
            onApplyNow();
          } else if (onApply) {
            onApply();
          }
        }}
        className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-[32px] bg-white border border-slate-200/80 hover:border-blue-400/80 hover:shadow-[0_20px_50px_-15px_rgba(37,99,235,0.12)] transition-all duration-300 cursor-pointer"
      >
        <div>
          {/* Top Row: Company Logo + Platform Badge + Application Status Badge + Save Button */}
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3.5">
              <CompanyLogo logoUrl={job.companyLogo || job.company_logo} companyName={job.company} size="md" />
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${platform.bg}`}>
                    {platform.label}
                  </span>

                  {/* Canonical Application Status Badge on Job Card */}
                  {canonicalStatus !== "ready_to_apply" && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}>
                      {canonicalStatus === "checking" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      {canonicalStatus === "needs_info" && <AlertTriangle className="w-2.5 h-2.5 text-amber-600 animate-bounce" />}
                      {canonicalStatus === "queued" && <Sparkles className="w-2.5 h-2.5" />}
                      {canonicalStatus === "applying" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      {canonicalStatus === "action_required" && <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />}
                      {canonicalStatus === "submitted" && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                      {canonicalStatus === "failed" && <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />}
                      <span>{statusMeta.label}</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(job.fetched_at || job.postedAt)}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleToggleSave}
              disabled={isTogglingSave}
              aria-label={isSaved ? "Unsave job" : "Save job"}
              className={`p-2.5 rounded-2xl border transition-all duration-200 shrink-0 ${
                isSaved
                  ? "bg-rose-50 border-rose-200 text-rose-500 shadow-sm"
                  : "bg-slate-50 border-slate-200/80 text-slate-400 hover:text-rose-500 hover:bg-rose-50/50 hover:border-rose-200"
              } ${isTogglingSave ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {isTogglingSave ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className={`w-4 h-4 ${isSaved ? "fill-current text-rose-500" : ""}`} />
              )}
            </button>
          </div>

          {/* Job Title & Company */}
          <div className="mb-4">
            <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 mb-1.5">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{job.company}</span>
            </div>
          </div>

          {/* Meta Details: Location, Salary, Job Type, Experience */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {job.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100/70 text-[11px] font-bold text-slate-600 border border-slate-200/60">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate max-w-[140px]">{job.location}</span>
              </span>
            )}

            {job.salary && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 text-[11px] font-black text-emerald-700 border border-emerald-200/70">
                <DollarSign className="w-3 h-3 text-emerald-500 shrink-0 -mr-0.5" />
                {job.salary}
              </span>
            )}

            {(job.job_type || job.type) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-[11px] font-bold text-blue-700 border border-blue-200/70">
                <Briefcase className="w-3 h-3 text-blue-500 shrink-0" />
                {job.job_type || job.type}
              </span>
            )}

            {job.experience_level && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-[11px] font-bold text-amber-700 border border-amber-200/70">
                <Award className="w-3 h-3 text-amber-500 shrink-0" />
                {job.experience_level}
              </span>
            )}
          </div>

          {/* Tags */}
          {jobTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {jobTags.slice(0, 4).map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-0.5 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-500 border border-slate-200/60"
                >
                  {tag}
                </span>
              ))}
              {jobTags.length > 4 && (
                <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-400 border border-slate-200/60">
                  +{jobTags.length - 4}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section: Match Progress Bar + Actions */}
        <div className="pt-4 border-t border-slate-100 mt-2 space-y-4">
          {/* Match Score & Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>Fit Score</span>
              </div>
              <span className={`text-xs font-black ${
                matchPercentage >= 85 ? "text-emerald-600" : matchPercentage >= 75 ? "text-blue-600" : "text-amber-600"
              }`}>
                {matchPercentage}% Match
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  matchPercentage >= 85
                    ? "bg-gradient-to-r from-blue-500 to-emerald-500"
                    : matchPercentage >= 75
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                    : "bg-gradient-to-r from-amber-400 to-orange-500"
                }`}
                style={{ width: `${matchPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons: Save & Apply Button */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              onClick={handleToggleSave}
              disabled={isTogglingSave}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-1.5 border ${
                isSaved
                  ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/70"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-current text-rose-500" : "text-slate-400"}`} />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </button>

            <button
              onClick={handleApplyClick}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-white transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98] ${
                canonicalStatus === "needs_info"
                  ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30 ring-2 ring-amber-400/50 animate-pulse"
                  : canonicalStatus === "queued" || canonicalStatus === "checking" || canonicalStatus === "applying"
                  ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20"
                  : canonicalStatus === "action_required"
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20"
                  : canonicalStatus === "submitted"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : canonicalStatus === "failed"
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock</span>
                </>
              ) : canonicalStatus === "needs_info" ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Complete & Continue</span>
                </>
              ) : canonicalStatus === "queued" ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>In Queue (Track)</span>
                </>
              ) : canonicalStatus === "checking" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking... (Track)</span>
                </>
              ) : canonicalStatus === "applying" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying... (Track)</span>
                </>
              ) : canonicalStatus === "action_required" ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Action Required</span>
                </>
              ) : canonicalStatus === "submitted" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submitted</span>
                </>
              ) : canonicalStatus === "failed" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Application</span>
                </>
              ) : (
                <>
                  <span>Open URL to Apply</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        reason="Unlock instant direct job applications and unlimited match visibility!"
      />
    </>
  );
}
