import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useSubscriptionStore } from '@/store/useSubscription';
import debounce from 'lodash.debounce';
import { createClient } from '@/utils/supabase/client';
import { notifyResumeCreated } from '@/store/useNotificationStore';

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    website?: string;
    photo?: string;
  };
  experience: {
    id: string;
    company: string;
    role: string;
    dates: string;
    bullets: string[];
  }[];
  education: {
    id: string;
    school: string;
    degree: string;
    year: string;
  }[];
  skills: string[];
  projects: {
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date: string;
    link?: string;
  }[];
  languages: {
    id: string;
    name: string;
    fluency: string;
  }[];
  interests: string[];
  references: {
    id: string;
    name: string;
    position: string;
    company: string;
    contactInfo: string;
  }[];
}

export type OnboardingStatus = 'step_1_edit' | 'step_2_optimize' | 'step_3_cover_letter' | 'completed';

export interface UserResume {
  id: string;
  user_id: string;
  title: string;
  content: ResumeData;
  is_public: boolean;
  onboarding_status: OnboardingStatus;
  template_id?: string;
  created_at: string;
  updated_at: string;
}

interface ResumeState {
  data: ResumeData;
  templateId: string;
  lastSaved: Date | null;
  userResumes: UserResume[];
  isLoading: boolean;
  error: string | null;
  currentResumeId: string | null;

  updatePersonalInfo: (info: Partial<ResumeData['personalInfo']>) => void;
  updateExperience: (experience: ResumeData['experience']) => void;
  updateEducation: (education: ResumeData['education']) => void;
  updateSkills: (skills: string[]) => void;
  updateProjects: (projects: ResumeData['projects']) => void;
  updateCertifications: (certifications: ResumeData['certifications']) => void;
  updateLanguages: (languages: ResumeData['languages']) => void;
  updateInterests: (interests: ResumeData['interests']) => void;
  updateReferences: (references: ResumeData['references']) => void;
  setTemplateId: (id: string) => void;
  setResumeData: (data: ResumeData) => void;
  
  fetchUserResumes: () => Promise<void>;
  saveToDatabase: (resumeId: string, data: ResumeData) => Promise<void>;
  createResume: (title: string, data: ResumeData) => Promise<string | null>;
  deleteResume: (id: string) => Promise<void>;
  duplicateResume: (id: string, newTitle: string) => Promise<string | null>;
  setCurrentResumeId: (id: string | null) => void;
  updateOnboardingStatus: (resumeId: string, status: OnboardingStatus) => Promise<void>;
  getOnboardingStatus: () => OnboardingStatus;
  reset: () => void;
}

const initialData: ResumeData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    photo: '',
  },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  references: [],
};

