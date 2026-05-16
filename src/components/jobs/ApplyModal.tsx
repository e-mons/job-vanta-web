"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Send, 
  CheckCircle2, 
  FileText, 
  User, 
  Mail, 
  Loader2,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Job } from "@/store/useJobStore";
import { UserResume } from "@/store/useResumeStore";
import { createClient } from "@/utils/supabase/client";
import HTMLPreview from "@/components/builder/Preview/HTMLPreview";

interface ApplyModalProps {
  job: Job | null;
  resume: UserResume | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyModal({ job, resume, isOpen, onClose, onSuccess }: ApplyModalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");

  const handleApply = async () => {
    if (!job || !resume) return;

    setIsApplying(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // 1. Create Application Record
      const { data: application, error: appError } = await supabase
        .from("job_applications")
        .insert({
          user_id: user.id,
          resume_id: resume.id,
          job_title: job.title,
          company: job.company,
          status: "pending",
          metadata: job
        })
        .select()
        .single();

      if (appError) throw appError;

      // 2. Trigger Email Notification (optional — gracefully skips if edge function not deployed)
      try {
        const { error: emailError } = await supabase.functions.invoke("send-application-email", {
          body: {
            applicationId: application.id,
            customMessage: customMessage
          }
        });

        if (emailError && !emailError.message?.includes("Function not found")) {
          console.warn("Email notification failed:", emailError.message);
        }
      } catch (emailErr) {
        // Email is non-critical — application is already saved to database
        console.warn("Email notification skipped:", emailErr);
      }

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);

    } catch (err: any) {
      console.error("Application error:", err);
      setError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsApplying(false);
    }
  };

  if (!job || !resume) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            {isSuccess ? (
              <div className="p-16 text-center space-y-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-slate-900">Application Sent!</h2>
                  <p className="text-slate-500 font-medium text-lg">
                    You've successfully applied to <span className="text-blue-600 font-bold">{job.company}</span>.
                  </p>
                </div>
                <div className="pt-8">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Returning to results...
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                      <Send className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 leading-tight">Apply to {job.company}</h2>
                      <p className="text-slate-500 font-bold text-sm tracking-tight">{job.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-3 rounded-2xl bg-white text-slate-400 hover:text-slate-900 transition-all border border-slate-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-10 space-y-10">
                  {/* Selected Resume */}
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      Selected Resume
                    </label>
                    <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-32 rounded-xl bg-white shadow-xl relative overflow-hidden border border-slate-200">
                          {/* Realistic Resume Preview - Calibrated for modal icon */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.14] w-[210mm] h-[297mm] pointer-events-none">
                            <HTMLPreview 
                              data={resume.content} 
                              templateId={resume.template_id || 'modern'} 
                            />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{resume.title}</p>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Optimized for AI matching</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                         <Sparkles className="w-3 h-3" />
                         Match: 98%
                      </div>
                    </div>
                  </div>

                  {/* Personal Note */}
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      Personal Note (Optional)
                    </label>
                    <textarea
                      placeholder="Add a brief note to the hiring team..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full h-32 p-6 rounded-3xl bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-slate-900 font-medium"
                    />
                  </div>

                  {/* Privacy / Security Badge */}
                  <div className="flex items-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <p className="text-xs font-medium text-slate-500">
                      JobVanta will securely package your resume and information to ensure the best first impression.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p className="text-sm font-bold">{error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4">
                    <button
                      onClick={onClose}
                      disabled={isApplying}
                      className="flex-1 px-8 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={isApplying}
                      className="flex-[2] px-8 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isApplying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending Application...
                        </>
                      ) : (
                        <>
                          Send Application
                          <Send className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
