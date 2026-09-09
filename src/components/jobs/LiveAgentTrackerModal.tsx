"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle, 
  ExternalLink, 
  Minimize2, 
  X, 
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  Building2,
  Clock,
  Layers,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAgentTrackerStore, AgentStepStatus } from "@/store/useAgentTrackerStore";
import { createClient } from "@/utils/supabase/client";
import CompanyLogo from "./CompanyLogo";
import { toast } from "sonner";
import { FormFieldDefinition, getApplicationStatusMeta } from "@/services/automation/types";

const PHASES = [
  { id: 0, key: "checking", title: "Checking Application", desc: "Inspecting form requirements" },
  { id: 1, key: "needs_info", title: "Review Details", desc: "Verifying candidate facts" },
  { id: 2, key: "queued", title: "Queued", desc: "Waiting for cloud browser execution" },
  { id: 3, key: "applying", title: "Applying", desc: "Jobvanta is filling the application" },
  { id: 4, key: "submitted", title: "Submitted", desc: "Application submitted successfully" },
];

export default function LiveAgentTrackerModal() {
  const router = useRouter();
  const {
    activeApplicationId,
    activeJob,
    status,
    currentStepIndex,
    logs,
    missingFields,
    isModalOpen,
    error,
    updateStatus,
    closeModal,
    minimize,
    reset,
  } = useAgentTrackerStore();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmittingMissing, setIsSubmittingMissing] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Populate missing field inputs
  useEffect(() => {
    if (missingFields.length > 0) {
      const initial: Record<string, string> = {};
      missingFields.forEach((f) => {
        initial[f.fieldKey] = f.value || "";
      });
      setFormValues(initial);
    }
  }, [missingFields]);

  // Auto-scroll terminal log container to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Real-time synchronization for active application
  useEffect(() => {
    if (!activeApplicationId) return;

    let channel: any = null;
    let isMounted = true;

    const setupSubscription = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        const channelName = `live-tracker-${activeApplicationId}-${Math.random().toString(36).substring(2, 9)}`;
        const newChannel = supabase.channel(channelName);

        newChannel
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "job_applications",
              filter: `id=eq.${activeApplicationId}`,
            },
            (payload: any) => {
              if (!isMounted) return;
              const updated = payload.new;
              if (updated) {
                const newStatus = updated.status as AgentStepStatus;
                const newMissing = Array.isArray(updated.missing_fields) ? updated.missing_fields : [];
                updateStatus(newStatus, {
                  missingFields: newMissing,
                  error: updated.error_message,
                });
              }
            }
          )
          .subscribe();

        channel = newChannel;
      } catch (e) {
        console.warn("[LiveAgentTracker] Realtime setup error:", e);
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [activeApplicationId, supabase, updateStatus]);

  // Polling fallback while active
  useEffect(() => {
    if (!activeApplicationId) return;

    const isRunning = status === "checking" || status === "queued" || status === "applying";
    if (!isRunning) return;

    const interval = setInterval(async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from("job_applications")
          .select("id, status, missing_fields, error_message")
          .eq("id", activeApplicationId)
          .single();

        if (!fetchErr && data) {
          const newStatus = data.status as AgentStepStatus;
          const newMissing = Array.isArray(data.missing_fields) ? data.missing_fields : [];
          updateStatus(newStatus, {
            missingFields: newMissing,
            error: data.error_message,
          });
        }
      } catch (e) {
        console.warn("[LiveAgentTracker] Polling warning:", e);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [activeApplicationId, status, supabase, updateStatus]);

  if (!isModalOpen || !activeJob) return null;

  const handleResolveMissingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApplicationId) return;

    for (const field of missingFields) {
      if (field.required && !formValues[field.fieldKey]?.trim()) {
        toast.error(`Please provide an answer for "${field.label}"`);
        return;
      }
    }

    setIsSubmittingMissing(true);
    try {
      const res = await fetch("/api/jobs/apply/missing-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: activeApplicationId,
          missingFieldValues: formValues,
          updateResume: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit missing fields");

      updateStatus("queued");
      toast.success("Details saved! Jobvanta is continuing your application.");
    } catch (err: any) {
      toast.error(err.message || "Failed to update details");
    } finally {
      setIsSubmittingMissing(false);
    }
  };

  const handleRetry = async () => {
    if (!activeApplicationId) return;
    updateStatus("checking");
    try {
      await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: activeJob.id,
          applicationType: "automated",
          jobMetadata: {
            title: activeJob.title,
            company: activeJob.company,
            applyLink: activeJob.applyLink || activeJob.job_url,
          },
        }),
      });
      toast.success("Application restarted!");
    } catch (err) {
      toast.error("Failed to retry application");
    }
  };

  const statusMeta = getApplicationStatusMeta(status);
  const isCompleted = status === "submitted";
  const isFailed = status === "failed";
  const isNeedsInfo = status === "needs_info";
  const isActionRequired = status === "action_required";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-4 bg-gradient-to-r from-blue-50/40 via-white to-indigo-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Auto Apply Status
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${statusMeta.badgeBg} ${statusMeta.badgeText} border ${statusMeta.badgeBorder}`}>
                    {statusMeta.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {statusMeta.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={minimize}
                title="Minimize"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={closeModal}
                title="Close"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
            {/* Job Summary Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <CompanyLogo
                  logoUrl={activeJob.companyLogo || activeJob.company_logo}
                  companyName={activeJob.company}
                  size="md"
                />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                    {activeJob.title}
                  </h4>
                  <div className="text-xs text-slate-500 font-semibold truncate">
                    {activeJob.company} • {activeJob.location || "Remote"}
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {PHASES.map((phase, idx) => {
                const isPassed = currentStepIndex > idx || isCompleted;
                const isCurrent = currentStepIndex === idx && !isCompleted && !isFailed;

                return (
                  <div key={phase.id} className="space-y-1.5 text-center">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        isPassed
                          ? "bg-emerald-500"
                          : isCurrent
                          ? "bg-blue-600 animate-pulse"
                          : "bg-slate-200"
                      }`}
                    />
                    <span
                      className={`block text-[10px] font-bold truncate ${
                        isCurrent
                          ? "text-blue-600 font-black"
                          : isPassed
                          ? "text-slate-800"
                          : "text-slate-400"
                      }`}
                    >
                      {phase.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 1. Missing Information Dialog (Integrated Inline) */}
            {isNeedsInfo && missingFields.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300/90 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>We need a few details before applying</span>
                </div>

                <form onSubmit={handleResolveMissingSubmit} className="space-y-3 pt-1">
                  {missingFields.map((field) => {
                    const currentVal = formValues[field.fieldKey] || "";

                    return (
                      <div key={field.fieldKey} className="p-3 rounded-xl bg-white border border-amber-200/80 space-y-1.5">
                        <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                          <span>{field.label}</span>
                          {field.required && (
                            <span className="text-[9px] text-rose-600 font-black uppercase">Required</span>
                          )}
                        </label>

                        {field.type === "yes_no" ? (
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => setFormValues((prev) => ({ ...prev, [field.fieldKey]: "Yes" }))}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                currentVal.toLowerCase() === "yes"
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormValues((prev) => ({ ...prev, [field.fieldKey]: "No" }))}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                currentVal.toLowerCase() === "no"
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        ) : field.type === "choice" || (field.options && field.options.length > 0) ? (
                          <select
                            value={currentVal}
                            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                          >
                            <option value="">Select option...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={currentVal}
                            onChange={(e) => setFormValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                        )}
                      </div>
                    );
                  })}

                  <button
                    type="submit"
                    disabled={isSubmittingMissing}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmittingMissing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving & Continuing...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Continue Application</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 2. Action Required Banner */}
            {isActionRequired && (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-2.5">
                <div className="flex items-center gap-2 text-orange-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Action Required</span>
                </div>
                <p className="text-xs text-orange-800 leading-relaxed font-medium">
                  {error || "The employer application form requires completing a CAPTCHA or external verification."}
                </p>
                <div className="pt-1">
                  <a
                    href={activeJob.applyLink || activeJob.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    <span>Open Application Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* 3. Submitted Success Banner */}
            {isCompleted && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Application Submitted!</h4>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Your application has been verified and logged. Prepare for the interview with tailored questions:
                  </p>
                </div>
                {activeApplicationId && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        closeModal();
                        router.push(`/applications/${activeApplicationId}/prepare`);
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Prepare Me (Interview Q&A)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. Failed Banner */}
            {isFailed && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>We couldn&apos;t complete this application</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                  {error || "An unexpected error occurred during submission."}
                </p>
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Auto Apply</span>
                  </button>
                  <a
                    href={activeJob.applyLink || activeJob.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-rose-300 text-rose-800 text-xs font-bold rounded-xl hover:bg-rose-100/50 transition-colors"
                  >
                    <span>Apply Manually</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Plain Activity Feed */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Activity Log
              </span>
              <div
                ref={logContainerRef}
                className="max-h-28 overflow-y-auto rounded-xl bg-slate-50 border border-slate-200/80 p-3 font-mono text-[11px] space-y-1 text-slate-700 custom-scrollbar"
              >
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-slate-400 shrink-0">{log.timestamp}</span>
                    <span className={
                      log.type === "error" ? "text-rose-600 font-bold" :
                      log.type === "warning" ? "text-amber-700 font-bold" :
                      log.type === "success" ? "text-emerald-700 font-bold" :
                      "text-slate-700"
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
