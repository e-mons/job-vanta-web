"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Search as SearchIcon, 
  Sparkles, 
  ArrowLeft, 
  Filter, 
  Loader2, 
  MapPin, 
  Globe, 
  ChevronDown,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import JobCard from "@/components/jobs/JobCard";
import ResumeSelector from "@/components/jobs/ResumeSelector";
import PlatformSelectorCards from "@/components/jobs/PlatformSelectorCards";
import ResumeCompletenessSidebar from "@/components/jobs/ResumeCompletenessSidebar";
import ApplyModal from "@/components/jobs/ApplyModal";
import MissingFieldsModal from "@/components/jobs/MissingFieldsModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useJobStore, Job } from "@/store/useJobStore";
import { useResumeStore, UserResume } from "@/store/useResumeStore";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { toast } from "sonner";
import { useSubscriptionStore } from "@/store/useSubscription";
import UpgradeModal from "@/components/shared/UpgradeModal";
import { FormFieldDefinition } from "@/services/automation/browserbaseService";

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
    selectedPlatforms,
    hasSearched,
    setHasSearched
  } = useJobStore();
  const { userResumes, fetchUserResumes } = useResumeStore();
  const { getPlanTier } = useSubscriptionStore();
  const planTier = getPlanTier();
  const [selectedResume, setSelectedResume] = useState<UserResume | null>(null);
  const router = useRouter();

  // Filter States (Optional)
  const [filterLocation, setFilterLocation] = useState("");
  const [filterRadius, setFilterRadius] = useState("25");
  const [filterRemote, setFilterRemote] = useState(false);
  const [filterJobType, setFilterJobType] = useState("Full-time");
  const [filterExperience, setFilterExperience] = useState("Mid-level");
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);
  
  // Application Tracking & Modals
  const [userApplicationsMap, setUserApplicationsMap] = useState<
    Record<string, { id: string; status: string; missingFields: FormFieldDefinition[] }>
  >({});
  const [selectedApplyJob, setSelectedApplyJob] = useState<Job | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const [activeMissingAppId, setActiveMissingAppId] = useState<string | null>(null);
  const [activeMissingFields, setActiveMissingFields] = useState<FormFieldDefinition[]>([]);
  const [isMissingFieldsModalOpen, setIsMissingFieldsModalOpen] = useState(false);

  // Upgrade Modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTargetTier, setUpgradeTargetTier] = useState<'pro' | 'unlimited'>('pro');

  const searchParams = useSearchParams();
  const resumeIdParam = searchParams.get("resumeId");
  const triggerSearchParam = searchParams.get("triggerSearch");

  const supabase = createClient();

  // Load user applications to reflect live status badges
  const loadUserApplications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: apps } = await supabase
        .from("job_applications")
        .select("id, status, metadata, missing_fields")
        .eq("user_id", user.id);

      if (apps) {
        const map: Record<string, { id: string; status: string; missingFields: FormFieldDefinition[] }> = {};
        apps.forEach((a: any) => {
          const url = a.metadata?.applyLink || a.metadata?.job_url;
          const jobId = a.metadata?.jobId || a.metadata?.job_id;
          const entry = {
            id: a.id,
            status: a.status,
            missingFields: Array.isArray(a.missing_fields) ? a.missing_fields : [],
          };
          if (url) {
            map[url] = entry;
            const cleanUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
            map[cleanUrl] = entry;
          }
          if (jobId) {
            map[jobId] = entry;
          }
        });
        setUserApplicationsMap(map);
      }
    } catch (err) {
      console.warn("[JobsPage] Error loading applications:", err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSavedJobs();
    fetchUserResumes();
    loadUserApplications();
  }, [fetchSavedJobs, fetchUserResumes, loadUserApplications]);

  // Real-time synchronization for active applications
  useEffect(() => {
    let channel: any = null;
    let isMounted = true;

    const setupRealtime = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        const channelName = `user-job-apps-${user.id}-${Math.random().toString(36).substring(2, 9)}`;
        const newChannel = supabase.channel(channelName);

        newChannel
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "job_applications",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (!isMounted) return;
              console.log("[JobsPage Realtime] Application update:", payload);
              loadUserApplications();
            }
          )
          .subscribe();

        channel = newChannel;
      } catch (e) {
        console.warn("[JobsPage Realtime] Setup error:", e);
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase, loadUserApplications]);

  // Polling fallback while any application is in an active state
  const hasActiveApplications = useMemo(() => {
    return Object.values(userApplicationsMap).some(
      (app) => app.status === "queued" || app.status === "detecting_fields" || app.status === "submitting"
    );
  }, [userApplicationsMap]);

  useEffect(() => {
    if (!hasActiveApplications) return;

    const interval = setInterval(() => {
      loadUserApplications();
    }, 2000);

    return () => clearInterval(interval);
  }, [hasActiveApplications, loadUserApplications]);

  // Handle auto-selection of resume from URL
  useEffect(() => {
    if (resumeIdParam && userResumes.length > 0 && !selectedResume) {
      const resume = userResumes.find(r => r.id === resumeIdParam);
      if (resume) {
        setSelectedResume(resume);
        if (triggerSearchParam === "true") {
          searchByResume(
            resume.content?.skills || [],
            {
              location: filterLocation,
              radius: filterRadius,
              isRemote: filterRemote,
              jobType: filterJobType,
              experienceLevel: filterExperience,
            },
            resume.id,
            selectedPlatforms
          );
        }
      }
    }
  }, [resumeIdParam, userResumes, selectedResume, triggerSearchParam, selectedPlatforms]);

  // Auto-detect client location
  const detectUserLocation = async (): Promise<string> => {
    if (selectedResume?.content?.personalInfo?.location) {
      return selectedResume.content.personalInfo.location;
    }
    try {
      const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data.city && data.country_name) {
          return `${data.city}, ${data.country_name}`;
        }
      }
    } catch {}
    return "Remote";
  };

  const handleResumeSelect = (resume: UserResume) => {
    setSelectedResume(resume);
  };

  const handleSearchSubmit = async () => {
    if (!selectedResume) return;
    let locationToUse = filterLocation;
    if (!locationToUse || locationToUse.trim().length === 0) {
      locationToUse = await detectUserLocation();
    }
    searchByResume(
      selectedResume.content?.skills || [],
      {
        location: locationToUse,
        radius: filterRadius,
        isRemote: filterRemote,
        jobType: filterJobType,
        experienceLevel: filterExperience,
      },
      selectedResume.id,
      selectedPlatforms
    );
  };

  const handleResetSelection = () => {
    setSelectedResume(null);
    setHasSearched(false);
    resetJobs();
  };

  // Open the Apply Modal with choices (Manual vs AI Agent)
  const handleOpenApplyModal = (job: Job) => {
    if (planTier === 'free') {
      setUpgradeTargetTier('pro');
      setIsUpgradeModalOpen(true);
      return;
    }
    setSelectedApplyJob(job);
    setIsApplyModalOpen(true);
  };

  // Handle Missing Fields Resolution
  const handleResolveMissingFields = (job: Job) => {
    const applyUrl = job.job_url || job.applyLink || "";
    const cleanUrl = applyUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const appInfo = userApplicationsMap[job.id] || userApplicationsMap[applyUrl] || userApplicationsMap[cleanUrl];

    if (appInfo && appInfo.missingFields.length > 0) {
      setActiveMissingAppId(appInfo.id);
      setActiveMissingFields(appInfo.missingFields);
      setIsMissingFieldsModalOpen(true);
    } else if (selectedResume) {
      // Redirect to dedicated resume view page
      router.push(`/resumes/${selectedResume.id}?applicationId=${appInfo?.id || ""}`);
    }
  };

  const displayLimit = planTier === 'free' ? 25 : planTier === 'pro' ? 45 : Infinity;
  const displayedJobs = searchResults.slice(0, displayLimit);
  const hasHiddenJobs = (planTier !== 'unlimited' && (planTier as any) !== 'enterprise') && searchResults.length > displayLimit;

  const handleUpgradePrompt = () => {
    setUpgradeTargetTier(planTier === 'free' ? 'pro' : 'unlimited');
    setIsUpgradeModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-10 pb-24 lg:pb-12 max-w-7xl mx-auto space-y-10">
        {/* Header Title Area (NO stats cards) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <SearchIcon className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">
                AI Job Discovery & Automated Applications
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {hasSearched && selectedResume ? (
                <>Top Job Matches for <span className="text-blue-600">{selectedResume.title}</span></>
              ) : (
                <>Targeted <span className="text-blue-600">Job Search</span></>
              )}
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              {hasSearched && selectedResume 
                ? "Live verified opportunities. Apply manually or automate with our AI Agent."
                : "Select your CV and target platforms to query verified hiring portals via Brave Search."}
            </p>
          </div>

          {hasSearched && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSearchSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-black transition-all border border-blue-200 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh Jobs</span>
              </button>

              <button
                onClick={handleResetSelection}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all border border-slate-200 shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change CV / Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Search & Results Column */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence mode="wait">
              {!hasSearched ? (
                <motion.div
                  key="search-configuration"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  {/* Step 1: Select Resume */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            1. Select Resume
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                              Compulsory
                            </span>
                          </h2>
                          <p className="text-xs text-slate-500 font-medium">
                            Tailor queries and match scoring to your exact experience
                          </p>
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
                      <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                        <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 font-bold mb-4 text-base">No resumes found yet</p>
                        <Link 
                          href="/builder"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all text-sm shadow-lg shadow-blue-600/20"
                        >
                          Create Your First Resume
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Select Target Platforms (Greenhouse, Lever, Workable, Wellfound) */}
                  {userResumes.length > 0 && (
                    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
                      <PlatformSelectorCards />
                    </div>
                  )}

                  {/* Step 3: Optional Search Filters */}
                  {userResumes.length > 0 && (
                    <div className="rounded-3xl bg-slate-50/70 border border-slate-200/80 shadow-sm overflow-hidden transition-all">
                      <button
                        type="button"
                        onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                        className="w-full flex items-center justify-between p-6 text-left outline-none cursor-pointer focus:bg-slate-100/50 select-none group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-sm group-hover:scale-105 transition-transform">
                            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                              Optional Search Filters
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-200/70 px-2 py-0.5 rounded-md">
                                Optional
                              </span>
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                              Refine location, job type, or remote preferences (or leave empty)
                            </p>
                          </div>
                        </div>
                        
                        <div className={`p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all ${isFiltersExpanded ? 'rotate-180 text-blue-600 border-blue-200' : 'text-slate-400'}`}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isFiltersExpanded && (
                          <motion.div
                            key="filters-drawer"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden border-t border-dashed border-slate-200 px-6 pb-6 pt-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {/* Location */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  Target Location
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. San Francisco, CA or Remote"
                                  value={filterLocation}
                                  onChange={(e) => setFilterLocation(e.target.value)}
                                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 outline-none text-sm font-medium shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                                />
                              </div>

                              {/* Job Type */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                  Job Type
                                </label>
                                <select
                                  value={filterJobType}
                                  onChange={(e) => setFilterJobType(e.target.value)}
                                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 outline-none text-sm font-medium shadow-sm focus:border-blue-500 transition-all cursor-pointer"
                                >
                                  <option value="Full-time">Full-time</option>
                                  <option value="Part-time">Part-time</option>
                                  <option value="Contract">Contract</option>
                                  <option value="Internship">Internship</option>
                                </select>
                              </div>

                              {/* Experience Level */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700">
                                  Experience Level
                                </label>
                                <select
                                  value={filterExperience}
                                  onChange={(e) => setFilterExperience(e.target.value)}
                                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 outline-none text-sm font-medium shadow-sm focus:border-blue-500 transition-all cursor-pointer"
                                >
                                  <option value="Entry-level">Entry-level</option>
                                  <option value="Mid-level">Mid-level</option>
                                  <option value="Senior-level">Senior-level</option>
                                  <option value="Executive">Executive</option>
                                </select>
                              </div>

                              {/* Remote Checkbox */}
                              <div className="md:col-span-2 lg:col-span-3 pt-2">
                                <label className="inline-flex items-center gap-3 cursor-pointer p-3.5 px-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 shadow-sm transition-all select-none">
                                  <input
                                    type="checkbox"
                                    checked={filterRemote}
                                    onChange={(e) => setFilterRemote(e.target.checked)}
                                    className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
                                  />
                                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                                    Prioritize 100% Remote Opportunities
                                  </span>
                                </label>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Primary Search CTA */}
                  {userResumes.length > 0 && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        disabled={!selectedResume || isLoading}
                        className={`w-full py-4 sm:py-5 rounded-3xl font-black text-base transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                          selectedResume 
                            ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 hover:scale-[1.005] active:scale-[0.99] cursor-pointer" 
                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Searching Greenhouse, Lever, Workable & Wellfound...</span>
                          </div>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span>Search Matching Jobs Across Platforms</span>
                          </>
                        )}
                      </button>
                      {!selectedResume && (
                        <p className="text-center text-rose-500 font-bold text-xs mt-3">
                          ⚠️ Please select a resume above to launch your search!
                        </p>
                      )}
                    </div>
                  )}
                </motion.div>
              ) : (
                /* Results View: Top Job Matches List */
                <motion.div
                  key="results-active-view"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Results Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-slate-900 leading-tight">
                          Top Job Matches ({displayedJobs.length})
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          Queried from {selectedPlatforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                        Sorted by Fit Score
                      </span>
                    </div>
                  </div>

                  {/* Loading State */}
                  {isLoading && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-xl flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                            <Sparkles className="w-3 h-3 text-blue-200 animate-spin" />
                            Brave Job Search Engine Active
                          </div>
                          <h4 className="text-xl font-black">Querying Live Platform Boards...</h4>
                          <p className="text-xs text-blue-100 font-medium">Evaluating job descriptions, requirements, and salaries.</p>
                        </div>
                        <Loader2 className="w-7 h-7 text-white animate-spin shrink-0" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="p-6 rounded-[32px] bg-white border border-slate-200/80 shadow-sm h-[320px] flex flex-col justify-between">
                            <div className="flex items-center gap-3">
                              <Skeleton className="w-12 h-12 rounded-2xl bg-slate-100" />
                              <div className="space-y-2 flex-1">
                                <Skeleton className="w-24 h-4 bg-slate-100" />
                                <Skeleton className="w-16 h-3 bg-slate-100" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Skeleton className="w-3/4 h-5 bg-slate-100" />
                              <Skeleton className="w-1/2 h-4 bg-slate-100" />
                            </div>
                            <Skeleton className="w-full h-10 rounded-xl bg-slate-100" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {error && !isLoading && (
                    <div className="text-center py-16 bg-rose-50 rounded-3xl border border-rose-100 p-6 space-y-3">
                      <p className="text-rose-600 font-bold text-base">{error}</p>
                      <button 
                        onClick={handleSearchSubmit}
                        className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-md shadow-rose-600/20"
                      >
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Results Grid */}
                  {!isLoading && displayedJobs.length > 0 && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {displayedJobs.map((job, index) => {
                          const applyUrl = job.job_url || job.applyLink || "";
                          const cleanUrl = applyUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
                          const appTracking = userApplicationsMap[job.id] || userApplicationsMap[applyUrl] || userApplicationsMap[cleanUrl];
                          const liveStatus = appTracking?.status || job.applied_status || "not_applied";

                          return (
                            <JobCard
                              key={job.id || `${job.title}-${index}`}
                              job={job}
                              index={index}
                              applicationStatus={liveStatus}
                              onApplyNow={() => handleOpenApplyModal(job)}
                              onResolveMissing={() => handleResolveMissingFields(job)}
                              isLocked={planTier === 'free'}
                              onUpgradeClick={handleUpgradePrompt}
                              matchSkills={selectedResume?.content?.skills || []}
                            />
                          );
                        })}
                      </div>

                      {hasHiddenJobs && (
                        <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xl text-white">
                          <div>
                            <h4 className="text-xl font-black mb-1">
                              Unlock {searchResults.length - displayLimit} more matching opportunities!
                            </h4>
                            <p className="text-xs text-blue-200 font-medium">
                              Upgrade your plan to unlock direct instant applications and see all matches.
                            </p>
                          </div>
                          <button
                            onClick={handleUpgradePrompt}
                            className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black text-xs hover:bg-blue-50 transition-all shrink-0 shadow-md"
                          >
                            Upgrade to Pro
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback Zero Results */}
                  {!isLoading && !error && searchResults.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                        <SearchIcon className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Broadening job search...</h3>
                      <p className="text-slate-500 text-xs max-w-sm mx-auto">
                        We are currently expanding queries across Greenhouse, Lever, Workable, and Wellfound.
                      </p>
                      <button
                        onClick={handleSearchSubmit}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
                      >
                        Search Again
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Sidebar: Selected Resume Completeness & Recent Activity */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            <ResumeCompletenessSidebar resume={selectedResume} />
          </div>
        </div>

        {/* Apply Options Modal (Manual vs AI Agent) */}
        <ApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          job={selectedApplyJob}
          selectedResume={selectedResume}
          onApplicationStarted={(appId, status) => {
            if (selectedApplyJob) {
              const applyUrl = selectedApplyJob.job_url || selectedApplyJob.applyLink || "";
              const cleanUrl = applyUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
              const optimistic = {
                id: appId,
                status: status || "queued",
                missingFields: [],
              };
              setUserApplicationsMap((prev) => ({
                ...prev,
                [selectedApplyJob.id]: optimistic,
                [applyUrl]: optimistic,
                [cleanUrl]: optimistic,
              }));
            }
            loadUserApplications();
          }}
        />

        {/* Inline Missing Fields Modal */}
        <MissingFieldsModal
          isOpen={isMissingFieldsModalOpen}
          onClose={() => setIsMissingFieldsModalOpen(false)}
          applicationId={activeMissingAppId}
          missingFields={activeMissingFields}
          onSuccess={() => {
            loadUserApplications();
          }}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          targetTier={upgradeTargetTier}
          reason={
            upgradeTargetTier === 'unlimited'
              ? "You've reached your Pro job limit. Upgrade to Unlimited Plan for unlimited search matches and applications."
              : "Free users have limited job search visibility. Upgrade to Pro for 18 results and full application access!"
          }
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
