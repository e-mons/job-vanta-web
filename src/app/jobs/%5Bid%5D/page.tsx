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
import { useSubscriptionStore } from "@/store/useSubscription";
import { Skeleton } from "@/components/ui/Skeleton";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  const { selectedJob, savedJobIds, saveJob, fetchSavedJobs } = useJobStore();
  const { isPremium } = useSubscriptionStore();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

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
          <div className="lg:col-span-8 space-y-12">
            
            {/* Job Banner Header */}
            <section className="relative overflow-hidden rounded-[48px] bg-white border border-slate-200/60 shadow-2xl shadow-slate-900/5">
              <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-blue-600/5 via-indigo-600/5 to-transparent" />
              
              <div className="relative pt-12 px-12 pb-12">
                <div className="flex flex-col md:flex-row md:items-end gap-8 mb-10">
                  {selectedJob.companyLogo ? (
                    <div className="w-32 h-32 rounded-[36px] bg-white border-4 border-white shadow-2xl p-4 flex items-center justify-center shrink-0">
                      <img src={selectedJob.companyLogo} alt={selectedJob.company} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-[36px] bg-gradient-to-br from-blue-600 to-indigo-600 border-4 border-white shadow-2xl flex items-center justify-center text-white text-4xl font-black shrink-0">
                      {selectedJob.company.charAt(0)}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                       {selectedJob.isRemote && (
                         <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">Remote</span>
                       )}
                       <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-wider">{selectedJob.type}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
                      {selectedJob.title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-6 text-slate-500 font-bold">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Building2 className="w-5 h-5" />
                        {selectedJob.company}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {selectedJob.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Posted {new Date(selectedJob.postedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <DollarSign className="w-4 h-4" />, label: "Salary", value: selectedJob.salary || "Competitive", color: "text-emerald-600", bg: "bg-emerald-50" },
                    { icon: <Briefcase className="w-4 h-4" />, label: "Type", value: selectedJob.type, color: "text-blue-600", bg: "bg-blue-50" },
                    { icon: <Globe className="w-4 h-4" />, label: "Location", value: selectedJob.isRemote ? "Remote" : "Hybrid/On-site", color: "text-indigo-600", bg: "bg-indigo-50" },
                    { icon: <Calendar className="w-4 h-4" />, label: "Deadline", value: "Open", color: "text-rose-600", bg: "bg-rose-50" },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                      <div className={`w-10 h-10 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                        {stat.icon}
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="font-black text-slate-900 truncate">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* AI Insights Card */}
            <section className="p-8 md:p-10 rounded-[48px] bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
              
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="w-20 h-20 shrink-0 rounded-3xl bg-blue-500/20 backdrop-blur-xl border border-blue-400/20 flex items-center justify-center shadow-inner">
                  <Sparkles className="w-10 h-10 text-blue-400" />
                </div>
                <div className="space-y-4 text-center md:text-left flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/20 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                    <TrendingUp className="w-3 h-3" />
                    AI Match Insight
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">How well do you fit this role?</h3>
                  <p className="text-slate-300 font-medium leading-relaxed">
                    Based on your saved resumes, you have <span className="text-blue-400 font-black">85%</span> of the required skills. 
                    Our AI can bridge the remaining gap by highlighting your transferable experiences in a tailored resume.
                  </p>
                </div>
                <button 
                  onClick={handleMatch}
                  disabled={isSaving}
                  className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-black hover:bg-blue-50 transition-all shadow-xl active:scale-95 whitespace-nowrap"
                >
                  {isSaving ? "Preparing..." : "Get AI Match"}
                </button>
              </div>
            </section>

            {/* Main Content Sections */}
            <div className="space-y-12">
              <section className="bg-white p-12 rounded-[48px] border border-slate-200/60 shadow-sm">
                <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  About the Role
                </h3>
                <div className="prose prose-slate prose-lg max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedJob.description}
                </div>
              </section>

              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <section className="bg-white p-12 rounded-[48px] border border-slate-200/60 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Target className="w-5 h-5" />
                    </div>
                    Responsibilities
                  </h3>
                  <ul className="space-y-6">
                    {selectedJob.responsibilities.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-slate-600 font-medium leading-relaxed">
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
                <section className="bg-white p-12 rounded-[48px] border border-slate-200/60 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    Qualifications
                  </h3>
                  <ul className="space-y-6">
                    {selectedJob.qualifications.map((item, i) => (
                      <li key={i} className="flex items-start gap-4 text-slate-600 font-medium leading-relaxed">
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
                <section className="bg-white p-12 rounded-[48px] border border-slate-200/60 shadow-sm">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    Benefits & Perks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedJob.benefits.map((benefit, i) => (
                      <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                          <CheckCircle2 className="w-5 h-5 text-rose-500" />
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
              <div className="p-10 rounded-[48px] bg-white border border-slate-200/60 shadow-2xl shadow-slate-900/5 space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Application Options</p>
                  <h4 className="text-xl font-black text-slate-900">Ready to take the leap?</h4>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={handleMatch}
                    disabled={isSaving}
                    className="w-full p-6 rounded-[24px] bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98] flex items-center justify-center gap-3 group overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Sparkles className="w-5 h-5" />
                    {isSaving ? "Processing..." : "Match Resume & Cover"}
                  </button>
                  
                  <a 
                    href={selectedJob.applyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full p-6 rounded-[24px] bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    Apply Now
                    <ExternalLink className="w-5 h-5" />
                  </a>
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
              <div className="p-10 rounded-[48px] bg-white border border-slate-200/60 shadow-sm space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">About the Employer</h4>
                <div className="flex items-center gap-4">
                  {selectedJob.companyLogo ? (
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 p-2 flex items-center justify-center">
                      <img src={selectedJob.companyLogo} alt={selectedJob.company} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl">
                      {selectedJob.company.charAt(0)}
                    </div>
                  )}
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
              <div className="px-10 text-center">
                <p className="text-xs text-slate-400 font-bold leading-relaxed">
                  Avoid scams. Never pay for a job application or interview. Report suspicious listings to our safety team.
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
}
