"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Target,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Zap,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  Check,
  DollarSign,
  Briefcase,
  TrendingUp,
  ChevronRight,
  Sparkle
} from "lucide-react";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import HTMLPreview from "@/components/builder/Preview/HTMLPreview";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import CompanyLogo from "@/components/jobs/CompanyLogo";

function MatcherContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("jobId");

  const { selectedJob, fetchSavedJobs, savedJobs } = useJobStore();
  const { userResumes, fetchUserResumes } = useResumeStore();
  const { isPremium } = useSubscriptionStore();

  const [docType, setDocType] = useState<'resume' | 'cover_letter'>('resume');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isSavedJobsLoaded, setIsSavedJobsLoaded] = useState(false);

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Analyzing job requirements...");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "processing" | "ready">("select");

  useEffect(() => {
    fetchSavedJobs().then(() => setIsSavedJobsLoaded(true));
    fetchUserResumes();
  }, [fetchSavedJobs, fetchUserResumes]);

  // Auto-select the first resume
  useEffect(() => {
    if (userResumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(userResumes[0].id);
    }
  }, [userResumes, selectedResumeId]);

  // Resolve target job from active selection or saved jobs in store
  const resolvedJob = selectedJob || (() => {
    const saved = savedJobs.find(j => j.id === jobId);
    if (!saved) return null;
    return saved.metadata || {
      id: saved.id,
      title: saved.job_title,
      company: saved.company_name,
      location: saved.location || "Remote",
      type: "Full-time",
      salary: "Competitive",
      description: "",
      applyLink: saved.job_url || "",
      companyLogo: null,
      isRemote: saved.location?.toLowerCase().includes("remote") || false,
      skills: []
    };
  })();

  const currentJob = resolvedJob || {
    id: "",
    title: "General",
    company: "Company",
    location: "Remote",
    type: "Full-time",
    salary: "Competitive",
    description: "",
    applyLink: "",
    companyLogo: null,
    isRemote: false,
    skills: []
  };

  const handleStartMatching = async (resumeId: string) => {
    if (!resolvedJob) return;
    setStep("processing");
    setProgress(10);
    setError(null);

    try {
      const resume = userResumes.find(r => r.id === resumeId);
      if (!resume) throw new Error("Resume not found");

      // If cover letter mode, skip analysis and redirect directly
      if (docType === 'cover_letter') {
        setStatusText("Preparing cover letter builder...");
        setProgress(50);
        await new Promise(r => setTimeout(r, 500));
        setProgress(100);
        setStep("ready");
        router.push(`/builder/edit?id=${resumeId}&matchJobId=${jobId}&tab=cover_letter`);
        return;
      }

      // Stage 1: Prepare data
      setStatusText("Scanning job description for keywords...");
      setProgress(30);
      await new Promise(r => setTimeout(r, 600));

      const jobTitle = currentJob.title || "General";
      const jobDescription = currentJob.description || "";

      // Stage 2: Call real ATS analysis API
      setStatusText("Running AI analysis against your resume...");
      setProgress(50);

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: resume.content,
          targetJobTitle: jobTitle,
          jobDescription: jobDescription,
        }),
      });

      setProgress(75);
      setStatusText("Processing AI recommendations...");

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const { data: analysisResult } = await res.json();

      // Cache the result in sessionStorage so the editor can load it instantly
      if (analysisResult) {
        sessionStorage.setItem(`ats_result_${jobId}`, JSON.stringify(analysisResult));
      }
      
      // Cache job metadata resiliently so unsaved search-result jobs can load instantly without database record
      sessionStorage.setItem(`job_metadata_${jobId}`, JSON.stringify({
        title: currentJob.title,
        company: currentJob.company,
        description: currentJob.description
      }));

      setProgress(95);
      setStatusText(`Match Score: ${analysisResult?.score || 0}% — Launching resume editor...`);
      await new Promise(r => setTimeout(r, 800));

      setProgress(100);
      setStep("ready");

      // Redirect to builder with matching context
      router.push(`/builder/edit?id=${resumeId}&matchJobId=${jobId}`);
    } catch (err: any) {
      console.error("Matching error:", err);
      setError(err.message || "Failed to complete AI matching. Please try again.");
      setStep("select");
      setProgress(0);
    }
  };

  // If still loading and resolvedJob is missing, show beautiful screen skeleton
  if (!isSavedJobsLoaded && !resolvedJob) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-500 animate-pulse">Loading Job Details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If fully loaded and still no job context, show error screen
  if (!jobId || (!resolvedJob && step !== "processing")) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-[#f8faff] flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md bg-white p-10 rounded-[32px] border border-slate-200/60 shadow-xl shadow-slate-900/5">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto shadow-lg shadow-rose-500/10">
              <AlertCircle className="w-10 h-10 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Missing Context</h2>
              <p className="text-slate-500 font-medium text-sm leading-relaxed">
                Please select a job from the search results to use the JobVanta AI Matcher.
              </p>
            </div>
            <button
              onClick={() => router.push("/jobs")}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Browse Jobs
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const selectedResume = userResumes.find(r => r.id === selectedResumeId);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f8faff] text-slate-900">
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="p-6 sm:p-8 lg:p-12 pb-24 lg:pb-12"
            >
              <div className="max-w-6xl mx-auto space-y-8">
                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => router.back()}
                      className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:shadow-md hover:scale-105 active:scale-95 transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Document Tailoring</h1>
                      <p className="text-sm text-slate-500 font-bold mt-1">Optimize your profile or generate a custom cover letter</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-black uppercase tracking-widest shadow-sm">
                    <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                    JobVanta AI Powered
                  </div>
                </div>

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* LEFT: Setup Form (3/5 Columns) */}
                  <div className="lg:col-span-3 space-y-8">
                    
                    {/* Step 1: Document Choice */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">1</div>
                          <h2 className="font-extrabold text-slate-900 text-base">Select Document Strategy</h2>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => setDocType('resume')}
                            className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 group relative overflow-hidden ${
                              docType === 'resume'
                                ? 'border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/5'
                                : 'border-slate-150 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                              docType === 'resume' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <p className={`font-black text-sm ${docType === 'resume' ? 'text-blue-700' : 'text-slate-800'}`}>
                              Optimize Resume
                            </p>
                            <p className="text-xs text-slate-400 font-semibold mt-1 leading-normal">
                              Analyze ATS compatibility, fill missing keywords, and tailor experience bullets.
                            </p>
                          </button>

                          <button
                            onClick={() => setDocType('cover_letter')}
                            className={`p-5 rounded-2xl border-2 text-left transition-all duration-300 group relative overflow-hidden ${
                              docType === 'cover_letter'
                                ? 'border-indigo-500 bg-indigo-50/20 ring-4 ring-indigo-500/5'
                                : 'border-slate-150 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                              docType === 'cover_letter' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <Zap className="w-5 h-5" />
                            </div>
                            <p className={`font-black text-sm ${docType === 'cover_letter' ? 'text-indigo-700' : 'text-slate-800'}`}>
                              Write Cover Letter
                            </p>
                            <p className="text-xs text-slate-400 font-semibold mt-1 leading-normal">
                              Generate a tailored, highly persuasive letter focused on target job requirements.
                            </p>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Content Selection */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="px-8 py-5 border-b border-slate-100 flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">2</div>
                        <h2 className="font-extrabold text-slate-900 text-base">
                          {docType === 'resume' ? 'Select Base Resume' : 'Target Strategy details'}
                        </h2>
                      </div>

                      {docType === 'resume' ? (
                        <div className="p-6">
                          {userResumes.length > 0 ? (
                            <div className="space-y-4">
                              {userResumes.map((resume) => (
                                <button
                                  key={resume.id}
                                  onClick={() => setSelectedResumeId(resume.id)}
                                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-300 flex items-center gap-5 group relative ${
                                    selectedResumeId === resume.id
                                      ? 'border-blue-500 bg-blue-50/20 ring-4 ring-blue-500/5'
                                      : 'border-slate-150 hover:border-slate-350 bg-white hover:bg-slate-50/50'
                                  }`}
                                >
                                  {/* Mini Preview */}
                                  <div className={`w-16 h-20 rounded-xl relative overflow-hidden border shrink-0 shadow-sm transition-all group-hover:shadow-md ${
                                    selectedResumeId === resume.id ? 'border-blue-300' : 'border-slate-200'
                                  }`}>
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.09] w-[210mm] h-[297mm] pointer-events-none">
                                      <HTMLPreview
                                        data={resume.content}
                                        templateId={resume.template_id || 'modern'}
                                      />
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className={`font-black text-sm truncate ${
                                      selectedResumeId === resume.id ? 'text-blue-700' : 'text-slate-900'
                                    }`}>
                                      {resume.title}
                                    </p>
                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                      Updated {new Date(resume.updated_at).toLocaleDateString()}
                                    </p>
                                  </div>

                                  {/* Circle Selector */}
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    selectedResumeId === resume.id
                                      ? 'border-blue-500 bg-blue-500 text-white scale-110 shadow-md shadow-blue-500/20'
                                      : 'border-slate-300 bg-white'
                                  }`}>
                                    {selectedResumeId === resume.id && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-10 text-center space-y-4">
                              <p className="text-slate-400 font-bold text-sm">No resumes available</p>
                              <button
                                onClick={() => router.push("/builder")}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                              >
                                Create A Resume
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-8 space-y-5">
                          <div className="flex items-start gap-4 p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100/60 shadow-sm">
                            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                              <Zap className="w-5.5 h-5.5" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-950 text-sm">AI Copilot Writing</p>
                              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                We'll draft a highly targeted cover letter matching {currentJob.company}'s mission, expectations, and core values perfectly.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100/60 shadow-sm">
                            <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                              <ShieldCheck className="w-5.5 h-5.5" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-950 text-sm">Smart Alignment System</p>
                              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                                Automatically isolates your key technical skills and matches them directly against job descriptions dynamically.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Start matching button */}
                    <button
                      onClick={() => {
                        if (docType === 'resume' && !selectedResumeId) return;
                        handleStartMatching(selectedResumeId || '');
                      }}
                      disabled={docType === 'resume' && !selectedResumeId}
                      className="w-full py-5 rounded-[24px] bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-3 group overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <span className="relative z-10 flex items-center gap-2.5 uppercase tracking-widest text-xs">
                        <Sparkles className="w-4.5 h-4.5 text-blue-400 group-hover:text-white transition-colors" />
                        {docType === 'resume' ? 'Start AI Document Tailoring' : 'Generate Cover Letter'}
                      </span>
                    </button>
                  </div>

                  {/* RIGHT: Target Job Info (2/5 Columns) */}
                  <div className="lg:col-span-2 space-y-8">
                    
                    {/* Selected Job Card */}
                    <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <div className="px-8 py-5 border-b border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Target Position Details</p>
                      </div>
                      <div className="p-8 space-y-6">
                        <div className="flex items-center gap-4">
                          <CompanyLogo
                            logoUrl={currentJob.companyLogo}
                            companyName={currentJob.company || "Company"}
                            size="lg"
                            className="rounded-2xl shadow-sm border border-slate-100"
                          />
                          <div className="min-w-0">
                            <p className="font-black text-slate-950 text-base leading-tight truncate">{currentJob.title}</p>
                            <p className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-wider">{currentJob.company}</p>
                          </div>
                        </div>

                        <div className="h-px bg-slate-100" />

                        <div className="space-y-4">
                          {[
                            { icon: <MapPin className="w-4 h-4" />, text: currentJob.location },
                            { icon: <Briefcase className="w-4 h-4" />, text: currentJob.type },
                            { icon: <DollarSign className="w-4 h-4" />, text: currentJob.salary || "Competitive Salary" },
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3.5 text-xs font-bold text-slate-600">
                              <span className="text-slate-400">{item.icon}</span>
                              {item.text}
                            </div>
                          ))}
                        </div>

                        {currentJob.isRemote && (
                          <div className="pt-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
                              <Sparkle className="w-3.5 h-3.5 text-emerald-500 animate-spin" style={{ animationDuration: '6s' }} />
                              Remote Eligible
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Marketing Pitch Card */}
                    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/10 group">
                      <div className="absolute -top-16 -right-16 w-44 h-44 bg-blue-600/10 rounded-full blur-[80px] group-hover:bg-blue-600/20 transition-all duration-700" />
                      <div className="relative z-10 space-y-5">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <TrendingUp className="w-5.5 h-5.5 text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-100">Why optimize?</h4>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed mt-2">
                            Recruiters scan resumes in under 6 seconds. Tailored resumes bypass ATS bots automatically and get <span className="text-white font-extrabold">3x more callbacks</span>.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-3">
                          {[
                            { label: "ATS Pass", value: "99%" },
                            { label: "Callbacks", value: "3.4x" },
                            { label: "AI Matcher", value: "10s" },
                          ].map((stat, i) => (
                            <div key={i} className="text-center p-3 rounded-xl bg-white/5 border border-white/5">
                              <p className="text-white font-black text-sm">{stat.value}</p>
                              <p className="text-slate-500 text-[9px] font-bold mt-1 uppercase tracking-wider">{stat.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="min-h-[85vh] flex items-center justify-center p-6"
            >
              <div className="max-w-md mx-auto text-center space-y-12">
                {/* Orbital Progress Indicator */}
                <div className="relative w-44 h-44 mx-auto">
                  <svg className="w-full h-full rotate-[-90deg]">
                    <circle
                      cx="88"
                      cy="88"
                      r="80"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-slate-100"
                    />
                    <motion.circle
                      cx="88"
                      cy="88"
                      r="80"
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeDasharray="502.4"
                      initial={{ strokeDashoffset: 502.4 }}
                      animate={{ strokeDashoffset: 502.4 - (502.4 * progress) / 100 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="text-blue-600"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-28 h-28 rounded-full bg-white shadow-xl flex items-center justify-center border border-slate-100">
                      <div className="relative flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-blue-600 animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Analyzing Compatibility</h2>
                  <div className="inline-flex items-center justify-center gap-3 px-6 py-2.5 rounded-full bg-white border border-slate-200/80 shadow-sm text-slate-500 font-bold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    {statusText}
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-6">
                  {[
                    { icon: <Target className="w-4 h-4" />, label: "Extract", active: progress >= 30 },
                    { icon: <FileText className="w-4 h-4" />, label: "Compare", active: progress >= 50 },
                    { icon: <CheckCircle2 className="w-4 h-4" />, label: "Optimize", active: progress >= 75 },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className={`w-11 h-11 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-sm ${
                        item.active
                          ? "bg-blue-50 border-blue-200 text-blue-600 scale-110 shadow-blue-500/10"
                          : "bg-white border-slate-100 text-slate-200"
                      }`}>
                        {item.icon}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${item.active ? 'text-blue-600' : 'text-slate-300'}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && step !== "select" && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 p-5 rounded-2xl bg-rose-600 text-white shadow-2xl flex items-center gap-3.5 max-w-md z-50 animate-in slide-in-from-bottom-5">
            <AlertCircle className="w-5.5 h-5.5 shrink-0" />
            <p className="text-sm font-bold">{error}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function AIJobMatcherPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    }>
      <MatcherContent />
    </Suspense>
  );
}
