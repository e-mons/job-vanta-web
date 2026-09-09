"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Rocket, 
  CreditCard,
  Crown,
  Lock,
  ArrowRight,
  Infinity as InfinityIcon,
  MessageSquareCheck
} from "lucide-react";
import { useSubscriptionStore } from "@/store/useSubscription";
import { PLANS } from "@/config/plans";

export type UpgradeTargetTier = 'pro' | 'unlimited' | 'enterprise';
export type FeatureContext = 'resume_limit' | 'ai_apply_limit' | 'prepare_me' | 'general';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
  targetTier?: UpgradeTargetTier;
  featureContext?: FeatureContext;
}

export default function UpgradeModal({ 
  isOpen, 
  onClose, 
  reason, 
  targetTier = 'pro',
  featureContext = 'general'
}: UpgradeModalProps) {
  const { createCheckoutSession, isLoading } = useSubscriptionStore();
  
  // Normalize target tier (map enterprise to unlimited)
  const normalizedTier = (targetTier === 'enterprise' ? 'unlimited' : targetTier) as 'pro' | 'unlimited';
  const targetPlan = PLANS.find(p => p.id === normalizedTier) || PLANS[1]; // default to Pro

  // Contextual messaging
  const getContextualHeadline = () => {
    switch (featureContext) {
      case 'resume_limit':
        return normalizedTier === 'pro' 
          ? "Unlock More Resumes with Pro"
          : "Create Unlimited Resumes without Limits";
      case 'ai_apply_limit':
        return normalizedTier === 'pro'
          ? "Expand to 25 AI Applies Daily"
          : "Unlock Unlimited AI Job Applies";
      case 'prepare_me':
        return "Unlock Prepare Me Interview Intelligence";
      default:
        return `Accelerate Your Career with ${targetPlan.name}`;
    }
  };

  const getContextualSubhead = () => {
    switch (featureContext) {
      case 'resume_limit':
        return normalizedTier === 'pro'
          ? "The Free plan includes 1 resume. Upgrade to Pro to create up to 5 resumes, tailor for multiple roles, and unlock interview prep."
          : "You've reached the 5-resume Pro limit. Upgrade to Unlimited for unrestricted resume creations and continuous role tailoring.";
      case 'ai_apply_limit':
        return normalizedTier === 'pro'
          ? "You've completed your 2 daily Free AI applications. Upgrade to Pro for 25 AI applications every single day!"
          : "You've reached the 25 daily AI application limit. Upgrade to Unlimited for truly limitless daily job applications!";
      case 'prepare_me':
        return "Prepare Me is exclusively available on Pro and Unlimited plans. Get job-specific predicted questions, STAR delivery coaching, and risk radar analysis.";
      default:
        return targetPlan.description;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white border border-slate-200/80 rounded-[36px] overflow-hidden shadow-2xl my-8 z-10"
          >
            {/* Top Accent Gradient */}
            <div className={`h-2 w-full bg-gradient-to-r ${
              normalizedTier === 'unlimited'
                ? 'from-purple-600 via-pink-600 to-amber-500'
                : 'from-blue-600 via-indigo-600 to-cyan-500'
            }`} />

            {/* Glowing ambient orbs */}
            <div className={`absolute -top-24 -right-24 w-60 h-60 rounded-full blur-[90px] pointer-events-none ${
              normalizedTier === 'unlimited' ? 'bg-purple-200/60' : 'bg-blue-200/60'
            }`} />
            <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-200/40 rounded-full blur-[90px] pointer-events-none" />

            <div className="p-6 sm:p-8 relative z-10">
              {/* Header Row */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-3.5 border ${
                    normalizedTier === 'unlimited'
                      ? 'bg-purple-50 text-purple-700 border-purple-200/60'
                      : 'bg-blue-50 text-blue-700 border-blue-200/60'
                  }`}>
                    {normalizedTier === 'unlimited' ? (
                      <Crown className="w-3.5 h-3.5 text-purple-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    {normalizedTier === 'unlimited' ? 'Unlimited Career Tier' : 'Recommended Upgrade'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
                    {getContextualHeadline()}
                  </h2>
                </div>

                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reason / Prompt Box */}
              {reason && (
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs sm:text-sm font-semibold mb-6 flex gap-3 items-center shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                  <span>{reason}</span>
                </div>
              )}

              {/* Subhead narrative */}
              <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                {getContextualSubhead()}
              </p>

              {/* Quick Comparison Card */}
              <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
                  Included in {targetPlan.name} Plan:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-blue-100/80 flex items-center justify-center shrink-0">
                      <Rocket className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {normalizedTier === 'unlimited' ? 'Unlimited Resumes' : '5 Resumes / CVs'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-indigo-100/80 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      {normalizedTier === 'unlimited' ? 'Unlimited AI Applies' : '25 AI Applies / day'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 sm:col-span-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-100/80 flex items-center justify-center shrink-0">
                      <MessageSquareCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Prepare Me: Full Job-Specific AI Q&A Unlocked
                    </span>
                  </div>
                </div>
              </div>

              {/* Plan Features Checklist */}
              <div className="space-y-3 mb-8">
                {targetPlan.features.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Actions & Checkout Button */}
              <div className="flex flex-col gap-3.5">
                <button
                  disabled={isLoading || !targetPlan.priceId}
                  onClick={() => createCheckoutSession(targetPlan.priceId!)}
                  className={`w-full flex items-center justify-center gap-3 py-4 sm:py-4.5 rounded-2xl font-black text-base sm:text-lg text-white shadow-xl transition-all active:scale-[0.99] disabled:opacity-50 ${
                    normalizedTier === 'unlimited'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/30'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/30'
                  }`}
                >
                  {isLoading ? (
                    <span className="animate-pulse flex items-center gap-2">
                      <Sparkles className="w-5 h-5 animate-spin" /> Redirecting to Checkout...
                    </span>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      <span>Upgrade to {targetPlan.name} (${targetPlan.price}/mo)</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Cancel anytime • Secure checkout powered by Dodo Payments</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
