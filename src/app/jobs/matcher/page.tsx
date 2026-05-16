"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Target, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  Cpu,
  Zap,
  ShieldCheck,
  ZapOff,
  MapPin,
  ArrowLeft,
  Check
} from "lucide-react";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import ResumeSelector from "@/components/jobs/ResumeSelector";
import HTMLPreview from "@/components/builder/Preview/HTMLPreview";
import DashboardLayout from "@/components/layouts/DashboardLayout";

function MatcherContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const jobId = searchParams.get("jobId");
  
  const { selectedJob, fetchSavedJobs } = useJobStore();
  const { userResumes, fetchUserResumes } = useResumeStore();
  const { isPremium } = useSubscriptionStore();
  
  const [docType, setDocType] = useState<'resume' | 'cover_letter'>('resume');
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Analyzing job requirements...");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"select" | "processing" | "ready">("select");

  useEffect(() => {
    fetchSavedJobs();
    fetchUserResumes();
  }, [fetchSavedJobs, fetchUserResumes]);

  const handleStartMatching = async (resumeId: string) => {
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
        router.push(`/cover-letter/builder?matchJobId=${jobId}`);
        return;
      }

      // Stage 1: Prepare data
      setStatusText("Scanning job description for keywords...");
      setProgress(20);

      const jobTitle = selectedJob?.title || "General";
      const jobDescription = selectedJob?.description || "";

      // Stage 2: Call real ATS analysis API
      setStatusText("Running AI analysis against your resume...");
      setProgress(40);

      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeData: resume.content,
          targetJobTitle: jobTitle,
          jobDescription: jobDescription,
        }),
      });

      setProgress(70);
      setStatusText("Processing AI recommendations...");

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Analysis failed");
      }

      const { data: analysisResult } = await res.json();
      
      setProgress(90);
      setStatusText(`Match Score: ${analysisResult?.score || 0}% — Preparing builder...`);
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

  if (!jobId || (!selectedJob && step !== "processing")) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
           <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[32px] flex items-center justify-center mx-auto shadow-xl">
             <AlertCircle className="w-10 h-10" />
           </div>
           <h2 className="text-2xl font-black text-slate-900">Missing Context</h2>
           <p className="text-slate-500 font-medium">Please select a job from the search results to use the AI Matcher.</p>
           <button onClick={() => router.push("/jobs")} className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl">
             Browse Jobs
           </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50 py-12 px-6 sm:px-12 lg:px-16">
        <div className="max-w-5xl mx-auto">
        
        <AnimatePresence mode="wait">
          {step === "select" && (
            <motion.div 
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
                  Optimize your <span className="text-blue-600">Perfect Match</span>
                </h1>
                <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
                  Choose which document you want to tailor for the <span className="text-slate-900 font-bold">{selectedJob?.title}</span> role at <span className="text-slate-900 font-bold">{selectedJob?.company}</span>.
                </p>
              </div>

              {/* Doc Type Selector */}
              <div className="max-w-md mx-auto bg-white p-2 rounded-[24px] border border-slate-200 shadow-xl shadow-slate-200/50 flex">
                <button 
                  onClick={() => setDocType('resume')}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${docType === 'resume' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <FileText className="w-4 h-4" /> Resume
                </button>
                <button 
                  onClick={() => setDocType('cover_letter')}
                  className={`flex-1 py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${docType === 'cover_letter' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  <Zap className="w-4 h-4" /> Cover Letter
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                   {docType === 'resume' ? (
                     <>
                       <div className="flex items-center gap-4 mb-2">
                         <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                           <FileText className="w-5 h-5" />
                         </div>
                         <h2 className="text-2xl font-bold text-slate-900">Select Base Resume</h2>
                       </div>
                       
                       {userResumes.length > 0 ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                           {userResumes.map((resume) => (
                             <button
                               key={resume.id}
                               onClick={() => setSelectedResumeId(resume.id)}
                               className={`group p-8 rounded-[40px] bg-white border-2 text-left transition-all duration-500 relative overflow-hidden ${selectedResumeId === resume.id ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-2xl' : 'border-slate-200 hover:border-blue-400'}`}
                             >
                               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                               <div className="relative z-10 space-y-4">
                               <div className={`aspect-[1/1.41] w-full rounded-2xl relative overflow-hidden transition-all duration-500 border-2 ${selectedResumeId === resume.id ? 'border-white/40 ring-4 ring-white/10' : 'border-slate-100 bg-white'}`}>
                                 {/* Realistic Resume Preview - Calibrated for sidebar cards */}
                                 <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.32] w-[210mm] h-[297mm] pointer-events-none">
                                   <HTMLPreview 
                                     data={resume.content} 
                                     templateId={resume.template_id || 'modern'} 
                                   />
                                 </div>
                               </div>
                                 <div>
                                   <h3 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{resume.title}</h3>
                                   <p className="text-sm text-slate-400 font-bold tracking-tight">Last edited {new Date(resume.updated_at).toLocaleDateString()}</p>
                                 </div>
                                 {selectedResumeId === resume.id && (
                                   <div className="flex items-center gap-2 text-blue-600 text-sm font-black">
                                     Selected <Check className="w-4 h-4" />
                                   </div>
                                 )}
                               </div>
                             </button>
                           ))}
                         </div>
                       ) : (
                         <div className="p-12 rounded-[40px] border-2 border-dashed border-slate-200 text-center bg-white">
                            <p className="text-slate-400 font-bold mb-6">No resumes found</p>
                            <button onClick={() => router.push("/builder")} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Create Resume</button>
                         </div>
                       )}
                     </>
                   ) : (
                     <div className="bg-white rounded-[40px] p-12 border border-slate-200 shadow-xl shadow-slate-200/50 space-y-8">
                        <div className="w-16 h-16 rounded-[24px] bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Zap className="w-8 h-8" />
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-3xl font-black text-slate-900">AI Cover Letter Strategy</h2>
                          <p className="text-slate-500 text-lg font-medium leading-relaxed">
                            We'll generate a brand new cover letter perfectly tailored for this company's culture and job requirements using your career profile.
                          </p>
                        </div>
                        <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-200 flex items-start gap-6">
                          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900">Direct Optimization</p>
                            <p className="text-slate-500 font-medium mt-1">Our AI will intelligently highlight your most relevant skills automatically for this role.</p>
                          </div>
                        </div>
                     </div>
                   )}

                   <button
                     onClick={() => {
                        if (docType === 'resume' && !selectedResumeId) return;
                        handleStartMatching(selectedResumeId || '');
                     }}
                     disabled={docType === 'resume' && !selectedResumeId}
                     className="w-full p-8 rounded-[32px] bg-slate-900 text-white font-black text-xl hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/30 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-4 group overflow-hidden relative"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <span className="relative z-10 flex items-center gap-4">
                       Start AI Tailoring <Sparkles className="w-6 h-6" />
                     </span>
                   </button>
                </div>

                <div className="space-y-8">
                   <div className="p-8 rounded-[40px] bg-white border border-slate-200 shadow-sm space-y-6">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Selected Job</h3>
                      <div className="flex items-center gap-4">
                        {selectedJob?.companyLogo ? (
                          <img src={selectedJob.companyLogo} className="w-12 h-12 rounded-xl object-contain border border-slate-100" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">{selectedJob?.company.charAt(0)}</div>
                        )}
                        <div>
                          <p className="font-black text-slate-900 leading-tight">{selectedJob?.title}</p>
                          <p className="text-xs font-bold text-slate-500">{selectedJob?.company}</p>
                        </div>
                      </div>
                      <div className="space-y-3 pt-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <MapPin className="w-3.5 h-3.5" /> {selectedJob?.location}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <Target className="w-3.5 h-3.5" /> {selectedJob?.type}
                        </div>
                      </div>
                   </div>

                   <div className="p-8 rounded-[40px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-900/20 space-y-6">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Zap className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-lg font-black leading-tight">Why optimize?</h4>
                      <p className="text-blue-100 text-sm font-medium leading-relaxed">
                        Tailored resumes get <span className="text-white font-black">3x more interviews</span>. Our AI ensures your profile passes ATS filters and catches the recruiter's eye.
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto py-24 text-center space-y-12"
            >
              <div className="relative w-48 h-48 mx-auto">
                {/* Orbital Progress */}
                <svg className="w-full h-full rotate-[-90deg]">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-slate-100"
                  />
                  <motion.circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray="553"
                    initial={{ strokeDashoffset: 553 }}
                    animate={{ strokeDashoffset: 553 - (553 * progress) / 100 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="text-blue-600"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-blue-50 opacity-50 animate-pulse" />
                      <Sparkles className="w-12 h-12 text-blue-600 relative z-10 animate-bounce" />
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Engine at work...</h2>
                <div className="flex items-center justify-center gap-3 text-slate-500 font-bold">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  {statusText}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                {[
                  { icon: <Target />, active: progress > 20 },
                  { icon: <FileText />, active: progress > 50 },
                  { icon: <CheckCircle2 />, active: progress > 80 },
                ].map((item, i) => (
                  <div key={i} className={`p-4 rounded-2xl border-2 transition-all duration-500 ${item.active ? "bg-blue-50 border-blue-100 text-blue-600 scale-110" : "bg-white border-slate-100 text-slate-200"}`}>
                    {item.icon}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 p-6 rounded-3xl bg-rose-600 text-white shadow-2xl flex items-center gap-4">
            <AlertCircle className="w-6 h-6" />
            <p className="font-bold">{error}</p>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}

export default function AIJobMatcherPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    }>
      <MatcherContent />
    </Suspense>
  );
}
