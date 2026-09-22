export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export type SupportTicketSource = 'ai_assistant_handoff' | 'direct_help_button' | 'application_issue';
export type SupportTicketCategory = 'interview_prep' | 'resume_tools' | 'billing_subscription' | 'technical' | 'general';

export interface SupportContextSnapshot {
  applicationId?: string;
  jobTitle?: string;
  companyName?: string;
  resumeScore?: number;
  currentPath?: string;
  browserInfo?: string;
  aiAssistantSummary?: string;
  recentAiMessages?: Array<{ role: string; content: string }>;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  assigned_agent_id: string | null;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  source: SupportTicketSource;
  category: SupportTicketCategory;
  subject: string;
  context_snapshot: SupportContextSnapshot;
  user_satisfaction_rating?: number | null;
  feedback_note?: string | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  user?: {
    email: string;
    full_name?: string;
  };
  assigned_agent?: {
    display_name: string;
    avatar_url?: string | null;
  };
}

export interface SupportMessageAttachment {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'user' | 'agent' | 'system';
  content: string;
  attachments: SupportMessageAttachment[];
  is_internal_note: boolean;
  read_at?: string | null;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
}

export interface SupportStaffProfile {
  id: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  is_online: boolean;
  is_active: boolean;
  max_concurrent_tickets: number;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
  email?: string;
  role?: string;
  active_tickets_count?: number;
}

export interface SupportCannedResponse {
  id: string;
  title: string;
  category: string;
  content: string;
  shortcut?: string | null;
  created_at: string;
}
