export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  title: string;
  content: Record<string, any>;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  dodo_customer_id: string | null;
  dodo_subscription_id: string | null;
  plan_id: string | null;
  status: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_title: string;
  company_name: string;
  job_url: string | null;
  location: string | null;
  status: string;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface JobSearchHistory {
  id: string;
  user_id: string;
  search_query: string;
  location: string | null;
  filters: Record<string, any> | null;
  created_at: string;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string | null;
  preview_image_url: string | null;
  structure: Record<string, any>;
  is_premium: boolean;
  created_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  resume_id: string | null;
  status: string;
  metadata: Record<string, any>;
  resume_snapshot: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface CoverLetter {
  id: string;
  user_id: string;
  resume_id: string | null;
  title: string;
  target_job_title: string | null;
  company_name: string | null;
  content: Record<string, any>;
  created_at: string;
  updated_at: string;
}
