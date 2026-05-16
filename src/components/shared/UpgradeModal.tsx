"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Sparkles, Zap, ShieldCheck, Rocket, CreditCard } from "lucide-react";
import { useSubscriptionStore } from "@/store/useSubscription";
import { PLANS } from "@/config/plans";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

const FEATURES = [
  { icon: <Rocket className="w-5 h-5 text-blue-600" />, text: "Unlimited Resume Creations" },
  { icon: <Sparkles className="w-5 h-5 text-indigo-600" />, text: "AI-Powered Content Improvement" },
  { icon: <Zap className="w-5 h-5 text-amber-600" />, text: "Real-time Job Skill Matching" },
  { icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />, text: "Priority Support & Tracking" },
];

export default function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const { createCheckoutSession, isLoading } = useSubscriptionStore();
  const proPlan = PLANS.find(p => p.id === 'pro')!;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-2xl"
          >
            {/* Design Elements */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-50 rounded-full blur-[80px] pointer-events-none" />

            <div className="p-10 relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-widest mb-4">
                    <Sparkles className="w-3.5 h-3.5" />
                    Premium Experience
                  </div>
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">Upgrade to {proPlan.name}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {reason && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-700 text-sm font-medium mb-8 flex gap-3 items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  {reason}
                </div>
              )}

              <p className="text-slate-500 mb-10 leading-relaxed">
                {proPlan.description}
              </p>

              <div className="space-y-5 mb-12">
                {proPlan.features.slice(0, 4).map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                      {i === 0 && <Rocket className="w-5 h-5 text-blue-600" />}
                      {i === 1 && <Sparkles className="w-5 h-5 text-indigo-600" />}
                      {i === 2 && <Zap className="w-5 h-5 text-amber-600" />}
                      {i === 3 && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <span className="text-slate-700 font-semibold">{feature}</span>
                    <Check className="w-5 h-5 text-emerald-500 ml-auto" />
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col gap-5">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => createCheckoutSession(proPlan.priceId!)}
                  disabled={isLoading}
                  className="relative group w-full py-5 rounded-2xl bg-blue-600 text-white font-bold text-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.2)] overflow-hidden"
                >
                  {isLoading ? (
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-white" />
                      Upgrade Now — ${proPlan.price}/mo
                    </>
                  )}
                </motion.button>

                <div className="flex items-center justify-center gap-2 text-slate-400">
                  <CreditCard className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase tracking-widest">Secure Checkout with Dodo Payments</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
