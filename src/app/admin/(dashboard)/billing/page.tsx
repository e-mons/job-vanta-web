"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  CreditCard, 
  Search, 
  Filter, 
  RefreshCw, 
  Gift, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Clock, 
  User, 
  ShieldCheck,
  Calendar,
  DollarSign
} from "lucide-react";
import type { AdminSubscriptionRecord } from "@shared/types";

export default function AdminBillingPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Override Modal
  const [selectedSub, setSelectedSub] = useState<AdminSubscriptionRecord | null>(null);
  const [overridePlan, setOverridePlan] = useState<"free" | "pro" | "unlimited">("pro");
  const [overrideStatus, setOverrideStatus] = useState<"active" | "canceled" | "past_due">("active");
  const [overrideDays, setOverrideDays] = useState<number>(30);
  const [overrideReason, setOverrideReason] = useState("");
  const [submittingOverride, setSubmittingOverride] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search.trim()) params.set("search", search.trim());

      const res = await fetch(`/api/admin/billing/subscriptions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load subscriptions");
      const json = await res.json();
      setSubscriptions(json.subscriptions || []);
    } catch (err: any) {
      setError(err.message || "Could not load subscriptions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleOpenOverride = (sub: AdminSubscriptionRecord) => {
    setSelectedSub(sub);
    const plan = sub.planId.toLowerCase();
    if (plan.includes("unlimited")) {
      setOverridePlan("unlimited");
    } else if (plan.includes("pro")) {
      setOverridePlan("pro");
    } else {
      setOverridePlan("free");
    }
    setOverrideStatus((sub.status as any) || "active");
    setOverrideDays(30);
    setOverrideReason("");
  };

  const handleApplyOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      setSubmittingOverride(true);
      const res = await fetch("/api/admin/billing/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedSub.userId,
          planId: overridePlan,
          status: overrideStatus,
          durationDays: overrideDays,
          reason: overrideReason || "Manual super admin tier override",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to override subscription");
      }

      setSuccessToast(`Successfully updated subscription for ${selectedSub.userEmail} to ${overridePlan.toUpperCase()}.`);
      setSelectedSub(null);
      fetchSubscriptions();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to update subscription");
    } finally {
      setSubmittingOverride(false);
    }
  };

  // Stats calculation
  const totalActive = subscriptions.filter(s => s.status === "active").length;
  const totalPastDue = subscriptions.filter(s => s.status === "past_due").length;
  const mrrTotal = subscriptions
    .filter(s => s.status === "active")
    .reduce((acc, curr) => acc + (curr.amountMonthly || (curr.planId === "unlimited" ? 99 : 29)), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscriptions & Revenue Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time subscriber roster, payment provider status, and administrative tier overrides.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Ledger
        </button>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Active Subscribers</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalActive}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Calculated MRR</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">${mrrTotal.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Past Due / Failed</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{totalPastDue}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="past_due">Past Due (Delinquent)</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Loading subscriptions ledger...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs font-semibold">{error}</div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No subscriptions matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Customer Profile</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Price / Mo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Period End</th>
                  <th className="py-3 px-4">Provider Ref</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{sub.userName || sub.userEmail}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{sub.userId.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                        sub.planId === "unlimited" 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-blue-100 text-blue-800"
                      }`}>
                        {sub.planId?.toUpperCase() || "PRO"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-black text-slate-900">
                      ${sub.amountMonthly}/mo
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        sub.status === "active" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : sub.status === "past_due"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          sub.status === "active" ? "bg-emerald-500" : sub.status === "past_due" ? "bg-red-500" : "bg-slate-400"
                        }`} />
                        {sub.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "N/A"}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[10px]">
                      {sub.dodoSubscriptionId || sub.dodoPaymentId || "manual_grant"}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleOpenOverride(sub)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Override Tier</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Tier Override Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Manual Subscription Override</h3>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <p className="text-slate-500">Target User:</p>
              <p className="font-bold text-slate-900">{selectedSub.userName || selectedSub.userEmail}</p>
              <p className="text-[10px] text-slate-400 font-mono">{selectedSub.userId}</p>
            </div>

            <form onSubmit={handleApplyOverride} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Assign Plan Tier
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["free", "pro", "unlimited"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setOverridePlan(p)}
                      className={`py-2 px-3 rounded-xl font-bold text-xs capitalize transition-all cursor-pointer border ${
                        overridePlan === p
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value as any)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="canceled">Canceled</option>
                    <option value="past_due">Past Due</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Duration (Days)
                  </label>
                  <select
                    value={overrideDays}
                    onChange={(e) => setOverrideDays(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                  >
                    <option value={14}>14 Days</option>
                    <option value={30}>30 Days (1 Month)</option>
                    <option value={90}>90 Days (Quarter)</option>
                    <option value={365}>365 Days (1 Year)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Reason for Override (Audit Log)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP goodwill grant, support resolution..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                >
                  {submittingOverride ? "Applying..." : "Save Override"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
