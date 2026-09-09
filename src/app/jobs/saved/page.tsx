"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bookmark, 
  Search as SearchIcon, 
  Briefcase, 
  ArrowRight, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  Sparkles, 
  Heart,
  SlidersHorizontal,
  Layers,
  ChevronRight
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import JobCard from "@/components/jobs/JobCard";
import ApplyModal from "@/components/jobs/ApplyModal";
import MissingFieldsModal from "@/components/jobs/MissingFieldsModal";
import { useJobStore, SavedJob, Job } from "@/store/useJobStore";
import { useResumeStore, UserResume } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import { createClient } from "@/utils/supabase/client";
import { FormFieldDefinition, detectPlatform } from "@/services/automation/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SavedJobsPage() {
  const { savedJobs, isSavedLoading, fetchSavedJobs, unsaveJob } = useJobStore();
  const { userResumes, fetchUserResumes } = useResumeStore();
  const { getPlanTier } = useSubscriptionStore();
  const planTier = getPlanTier();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "saved" | "applied" | "in_progress">("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [selectedResume, setSelectedResume] = useState<UserResume | null>(null);

  // Application Tracking state from Supabase
  const [applicationsMap, setApplicationsMap] = useState<
    Record<string, { id: string; status: string; missingFields: FormFieldDefinition[] }>
  >({});
  const [isAppsLoading, setIsAppsLoading] = useState(true);

  // Apply Modal state
  const [selectedApplyJob, setSelectedApplyJob] = useState<Job | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Missing Fields Modal state
  const [activeMissingAppId, setActiveMissingAppId] = useState<string | null>(null);
  const [activeMissingFields, setActiveMissingFields] = useState<FormFieldDefinition[]>([]);
  const [isMissingFieldsModalOpen, setIsMissingFieldsModalOpen] = useState(false);

  const supabase = createClient();

  // Load user applications to synchronize exact live statuses
  const loadUserApplications = useCallback(async () => {
    setIsAppsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: apps, error } = await supabase
        .from("job_applications")
        .select("id, status, metadata, missing_fields")
        .eq("user_id", user.id);

      if (error) throw error;

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
        setApplicationsMap(map);
      }
    } catch (err: any) {
      console.warn("[SavedJobs] Error loading application statuses:", err.message);
    } finally {
      setIsAppsLoading(false);
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

        const channelName = `user-saved-apps-${user.id}-${Math.random().toString(36).substring(2, 9)}`;
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
              console.log("[SavedJobs Realtime] Application update:", payload);
              loadUserApplications();
            }
          )
          .subscribe();

        channel = newChannel;
      } catch (e) {
        console.warn("[SavedJobs Realtime] Setup error:", e);
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
    return Object.values(applicationsMap).some(
      (app) => app.status === "queued" || app.status === "detecting_fields" || app.status === "submitting"
    );
  }, [applicationsMap]);

  useEffect(() => {
    if (!hasActiveApplications) return;

    const interval = setInterval(() => {
      loadUserApplications();
    }, 2000);

    return () => clearInterval(interval);
  }, [hasActiveApplications, loadUserApplications]);

  // Default selected resume for apply flow
  useEffect(() => {
    if (userResumes.length > 0 && !selectedResume) {
      setSelectedResume(userResumes[0]);
    }
  }, [userResumes, selectedResume]);

  // Convert SavedJob to full Job model for JobCard component reuse
  const normalizedJobs: { savedJobId: string; job: Job; appStatus: string }[] = useMemo(() => {
    return savedJobs.map((sj) => {
      const meta: any = sj.metadata || {};
      const applyUrl = sj.job_url || meta.applyLink || meta.job_url || "";
      const cleanUrl = applyUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const platform = meta.platform || detectPlatform(applyUrl);

      // Check real-time application status from job_applications
      const appRecord = applicationsMap[sj.id] || (meta.id && applicationsMap[meta.id]) || applicationsMap[applyUrl] || applicationsMap[cleanUrl];
      let appStatus = "not_applied";

      if (appRecord) {
        appStatus = appRecord.status;
      } else if (sj.status && sj.status !== "saved") {
        appStatus = sj.status;
      }

      const job: Job = {
        id: meta.id || sj.id,
        title: sj.job_title || meta.title || "Job Title",
        company: sj.company_name || meta.company || "Company",
        companyLogo: meta.companyLogo || meta.company_logo || null,
        company_logo: meta.company_logo || meta.companyLogo || null,
        companyDescription: meta.companyDescription || null,
        location: sj.location || meta.location || "Remote",
        isRemote: meta.isRemote ?? (sj.location?.toLowerCase().includes("remote") || false),
        salary: meta.salary || null,
        applyLink: applyUrl,
        job_url: applyUrl,
        description: meta.description || "",
        type: meta.type || meta.job_type || "Full-time",
        job_type: meta.job_type || meta.type || "Full-time",
        source: meta.source || "saved",
        platform,
        postedAt: meta.postedAt || sj.created_at,
        fetched_at: sj.created_at,
        skills: meta.skills || [],
        tags: meta.tags || meta.skills || [],
        match_score: meta.match_score || meta.matchScore || 85,
        matchScore: meta.matchScore || meta.match_score || 85,
        applied_status: appStatus,
        saved_status: true, // Saved jobs always show active heart!
      };

      return {
        savedJobId: sj.id,
        job,
        appStatus,
      };
    });
  }, [savedJobs, applicationsMap]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return normalizedJobs.filter(({ job, appStatus }) => {
      // Search text query
      const matchesSearch =
        !searchQuery ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Platform filter
      if (platformFilter !== "all" && job.platform?.toLowerCase() !== platformFilter.toLowerCase()) {
        return false;
      }

      // Status filter
      if (statusFilter === "all") return true;
      if (statusFilter === "saved") return appStatus === "not_applied" || appStatus === "saved";
      if (statusFilter === "applied") return appStatus === "applied" || appStatus === "submitted";
      if (statusFilter === "in_progress") {
        return ["queued", "detecting_fields", "missing_info", "submitting", "interviewing"].includes(appStatus);
      }

      return true;
    });
  }, [normalizedJobs, searchQuery, statusFilter, platformFilter]);

  const handleOpenApplyModal = (job: Job) => {
    setSelectedApplyJob(job);
    setIsApplyModalOpen(true);
  };

  const handleResolveMissing = (job: Job) => {
    const applyUrl = job.job_url || job.applyLink || "";
    const appRecord = applicationsMap[applyUrl];

    if (appRecord && appRecord.missingFields.length > 0) {
      setActiveMissingAppId(appRecord.id);
      setActiveMissingFields(appRecord.missingFields);
      setIsMissingFieldsModalOpen(true);
    } else if (selectedResume) {
      router.push(`/resumes/${selectedResume.id}?applicationId=${appRecord?.id || ""}`);
    }
  };

  const isLoading = isSavedLoading || (savedJobs.length > 0 && isAppsLoading);

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-10 pb-24 lg:pb-12 max-w-7xl mx-auto space-y-8">
        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1.5">
              <Bookmark className="w-4 h-4 fill-blue-600" />
              <span className="text-xs font-black uppercase tracking-widest">
                Job Opportunity Pipeline
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Saved <span className="text-blue-600">Jobs</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
              View and track all bookmarked opportunities with live application status updates.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-md shadow-blue-600/20"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Search More Jobs</span>
            </Link>

            <Link
              href="/jobs/history"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all border border-slate-200 shadow-sm"
            >
              <span>Application Timeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        {savedJobs.length > 0 && (
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {[
                { id: "all", label: "All Saved", count: savedJobs.length },
                { 
                  id: "saved", 
                  label: "Ready to Apply", 
                  count: normalizedJobs.filter(j => j.appStatus === "not_applied" || j.appStatus === "saved").length 
                },
                { 
                  id: "in_progress", 
                  label: "In Progress / Action", 
                  count: normalizedJobs.filter(j => ["queued", "detecting_fields", "missing_info", "submitting"].includes(j.appStatus)).length 
                },
                { 
                  id: "applied", 
                  label: "Applied / Submitted", 
                  count: normalizedJobs.filter(j => j.appStatus === "applied" || j.appStatus === "submitted").length 
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    statusFilter === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Right: Search & Platform Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Platform Filter */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Platforms</option>
                <option value="greenhouse">Greenhouse</option>
                <option value="lever">Lever</option>
                <option value="workable">Workable</option>
                <option value="wellfound">Wellfound</option>
              </select>

              {/* Search Query */}
              <div className="relative w-full sm:w-64">
                <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter saved jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
              Loading your saved opportunities...
            </p>
          </div>
        ) : savedJobs.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-28 text-center bg-white rounded-[40px] border border-slate-200/80 shadow-sm p-10 max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 text-blue-600 shadow-md shadow-blue-600/10">
              <Bookmark className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">No Saved Jobs Yet</h3>
            <p className="text-slate-500 max-w-md mb-8 font-medium text-sm leading-relaxed">
              When exploring positions on the Job Search page, click the heart icon on any job card to bookmark it here for later.
            </p>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Briefcase className="w-4 h-4" />
              <span>Explore Top Job Matches</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        ) : filteredJobs.length === 0 ? (
          /* Zero filter matches */
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <SearchIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-lg font-black text-slate-900">No matching saved jobs found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or filter selection.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPlatformFilter("all");
              }}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Saved Jobs Grid - Reusing JobCard Component */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map(({ savedJobId, job, appStatus }, index) => (
                <JobCard
                  key={savedJobId}
                  job={job}
                  index={index}
                  applicationStatus={appStatus}
                  onApplyNow={() => handleOpenApplyModal(job)}
                  onResolveMissing={() => handleResolveMissing(job)}
                  matchSkills={selectedResume?.content?.skills || []}
                />
              ))}
            </div>
          </div>
        )}

        {/* Apply Modal (Manual vs AI Agent) */}
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
              setApplicationsMap((prev) => ({
                ...prev,
                [selectedApplyJob.id]: optimistic,
                [applyUrl]: optimistic,
                [cleanUrl]: optimistic,
              }));
            }
            loadUserApplications();
          }}
        />

        {/* Missing Fields Resolution Modal */}
        <MissingFieldsModal
          isOpen={isMissingFieldsModalOpen}
          onClose={() => setIsMissingFieldsModalOpen(false)}
          applicationId={activeMissingAppId}
          missingFields={activeMissingFields}
          onSuccess={() => {
            loadUserApplications();
          }}
        />
      </div>
    </DashboardLayout>
  );
}
