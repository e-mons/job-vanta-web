"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, CheckCircle2, Bot, FileText, Search, ShieldCheck } from "lucide-react";

interface QAGenerationLoadingProps {
  jobTitle?: string;
  companyName?: string;
}

const LOADING_STEPS = [
  { text: "Reading the job requirements & key responsibilities", icon: Search },
  { text: "Checking your submitted resume & career achievements", icon: FileText },
  { text: "Matching your strongest real evidence to the role", icon: ShieldCheck },
  { text: "Identifying the questions interviewers are most likely to ask", icon: Bot },
  { text: "Verifying talking points with Truth Lock for consistency", icon: Sparkles },
];

export default function QAGenerationLoading({
  jobTitle = "your role",
  companyName = "this company",
}: QAGenerationLoadingProps) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = LOADING_STEPS[stepIndex].icon;

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
      {/* Animated Orb & Icon */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-400 p-0.5 shadow-2xl shadow-blue-500/25 animate-pulse">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
            <CurrentIcon className="w-10 h-10 text-blue-600 animate-bounce" />
          </div>
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Main Title */}
      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
        Preparing your job-specific questions
      </h2>
      <p className="text-slate-500 font-medium text-sm sm:text-base mb-8">
        Building role-tailored interview preparation for <span className="font-bold text-slate-800">{jobTitle}</span> at <span className="font-bold text-blue-600">{companyName}</span>.
      </p>

      {/* Step Progression */}
      <div className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm">
        <div className="space-y-4 text-left">
          {LOADING_STEPS.map((step, idx) => {
            const isDone = idx < stepIndex;
            const isCurrent = idx === stepIndex;
            const StepIcon = step.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0.4 }}
                animate={{
                  opacity: isCurrent ? 1 : isDone ? 0.7 : 0.3,
                  scale: isCurrent ? 1.02 : 1,
                }}
                className={`flex items-center gap-3.5 p-3 rounded-2xl transition-all ${
                  isCurrent ? "bg-white border border-blue-100 shadow-sm" : ""
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white animate-pulse"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <StepIcon className="w-3.5 h-3.5" />}
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold ${
                    isCurrent
                      ? "text-blue-900 font-bold"
                      : isDone
                      ? "text-slate-700 line-through opacity-75"
                      : "text-slate-400"
                  }`}
                >
                  {step.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-slate-400 font-medium mt-6">
        This takes just a few seconds. Your progress is saved automatically.
      </p>
    </div>
  );
}
