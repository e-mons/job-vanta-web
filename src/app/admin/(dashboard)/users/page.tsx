"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Users, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Gift, 
  RotateCcw, 
  FileText, 
  Briefcase, 
  Star, 
  ShieldAlert,
  Headphones,
  SlidersHorizontal,
  Sliders
} from "lucide-react";
import type { AdminUserRecord } from "@shared/types";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Gift Plan Modal
  const [giftModalUser, setGiftModalUser] = useState<AdminUserRecord | null>(null);
  const [giftPlan, setGiftPlan] = useState<"pro" | "unlimited">("pro");
  const [giftDays, setGiftDays] = useState<number>(30);
  const [giftReason, setGiftReason] = useState<string>("");
  const [giftLoading, setGiftLoading] = useState(false);

  // Reset Usage State
  const [resettingId, setResettingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("limit", "50");

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load candidate users");
      const json = await res.json();
      setUsers(json.users || []);
    } catch (err: any) {
      setError(err.message || "Could not fetch users");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleResetLimits = async (userId: string) => {
    try {
      setResettingId(userId);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset_limits",
          userId,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reset limits");
      }

      setToastMessage("User daily applies and quota counter reset to 0.");
      fetchUsers();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to reset quota");
    } finally {
      setResettingId(null);
    }
  };

  const handleGiftPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftModalUser) return;

    try {
      setGiftLoading(true);
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "gift_plan",
          userId: giftModalUser.id,
          planId: giftPlan,
          durationDays: giftDays,
          reason: giftReason || "Admin candidate courtesy gift",
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to gift plan");
      }

      setToastMessage(`Granted ${giftPlan.toUpperCase()} plan to ${giftModalUser.fullName} for ${giftDays} days.`);
      setGiftModalUser(null);
      fetchUsers();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to grant plan");
    } finally {
      setGiftLoading(false);
    }
  };

  const totalUsers = users.length;
  const paidCount = users.filter((u) => u.isSubscriber).length;
  const totalApps = users.reduce((acc, curr) => acc + (curr.applicationsCount || 0), 0);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Candidate User Intelligence & Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Searchable candidate roster with ATS score averages, daily AI applies, and administrative quota controls.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Directory
        </button>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered Candidates</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalUsers}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Paid Subscribers in Pool</p>
            <p className="text-2xl font-black text-emerald-600 mt-1">{paidCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Job Applications Processed</p>
            <p className="text-2xl font-black text-purple-600 mt-1">{totalApps}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidates by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Candidate Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">Loading candidate directory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-xs font-semibold">{error}</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No candidate profiles found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Candidate Name</th>
                  <th className="py-3 px-4">Plan Status</th>
                  <th className="py-3 px-4">Resumes</th>
                  <th className="py-3 px-4">Avg ATS</th>
                  <th className="py-3 px-4">Total Applies</th>
                  <th className="py-3 px-4">Today Applies</th>
                  <th className="py-3 px-4">Support</th>
                  <th className="py-3 px-5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {u.fullName?.[0]?.toUpperCase() || "C"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{u.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        u.plan === "UNLIMITED"
                          ? "bg-purple-100 text-purple-800"
                          : u.plan === "PRO"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {u.plan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {u.resumesCount}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        u.avgAtsScore >= 80 
                          ? "bg-emerald-50 text-emerald-700" 
                          : u.avgAtsScore >= 60 
                          ? "bg-amber-50 text-amber-700" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {u.avgAtsScore > 0 ? `${u.avgAtsScore}%` : "—"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {u.applicationsCount}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`font-mono text-xs font-bold ${
                        u.todayAppliesCount >= 2 ? "text-amber-600" : "text-slate-600"
                      }`}>
                        {u.todayAppliesCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {u.supportTicketsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-600">
                          <Headphones className="w-3 h-3" />
                          {u.supportTicketsCount}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleResetLimits(u.id)}
                          disabled={resettingId === u.id}
                          title="Reset Today's Usage Limits"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${resettingId === u.id ? "animate-spin text-amber-600" : ""}`} />
                        </button>
                        <button
                          onClick={() => {
                            setGiftModalUser(u);
                            setGiftPlan("pro");
                            setGiftDays(30);
                            setGiftReason("");
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Gift className="w-3 h-3" />
                          <span>Gift Plan</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gift Plan Modal */}
      {giftModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Grant Courtesy Plan</h3>
              </div>
              <button
                onClick={() => setGiftModalUser(null)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <p className="text-slate-500">Target Candidate:</p>
              <p className="font-bold text-slate-900">{giftModalUser.fullName}</p>
              <p className="text-[10px] text-slate-400 font-mono">{giftModalUser.id}</p>
            </div>

            <form onSubmit={handleGiftPlanSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Plan to Gift
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGiftPlan("pro")}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                      giftPlan === "pro"
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    PRO ($29/mo tier)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGiftPlan("unlimited")}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                      giftPlan === "unlimited"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    UNLIMITED ($99/mo tier)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Access Duration
                </label>
                <select
                  value={giftDays}
                  onChange={(e) => setGiftDays(Number(e.target.value))}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                >
                  <option value={7}>7 Days (Trial Extension)</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days (1 Month Full)</option>
                  <option value={90}>90 Days (Quarter Pass)</option>
                  <option value={365}>365 Days (1 Year VIP)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Reason (Recorded in Audit Trail)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP test user, compensation for delay..."
                  value={giftReason}
                  onChange={(e) => setGiftReason(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGiftModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={giftLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                >
                  {giftLoading ? "Granting..." : "Confirm & Grant Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
