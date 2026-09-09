"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Edit3, 
  FileText, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Code, 
  ExternalLink,
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { createClient } from "@/utils/supabase/client";
import { FormFieldDefinition } from "@/services/automation/browserbaseService";
import { toast } from "sonner";
import ApplicationInformationSection from "@/components/jobs/ApplicationInformationSection";

interface ResumeViewProps {
  params: Promise<{ id: string }>;
}

export default function ResumeViewPage({ params }: ResumeViewProps) {
  const resolvedParams = use(params);
  const resumeId = resolvedParams.id;
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");

  const [resume, setResume] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [missingFieldValues, setMissingFieldValues] = useState<Record<string, string>>({});
  const [isSubmittingMissing, setIsSubmittingMissing] = useState(false);
  const [isDoneSubmitting, setIsDoneSubmitting] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }

        // 1. Fetch Resume
        const { data: resData, error: resError } = await supabase
          .from("resumes")
          .select("*")
          .eq("id", resumeId)
          .eq("user_id", user.id)
          .single();

        if (resError || !resData) {
          toast.error("Resume not found");
          return;
        }
        setResume(resData);

        // 2. Fetch Application if query param present
        if (applicationId) {
          const { data: appData } = await supabase
            .from("job_applications")
            .select("*")
            .eq("id", applicationId)
            .eq("user_id", user.id)
            .single();

          if (appData) {
            setApplication(appData);
            // Pre-fill initial missing field values
            const initialVals: Record<string, string> = {};
            if (Array.isArray(appData.missing_fields)) {
              appData.missing_fields.forEach((f: FormFieldDefinition) => {
                initialVals[f.fieldKey] = appData.filled_fields?.[f.fieldKey] || "";
              });
            }
            setMissingFieldValues(initialVals);
          }
        }
      } catch (err: any) {
        console.error("Error loading resume view:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [resumeId, applicationId]);

  const handleSaveMissingFields = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationId) return;

    setIsSubmittingMissing(true);
    try {
      const res = await fetch("/api/jobs/apply/missing-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          missingFieldValues,
          updateResume: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save missing fields");

      setIsDoneSubmitting(true);
      toast.success("Missing fields saved! AI Agent is submitting your application.");

      setTimeout(() => {
        router.push("/jobs/history");
      }, 2500);
    } catch (err: any) {
      toast.error(err.message || "Failed to update fields");
    } finally {
      setIsSubmittingMissing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[500px] gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading Resume Overview...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!resume) {
    return (
      <DashboardLayout>
        <div className="p-8 max-w-5xl mx-auto text-center py-20">
          <p className="text-slate-500 font-bold mb-4">Resume not found or access denied.</p>
          <Link href="/builder" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm">
            Go to Resumes
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const content = resume.content || {};
  const personal = content.personalInfo || {};
  const experiences = content.experience || [];
  const educationList = content.education || [];
  const skillsList = content.skills || [];
  const projectsList = content.projects || [];
  const certsList = content.certifications || [];

  const missingFieldsList: FormFieldDefinition[] = application?.missing_fields || [];
  const hasMissingFields = application && application.status === "missing_info" && missingFieldsList.length > 0;

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-10 pb-24 lg:pb-12 max-w-6xl mx-auto space-y-8">
        {/* Navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Dedicated Resume View
                </span>
                <span className="text-xs text-slate-400">
                  Updated {new Date(resume.updated_at).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                {resume.title || "Professional Resume"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href={`/builder/edit?id=${resume.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs shadow-sm transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              <span>Edit in Builder</span>
            </Link>

            <Link
              href={`/preview/${resume.id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Preview & Export</span>
            </Link>
          </div>
        </div>

        {/* Missing Application Fields Banner & Interactive Card */}
        {hasMissingFields && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 sm:p-8 rounded-[32px] bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border-2 border-amber-400/80 shadow-xl shadow-amber-500/10 space-y-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Missing Resume/Profile Info Required for Job Application
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Applying for: <strong>{application.metadata?.title}</strong> at <strong>{application.metadata?.company}</strong>
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Action Required
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              The employer’s application portal requires the following fields before submission. Fill in the values below to automatically update your resume and continue the AI Agent application.
            </p>

            {isDoneSubmitting ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
                <h4 className="text-base font-black text-emerald-900">Fields Updated Successfully!</h4>
                <p className="text-xs text-emerald-700 font-medium">Submitting application in background session. Redirecting to Application Timeline...</p>
              </div>
            ) : (
              <form onSubmit={handleSaveMissingFields} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {missingFieldsList.map((field) => (
                    <div key={field.fieldKey} className="space-y-1.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                      <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                        <span>{field.label}</span>
                        {field.required && <span className="text-[10px] text-rose-500 font-black uppercase">Required</span>}
                      </label>

                      {field.type === "choice" && field.options ? (
                        <select
                          value={missingFieldValues[field.fieldKey] || ""}
                          onChange={(e) =>
                            setMissingFieldValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))
                          }
                          required={field.required}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        >
                          <option value="">Select an option</option>
                          {field.options.map((opt, idx) => (
                            <option key={idx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          rows={2}
                          value={missingFieldValues[field.fieldKey] || ""}
                          onChange={(e) =>
                            setMissingFieldValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))
                          }
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          required={field.required}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        />
                      ) : (
                        <input
                          type={field.type === "tel" ? "tel" : field.type === "email" ? "email" : "text"}
                          value={missingFieldValues[field.fieldKey] || ""}
                          onChange={(e) =>
                            setMissingFieldValues((prev) => ({ ...prev, [field.fieldKey]: e.target.value }))
                          }
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          required={field.required}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 outline-none focus:border-blue-500"
                        />
                      )}

                      {field.description && (
                        <p className="text-[10px] text-slate-400 font-medium">{field.description}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSubmittingMissing}
                    className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingMissing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving & Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Save & Continue AI Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}

        {/* Resume Content View: Header & Personal Info */}
        <div className="p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {personal.fullName || "Candidate Name"}
              </h2>
              {experiences.length > 0 && experiences[0]?.role && (
                <p className="text-lg font-bold text-blue-600">
                  {experiences[0].role}
                </p>
              )}
            </div>

            {/* Contact Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
              {personal.email && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {personal.email}
                </span>
              )}
              {personal.phone && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {personal.phone}
                </span>
              )}
              {personal.location && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {personal.location}
                </span>
              )}
              {personal.website && (
                <a
                  href={personal.website.startsWith("http") ? personal.website : `https://${personal.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Portfolio / Website
                </a>
              )}
            </div>
          </div>

          {/* Professional Summary */}
          {personal.summary && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Professional Summary
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {personal.summary}
              </p>
            </div>
          )}
        </div>

        {/* Reusable Application Information for Auto Apply */}
        <ApplicationInformationSection />

        {/* Skills & Technologies */}
        {skillsList.length > 0 && (
          <div className="p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Code className="w-3.5 h-3.5 text-blue-600" />
              Core Skills & Tech Stack ({skillsList.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill: string, i: number) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 border border-slate-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {experiences.length > 0 && (
          <div className="p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              Work Experience ({experiences.length})
            </h3>
            <div className="space-y-6">
              {experiences.map((exp: any, i: number) => (
                <div key={i} className="space-y-2 pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-base font-black text-slate-900">{exp.role}</h4>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {exp.startDate || "Start"} — {exp.endDate || (exp.current ? "Present" : "End")}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-blue-600">{exp.company} {exp.location && `• ${exp.location}`}</div>
                  {exp.description && (
                    <p className="text-xs text-slate-600 font-medium leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projectsList.length > 0 && (
          <div className="p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Featured Projects ({projectsList.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projectsList.map((proj: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{proj.name}</h4>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {proj.description && (
                    <p className="text-xs text-slate-600 font-medium line-clamp-3">{proj.description}</p>
                  )}
                  {proj.technologies && (
                    <div className="text-[11px] font-mono text-slate-400 font-semibold pt-1">
                      Tech: {proj.technologies}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education & Certifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {educationList.length > 0 && (
            <div className="p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                Education
              </h3>
              <div className="space-y-4">
                {educationList.map((edu: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <h4 className="font-bold text-sm text-slate-900">{edu.degree} in {edu.field}</h4>
                    <p className="text-xs text-blue-600 font-bold">{edu.school}</p>
                    <p className="text-[11px] text-slate-400">{edu.graduationYear || edu.year}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certsList.length > 0 && (
            <div className="p-8 rounded-[36px] bg-white border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-blue-600" />
                Certifications
              </h3>
              <div className="space-y-4">
                {certsList.map((cert: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">{cert.name}</h4>
                      {cert.url && (
                        <a href={cert.url} target="_blank" rel="noreferrer" className="text-blue-600">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 font-bold">{cert.issuer}</p>
                    {cert.date && <p className="text-[11px] text-slate-400">{cert.date}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
