"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, CheckCircle2, Lock, Clock, AlertTriangle, ArrowRight } from "lucide-react";
import type { ApplicationMemory } from "@shared/types/qa";

interface QAWhatYouSentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  memory: ApplicationMemory | null;
  jobTitle?: string;
  companyName?: string;
}

export default function QAWhatYouSentDrawer({
  isOpen,
  onClose,
  memory,
  jobTitle,
  companyName,
}: QAWhatYouSentDrawerProps) {
  if (!isOpen) return null;

  const appTruth = memory?.applicationTruth;
  const careerTruth = memory?.careerTruth;
  const divergences = memory?.divergences;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-screen max-w-xl bg-white shadow-2xl flex flex-col h-full border-l border-slate-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">What You Submitted</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Immutable snapshot attached to this application
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Notice Banner */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-3">
                <Lock className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-900 leading-relaxed">
                  This shows the exact information sent to <span className="font-bold">{companyName || "the employer"}</span> at the time of application. Updating your live profile never changes what this employer received.
                </p>
              </div>

              {/* Submitted Resume Info */}
              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Submitted Resume</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Frozen Snapshot
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-100 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Resume Title</span>
                    <span className="font-bold text-slate-900 text-sm">{appTruth?.submittedResumeTitle || "Standard Application Resume"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Submitted Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {appTruth?.submittedSkills && appTruth.submittedSkills.length > 0 ? (
                        appTruth.submittedSkills.map((skill, idx) => (
                          <span key={idx} className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">No explicit skills listed</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Calculated Experience</span>
                    <span className="font-bold text-slate-900 text-sm">{appTruth?.submittedExperienceYears || 0} years verified</span>
                  </div>
                </div>
              </div>

              {/* Stated Logistics & Answers */}
              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Stated Logistics & Application Answers
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Salary Expectation</span>
                    <span className="text-xs font-bold text-slate-800">{appTruth?.statedSalaryExpectation || "Not specified"}</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Notice Period</span>
                    <span className="text-xs font-bold text-slate-800">{appTruth?.statedNoticePeriod || "Immediate / Standard"}</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Work Authorization</span>
                    <span className="text-xs font-bold text-slate-800">{appTruth?.statedWorkAuthorization || "Authorized"}</span>
                  </div>

                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Availability</span>
                    <span className="text-xs font-bold text-slate-800">{appTruth?.statedAvailability || "Standard"}</span>
                  </div>
                </div>

                {appTruth?.submittedApplicationAnswers && Object.keys(appTruth.submittedApplicationAnswers).length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3 mt-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Written Questions</span>
                    {Object.entries(appTruth.submittedApplicationAnswers).map(([k, v], idx) => (
                      <div key={idx} className="border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                        <span className="text-xs font-bold text-slate-700 capitalize block">{k.replace(/_/g, " ")}:</span>
                        <span className="text-xs text-slate-600 leading-relaxed">{v}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Profile Divergences (if live profile changed) */}
              {divergences && (divergences.newSkillsAddedSinceSubmission.length > 0 || divergences.experienceYearsDiff > 0) && (
                <div className="bg-amber-50/60 border border-amber-200/80 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Profile Updates Since Applying</span>
                  </div>

                  <div className="text-xs text-amber-800 space-y-1.5 leading-relaxed">
                    {divergences.experienceYearsDiff > 0 && (
                      <p>
                        • Your current profile reflects <span className="font-bold">{careerTruth?.currentExperienceYears} years</span> of experience (+{divergences.experienceYearsDiff} yr since applying).
                      </p>
                    )}
                    {divergences.newSkillsAddedSinceSubmission.length > 0 && (
                      <p>
                        • New skills added to profile: <span className="font-semibold">{divergences.newSkillsAddedSinceSubmission.join(", ")}</span>.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
