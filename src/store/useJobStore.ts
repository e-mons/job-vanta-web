"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { notifyJobSaved, notifyStatusChange } from "@/store/useNotificationStore";

export type JobPlatform = "greenhouse" | "lever" | "workable" | "wellfound";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  company_logo?: string | null;
  companyDescription?: string | null;
  location: string;
  isRemote: boolean;
  salary: string | null;
  contactEmail?: string | null;
  applyLink: string;
  job_url?: string;
  source_url?: string | null;
  description: string;
  type: string;
  job_type?: string;
  employmentType?: string | null;
  experience_level?: string | null;
  source: string;
  platform?: JobPlatform | string;
  postedAt: string;
  fetched_at?: string;
  skills: string[];
  tags?: string[];
  match_score?: number;
  matchScore?: number;
  applied_status?: string;
  saved_status?: boolean;
  responsibilities?: string[];
  qualifications?: string[];
  benefits?: string[];
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  job_url: string | null;
  location: string | null;
  status: "saved" | "applied" | "interviewing" | "offered" | "rejected";
  metadata: Job | null;
  created_at: string;
  updated_at: string;
}

export type JobStatus = SavedJob["status"];

interface JobState {
  // Search state
  searchResults: Job[];
  searchQuery: string;
  locationFilter: string;
  selectedJob: Job | null;
  selectedPlatforms: JobPlatform[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;

  // Saved jobs state
  savedJobs: SavedJob[];
  savedJobIds: Set<string>;
  isSavedLoading: boolean;

  // Actions
  searchJobs: (query: string, location?: string) => Promise<void>;
  searchByResume: (
    skills: string[],
    filters?: {
      location?: string;
      radius?: string;
      isRemote?: boolean;
      jobType?: string;
      experienceLevel?: string;
    },
    resumeId?: string,
    platforms?: JobPlatform[]
  ) => Promise<void>;
  setSelectedPlatforms: (platforms: JobPlatform[]) => void;
  togglePlatform: (platform: JobPlatform) => void;
  saveJob: (job: Job) => Promise<void>;
  unsaveJob: (savedJobId: string) => Promise<void>;
  updateJobStatus: (savedJobId: string, status: JobStatus) => Promise<void>;
  fetchSavedJobs: () => Promise<void>;
  setSelectedJob: (job: Job | null) => void;
  setSearchQuery: (query: string) => void;
  setLocationFilter: (location: string) => void;
  setHasSearched: (val: boolean) => void;
  reset: () => void;
}

const DEFAULT_PLATFORMS: JobPlatform[] = ["greenhouse", "lever", "workable", "wellfound"];

export const useJobStore = create<JobState>()((set, get) => ({
  searchResults: [],
  searchQuery: "",
  locationFilter: "",
  selectedJob: null,
  selectedPlatforms: DEFAULT_PLATFORMS,
  isLoading: false,
  error: null,
  hasSearched: false,

  savedJobs: [],
  savedJobIds: new Set<string>(),
  isSavedLoading: false,

  setSelectedPlatforms: (platforms) => set({ selectedPlatforms: platforms }),
  
  togglePlatform: (platform) => {
    const current = get().selectedPlatforms;
    if (current.includes(platform)) {
      // Prevent unchecking the last platform
      if (current.length > 1) {
        set({ selectedPlatforms: current.filter((p) => p !== platform) });
      }
    } else {
      set({ selectedPlatforms: [...current, platform] });
    }
  },

  setSelectedJob: (job) => set({ selectedJob: job }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLocationFilter: (location) => set({ locationFilter: location }),
  setHasSearched: (val) => set({ hasSearched: val }),

  searchJobs: async (query, location) => {
    set({ isLoading: true, error: null, searchQuery: query, locationFilter: location || "" });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const res = await fetch(`/api/jobs/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          filters: { location },
          platforms: get().selectedPlatforms,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error("The search service returned an unexpected response. Please try again.");
      }
      if (!res.ok) throw new Error(data?.error || "Search request failed");

      set({ searchResults: data.jobs || [], isLoading: false, hasSearched: true });

      // Save search to history (fire-and-forget)
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        supabase
          .from("job_search_history")
          .insert({ user_id: user.id, search_query: query, location })
          .then(() => {});
      }
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  searchByResume: async (skills, filters, resumeId, platforms) => {
    set({ isLoading: true, error: null, hasSearched: true });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      const activePlatforms = platforms || get().selectedPlatforms;

      const res = await fetch(`/api/jobs/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId,
          skills,
          filters,
          platforms: activePlatforms,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error("The search service returned an unexpected response. Please try again.");
      }
      if (!res.ok) throw new Error(data?.error || "Resume search failed");

      set({
        searchResults: data.jobs || [],
        searchQuery: data.query || skills.join(", "),
        isLoading: false,
      });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  saveJob: async (job) => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) throw new Error("You must be logged in to save jobs");

      const applyUrl = job.applyLink || job.job_url || "";

      // Check if already saved by URL or ID to prevent duplicates
      const existing = get().savedJobs.find(
        (sj) => (sj.job_url && sj.job_url === applyUrl) || (sj.metadata?.id && sj.metadata.id === job.id)
      );
      if (existing) return;

      const { data, error } = await supabase
        .from("saved_jobs")
        .insert({
          user_id: user.id,
          job_title: job.title,
          company_name: job.company,
          job_url: applyUrl,
          location: job.location,
          status: "saved",
          metadata: job as any,
        })
        .select()
        .single();

      if (error) throw error;

      // Also update saved_status in public.jobs if this job exists in jobs table
      if (job.id) {
        await supabase
          .from("jobs")
          .update({ saved_status: true })
          .eq("id", job.id)
          .eq("user_id", user.id);
      }

      set((state) => ({
        savedJobs: [data as SavedJob, ...state.savedJobs],
        savedJobIds: new Set([...state.savedJobIds, job.id, applyUrl]),
        searchResults: state.searchResults.map((j) =>
          j.id === job.id || (applyUrl && (j.applyLink === applyUrl || j.job_url === applyUrl))
            ? { ...j, saved_status: true }
            : j
        ),
      }));

      // Push a notification
      notifyJobSaved(job.title, job.company);
    } catch (err: any) {
      const msg = err?.message || err?.details || "Failed to save job";
      console.warn("[SavedJobs] Save error:", msg);
      set({ error: msg });
    }
  },

  unsaveJob: async (jobOrSavedJobId) => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      // Match either saved_jobs.id, metadata.id, or job_url
      const jobToRemove = get().savedJobs.find(
        (j) =>
          j.id === jobOrSavedJobId ||
          j.metadata?.id === jobOrSavedJobId ||
          j.job_url === jobOrSavedJobId
      );

      const targetId = jobToRemove ? jobToRemove.id : jobOrSavedJobId;
      const originalJobId = jobToRemove?.metadata?.id || jobOrSavedJobId;
      const originalUrl = jobToRemove?.job_url || jobOrSavedJobId;

      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("id", targetId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Also update saved_status in public.jobs if applicable
      if (originalJobId) {
        await supabase
          .from("jobs")
          .update({ saved_status: false })
          .eq("id", originalJobId)
          .eq("user_id", user.id);
      }

      set((state) => {
        const newIds = new Set(state.savedJobIds);
        if (originalJobId) newIds.delete(originalJobId);
        if (originalUrl) newIds.delete(originalUrl);
        newIds.delete(targetId);

        return {
          savedJobs: state.savedJobs.filter((j) => j.id !== targetId),
          savedJobIds: newIds,
          searchResults: state.searchResults.map((j) =>
            j.id === originalJobId || (originalUrl && (j.applyLink === originalUrl || j.job_url === originalUrl))
              ? { ...j, saved_status: false }
              : j
          ),
        };
      });
    } catch (err: any) {
      const msg = err?.message || err?.details || "Failed to remove saved job";
      console.warn("[SavedJobs] Unsave error:", msg);
    }
  },

  updateJobStatus: async (savedJobId, status) => {
    try {
      const supabase = createClient();
      const jobToUpdate = get().savedJobs.find((j) => j.id === savedJobId);

      const { error } = await supabase
        .from("saved_jobs")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", savedJobId);

      if (error) throw error;

      set((state) => ({
        savedJobs: state.savedJobs.map((j) =>
          j.id === savedJobId ? { ...j, status, updated_at: new Date().toISOString() } : j
        ),
      }));

      // Push notification for status change
      if (jobToUpdate) {
        notifyStatusChange(jobToUpdate.job_title, jobToUpdate.company_name, status);
      }
    } catch (err) {
      console.error("Error updating job status:", err);
      set({ error: (err as Error).message });
    }
  },

  fetchSavedJobs: async () => {
    set({ isSavedLoading: true });
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        set({ savedJobs: [], savedJobIds: new Set(), isSavedLoading: false });
        return;
      }

      let { data, error } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Handle transient clock-skew or JWT timing discrepancies between edge nodes
      if (
        error &&
        (error.code === "PGRST303" ||
          error.code === "PGRST301" ||
          (error as any).status === 401 ||
          error.message?.toLowerCase().includes("jwt"))
      ) {
        await new Promise((r) => setTimeout(r, 350));
        await supabase.auth.refreshSession().catch(() => {});
        const retry = await supabase
          .from("saved_jobs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      const jobs = (data as SavedJob[]) || [];
      const ids = new Set<string>();
      jobs.forEach((j) => {
        if (j.id) ids.add(j.id);
        if (j.metadata?.id) ids.add(j.metadata.id);
        if (j.job_url) ids.add(j.job_url);
      });

      set({ savedJobs: jobs, savedJobIds: ids, isSavedLoading: false });
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        err?.details ||
        err?.hint ||
        (err ? JSON.stringify(err, Object.getOwnPropertyNames(err)) : "Unknown error");
      console.warn("[SavedJobs] Notice while loading saved jobs:", errorMsg);
      set({ isSavedLoading: false });
    }
  },

  reset: () => {
    set({
      searchResults: [],
      searchQuery: "",
      locationFilter: "",
      selectedJob: null,
      selectedPlatforms: DEFAULT_PLATFORMS,
      isLoading: false,
      error: null,
      hasSearched: false,
      savedJobs: [],
      savedJobIds: new Set(),
      isSavedLoading: false,
    });
  },
}));
