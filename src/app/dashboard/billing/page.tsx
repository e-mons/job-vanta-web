"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  CreditCard, 
  Sparkles, 
  Check, 
  Zap, 
  Crown, 
  Shield, 
  AlertCircle, 
  ArrowUpRight, 
  RefreshCw, 
  Calendar, 
  FileText, 
  Send, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  HelpCircle,
  Clock
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useSubscriptionStore, UserDailyUsage } from "@/store/useSubscription";
import { PLANS } from "@/config/plans";
import { toast } from "sonner";
import UpgradeModal from "@/components/shared/UpgradeModal";

export default function BillingPage() {
  const { 
    status, 
    planId, 
    currentPeriodEnd, 
    usage, 
    fetchSubscription, 
    fetchUsage, 
    createCheckoutSession, 
    openCustomerPortal, 
    getPlanTier, 
    isLoading 
  } = useSubscriptionStore();

  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<'pro' | 'unlimited'>('pro');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSubscription();
      await fetchUsage();
      toast.success("Subscription and usage refreshed!");
    } catch {
      toast.error("Failed to refresh usage");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenPortal = async () => {
    setIsOpeningPortal(true);
    try {
      await openCustomerPortal();
    } catch (err: any) {
      toast.error(err.message || "Could not open customer portal. You might not have an active billing profile.");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const currentTier = getPlanTier();
  const currentPlan = PLANS.find(p => p.id === currentTier) || PLANS[0];

  const resumesCreated = usage?.usage?.resumesCreated ?? 0;
  const resumesLimit = usage?.limits?.resumes ?? (currentTier === 'unlimited' ? 'unlimited' : currentTier === 'pro' ? 5 : 1);
  const resumesRemaining = usage?.usage?.resumesRemaining ?? (typeof resumesLimit === 'number' ? Math.max(0, resumesLimit - resumesCreated) : 'unlimited');

  const appliesUsed = usage?.usage?.aiAppliesUsedToday ?? 0;
  const appliesLimit = usage?.limits?.dailyAIApplies ?? (currentTier === 'unlimited' ? 'unlimited' : currentTier === 'pro' ? 25 : 2);
  const appliesRemaining = usage?.usage?.aiAppliesRemainingToday ?? (typeof appliesLimit === 'number' ? Math.max(0, appliesLimit - appliesUsed) : 'unlimited');

  const isUnlimitedPlan = currentTier === 'unlimited';

  const scrollToPlans = () => {
    const el = document.getElementById("available-plans-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 max-w-7xl mx-auto space-y-12 pb-24">
        {/* Page Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Billing & Subscription</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Manage Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Plan & Usage</span>
            </h1>
            <p className="text-slate-500 text-sm sm:text-base font-medium mt-1">
              Real-time daily usage quotas, subscription tier controls, and payment management.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Quotas</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: Current Plan */}
        {/* ========================================================================= */}
        <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-8 sm:p-10 text-white shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  currentTier === 'unlimited' 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                    : currentTier === 'pro'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                    : 'bg-white/10'
                }`}>
                  {currentTier === 'unlimited' ? (
                    <Crown className="w-7 h-7 text-white" />
                  ) : currentTier === 'pro' ? (
                    <Zap className="w-7 h-7 text-white" />
                  ) : (
                    <Shield className="w-7 h-7 text-slate-300" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black uppercase tracking-[0.25em] text-blue-400">
                      Active Subscription
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : status === 'trialing'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                    }`}>
                      {status === 'none' ? 'Free Tier' : status.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
                    {currentPlan.name} Plan
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentTier === 'free' ? (
                  <button
                    onClick={() => {
                      setUpgradeTargetTier('pro');
                      setIsUpgradeModalOpen(true);
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Upgrade to Pro</span>
                  </button>
                ) : currentTier === 'pro' ? (
                  <button
                    onClick={() => {
                      setUpgradeTargetTier('unlimited');
                      setIsUpgradeModalOpen(true);
                    }}
                    className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Unlimited</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-black">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span>Highest Tier Active</span>
                  </div>
                )}
              </div>
            </div>

            {/* Plan Limits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Resume / CV Limit</p>
                <p className="text-xl font-black text-white">
                  {currentTier === 'unlimited' ? 'Unlimited Resumes' : currentTier === 'pro' ? '5 Resumes max' : '1 Resume max'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Daily AI Applies</p>
                <p className="text-xl font-black text-white">
                  {currentTier === 'unlimited' ? 'Unlimited / day' : currentTier === 'pro' ? '25 Applies / day' : '2 Applies / day'}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Prepare Me (AI Q&A)</p>
                <p className={`text-xl font-black ${currentTier === 'free' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {currentTier === 'free' ? 'Locked (Requires Pro)' : 'Unlocked & Active'}
                </p>
              </div>
            </div>

            {currentPeriodEnd && (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Next billing date: {new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: Usage Information */}
        {/* ========================================================================= */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <span>Usage Information</span>
                {isUnlimitedPlan && (
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-purple-500/20">
                    Unlimited usage
                  </span>
                )}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Monitor your real-time consumption against your active plan's boundaries.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Daily limits reset every day at 00:00 UTC</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resumes Meter */}
            <div className="p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-xl shadow-slate-100/60 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Resumes / CVs Created</h3>
                    <p className="text-xs font-medium text-slate-500">Total documents active in your workspace</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">
                    {resumesCreated}
                    <span className="text-sm text-slate-400 font-bold">
                      {typeof resumesLimit === 'number' ? ` / ${resumesLimit}` : ' (Unlimited)'}
                    </span>
                  </p>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {isUnlimitedPlan 
                      ? 'Unlimited usage' 
                      : `${resumesRemaining} remaining`}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: isUnlimitedPlan 
                        ? '100%' 
                        : `${Math.min(100, (resumesCreated / (typeof resumesLimit === 'number' ? resumesLimit : 1)) * 100)}%` 
                    }}
                    className={`h-full rounded-full ${
                      isUnlimitedPlan 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500' 
                        : (resumesRemaining === 0 ? 'bg-rose-500' : 'bg-blue-600')
                    }`}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>{resumesCreated} created</span>
                  <span>{isUnlimitedPlan ? 'No maximum' : `${resumesRemaining} slots available`}</span>
                </div>
              </div>

              {/* Notice if limit reached */}
              {!isUnlimitedPlan && resumesRemaining === 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
                  <span>Resume limit reached for {currentPlan.name} plan.</span>
                  <button 
                    onClick={() => {
                      setUpgradeTargetTier(currentTier === 'free' ? 'pro' : 'unlimited');
                      setIsUpgradeModalOpen(true);
                    }}
                    className="underline text-amber-950 font-black hover:opacity-80"
                  >
                    Upgrade now
                  </button>
                </div>
              )}
            </div>

            {/* AI Job Applies Meter */}
            <div className="p-8 rounded-[32px] bg-white border border-slate-200/80 shadow-xl shadow-slate-100/60 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Send className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">AI Job Applies Today</h3>
                    <p className="text-xs font-medium text-slate-500">Automated Browserbase agent submissions</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-black text-slate-900">
                    {appliesUsed}
                    <span className="text-sm text-slate-400 font-bold">
                      {typeof appliesLimit === 'number' ? ` / ${appliesLimit}` : ' (Unlimited)'}
                    </span>
                  </p>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {isUnlimitedPlan 
                      ? 'Unlimited usage' 
                      : `${appliesRemaining} left today`}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: isUnlimitedPlan 
                        ? '100%' 
                        : `${Math.min(100, (appliesUsed / (typeof appliesLimit === 'number' ? appliesLimit : 1)) * 100)}%` 
                    }}
                    className={`h-full rounded-full ${
                      isUnlimitedPlan 
                        ? 'bg-gradient-to-r from-purple-500 to-indigo-500' 
                        : (appliesRemaining === 0 ? 'bg-rose-500' : 'bg-indigo-600')
                    }`}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>{appliesUsed} used today</span>
                  <span>{isUnlimitedPlan ? 'Unlimited daily capacity' : `${appliesRemaining} remaining today`}</span>
                </div>
              </div>

              {/* Notice if limit reached */}
              {!isUnlimitedPlan && appliesRemaining === 0 && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between">
                  <span>Daily apply quota reached for {currentPlan.name}.</span>
                  <button 
                    onClick={() => {
                      setUpgradeTargetTier(currentTier === 'free' ? 'pro' : 'unlimited');
                      setIsUpgradeModalOpen(true);
                    }}
                    className="underline text-amber-950 font-black hover:opacity-80"
                  >
                    Upgrade now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: Manage Subscription */}
        {/* ========================================================================= */}
        <div className="p-8 sm:p-10 rounded-[32px] bg-slate-50 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manage Subscription</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">
                Access payment invoices, update your payment card, or modify your subscription tier.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {currentTier !== 'free' && (
                <button
                  onClick={handleOpenPortal}
                  disabled={isOpeningPortal}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isOpeningPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Opening Billing Portal...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Open Dodo Billing Portal</span>
                      <ExternalLink className="w-3.5 h-3.5 ml-0.5 text-slate-400" />
                    </>
                  )}
                </button>
              )}

              <button
                onClick={scrollToPlans}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm transition-all active:scale-95"
              >
                <span>Change or Upgrade Plan</span>
                <ArrowUpRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Secure Invoicing via Dodo Payments</p>
                <p className="text-xs text-slate-500">Download official tax invoices, receipts, and view payment history.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Seamless Plan Upgrades</p>
                <p className="text-xs text-slate-500">Upgrade at any time. Prorated credits are automatically calculated.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: Available Plans */}
        {/* ========================================================================= */}
        <div id="available-plans-section" className="space-y-8 pt-4">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Available Plans
            </h2>
            <p className="text-sm sm:text-base font-medium text-slate-500">
              Select the right plan for your career velocity. Subscribe or switch tiers with one click.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {PLANS.map((plan) => {
              const isCurrent = currentTier === plan.id;
              const isPro = plan.id === 'pro';
              const isUnlimited = plan.id === 'unlimited';

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-[36px] p-8 sm:p-10 flex flex-col justify-between transition-all duration-300 ${
                    isCurrent
                      ? 'bg-white border-2 border-blue-600 shadow-2xl shadow-blue-500/10'
                      : isPro
                      ? 'bg-white border-2 border-slate-300 hover:border-blue-400 shadow-xl shadow-slate-200/50'
                      : 'bg-white border border-slate-200 hover:border-slate-300 shadow-lg shadow-slate-100'
                  }`}
                >
                  {/* Badge */}
                  {isCurrent && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                      Current Plan
                    </div>
                  )}

                  {!isCurrent && isPro && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                      Most Popular
                    </div>
                  )}

                  {!isCurrent && isUnlimited && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-black uppercase tracking-widest shadow-md">
                      Zero Limits
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="mb-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                        isUnlimited ? 'bg-purple-50 text-purple-600' : isPro ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isUnlimited ? <Crown className="w-6 h-6" /> : isPro ? <Zap className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">{plan.name}</h3>
                      <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 min-h-[40px] leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-8 flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-slate-900">
                        ${plan.price}
                      </span>
                      <span className="text-slate-400 font-bold text-sm">/month</span>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3.5 mb-8">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-700 leading-snug">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div>
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-4 rounded-2xl bg-slate-100 text-slate-400 font-black text-sm cursor-default"
                      >
                        Active Plan
                      </button>
                    ) : plan.priceId ? (
                      <button
                        disabled={isLoading}
                        onClick={() => createCheckoutSession(plan.priceId!)}
                        className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
                          isUnlimited
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-purple-600/20'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/20'
                        }`}
                      >
                        {isLoading ? "Processing..." : `Subscribe to ${plan.name}`}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-4 rounded-2xl bg-slate-100 text-slate-600 font-black text-sm"
                      >
                        Default Free
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          targetTier={upgradeTargetTier}
        />
      </div>
    </DashboardLayout>
  );
}
