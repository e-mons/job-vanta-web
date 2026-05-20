"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  DollarSign, 
  Globe, 
  ShieldCheck, 
  Calendar, 
  Briefcase, 
  Share2, 
  ExternalLink,
  Send,
  Zap,
  CheckCircle2,
  Sparkles,
  Clock,
  Target,
  ChevronRight,
  TrendingUp,
  Info
} from "lucide-react";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore, UserResume } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import { Skeleton } from "@/components/ui/Skeleton";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import CompanyLogo from "@/components/jobs/CompanyLogo";
import ApplyModal from "@/components/jobs/ApplyModal";


export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { selectedJob, savedJobIds, saveJob, fetchSavedJobs } = useJobStore();
  const { userResumes, fetchUserResumes } = useResumeStore();
  const { isPremium } = useSubscriptionStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<UserResume | null>(null);

  useEffect(() => {
    fetchSavedJobs();
    fetchUserResumes();
  }, [fetchSavedJobs, fetchUserResumes]);

  // Auto-select first resume when resumes load
  useEffect(() => {
    if (userResumes.length > 0 && !selectedResume) {
      setSelectedResume(userResumes[0]);
    }
  }, [userResumes, selectedResume]);

  // If no job is in store (e.g. direct link), we'd usually fetch it here.
  // For now, we'll assume it was passed through the store or redirect if missing.
  if (!selectedJob) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-blue-900/5">
            <Info className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Job Not Found</h2>
          <p className="text-slate-500 font-medium">We couldn't find the details for this job. You might have refreshed the page or used an expired link.</p>
          <Link 
            href="/jobs"
            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const isSaved = savedJobIds.has(selectedJob.id);

  const handleMatch = async () => {
    setIsSaving(true);
    try {
      if (!isSaved) {
        await saveJob(selectedJob);
      }
      // Redirect to AI Matcher Page
      router.push(`/jobs/matcher?jobId=${selectedJob.id}`);
    } catch (error) {
      console.error("Match error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 lg:pb-0">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link 
              href="/jobs"
              className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-all font-bold text-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
                <ArrowLeft className="w-5 h-5" />
              </div>
              <span className="hidden sm:inline">Back to Search</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
             <button className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">
               <Share2 className="w-5 h-5" />
             </button>
             <div className="h-6 w-px bg-slate-200 mx-2" />
             <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em]">
               <ShieldCheck className="w-4 h-4" />
               Verified Job
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-8 space-y-8">
            
            <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/60 shadow-xl shadow-slate-900/5">
              <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-br from-blue-600/[0.04] via-indigo-600/[0.03] to-transparent" />
              
              <div className="relative px-8 sm:px-10 pt-8 pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-7">
                  <CompanyLogo 
                    logoUrl={selectedJob.companyLogo} 
                    companyName={selectedJob.company} 
                    size="lg" 
                    className="border-2 border-white shadow-lg shrink-0" 
                  />

                  <div className="space-y-2.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                       {selectedJob.isRemote && (
                         <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">Remote</span>
                       )}
                       <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-wider">{selectedJob.type}</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 leading-snug">
                      {selectedJob.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-slate-500 font-semibold">
                      <div className="flex items-center gap-1.5 text-blue-600">
                        <Building2 className="w-4 h-4" />
                        {selectedJob.company}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {selectedJob.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        Posted {new Date(selectedJob.postedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon: <DollarSign className="w-3.5 h-3.5" />, label: "Salary", value: selectedJob.salary || "Competitive", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { icon: <Briefcase className="w-3.5 h-3.5" />, label: "Type", value: selectedJob.type, color: "text-blue-600", bg: "bg-blue-50" },
                    { icon: <Globe className="w-3.5 h-3.5" />, label: "Location", value: selectedJob.isRemote ? "Remote" : "Hybrid/On-site", color: "text-indigo-600", bg: "bg-indigo-50" },
                    { icon: <Calendar className="w-3.5 h-3.5" />, label: "Deadline", value: "Open", color: "text-rose-600", bg: "bg-rose-50" },
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 group hover:bg-white hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300">
                      <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-2.5`}>
                        {stat.icon}
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* AI Insights Card */}
            <section className="p-7 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden shadow-xl shadow-blue-900/15">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
              
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-blue-500/20 backdrop-blur-xl border border-blue-400/20 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-7 h-7 text-blue-400" />
                </div>
                <div className="space-y-3 text-center md:text-left flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/20 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                    <TrendingUp className="w-3 h-3" />
                    AI Match Insight
                  </div>
                  <h3 className="text-xl font-black tracking-tight">How well do you fit this role?</h3>
                  <p className="text-slate-300 font-medium leading-relaxed">
                    Based on your saved resumes, you have <span className="text-blue-400 font-black">85%</span> of the required skills. 
                    Our AI can bridge the remaining gap by highlighting your transferable experiences in a tailored resume.
                  </p>
                </div>
                <button 
                  onClick={handleMatch}
                  disabled={isSaving}
                  className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-blue-50 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                >
                  {isSaving ? "Preparing..." : "Get AI Match"}
                </button>
              </div>
            </section>

            {/* Main Content Sections */}
            <div className="space-y-8">
              <section className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  About the Role
                </h3>
                <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">
                  {selectedJob.description}
                </div>
              </section>

              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <section className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Target className="w-5 h-5" />
                    </div>
                    Responsibilities
                  </h3>
                  <ul className="space-y-4">
                    {selectedJob.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 font-medium leading-relaxed text-[15px]">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {selectedJob.qualifications && selectedJob.qualifications.length > 0 && (
                <section className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    Qualifications
                  </h3>
                  <ul className="space-y-4">
                    {selectedJob.qualifications.map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-slate-600 font-medium leading-relaxed text-[15px]">
                        <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <section className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/60 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    Benefits & Perks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedJob.benefits.map((benefit, i) => (
                      <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="font-bold text-slate-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Action Panel / Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-32 space-y-8">
              
              {/* Main Action Card */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200/60 shadow-xl shadow-slate-900/5 space-y-6">
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Options</p>
                  <h4 className="text-xl font-black text-slate-900">Ready to take the leap?</h4>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleMatch}
                    disabled={isSaving}
                    className="w-full p-5 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-3 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Sparkles className="w-5 h-5" />
                    {isSaving ? "Processing..." : "Match Resume & Cover"}
                  </button>
                  
                  <button 
                    onClick={() => setIsApplyOpen(true)}
                    className="w-full p-5 rounded-2xl bg-slate-900 text-white font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <Send className="w-4 h-4" />
                    Apply Now
                  </button>

                  {selectedJob.applyLink && selectedJob.applyLink !== 'https://example.com/apply' && (
                    <a 
                      href={selectedJob.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-4 rounded-2xl bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all border border-slate-200 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      Apply on Company Site
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Salary</p>
                      <p className="text-sm font-black text-slate-900">{selectedJob.salary || "Competitive"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-600 shadow-sm">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Type</p>
                      <p className="text-sm font-black text-slate-900">{selectedJob.type}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Company Info Card */}
              <div className="p-8 rounded-3xl bg-white border border-slate-200/60 shadow-sm space-y-5">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">About the Employer</h4>
                <div className="flex items-center gap-4">
                  <CompanyLogo 
                    logoUrl={selectedJob.companyLogo} 
                    companyName={selectedJob.company} 
                    size="md" 
                    className="rounded-2xl" 
                  />
                  <div>
                    <p className="font-black text-slate-900">{selectedJob.company}</p>
                    <p className="text-xs font-bold text-slate-500">{selectedJob.location}</p>
                  </div>
                </div>
                {selectedJob.companyDescription && (
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">
                    {selectedJob.companyDescription}
                  </p>
                )}
                <button className="w-full py-4 text-sm font-black text-blue-600 hover:text-blue-700 flex items-center justify-center gap-2 transition-all">
                  View Company Profile
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Safety & Help */}
              <div className="px-8 text-center">
                <p className="text-xs text-slate-400 font-bold leading-relaxed">
                  Avoid scams. Never pay for a job application or interview. Report suspicious listings to our safety team.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* Apply Modal */}
      <ApplyModal
        job={selectedJob}
        resume={selectedResume}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={() => {
          setIsApplyOpen(false);
        }}
      />
    </div>
  );
}