const normalizeResumeData = (data: any): ResumeData => {
  if (!data) return initialData;
  return {
    personalInfo: {
      fullName: data.personalInfo?.fullName || "",
      email: data.personalInfo?.email || "",
      phone: data.personalInfo?.phone || "",
      location: data.personalInfo?.location || "",
      summary: data.personalInfo?.summary || "",
      website: data.personalInfo?.website || "",
      photo: data.personalInfo?.photo || "",
    },
    experience: (data.experience || []).map((exp: any) => ({
      id: exp.id || Math.random().toString(36).substring(2, 9),
      company: exp.company || "",
      role: exp.role || "",
      dates: exp.dates || "",
      bullets: Array.isArray(exp.bullets) ? exp.bullets : [],
    })),
    education: (data.education || []).map((edu: any) => ({
      id: edu.id || Math.random().toString(36).substring(2, 9),
      school: edu.school || "",
      degree: edu.degree || "",
      year: edu.year || "",
    })),
    skills: Array.isArray(data.skills) ? data.skills : [],
    projects: (data.projects || []).map((proj: any) => ({
      id: proj.id || Math.random().toString(36).substring(2, 9),
      name: proj.name || "",
      description: proj.description || "",
      technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
      link: proj.link || "",
    })),
    certifications: (data.certifications || []).map((cert: any) => ({
      id: cert.id || Math.random().toString(36).substring(2, 9),
      name: cert.name || "",
      issuer: cert.issuer || "",
      date: cert.date || "",
      link: cert.link || "",
    })),
    languages: (data.languages || []).map((lang: any) => ({
      id: lang.id || Math.random().toString(36).substring(2, 9),
      name: lang.name || "",
      fluency: lang.fluency || "",
    })),
    interests: Array.isArray(data.interests) ? data.interests : [],
    references: (data.references || []).map((ref: any) => ({
      id: ref.id || Math.random().toString(36).substring(2, 9),
      name: ref.name || "",
      position: ref.position || "",
      company: ref.company || "",
      contactInfo: ref.contactInfo || "",
    })),
  };
};

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => {
      const debouncedSave = debounce(async (resumeId: string, data: ResumeData) => {
        const { saveToDatabase } = get();
        await saveToDatabase(resumeId, data);
      }, 3000);

      return {
        data: initialData,
        templateId: 'modern',
        lastSaved: null,
        userResumes: [],
        isLoading: false,
        error: null,
        currentResumeId: null,

        updatePersonalInfo: (info) => {
          const state = get();
          const newData = {
            ...state.data,
            personalInfo: { ...state.data.personalInfo, ...info },
          };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        updateExperience: (experience) => {
          const state = get();
          const newData = { ...state.data, experience };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        updateEducation: (education) => {
          const state = get();
          const newData = { ...state.data, education };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        updateSkills: (skills) => {
          const state = get();
          const newData = { ...state.data, skills };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        updateProjects: (projects) => {
          const state = get();
          const newData = { ...state.data, projects };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        updateCertifications: (certifications) => {
          const state = get();
          const newData = { ...state.data, certifications };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        updateLanguages: (languages) => {
          const state = get();
          const newData = { ...state.data, languages };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        updateInterests: (interests) => {
          const state = get();
          const newData = { ...state.data, interests };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        updateReferences: (references) => {
          const state = get();
          const newData = { ...state.data, references };
          set({ data: newData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, newData);
        },

        setTemplateId: (id) => {
          const state = get();
          set({ templateId: id });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, state.data);
        },

        setResumeData: (data) => {
          const normalizedData = normalizeResumeData(data);
          const state = get();
          set({ data: normalizedData });
          if (state.currentResumeId) debouncedSave(state.currentResumeId, normalizedData);
        },

        setCurrentResumeId: (id) => set({ currentResumeId: id }),

        fetchUserResumes: async () => {
          set({ isLoading: true });
          const supabase = createClient();
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase
              .from('resumes')
              .select('*')
              .eq('user_id', user.id)
              .order('updated_at', { ascending: false });

            if (error) throw error;
            set({ userResumes: data as UserResume[], isLoading: false });
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
          }
        },

        saveToDatabase: async (resumeId, data) => {
          const supabase = createClient();
          try {
            // Log payload size to help debug "Failed to fetch" (likely payload size limits)
            const payloadSize = new Blob([JSON.stringify(data)]).size;
            console.log(`Syncing resume ${resumeId} (${(payloadSize / 1024).toFixed(2)} KB)`);

            const now = new Date().toISOString();
            const { error } = await supabase
              .from('resumes')
              .update({ 
                content: data,
                template_id: get().templateId,
                updated_at: now
              })
              .eq('id', resumeId);

            if (error) {
              console.error('Supabase update error:', error);
              throw error;
            }
            
            set({ lastSaved: new Date() });
            
            // Update the local userResumes array inline instead of re-fetching.
            // Re-fetching triggers the useEffect in the edit page which calls
            // setResumeData() with stale DB data, overwriting in-memory changes
            // (e.g. a photo that was just uploaded but not yet saved).
            set((state) => ({
              userResumes: state.userResumes.map(r =>
                r.id === resumeId
                  ? { ...r, content: data, template_id: get().templateId, updated_at: now }
                  : r
              ),
            }));
          } catch (err: any) {
            console.error('CRITICAL: Save operation failed:', err);
            // If it's a fetch error, it's usually payload size (Vercel/Cloudflare limits) or network
            if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
              console.warn('Network error: This might be due to the photo size exceeding server limits. Try a smaller image.');
            }
          }
        },

        createResume: async (title, data) => {
          set({ isLoading: true });
          const supabase = createClient();
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const isPremium = useSubscriptionStore.getState().isPremium();
            const { userResumes } = get();
            if (!isPremium && userResumes.length >= 2) {
              throw new Error("Limit reached. Upgrade to Premium for unlimited resumes.");
            }

            const normalizedData = normalizeResumeData(data);
            const { data: newResume, error } = await supabase
              .from('resumes')
              .insert({
                user_id: user.id,
                title,
                content: normalizedData,
                template_id: get().templateId,
                onboarding_status: 'step_1_edit',
              })
              .select()
              .single();

            if (error) throw error;
            
            set({ currentResumeId: newResume.id, data: normalizedData, isLoading: false });

            // Push a real notification
            notifyResumeCreated(title);

            return newResume.id;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
          }
        },

        deleteResume: async (id) => {
          const supabase = createClient();
          try {
            const { error } = await supabase.from('resumes').delete().eq('id', id);
            if (error) throw error;
            set((state) => ({
              userResumes: state.userResumes.filter(r => r.id !== id),
              currentResumeId: state.currentResumeId === id ? null : state.currentResumeId
            }));
          } catch (err: any) {
            console.error('Failed to delete resume:', err.message);
          }
        },

        duplicateResume: async (id, newTitle) => {
          set({ isLoading: true });
          const supabase = createClient();
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const state = get();
            const sourceResume = state.userResumes.find(r => r.id === id);
            if (!sourceResume) throw new Error("Source resume not found");

            const isPremium = useSubscriptionStore.getState().isPremium();
            if (!isPremium && state.userResumes.length >= 2) {
              throw new Error("Limit reached. Upgrade to Premium for unlimited resumes.");
            }

            const { data: newResume, error } = await supabase
              .from('resumes')
              .insert({
                user_id: user.id,
                title: newTitle,
                content: sourceResume.content,
                template_id: sourceResume.template_id,
              })
              .select()
              .single();

            if (error) throw error;
            
            set(state => ({ 
              userResumes: [newResume, ...state.userResumes],
              isLoading: false 
            }));
            return newResume.id;
          } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
          }
        },

        updateOnboardingStatus: async (resumeId, status) => {
          const supabase = createClient();
          try {
            const { error } = await supabase
              .from('resumes')
              .update({ onboarding_status: status, updated_at: new Date().toISOString() })
              .eq('id', resumeId);
            if (error) throw error;
            set((state) => ({
              userResumes: state.userResumes.map(r =>
                r.id === resumeId ? { ...r, onboarding_status: status } : r
              ),
            }));
          } catch (err: any) {
            console.error('Failed to update onboarding status:', err.message);
          }
        },

        getOnboardingStatus: () => {
          const state = get();
          const currentResume = state.userResumes.find(r => r.id === state.currentResumeId);
          return currentResume?.onboarding_status || 'completed';
        },

        reset: () => set({
          data: initialData,
          userResumes: [],
          currentResumeId: null,
          lastSaved: null,
          error: null,
        }),
      };
    },
    {
      name: 'resume-storage',
      partialize: (state) => ({ 
        data: state.data, 
        templateId: state.templateId,
        currentResumeId: state.currentResumeId
      }),
    }
  )
);
