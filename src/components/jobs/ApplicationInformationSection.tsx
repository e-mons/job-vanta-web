"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  Save, 
  HelpCircle,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface ApplicationDetailsForm {
  work_authorization: string;
  requires_sponsorship: string;
  notice_period: string;
  salary_expectation: string;
  willing_to_relocate: string;
}

export default function ApplicationInformationSection({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [form, setForm] = useState<ApplicationDetailsForm>({
    work_authorization: "",
    requires_sponsorship: "",
    notice_period: "",
    salary_expectation: "",
    willing_to_relocate: "",
  });

  useEffect(() => {
    async function loadDetails() {
      try {
        const res = await fetch("/api/user/application-details");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setForm({
              work_authorization: json.data.work_authorization || "",
              requires_sponsorship: json.data.requires_sponsorship || "",
              notice_period: json.data.notice_period || "",
              salary_expectation: json.data.salary_expectation || "",
              willing_to_relocate: json.data.willing_to_relocate || "",
            });
          }
        }
      } catch (err) {
        console.error("Failed to load application details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDetails();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/user/application-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save application information");

      setSavedSuccess(true);
      toast.success("Application Information updated! These details will be used for auto-apply.");
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || "Failed to update application information");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-8 rounded-[36px] bg-white border border-slate-200/80 flex items-center justify-center min-h-[220px] ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Application Information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 sm:p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-sm space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Reusable Application Details
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Application Information
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Proactively maintain verified answers for automated job applications. We never fabricate material facts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto cursor-pointer ${
            savedSuccess
              ? "bg-emerald-600 text-white shadow-emerald-600/20"
              : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : savedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Details</span>
            </>
          )}
        </button>
      </div>

      {/* Inputs Form */}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Work Authorization */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Work Authorization
              </label>
              <span className="text-[10px] font-bold text-slate-400">Important</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Are you legally authorized to work in the country you are applying for?
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {["Yes", "No"].map((opt) => {
                const isSelected = form.work_authorization?.toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, work_authorization: opt }))}
                    className={`py-2 rounded-xl text-xs font-black transition-all border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visa Sponsorship */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Visa Sponsorship Required?
              </label>
              <span className="text-[10px] font-bold text-slate-400">Important</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Will you now or in the future require visa sponsorship to work?
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {["Yes", "No"].map((opt) => {
                const isSelected = form.requires_sponsorship?.toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, requires_sponsorship: opt }))}
                    className={`py-2 rounded-xl text-xs font-black transition-all border ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notice Period / Earliest Start Date */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Notice Period / Earliest Start Date
            </label>
            <p className="text-[11px] text-slate-500 leading-snug">
              How soon can you start a new role?
            </p>
            <select
              value={form.notice_period}
              onChange={(e) => setForm((prev) => ({ ...prev, notice_period: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Select notice period</option>
              <option value="Immediately">Immediately (Available now)</option>
              <option value="2 weeks">2 weeks notice</option>
              <option value="1 month">1 month (30 days)</option>
              <option value="2 months">2 months (60 days)</option>
              <option value="3 months">3 months (90 days)</option>
              <option value="Flexible">Flexible / Negotiable</option>
            </select>
          </div>

          {/* Salary Expectation */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Desired Salary / Compensation
            </label>
            <p className="text-[11px] text-slate-500 leading-snug">
              Target base salary or range requested on job forms.
            </p>
            <input
              type="text"
              value={form.salary_expectation}
              onChange={(e) => setForm((prev) => ({ ...prev, salary_expectation: e.target.value }))}
              placeholder="e.g. $120,000 / year or Negotiable"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Relocation */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              Willingness to Relocate
            </label>
            <p className="text-[11px] text-slate-500 leading-snug">
              Are you open to relocating for the right opportunity?
            </p>
            <div className="grid grid-cols-3 gap-2 pt-1 max-w-md">
              {["Yes", "No", "Remote Only"].map((opt) => {
                const isSelected = form.willing_to_relocate?.toLowerCase() === opt.toLowerCase();
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, willing_to_relocate: opt }))}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all border text-center ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
