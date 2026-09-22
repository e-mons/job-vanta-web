"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Sparkles, 
  Zap, 
  CreditCard, 
  ShieldAlert, 
  RefreshCw, 
  ArrowUpRight, 
  Gift, 
  CheckCircle2, 
  Tag, 
  Sliders,
  Calendar,
  Activity
} from "lucide-react";
import type { ExecutiveFinancialOverview } from "@shared/types";

export default function AdminExecutiveDashboard() {
  const [data, setData] = useState<ExecutiveFinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [giftingUserId, setGiftingUserId] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/financial/overview");
      if (!res.ok) {
        throw new Error("Failed to load financial telemetry");
      }
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleQuickGift = async (userId: string) => {
    try {
      setGiftingUserId(userId);
      const res = await fetch("/api/admin/billing/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planId: "pro",
          status: "active",
          durationDays: 30,
          reason: "Paywall conversion gift from Executive Hub",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to gift subscription");
      }

      setActionSuccess(`Successfully granted 30-Day Pro subscription to user.`);
      setTimeout(() => setActionSuccess(null), 4000);
      fetchOverview();
    } catch (err: any) {
      alert(err.message || "Failed to grant plan");
    } finally {
      setGiftingUserId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium text-sm">Aggregating real-time financial telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <ShieldAlert className="w-10 h-10 text-red-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-red-900 mb-1">Financial Ledger Error</h2>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0d1b2e] to-blue-950 p-6 md:p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Live Financial & Telemetry Pulse
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Commercial Executive Hub
          </h1>
          <p className="text-xs md:text-sm text-slate-300">
            Real-time MRR, ARR, Gemini AI token burn margin, and high-conversion candidate leads.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/billing"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Manage Billing
          </Link>
        </div>
      </div>

      {actionSuccess && (
        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4 Key Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Recurring</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            ${data?.mrr?.toLocaleString() || 0}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>ARR Run-Rate</span>
            <span className="font-bold text-emerald-600">${data?.arr?.toLocaleString() || 0}/yr</span>
          </div>
        </div>

        {/* AI Margin */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net AI Margin</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {data?.netProfitMargin !== undefined ? `${data.netProfitMargin}%` : "—"}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Real AI Cost</span>
            <span className="font-bold text-slate-700">${data?.totalAiCostThisMonth ?? "0.00"}</span>
          </div>
        </div>

        {/* Subscribers */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paid Subscribers</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {data?.activeSubscribersCount || 0}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Pro vs Unlimited</span>
            <span className="font-bold text-purple-700">
              {data?.proCount || 0} Pro · {data?.unlimitedCount || 0} Unl
            </span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Free to Paid Conv.</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {data?.conversionRate || 0}%
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Free Candidates</span>
            <span className="font-bold text-slate-700">{data?.freeUsersCount || 0} pool</span>
          </div>
        </div>
      </div>

      {/* Paywall Hitters Radar (High Intent Users Ready to Convert) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">
                Paywall Hitters Radar (High-Intent Candidates)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Active candidates who hit their daily 2 AI applies quota today. High probability conversion targets.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            <span>View Full Directory</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {(!data?.paywallHitters || data.paywallHitters.length === 0) ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Paywall Limits Reached Today</p>
            <p className="text-xs text-slate-500 mt-1">
              Candidates are operating comfortably within free allowances or are already upgraded to Pro/Unlimited.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="py-3 px-4">Candidate Lead</th>
                  <th className="py-3 px-4">Today Applies</th>
                  <th className="py-3 px-4">Resumes Saved</th>
                  <th className="py-3 px-4">Last Activity</th>
                  <th className="py-3 px-4 text-right">Quick Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.paywallHitters.map((hitter) => (
                  <tr key={hitter.userId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                          {hitter.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{hitter.email}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{hitter.userId.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        {hitter.appliesCount} applies (Limit Reached)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {hitter.resumesCount} CVs
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(hitter.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleQuickGift(hitter.userId)}
                        disabled={giftingUserId === hitter.userId}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        {giftingUserId === hitter.userId ? "Granting..." : "Gift 30-Day Pro"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Financial Breakdown & Quick Admin Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Velocity */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900">Revenue Velocity</h3>
            <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              Healthy
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Gross Revenue (Today)</span>
              <span className="font-bold text-slate-900">${data?.grossRevenueToday || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Gross Revenue (This Month)</span>
              <span className="font-bold text-slate-900">${data?.grossRevenueThisMonth || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Gemini 2.0 Flash AI Overheads</span>
              <span className="font-bold text-red-600">-${data?.totalAiCostThisMonth || 0}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-900 font-bold">Estimated Net Profit</span>
              <span className="font-black text-emerald-600 text-sm">
                ${Math.max(0, (data?.grossRevenueThisMonth || 0) - (data?.totalAiCostThisMonth || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick System Action Controls */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-[#111c2e] text-white rounded-3xl p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-sm text-white">Owner Operational Controls</h3>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">SuperAdmin Level</span>
          </div>

          <p className="text-xs text-slate-300">
            Quick links to control monetization limits, generate promo codes, and manage subscriptions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Link
              href="/admin/promos"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                <Tag className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Promo Discounts</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Create coupon codes</p>
              </div>
            </Link>

            <Link
              href="/admin/ai-costs"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                <Sliders className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">System Quotas</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Adjust free & pro caps</p>
              </div>
            </Link>

            <Link
              href="/admin/billing"
              className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col justify-between group"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className="font-bold text-xs text-white">Manual Tier Grants</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Gift or override plans</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transactions Roster */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Customer Subscriptions</h2>
            <p className="text-xs text-slate-500">Live payment and subscription activation feed</p>
          </div>
          <Link
            href="/admin/billing"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            View All Subscriptions →
          </Link>
        </div>

        {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
          <p className="text-xs text-slate-500 py-4 text-center">No subscriptions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Tier</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-800">{tx.userEmail}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {tx.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">${tx.amount}/mo</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        tx.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
