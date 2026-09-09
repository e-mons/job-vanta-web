"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Calendar,
  Check
} from "lucide-react";
import { FormFieldDefinition } from "@/services/automation/browserbaseService";
import { toast } from "sonner";

interface MissingFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string | null;
  missingFields: FormFieldDefinition[];
  jobTitle?: string;
  company?: string;
  onSuccess?: () => void;
}

export default function MissingFieldsModal({
  isOpen,
  onClose,
  applicationId,
  missingFields,
  jobTitle,
  company,
  onSuccess,
}: MissingFieldsModalProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (missingFields.length > 0) {
      const initial: Record<string, string> = {};
      missingFields.forEach((f) => {
        initial[f.fieldKey] = f.value || "";
      });
      setFormValues(initial);
      setIsSuccess(false);
    }
  }, [missingFields]);

  if (!isOpen || !applicationId) return null;

  const handleInputChange = (key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify all required fields have a value
    for (const field of missingFields) {
      if (field.required && !formValues[field.fieldKey]?.trim()) {
        toast.error(`Please provide an answer for "${field.label}"`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/jobs/apply/missing-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          missingFieldValues: formValues,
          updateResume: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save application details");

      setIsSuccess(true);
      toast.success("Details saved! Jobvanta is continuing your application.");
      if (onSuccess) onSuccess();

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      toast.error(err.message || "Failed to save details");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/25">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  We need a few details before applying
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5 truncate max-w-[280px]">
                  {jobTitle ? `${jobTitle} at ${company}` : "Employer form requirements"}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body / Form */}
          <div className="p-5 sm:p-6">
            {isSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-black text-slate-900">Details Saved Successfully!</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Your answers have been saved and Jobvanta is continuing your application automatically.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-slate-600 font-medium">
                  The employer requires these details to complete submission. We will remember reusable answers for future jobs:
                </p>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  {missingFields.map((field) => {
                    const currentVal = formValues[field.fieldKey] || "";

                    return (
                      <div key={field.fieldKey} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <label className="text-xs font-bold text-slate-900 flex items-start justify-between gap-2">
                          <span>{field.label}</span>
                          {field.required && (
                            <span className="text-[9px] text-rose-600 font-black uppercase tracking-wider bg-rose-50 px-1.5 py-0.5 rounded shrink-0">
                              Required
                            </span>
                          )}
                        </label>

                        {/* 1. Yes / No typed field */}
                        {field.type === "yes_no" ? (
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleInputChange(field.fieldKey, "Yes")}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                currentVal.toLowerCase() === "yes"
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleInputChange(field.fieldKey, "No")}
                              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                                currentVal.toLowerCase() === "no"
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        ) : field.type === "choice" || (field.options && field.options.length > 0) ? (
                          /* 2. Dropdown choice */
                          <select
                            value={currentVal}
                            onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                          >
                            <option value="">Select an option...</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "number" ? (
                          /* 3. Number input */
                          <input
                            type="number"
                            value={currentVal}
                            onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                            placeholder="Enter number..."
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        ) : field.type === "date" ? (
                          /* 4. Date input */
                          <input
                            type="date"
                            value={currentVal}
                            onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        ) : field.type === "textarea" ? (
                          /* 5. Textarea */
                          <textarea
                            rows={3}
                            value={currentVal}
                            onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                            placeholder="Enter response..."
                            className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        ) : (
                          /* 6. Short text (default) */
                          <input
                            type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
                            value={currentVal}
                            onChange={(e) => handleInputChange(field.fieldKey, e.target.value)}
                            placeholder={`Enter ${field.label.toLowerCase()}...`}
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving & Resuming Application...</span>
                      </>
                    ) : (
                      <>
                        <span>Save & Continue Application</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
