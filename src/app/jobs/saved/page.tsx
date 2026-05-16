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

function companyColor(name: string): string {
  const colors = [
    "from-blue-600 to-indigo-600",
    "from-indigo-600 to-violet-600",
    "from-emerald-600 to-teal-600",
    "from-orange-600 to-rose-600",
    "from-sky-600 to-blue-700",
    "from-amber-600 to-orange-600",
    "from-violet-600 to-purple-600",
    "from-cyan-600 to-blue-700",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      onClick={handleViewDetails}
      className={`group p-6 rounded-[32px] bg-white border border-slate-200/60 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 relative overflow-hidden cursor-pointer`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${companyColor(job.company_name)} flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200 shrink-0 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
          >
            {job.company_name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-base font-black text-slate-900 truncate leading-tight group-hover:text-blue-600 transition-colors">
                {job.job_title}
              </h3>
              {job.job_url && (
                <a
                  href={job.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-2 text-xs font-bold text-slate-500">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="truncate">{job.company_name}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 text-[11px] font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{job.location || 'Remote'}</span>
          </div>
          <span className="text-slate-200">•</span>
          <span>{new Date(job.updated_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-50">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${config.bgColor} ${config.color} border ${config.borderColor}`}
          >
            {config.icon}
            {config.label}
          </span>
          
          <div className="flex items-center gap-2">
            {nextStatus && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  updateJobStatus(job.id, nextStatus);
                }}
                className="flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all uppercase tracking-wider"
              >
                Next <ChevronRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                unsaveJob(job.id);
              }}
              className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
              title="Unsave Job"
            >
              <Trash2 className="w-4 h-4" />
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
