"use client";

import Link from "next/link";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Bookmark, ExternalLink, Building2, MapPin, ArrowRight } from "lucide-react";
import { useJobStore } from "@/store/useJobStore";

function companyColor(name: string): string {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-indigo-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-sky-500 to-blue-600",
    "from-amber-500 to-orange-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const STATUS_COLORS: Record<string, string> = {
  saved: "bg-blue-50 text-blue-600 border-blue-100",
  applied: "bg-indigo-50 text-indigo-600 border-indigo-100",
  interviewing: "bg-amber-50 text-amber-600 border-amber-100",
  offered: "bg-emerald-50 text-emerald-600 border-emerald-100",
  rejected: "bg-rose-50 text-rose-600 border-rose-100",
};

export default function SavedJobs() {
  const { savedJobs, fetchSavedJobs, isSavedLoading } = useJobStore();

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  // Show only the 2 most recent for the landing dashboard
  const recentJobs = savedJobs.slice(0, 2);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Saved Jobs</h2>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {savedJobs.length > 0
              ? `Tracking ${savedJobs.length} active opportunities`
              : "Save jobs to track them here"}
          </p>
        </div>
        <Link
          href="/jobs/saved"
          className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          View Pipeline
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isSavedLoading ? (
        <div className="flex items-center justify-center py-16 bg-white border border-slate-100 rounded-[32px]">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-600/20 animate-pulse" />
        </div>
      ) : recentJobs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center bg-white border border-slate-200 rounded-[32px] shadow-sm"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
            <Bookmark className="w-7 h-7 text-slate-200" />
          </div>
          <p className="text-slate-400 text-sm font-medium max-w-[240px] mb-6">
            No saved jobs yet. Explore opportunities and track them here.
          </p>
          <Link
            href="/jobs"
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/10"
          >
            Find Jobs
          </Link>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-6">
          {recentJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative p-6 rounded-[32px] bg-white border border-slate-200/60 hover:border-blue-300 hover:shadow-[0_15px_35px_-15px_rgba(30,58,138,0.1)] transition-all duration-500 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${companyColor(job.company_name)} flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-blue-900/5 shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}
                >
                  {job.company_name.charAt(0)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors leading-tight">
                      {job.job_title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-lg text-[9px] font-black border uppercase tracking-[0.15em] shrink-0 shadow-sm ${
                        STATUS_COLORS[job.status] || STATUS_COLORS.saved
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <div className="p-0.5 rounded bg-slate-50 border border-slate-100">
                        <Building2 className="w-3 h-3" />
                      </div>
                      <span className="truncate">{job.company_name}</span>
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1.5">
                        <div className="p-0.5 rounded bg-slate-50 border border-slate-100">
                          <MapPin className="w-3 h-3" />
                        </div>
                        <span className="truncate">{job.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                <Link 
                  href="/jobs/saved"
                  className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all border border-slate-100 shrink-0 shadow-sm active:scale-90"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
