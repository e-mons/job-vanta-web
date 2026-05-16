"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Bookmark, 
  TrendingUp, 
  Search as SearchIcon, 
  LogOut, 
  LayoutDashboard,
  Sparkles,
  ArrowLeft,
  Filter
} from "lucide-react";
import SearchBar from "@/components/jobs/SearchBar";
import JobCard from "@/components/jobs/JobCard";
import ResumeSelector from "@/components/jobs/ResumeSelector";
import JobDetailsModal from "@/components/jobs/JobDetailsModal";
import ApplyModal from "@/components/jobs/ApplyModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useJobStore, Job } from "@/store/useJobStore";
import { useResumeStore, UserResume } from "@/store/useResumeStore";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";

function JobsPageContent() {
  const { 
    searchResults, 
    isLoading, 
    error, 
    fetchSavedJobs, 
    searchByResume, 
    reset: resetJobs,
    setSelectedJob,
    selectedJob
  } = useJobStore();
  const { userResumes, fetchUserResumes, reset: resetResumes } = useResumeStore();
  const [selectedResume, setSelectedResume] = useState<UserResume | null>(null);
  const router = useRouter();
  
  // Modal states
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const searchParams = useSearchParams();
  const resumeIdParam = searchParams.get("resumeId");



  useEffect(() => {
    fetchSavedJobs();
    fetchUserResumes();
  }, [fetchSavedJobs, fetchUserResumes]);

  // Handle auto-selection of resume from URL
  useEffect(() => {
    if (resumeIdParam && userResumes.length > 0 && !selectedResume) {
      const resume = userResumes.find(r => r.id === resumeIdParam);
      if (resume) {
        handleResumeSelect(resume);
      }
    }
  }, [resumeIdParam, userResumes, selectedResume]);

  const handleResumeSelect = (resume: UserResume) => {
    setSelectedResume(resume);
    searchByResume(resume.content.skills || []);
  };

  const handleResetSelection = () => {
    setSelectedResume(null);
    resetJobs();
  };

  const handleViewJob = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsOpen(true);
  };

  const handleOpenApply = () => {
    if (selectedJob) {
      setApplyingJob(selectedJob);
      setIsApplyOpen(true);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <SearchIcon className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Marketplace</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {selectedResume ? (
                  <>Matching Jobs for <span className="text-blue-600">{selectedResume.title}</span></>
                ) : (
                  <>Find your <span className="text-blue-600">dream job</span></>
                )}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {selectedResume 
                  ? "We've analyzed your skills to find the best opportunities."
                  : "Browse verified opportunities or match using your resume."}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!selectedResume ? (
              <motion.div
                key="resume-selector"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                <div className="max-w-4xl">
                  <SearchBar />
                </div>

                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900">Your Resumes</h2>
                    </div>
                  </div>
                  
                  {userResumes.length > 0 ? (
                    <ResumeSelector 
                      resumes={userResumes} 
                      onSelect={handleResumeSelect} 
                    />
                  ) : (
                    <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                      <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500 font-bold mb-6 text-lg">No resumes found yet</p>
                      <Link 
                        href="/builder"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20"
                      >
                        Create Your First Resume
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="results-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={handleResetSelection}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change Resume
                  </button>
                </div>

                {/* Loading state */}
                {isLoading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="p-8 rounded-[40px] bg-white border border-slate-100 shadow-sm h-[400px]">
                        <div className="flex items-start justify-between mb-8">
                          <Skeleton className="w-16 h-16 rounded-[22px] bg-slate-50" />
                          <Skeleton className="w-10 h-10 rounded-2xl bg-slate-50" />
                        </div>
                        <Skeleton className="w-3/4 h-6 mb-4 bg-slate-50" />
                        <Skeleton className="w-1/2 h-4 mb-8 bg-slate-50" />
                        <div className="space-y-3 mb-10">
                          <Skeleton className="w-full h-4 bg-slate-50" />
                          <Skeleton className="w-full h-4 bg-slate-50" />
                          <Skeleton className="w-2/3 h-4 bg-slate-50" />
                        </div>
                        <Skeleton className="w-full h-14 rounded-2xl bg-slate-50" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Error state */}
                {error && !isLoading && (
                  <div className="text-center py-20 bg-rose-50 rounded-[40px] border border-rose-100">
                    <p className="text-rose-600 font-bold text-lg">{error}</p>
                    <button onClick={() => handleResumeSelect(selectedResume)} className="mt-4 text-sm font-bold text-rose-500 hover:text-rose-700 underline underline-offset-4">
                      Try again
                    </button>
                  </div>
                )}

                {/* Results grid */}
                {!isLoading && searchResults.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {searchResults.map((job, index) => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        index={index} 
                        onApply={() => handleViewJob(job)}
                      />
                    ))}
                  </div>
                )}

                {!isLoading && !error && searchResults.length === 0 && (
                  <div className="text-center py-32 bg-white rounded-[40px] border border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <SearchIcon className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No direct matches found</h3>
                    <p className="text-slate-500 max-w-sm mx-auto font-medium">
                      Try adjusting your resume skills or search manually for broader results.
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modals */}
        <JobDetailsModal 
          job={selectedJob}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          onApply={handleOpenApply}
        />

        <ApplyModal 
          job={applyingJob}
          resume={selectedResume}
          isOpen={isApplyOpen}
          onClose={() => setIsApplyOpen(false)}
          onSuccess={() => {
            // Maybe refresh search results or show a success message
          }}
        />
      </div>
    </DashboardLayout>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Skeleton className="w-32 h-32 rounded-full" /></div>}>
      <JobsPageContent />
    </Suspense>
  );
}
