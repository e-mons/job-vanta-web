"use client";

import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";
import { notifyJobSaved, notifyStatusChange } from "@/store/useNotificationStore";

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  companyDescription?: string | null;
  location: string;
  isRemote: boolean;
  salary: string | null;
  applyLink: string;
  description: string;
  type: string;
  employmentType?: string | null;
  source: string;
  postedAt: string;
  skills: string[];
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
  isLoading: boolean;
  error: string | null;

  // Saved jobs state
  savedJobs: SavedJob[];
  savedJobIds: Set<string>;
  isSavedLoading: boolean;

  // Actions
  searchJobs: (query: string, location?: string) => Promise<void>;
  searchByResume: (skills: string[]) => Promise<void>;
  saveJob: (job: Job) => Promise<void>;
  unsaveJob: (savedJobId: string) => Promise<void>;
  updateJobStatus: (savedJobId: string, status: JobStatus) => Promise<void>;
  fetchSavedJobs: () => Promise<void>;
  setSelectedJob: (job: Job | null) => void;
  setSearchQuery: (query: string) => void;
  setLocationFilter: (location: string) => void;
  reset: () => void;
}

export const useJobStore = create<JobState>()((set, get) => ({
  searchResults: [],
  searchQuery: "",
  locationFilter: "",
  selectedJob: null,
  isLoading: false,
  error: null,

  savedJobs: [],
  savedJobIds: new Set<string>(),
  isSavedLoading: false,

  setSelectedJob: (job) => set({ selectedJob: job }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setLocationFilter: (location) => set({ locationFilter: location }),

  searchJobs: async (query, location) => {
    set({ isLoading: true, error: null, searchQuery: query, locationFilter: location || "" });
    try {
      const res = await fetch(`/api/jobs/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, location }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search request failed");
      
      set({ searchResults: data.jobs || [], isLoading: false });

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

  searchByResume: async (skills) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/jobs/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ skills }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resume search failed");
      
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
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to save jobs");

      const { data, error } = await supabase
        .from("saved_jobs")
        .insert({
          user_id: user.id,
          job_title: job.title,
          company_name: job.company,
          job_url: job.applyLink,
          location: job.location,
          status: "saved",
          metadata: job as any,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        savedJobs: [data as SavedJob, ...state.savedJobs],
        savedJobIds: new Set([...state.savedJobIds, job.id]),
      }));

      // Push a real notification
      notifyJobSaved(job.title, job.company);
    } catch (err) {
      console.error("Error saving job:", err);
      set({ error: (err as Error).message });
    }
  },

  unsaveJob: async (savedJobId) => {
    try {
      const supabase = createClient();
      const jobToRemove = get().savedJobs.find((j) => j.id === savedJobId);

      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("id", savedJobId);

      if (error) throw error;

      set((state) => {
        const newIds = new Set(state.savedJobIds);
        if (jobToRemove?.metadata?.id) newIds.delete(jobToRemove.metadata.id);
        return {
          savedJobs: state.savedJobs.filter((j) => j.id !== savedJobId),
          savedJobIds: newIds,
        };
      });
    } catch (err) {
      console.error("Error removing saved job:", err);
    }
  },

  updateJobStatus: async (savedJobId, status) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("saved_jobs")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", savedJobId);

      if (error) throw error;

      const updatedJob = get().savedJobs.find((j) => j.id === savedJobId);
      set((state) => ({
        savedJobs: state.savedJobs.map((j) =>
          j.id === savedJobId ? { ...j, status, updated_at: new Date().toISOString() } : j
        ),
      }));

      // Push a real notification
      if (updatedJob) {
        notifyStatusChange(updatedJob.job_title, updatedJob.company_name, status);
      }
    } catch (err) {
      console.error("Error updating job status:", err);
    }
  },

  fetchSavedJobs: async () => {
    set({ isSavedLoading: true });
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ isSavedLoading: false });
        return;
      }

      const { data, error } = await supabase
        .from("saved_jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const savedIds = new Set<string>();
      (data || []).forEach((j: SavedJob) => {
        if (j.metadata?.id) savedIds.add(j.metadata.id);
      });

      set({
        savedJobs: (data || []) as SavedJob[],
        savedJobIds: savedIds,
        isSavedLoading: false,
      });
    } catch (err) {
      console.error("Error fetching saved jobs:", err);
      set({ isSavedLoading: false });
    }
  },
  reset: () =>
    set({
      searchResults: [],
      searchQuery: "",
      locationFilter: "",
      selectedJob: null,
      savedJobs: [],
      savedJobIds: new Set<string>(),
      error: null,
    }),
}));
