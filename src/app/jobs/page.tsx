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
  Filter,
  Loader2,
  CheckCircle2,
  MapPin,
  Globe,
  ChevronDown
} from "lucide-react";
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
    selectedJob,
    hasSearched,
    setHasSearched
  } = useJobStore();
  const { userResumes, fetchUserResumes, reset: resetResumes } = useResumeStore();
  const [selectedResume, setSelectedResume] = useState<UserResume | null>(null);
  const router = useRouter();

  // Filter States (Optional)
  const [filterLocation, setFilterLocation] = useState("");
  const [filterRadius, setFilterRadius] = useState("25");
  const [filterRemote, setFilterRemote] = useState(false);
  const [filterJobType, setFilterJobType] = useState("Full-time");
  const [filterExperience, setFilterExperience] = useState("Mid-level");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  
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
        setSelectedResume(resume);
        searchByResume(resume.content.skills || [], {
          location: filterLocation,
          radius: filterRadius,
          isRemote: filterRemote,
          jobType: filterJobType,
          experienceLevel: filterExperience
        });
      }
    }
  }, [resumeIdParam, userResumes, selectedResume]);

  const handleResumeSelect = (resume: UserResume) => {
    setSelectedResume(resume);
  };

  const handleSearchSubmit = () => {
    if (!selectedResume) return;
    searchByResume(selectedResume.content.skills || [], {
      location: filterLocation,
      radius: filterRadius,
      isRemote: filterRemote,
      jobType: filterJobType,
      experienceLevel: filterExperience
    });
  };

  const handleResetSelection = () => {
    setSelectedResume(null);
    setHasSearched(false);
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
                {hasSearched && selectedResume ? (
                  <>Matching Jobs for <span className="text-blue-600">{selectedResume.title}</span></>
                ) : (
                  <>Find your <span className="text-blue-600">dream job</span></>
                )}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {hasSearched && selectedResume 
                  ? "We've analyzed your skills and filters to find the best opportunities."
                  : "Choose your resume and search verified opportunities instantly."}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!hasSearched ? (
              <motion.div
                key="search-config"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Step 1: Select Resume */}
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/20">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                          1. Select Resume
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                            Compulsory
                          </span>
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-0.5">Which resume should we base your job search on?</p>
                      </div>
                    </div>
                  </div>

                  {userResumes.length > 0 ? (
                    <ResumeSelector 
                      resumes={userResumes} 
                      onSelect={handleResumeSelect}
                      selectedId={selectedResume?.id}
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

                {/* Step 2: Optional Filters Form Box */}
                {userResumes.length > 0 && (
                  <div className="relative rounded-[40px] bg-slate-50/70 border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    
                    {/* Accordion Toggle Header */}
                    <button
                      type="button"
                      onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                      className="w-full flex items-center justify-between p-8 sm:p-10 text-left outline-none cursor-pointer focus:bg-slate-100/30 select-none group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-sm group-hover:scale-105 transition-transform duration-300">
                          <Filter className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            2. Optional Filters
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200/60 px-2.5 py-1 rounded-md">
                              Optional
                            </span>
                          </h2>
                          <p className="text-sm text-slate-500 font-medium">Fine-tune your search with these optional settings (or leave them empty!)</p>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 group-hover:bg-slate-50 ${isFiltersExpanded ? 'rotate-180 text-blue-600 border-blue-200' : 'text-slate-400'}`}>
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </button>

                    {/* Accordion Content */}
                    <AnimatePresence initial={false}>
                      {isFiltersExpanded && (
                        <motion.div
                          key="filters-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ 
                            height: "auto", 
                            opacity: 1,
                            transition: {
                              height: { type: "spring", stiffness: 300, damping: 30 },
                              opacity: { duration: 0.2, delay: 0.05 }
                            }
                          }}
                          exit={{ 
                            height: 0, 
                            opacity: 0,
                            transition: {
                              height: { duration: 0.25 },
                              opacity: { duration: 0.15 }
                            }
                          }}
                          className="overflow-hidden"
                        >
                          <div className="p-8 sm:p-10 pt-0 sm:pt-0 border-t border-dashed border-slate-200/60 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
                              {/* Preferred City/State */}
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4 text-slate-400" />
                                  Preferred City / State
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. New York, NY or Remote"
                                  value={filterLocation}
                                  onChange={(e) => setFilterLocation(e.target.value)}
                                  className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none text-base font-bold shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                              </div>

                              {/* Radius */}
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                  Radius (miles)
                                </label>
                                <select
                                  value={filterRadius}
                                  onChange={(e) => setFilterRadius(e.target.value)}
                                  className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 outline-none text-base font-bold shadow-sm focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                  style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 1.25rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat' }}
                                >
                                  <option value="5">Within 5 miles</option>
                                  <option value="15">Within 15 miles</option>
                                  <option value="25">Within 25 miles</option>
                                  <option value="50">Within 50 miles</option>
                                  <option value="100">Within 100 miles</option>
                                </select>
                              </div>

                              {/* Job Type */}
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                  Job Type
                                </label>
                                <select
                                  value={filterJobType}
                                  onChange={(e) => setFilterJobType(e.target.value)}
                                  className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 outline-none text-base font-bold shadow-sm focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                  style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 1.25rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat' }}
                                >
                                  <option value="Full-time">Full-time</option>
                                  <option value="Part-time">Part-time</option>
                                  <option value="Contract">Contract</option>
                                  <option value="Internship">Internship</option>
                                </select>
                              </div>

                              {/* Experience Level */}
                              <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">
                                  Experience Level
                                </label>
                                <select
                                  value={filterExperience}
                                  onChange={(e) => setFilterExperience(e.target.value)}
                                  className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-900 outline-none text-base font-bold shadow-sm focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                  style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 1.25rem center', backgroundSize: '1.5em 1.5em', backgroundRepeat: 'no-repeat' }}
                                >
                                  <option value="Entry-level">Entry-level</option>
                                  <option value="Mid-level">Mid-level</option>
                                  <option value="Senior-level">Senior-level</option>
                                  <option value="Executive">Executive</option>
                                </select>
                              </div>

                              {/* Remote Only */}
                              <div className="flex items-end">
                                <label className="w-full flex items-center gap-4 cursor-pointer p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 shadow-sm transition-all select-none">
                                  <input
                                    type="checkbox"
                                    checked={filterRemote}
                                    onChange={(e) => setFilterRemote(e.target.checked)}
                                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                                      <Globe className="w-4 h-4 text-blue-500" />
                                      Remote Only
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">Work-from-home jobs only</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Big Search CTA */}
                {userResumes.length > 0 && (
                  <div className="pt-4">
                    <button
                      onClick={handleSearchSubmit}
                      disabled={!selectedResume || isLoading}
                      className={`w-full py-5 rounded-3xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                        selectedResume 
                          ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer" 
                          : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6" />
                          <span>Search Matching Jobs</span>
                        </>
                      )}
                    </button>
                    {!selectedResume && (
                      <p className="text-center text-rose-500 font-bold text-sm mt-3 animate-pulse">
                        ⚠️ Please select a resume above to search!
                      </p>
                    )}
                  </div>
                )}
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
                    Change Resume & Filters
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
                    <button onClick={handleSearchSubmit} className="mt-4 text-sm font-bold text-rose-500 hover:text-rose-700 underline underline-offset-4">
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
