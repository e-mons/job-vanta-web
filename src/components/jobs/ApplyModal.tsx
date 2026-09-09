"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Sparkles, 
  ExternalLink, 
  User, 
  Loader2,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { Job } from "@/store/useJobStore";
import { UserResume, useResumeStore } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import UpgradeModal from "@/components/shared/UpgradeModal";
import { toast } from "sonner";
import CompanyLogo from "./CompanyLogo";
import { useAgentTrackerStore } from "@/store/useAgentTrackerStore";

interface ApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  selectedResume: UserResume | null;
  onApplicationStarted?: (applicationId: string, status: string) => void;
  onMissingFieldsDetected?: (applicationId: string, missingFields: any[]) => void;
}

export default function ApplyModal({
  isOpen,
  onClose,
  job,
  selectedResume: propSelectedResume,
  onApplicationStarted,
}: ApplyModalProps) {
  const [isApplyingManual, setIsApplyingManual] = useState(false);
  const [isApplyingAutomated, setIsApplyingAutomated] = useState(false);
  
  const { getPlanTier, usage } = useSubscriptionStore();
  const { userResumes } = useResumeStore();

  // Internal resume selection if candidate has multiple
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    propSelectedResume?.id || (userResumes[0]?.id ?? "")
  );

  const activeResume = userResumes.find((r) => r.id === selectedResumeId) || propSelectedResume || userResumes[0] || null;

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<'pro' | 'unlimited'>('pro');
  const [upgradeReason, setUpgradeReason] = useState("");
  const [upgradeContext, setUpgradeContext] = useState<'resume_limit' | 'ai_apply_limit'>('ai_apply_limit');

  if (!isOpen || !job) return null;

  const resolveApplyUrl = (jobObj: any): string => {
    if (!jobObj) return "";
    const candidate =
      jobObj.applyLink ||
      jobObj.job_url ||
      jobObj.source_url ||
      jobObj.url ||
      jobObj.metadata?.applyLink ||
      jobObj.metadata?.job_url ||
      jobObj.metadata?.source_url ||
      jobObj.metadata?.url ||
      "";

    const trimmed = typeof candidate === "string" ? candidate.trim() : "";
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const targetApplyUrl = resolveApplyUrl(job);

  // 1. APPLY MANUALLY FLOW
  const handleManualApply = async () => {
    if (!targetApplyUrl) {
      toast.error("No official application link found for this job.");
      return;
    }

    // Open immediately to bypass popup blocker
    const newWindow = window.open(targetApplyUrl, "_blank", "noopener,noreferrer");
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      try {
        const fallbackAnchor = document.createElement("a");
        fallbackAnchor.href = targetApplyUrl;
        fallbackAnchor.target = "_blank";
        fallbackAnchor.rel = "noopener noreferrer";
        document.body.appendChild(fallbackAnchor);
        fallbackAnchor.click();
        document.body.removeChild(fallbackAnchor);
      } catch (e) {
        console.warn("Fallback anchor click failed:", e);
      }
    }

    setIsApplyingManual(true);
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          resumeId: activeResume?.id || null,
          applicationType: "manual",
          jobMetadata: {
            title: job.title,
            company: job.company,
            location: job.location,
            type: job.type || job.job_type,
            salary: job.salary,
            applyLink: targetApplyUrl,
            platform: job.platform || "generic",
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Application recorded for ${job.company}!`);
        if (onApplicationStarted) onApplicationStarted(data.applicationId, "submitted");
      }
    } catch (err) {
      console.warn("Could not log application record:", err);
      toast.success(`Opened application page for ${job.company}!`);
    } finally {
      setIsApplyingManual(false);
      onClose();
    }
  };

  // 2. APPLY AUTOMATICALLY FLOW
  const handleAutomatedApply = async () => {
    if (!activeResume) {
      toast.error("Please select or create a resume before starting Auto Apply.");
      return;
    }

    const tier = getPlanTier();

    // Check resume limit
    if (tier === 'free' && userResumes.length > 1) {
      setUpgradeReason("Free plan allows only 1 resume. Upgrade to Pro Plan to continue applying with AI.");
      setUpgradeTargetTier('pro');
      setUpgradeContext('resume_limit');
      setIsUpgradeModalOpen(true);
      return;
    }
    if (tier === 'pro' && userResumes.length > 5) {
      setUpgradeReason("Pro plan allows up to 5 resumes. Upgrade to Unlimited Plan to continue applying with AI.");
      setUpgradeTargetTier('unlimited');
      setUpgradeContext('resume_limit');
      setIsUpgradeModalOpen(true);
      return;
    }

    // Check daily AI applies limit
    const usedToday = usage?.usage?.aiAppliesUsedToday ?? 0;
    if (tier === 'free' && usedToday >= 2) {
      setUpgradeReason("You have reached your daily limit of 2 AI applications on the Free plan. Upgrade to Pro Plan for 25 applications per day!");
      setUpgradeTargetTier('pro');
      setUpgradeContext('ai_apply_limit');
      setIsUpgradeModalOpen(true);
      return;
    }
    if (tier === 'pro' && usedToday >= 25) {
      setUpgradeReason("You have reached your daily limit of 25 AI applications on the Pro plan. Upgrade to Unlimited Plan for unlimited applications!");
      setUpgradeTargetTier('unlimited');
      setUpgradeContext('ai_apply_limit');
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsApplyingAutomated(true);
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          resumeId: activeResume.id,
          applicationType: "automated",
          jobMetadata: {
            title: job.title,
            company: job.company,
            location: job.location,
            type: job.type || job.job_type,
            salary: job.salary,
            applyLink: targetApplyUrl,
            platform: job.platform || "generic",
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'DAILY_LIMIT_EXCEEDED' || data.code === 'RESUME_LIMIT_EXCEEDED') {
          setUpgradeReason(data.error);
          setUpgradeTargetTier(data.requiredTier || 'pro');
          setUpgradeContext(data.code === 'RESUME_LIMIT_EXCEEDED' ? 'resume_limit' : 'ai_apply_limit');
          setIsUpgradeModalOpen(true);
          return;
        }
        throw new Error(data.error || "Failed to start automated application");
      }

      // Start live tracker console with checking state
      useAgentTrackerStore.getState().startTracking({
        applicationId: data.applicationId,
        job,
        resume: activeResume,
      });

      toast.success("Auto Apply started! Jobvanta is checking application requirements.");
      if (onApplicationStarted) onApplicationStarted(data.applicationId, "checking");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to start Auto Apply");
    } finally {
      setIsApplyingAutomated(false);
    }
  };

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <CompanyLogo logoUrl={job.companyLogo || job.company_logo} companyName={job.company} size="md" />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  {job.platform ? `${job.platform.toUpperCase()} Job` : "Verified Job"}
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight mt-1 line-clamp-1">
                  {job.title}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{job.company}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Simple Resume Picker (Only if multiple resumes exist) */}
            {userResumes.length > 1 ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Select Resume to Apply With:
                </label>
                <div className="relative">
                  <select
                    value={activeResume?.id || ""}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full px-3 py-2 pr-8 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {userResumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            ) : activeResume ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold text-slate-600">Using:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[200px]">{activeResume.title}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Ready
                </span>
              </div>
            ) : null}

            {/* Exactly 2 Clear Options */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              {/* Option 1: Apply Automatically */}
              <button
                type="button"
                onClick={handleAutomatedApply}
                disabled={isApplyingAutomated || isApplyingManual || !activeResume}
                className="p-4 rounded-2xl border-2 border-blue-600 bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white hover:shadow-lg hover:shadow-blue-600/15 transition-all text-left flex items-start gap-3.5 disabled:opacity-60"
              >
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/25 shrink-0">
                  {isApplyingAutomated ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900">
                      Apply Automatically
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      Hands-Free
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                    Jobvanta checks application requirements, fills verified candidate details, and submits automatically.
                  </p>
                </div>
              </button>

              {/* Option 2: Apply Manually */}
              <button
                type="button"
                onClick={handleManualApply}
                disabled={isApplyingAutomated || isApplyingManual}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all text-left flex items-start gap-3.5 disabled:opacity-60"
              >
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 shrink-0">
                  {isApplyingManual ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-black text-slate-900">
                    Apply Manually
                  </span>
                  <p className="text-xs text-slate-500 font-medium mt-0.5 leading-relaxed">
                    Open the employer&apos;s application page in a new browser tab and track it in your application history.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        targetTier={upgradeTargetTier}
        reason={upgradeReason}
        featureContext={upgradeContext}
      />
    </>
  );
}
