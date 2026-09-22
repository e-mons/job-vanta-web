"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Cpu, 
  Sparkles, 
  DollarSign, 
  Sliders, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  AlertTriangle,
  Zap,
  TrendingDown,
  Info
} from "lucide-react";
import type { AICostTelemetry, SystemQuotas } from "@shared/types";

export default function AdminAICostsPage() {
  const [telemetry, setTelemetry] = useState<AICostTelemetry | null>(null);
  const [quotas, setQuotas] = useState<SystemQuotas | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingQuotas, setSavingQuotas] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form editable quotas state
  const [formData, setFormData] = useState({
    free_daily_ai_applies: 2,
    pro_daily_ai_applies: 25,
    unlimited_daily_ai_applies: 100,
    free_max_resumes: 1,
    pro_max_resumes: 5,
    ai_kill_switch: false,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [telRes, quoRes] = await Promise.all([
        fetch("/api/admin/ai/costs"),
        fetch("/api/admin/system/quotas"),
      ]);

      if (!telRes.ok || !quoRes.ok) {
        throw new Error("Failed to load telemetry or system quotas");
      }

      const telJson = await telRes.json();
      const quoJson = await quoRes.json();

      setTelemetry(telJson.telemetry);
      setQuotas(quoJson.quotas);
      if (quoJson.quotas) {
        setFormData({
          free_daily_ai_applies: quoJson.quotas.free_daily_ai_applies,
          pro_daily_ai_applies: quoJson.quotas.pro_daily_ai_applies,
          unlimited_daily_ai_applies: quoJson.quotas.unlimited_daily_ai_applies,
          free_max_resumes: quoJson.quotas.free_max_resumes,
          pro_max_resumes: quoJson.quotas.pro_max_resumes,
          ai_kill_switch: quoJson.quotas.ai_kill_switch || false,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveQuotas = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingQuotas(true);
      const res = await fetch("/api/admin/system/quotas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update quotas");
      }

      setSuccessToast("System monetization quotas updated and active across all web & mobile clients.");
      fetchData();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      alert(err.message || "Failed to save quotas");
    } finally {
      setSavingQuotas(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            AI Margin Defense & Dynamic Quotas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time Gemini token expenditure, margin defense telemetry, and global quota limits.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Telemetry
        </button>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Gemini Token Cost</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              ${telemetry?.totalEstimatedCost.toFixed(2) || "0.00"}
            </p>
            <p className="text-[11px] text-emerald-600 font-bold mt-1">98.5%+ Net Profit Margin</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tokens Processed</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {telemetry?.totalTokensConsumed.toLocaleString() || 0}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Gemini 2.0 Flash Model</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Token Efficiency Pricing</p>
            <div className="mt-1 space-y-0.5 text-xs font-mono font-bold text-slate-800">
              <p>In: $0.10 / 1M tokens</p>
              <p>Out: $0.40 / 1M tokens</p>
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Industry Lowest Latency</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Feature Breakdown & Live Quotas Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Cost Distribution by Feature */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">AI Cost Distribution</h2>
            <p className="text-xs text-slate-500 mt-0.5">Real expenditure breakdown by feature from database logs</p>
          </div>

          {(() => {
            const f = telemetry?.byFeature || { resumeOptimization: 0, coverLetters: 0, interviewQa: 0, voicePractice: 0 };
            const fTotal = (f.resumeOptimization + f.coverLetters + f.interviewQa + f.voicePractice) || 0.0001;
            const resumePct = Math.round((f.resumeOptimization / fTotal) * 100);
            const qaPct = Math.round((f.interviewQa / fTotal) * 100);
            const coverPct = Math.round((f.coverLetters / fTotal) * 100);
            const voicePct = Math.max(0, 100 - resumePct - qaPct - coverPct);

            return (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>AI Job Q&A Intelligence</span>
                    <span>${f.interviewQa.toFixed(4)} ({qaPct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${qaPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Resume ATS Optimization</span>
                    <span>${f.resumeOptimization.toFixed(4)} ({resumePct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${resumePct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Cover Letter Generator</span>
                    <span>${f.coverLetters.toFixed(4)} ({coverPct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${coverPct}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Voice Practice Speech Analysis</span>
                    <span>${f.voicePractice.toFixed(4)} ({voicePct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${voicePct}%` }} />
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 text-xs text-blue-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Margin Defense Active</span>
            </div>
            <p className="text-[11px] text-blue-700">
              Each $29/mo subscriber covers over ~70 million Gemini tokens. The commercial margin is protected by active database rate quotas.
            </p>
          </div>
        </div>

        {/* Global Dynamic System Quotas Editor */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Dynamic Monetization Quotas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure candidate daily application limits and resume caps in real time.
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
              Live Database Persistence
            </span>
          </div>

          <form onSubmit={handleSaveQuotas} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Free Tier Daily AI Applies
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={formData.free_daily_ai_applies}
                  onChange={(e) => setFormData({ ...formData, free_daily_ai_applies: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400">Drives paywall conversion (Standard: 2)</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Pro Tier Daily AI Applies
                </label>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={formData.pro_daily_ai_applies}
                  onChange={(e) => setFormData({ ...formData, pro_daily_ai_applies: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400">$29/mo plan allowance (Standard: 25)</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Unlimited Tier Daily Cap
                </label>
                <input
                  type="number"
                  min={50}
                  max={500}
                  value={formData.unlimited_daily_ai_applies}
                  onChange={(e) => setFormData({ ...formData, unlimited_daily_ai_applies: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400">Fair use ceiling (Standard: 100)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Free Tier Max Resumes
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={formData.free_max_resumes}
                  onChange={(e) => setFormData({ ...formData, free_max_resumes: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400">Max saved CVs for free users</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase">
                  Pro Tier Max Resumes
                </label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  value={formData.pro_max_resumes}
                  onChange={(e) => setFormData({ ...formData, pro_max_resumes: Number(e.target.value) })}
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-400">Max saved CVs for Pro subscribers</p>
              </div>
            </div>

            {/* Emergency Kill Switch */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              formData.ai_kill_switch 
                ? "bg-rose-50 border-rose-300 text-rose-900" 
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={`w-5 h-5 ${formData.ai_kill_switch ? "text-rose-600" : "text-slate-400"}`} />
                <div>
                  <p className="font-bold text-xs">Emergency Free AI Rate-Limiter / Kill Switch</p>
                  <p className="text-[11px] text-slate-500">
                    Temporarily blocks free-tier automated bulk generation during unexpected high load.
                  </p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ai_kill_switch}
                  onChange={(e) => setFormData({ ...formData, ai_kill_switch: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingQuotas}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingQuotas ? "Updating System Quotas..." : "Save System Quotas"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Negative Margin Radar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Negative Margin Accounts Radar</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time audit identifying any account whose Gemini AI costs exceed subscription revenue
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
            (telemetry?.negativeMarginUsers || []).length > 0 
              ? "bg-rose-50 text-rose-700 border border-rose-200" 
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}>
            {(telemetry?.negativeMarginUsers || []).length > 0 ? `${telemetry?.negativeMarginUsers.length} Flagged` : "All Accounts Operating Profitably"}
          </span>
        </div>

        {(!telemetry?.negativeMarginUsers || telemetry.negativeMarginUsers.length === 0) ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800">Zero Negative Margin Accounts Detected</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              All candidate usage is comfortably within system rate limits with healthy profit margins.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4">Account</th>
                  <th className="py-2.5 px-4">Plan Tier</th>
                  <th className="py-2.5 px-4">Revenue</th>
                  <th className="py-2.5 px-4">AI Token Cost</th>
                  <th className="py-2.5 px-4 text-right">Net Deficit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {telemetry.negativeMarginUsers.map((u) => (
                  <tr key={u.userId} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-md">
                        {u.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">${u.monthlyFee}/mo</td>
                    <td className="py-3 px-4 font-mono text-rose-600 font-bold">${u.estimatedAiCost}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                      -${Math.abs(u.margin).toFixed(4)}
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
