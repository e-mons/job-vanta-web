"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bookmark,
  Search as SearchIcon,
  Briefcase,
  Heart,
  Send,
  MessageSquare,
  Trophy,
  XCircle,
  ExternalLink,
  Building2,
  MapPin,
  ChevronRight,
  Trash2,
  LogOut,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { useJobStore, SavedJob, JobStatus } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import Image from "next/image";
import CompanyLogo from "@/components/jobs/CompanyLogo";

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; icon: React.ReactNode; color: string; bgColor: string; borderColor: string }
> = {
  saved: {
    label: "Saved",
    icon: <Heart className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50/50",
    borderColor: "border-blue-100",
  },
  applied: {
    label: "Applied",
    icon: <Send className="w-4 h-4" />,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50/50",
    borderColor: "border-indigo-100",
  },
  interviewing: {
    label: "Interviewing",
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50/50",
    borderColor: "border-amber-100",
  },
  offered: {
    label: "Offered",
    icon: <Trophy className="w-4 h-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50/50",
    borderColor: "border-emerald-100",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-rose-600",
    bgColor: "bg-rose-50/50",
    borderColor: "border-rose-100",
  },
};

const STATUS_ORDER: JobStatus[] = ["saved", "applied", "interviewing", "offered", "rejected"];

function SavedJobCard({
  job,
  index,
}: {
  job: SavedJob;
  index: number;
}) {
  const { updateJobStatus, unsaveJob, setSelectedJob } = useJobStore();
  const router = useRouter();
  const config = STATUS_CONFIG[job.status];
  const currentIdx = STATUS_ORDER.indexOf(job.status);
  const nextStatus = currentIdx < STATUS_ORDER.length - 2 ? STATUS_ORDER[currentIdx + 1] : null;

  const handleViewDetails = () => {
    const searchResultJob = job.metadata || {
      id: job.id,
      title: job.job_title,
      company: job.company_name,
      location: job.location || '',
      salary: '',
      description: '',
      type: '',
      applyLink: job.job_url || '',
      source: 'saved',
      postedAt: job.created_at,
      skills: [],
      isRemote: false,
      companyLogo: null
    };
    setSelectedJob(searchResultJob as any);
    router.push(`/jobs/${job.id}`);
  };

  const isRemote = job.location ? job.location.toLowerCase().includes('remote') : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      onClick={handleViewDetails}
      className="group p-5 rounded-[24px] bg-white border border-slate-200/70 hover:border-blue-400 hover:shadow-[0_15px_30px_-5px_rgba(59,130,246,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer min-h-[220px]"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Top Header Row: Logo & Badges */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="relative transform group-hover:scale-105 transition-transform duration-300">
              <CompanyLogo 
                logoUrl={job.metadata?.companyLogo || null} 
                companyName={job.company_name} 
                size="sm"
                className="p-0.5 rounded-xl border border-slate-100/80 shadow-sm"
              />
            </div>
            
            {/* Tiny Location Pill */}
            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
              isRemote ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"
            }`}>
              {isRemote ? "Remote" : "Hybrid"}
            </span>
          </div>

          {/* Job Title: Full width, clamped to 2 lines to align nicely */}
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 min-h-[2.5rem]">
              {job.job_title}
            </h3>
            
            {/* Company & Location Details */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{job.company_name}</span>
              </div>
              
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="truncate">{job.location || 'Remote'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions Area */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${config.bgColor} ${config.color} border ${config.borderColor}`}
          >
            {config.icon}
            {config.label}
          </span>
          
          <div className="flex items-center gap-1.5">
            {nextStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateJobStatus(job.id, nextStatus);
                }}
                className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-blue-600 hover:text-white border border-slate-100 hover:border-blue-600 text-[9px] font-black text-slate-500 transition-all uppercase tracking-wider"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                unsaveJob(job.id);
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
              title="Unsave Job"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function SavedJobsPage() {
  const { savedJobs, isSavedLoading, fetchSavedJobs, reset: resetJobs } = useJobStore();
  const resetResumes = useResumeStore(s => s.reset);
  const router = useRouter();

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const grouped: Record<JobStatus, SavedJob[]> = {
    saved: [],
    applied: [],
    interviewing: [],
    offered: [],
    rejected: [],
  };
  savedJobs.forEach((j) => {
    if (grouped[j.status]) grouped[j.status].push(j);
    else grouped.saved.push(j);
  });

  const activeStatuses = STATUS_ORDER.filter((s) => s !== "rejected");

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Bookmark className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">My Pipeline</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Saved <span className="text-blue-600">Opportunities</span>
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Track and manage your applications across all stages.
              </p>
            </div>
            <div className="flex items-center gap-4">
               <Link href="/jobs" className="px-8 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 font-black text-sm hover:border-blue-600 hover:text-blue-600 transition-all shadow-lg shadow-slate-200/50 flex items-center gap-2">
                 <SearchIcon className="w-4 h-4" /> Find New Roles
               </Link>
            </div>
          </div>

          {/* Pipeline columns */}
          {isSavedLoading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
              <div className="w-16 h-16 rounded-[24px] bg-white border border-slate-100 shadow-xl flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <span className="text-slate-400 font-black text-xs uppercase tracking-[0.3em] animate-pulse">Syncing your pipeline...</span>
            </div>
          ) : savedJobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[48px] border border-slate-200/60 shadow-2xl shadow-slate-200/50 p-12"
            >
              <div className="w-28 h-28 rounded-[40px] bg-slate-50 border border-slate-100 flex items-center justify-center mb-10 shadow-inner">
                <Bookmark className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">Your pipeline is empty</h3>
              <p className="text-slate-500 max-w-md mb-12 font-medium text-base">
                Found a job you love? Save it to track its progress here and never miss a follow-up.
              </p>
              <Link
                href="/jobs"
                className="px-12 py-5 rounded-[24px] bg-blue-600 text-white font-black text-base hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-500/30 transition-all active:scale-95"
              >
                Explore Opportunities
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
              {activeStatuses.map((status) => {
                const config = STATUS_CONFIG[status];
                const jobs = grouped[status];
                return (
                  <div key={status} className="flex flex-col min-h-[600px]">
                    {/* Column header */}
                    <div className={`flex items-center gap-3 mb-8 pb-5 border-b-2 ${config.borderColor} relative group/header`}>
                      <div className={`p-2.5 rounded-xl ${config.bgColor} ${config.color} shadow-sm transition-transform group-hover/header:rotate-12`}>
                        {config.icon}
                      </div>
                      <span className="text-lg font-black text-slate-900 tracking-tight">{config.label}</span>
                      <span className="ml-auto px-3 py-1 rounded-xl bg-slate-100 text-[11px] font-black text-slate-500 shadow-inner">
                        {jobs.length}
                      </span>
                    </div>

                    {/* Cards container */}
                    <div className="space-y-6">
                      {jobs.map((job, i) => (
                        <SavedJobCard key={job.id} job={job} index={i} />
                      ))}
                      {jobs.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-white/50 group/empty hover:bg-white hover:border-slate-300 transition-all">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] group-hover/empty:text-slate-400">Empty Stage</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rejected section */}
          {grouped.rejected.length > 0 && (
            <div className="mt-32">
              <div className="flex items-center gap-6 mb-12">
                <div className="h-px flex-1 bg-slate-200/60" />
                <div className="flex items-center gap-3 px-8 py-3 rounded-2xl bg-white border border-slate-200/60 shadow-xl shadow-slate-200/50">
                  <XCircle className="w-5 h-5 text-rose-500" />
                  <span className="text-base font-black text-slate-900">Archive</span>
                  <span className="ml-2 px-3 py-1 rounded-xl bg-rose-50 text-[11px] font-black text-rose-500 border border-rose-100">
                    {grouped.rejected.length}
                  </span>
                </div>
                <div className="h-px flex-1 bg-slate-200/60" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {grouped.rejected.map((job, i) => (
                  <SavedJobCard key={job.id} job={job} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
