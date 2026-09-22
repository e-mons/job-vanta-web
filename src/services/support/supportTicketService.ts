import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { 
  SupportTicket, 
  SupportMessage, 
  SupportContextSnapshot, 
  SupportTicketStatus,
  SupportTicketPriority,
  SupportCannedResponse
} from "@shared/types";

export class SupportTicketService {
  /**
   * Creates a new support ticket escalated from the AI Assistant or direct help.
   */
  static async createTicket(params: {
    userId: string;
    subject: string;
    category?: string;
    priority?: SupportTicketPriority;
    source?: 'ai_assistant_handoff' | 'direct_help_button' | 'application_issue';
    contextSnapshot: SupportContextSnapshot;
    initialMessage?: string;
  }): Promise<{ ticket: SupportTicket; firstMessage?: SupportMessage }> {
    const adminClient = createAdminClient();

    // Check if user already has an active open ticket
    const { data: existingTicket } = await adminClient
      .from("support_tickets")
      .select("*")
      .eq("user_id", params.userId)
      .in("status", ["open", "in_progress", "waiting_user"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingTicket) {
      // If active ticket already exists, post new message into it
      if (params.initialMessage) {
        const { data: msg } = await adminClient
          .from("support_messages")
          .insert({
            ticket_id: existingTicket.id,
            sender_id: params.userId,
            sender_type: "user",
            content: params.initialMessage,
            is_internal_note: false,
          })
          .select("*")
          .single();

        return { ticket: existingTicket as SupportTicket, firstMessage: msg as SupportMessage };
      }
      return { ticket: existingTicket as SupportTicket };
    }

    // 1. Insert new ticket
    const { data: ticket, error: ticketError } = await adminClient
      .from("support_tickets")
      .insert({
        user_id: params.userId,
        subject: params.subject || "Need help from a support specialist",
        category: params.category || "general",
        priority: params.priority || "normal",
        source: params.source || "ai_assistant_handoff",
        context_snapshot: params.contextSnapshot || {},
        status: "open",
      })
      .select("*")
      .single();

    if (ticketError || !ticket) {
      throw new Error(`Failed to create support ticket: ${ticketError?.message}`);
    }

    // 2. Insert initial message from user or AI handoff context
    let firstMessage: SupportMessage | undefined;
    const messageContent = params.initialMessage || 
      (params.contextSnapshot.aiAssistantSummary 
        ? `[Transferred from Jobvanta AI Assistant]: ${params.contextSnapshot.aiAssistantSummary}`
        : "Hello, I would like to speak with a human support specialist.");

    const { data: msgData, error: msgError } = await adminClient
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        sender_id: params.userId,
        sender_type: "user",
        content: messageContent,
        is_internal_note: false,
      })
      .select("*")
      .single();

    if (!msgError && msgData) {
      firstMessage = msgData as SupportMessage;
    }

    // 3. Post friendly system welcome message
    await adminClient
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        sender_id: params.userId,
        sender_type: "system",
        content: "👋 Welcome to JobVanta Live Support! A specialist has received your request along with your career details and will be with you momentarily.",
        is_internal_note: false,
      });

    return { ticket: ticket as SupportTicket, firstMessage };
  }

  /**
   * Retrieves the current user's active ticket and its message history.
   */
  static async getActiveUserTicket(userId: string): Promise<{
    ticket: SupportTicket | null;
    messages: SupportMessage[];
  }> {
    const adminClient = createAdminClient();

    const { data: ticket, error: ticketError } = await adminClient
      .from("support_tickets")
      .select(`
        *,
        assigned_agent:support_staff_profiles!support_tickets_assigned_agent_id_fkey(display_name, avatar_url)
      `)
      .eq("user_id", userId)
      .in("status", ["open", "in_progress", "waiting_user"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ticketError || !ticket) {
      // Check for recently resolved ticket within 2 hours to allow rating
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: recentResolved } = await adminClient
        .from("support_tickets")
        .select(`
          *,
          assigned_agent:support_staff_profiles!support_tickets_assigned_agent_id_fkey(display_name, avatar_url)
        `)
        .eq("user_id", userId)
        .eq("status", "resolved")
        .is("user_satisfaction_rating", null)
        .gte("resolved_at", twoHoursAgo)
        .order("resolved_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentResolved) {
        const { data: messages } = await adminClient
          .from("support_messages")
          .select("*")
          .eq("ticket_id", recentResolved.id)
          .eq("is_internal_note", false)
          .order("created_at", { ascending: true });

        return {
          ticket: recentResolved as SupportTicket,
          messages: (messages || []) as SupportMessage[],
        };
      }

      return { ticket: null, messages: [] };
    }

    const { data: messages } = await adminClient
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .eq("is_internal_note", false)
      .order("created_at", { ascending: true });

    // Resolve agent sender profiles if any agent messages exist
    const agentIds = Array.from(new Set(
      (messages || [])
        .filter((m: any) => m.sender_type === "agent")
        .map((m: any) => m.sender_id)
    ));

    const staffMap = new Map<string, { display_name: string; avatar_url: string | null }>();
    if (agentIds.length > 0) {
      const { data: staffList } = await adminClient
        .from("support_staff_profiles")
        .select("id, display_name, avatar_url")
        .in("id", agentIds);

      (staffList || []).forEach((s: any) => {
        staffMap.set(s.id, { display_name: s.display_name, avatar_url: s.avatar_url });
      });
    }

    const formattedMessages = (messages || []).map((m: any) => {
      const staff = staffMap.get(m.sender_id);
      return {
        ...m,
        sender_name: m.sender_type === "agent" ? (staff?.display_name || "Support Specialist") : undefined,
        sender_avatar: m.sender_type === "agent" ? (staff?.avatar_url || null) : undefined,
      };
    });

    return {
      ticket: ticket as SupportTicket,
      messages: formattedMessages as SupportMessage[],
    };
  }

  /**
   * Post a message to a ticket (from user or agent).
   */
  static async postMessage(params: {
    ticketId: string;
    senderId: string;
    senderType: "user" | "agent" | "system";
    content: string;
    isInternalNote?: boolean;
    attachments?: Array<{ name: string; url: string; size?: number }>;
  }): Promise<SupportMessage> {
    const adminClient = createAdminClient();

    const { data: msg, error: msgError } = await adminClient
      .from("support_messages")
      .insert({
        ticket_id: params.ticketId,
        sender_id: params.senderId,
        sender_type: params.senderType,
        content: params.content,
        is_internal_note: Boolean(params.isInternalNote),
        attachments: params.attachments || [],
      })
      .select("*")
      .single();

    if (msgError || !msg) {
      throw new Error(`Failed to post message: ${msgError?.message}`);
    }

    // Auto-update ticket status: if user sends message and ticket is waiting_user, mark in_progress
    if (params.senderType === "user") {
      await adminClient
        .from("support_tickets")
        .update({ status: "in_progress", updated_at: new Date().toISOString() })
        .eq("id", params.ticketId)
        .eq("status", "waiting_user");
    }

    return msg as SupportMessage;
  }

  /**
   * Submit satisfaction rating for a resolved ticket.
   */
  static async rateTicket(params: {
    ticketId: string;
    userId: string;
    rating: number;
    feedbackNote?: string;
  }): Promise<void> {
    const adminClient = createAdminClient();

    const { error } = await adminClient
      .from("support_tickets")
      .update({
        user_satisfaction_rating: params.rating,
        feedback_note: params.feedbackNote || null,
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.ticketId)
      .eq("user_id", params.userId);

    if (error) {
      throw new Error(`Failed to submit rating: ${error.message}`);
    }
  }

  /**
   * Admin/Staff: List tickets with filtering.
   */
  static async listAdminTickets(filters: {
    status?: string;
    agentId?: string;
    unassignedOnly?: boolean;
    search?: string;
    limit?: number;
  }): Promise<SupportTicket[]> {
    const adminClient = createAdminClient();

    let query = adminClient
      .from("support_tickets")
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(full_name, avatar_url),
        assigned_agent:support_staff_profiles!support_tickets_assigned_agent_id_fkey(display_name, avatar_url)
      `)
      .order("updated_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.unassignedOnly) {
      query = query.is("assigned_agent_id", null);
    } else if (filters.agentId) {
      query = query.eq("assigned_agent_id", filters.agentId);
    }
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,ticket_number.ilike.%${filters.search}%`);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to list tickets: ${error.message}`);
    }

    // Resolve user emails from auth.users securely
    const tickets = data || [];
    if (tickets.length > 0) {
      const userIds = Array.from(new Set(tickets.map((t: any) => t.user_id)));
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      const userMap = new Map((usersData?.users || []).map(u => [u.id, u.email]));

      return tickets.map((t: any) => ({
        ...t,
        user: {
          ...t.user,
          email: userMap.get(t.user_id) || "candidate@jobvanta.com",
        },
      })) as SupportTicket[];
    }

    return tickets as SupportTicket[];
  }

  /**
   * Admin/Staff: Get ticket details including internal notes and customer context.
   */
  static async getAdminTicketDetails(ticketId: string): Promise<{
    ticket: SupportTicket;
    messages: SupportMessage[];
    candidateContext: {
      profile?: any;
      activeApplication?: any;
      resume?: any;
    };
  }> {
    const adminClient = createAdminClient();

    const { data: ticket, error } = await adminClient
      .from("support_tickets")
      .select(`
        *,
        assigned_agent:support_staff_profiles!support_tickets_assigned_agent_id_fkey(display_name, avatar_url)
      `)
      .eq("id", ticketId)
      .single();

    if (error || !ticket) {
      throw new Error(`Ticket not found: ${error?.message}`);
    }

    // Get candidate email
    const { data: userData } = await adminClient.auth.admin.getUserById(ticket.user_id);
    const candidateEmail = userData?.user?.email || "candidate@jobvanta.com";

    // Get all messages including internal notes
    const { data: messages } = await adminClient
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    // Resolve agent sender profiles
    const agentIds = Array.from(new Set(
      (messages || [])
        .filter((m: any) => m.sender_type === "agent")
        .map((m: any) => m.sender_id)
    ));

    const staffMap = new Map<string, { display_name: string; avatar_url: string | null }>();
    if (agentIds.length > 0) {
      const { data: staffList } = await adminClient
        .from("support_staff_profiles")
        .select("id, display_name, avatar_url")
        .in("id", agentIds);

      (staffList || []).forEach((s: any) => {
        staffMap.set(s.id, { display_name: s.display_name, avatar_url: s.avatar_url });
      });
    }

    // Fetch candidate profile, latest resume, and active application for context card
    const [profileRes, resumeRes, appRes] = await Promise.all([
      adminClient.from("profiles").select("*").eq("id", ticket.user_id).maybeSingle(),
      adminClient.from("resumes").select("id, title, ats_score, updated_at").eq("user_id", ticket.user_id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
      ticket.context_snapshot?.applicationId 
        ? adminClient.from("job_applications").select("*, job:jobs(title, company, location)").eq("id", ticket.context_snapshot.applicationId).maybeSingle()
        : adminClient.from("job_applications").select("*, job:jobs(title, company, location)").eq("user_id", ticket.user_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const formattedMessages = (messages || []).map((m: any) => {
      const staff = staffMap.get(m.sender_id);
      return {
        ...m,
        sender_name: m.sender_type === "agent" 
          ? (staff?.display_name || "Support Specialist") 
          : (m.sender_type === "system" ? "JobVanta System" : "Candidate"),
        sender_avatar: m.sender_type === "agent" ? (staff?.avatar_url || null) : null,
      };
    });

    return {
      ticket: {
        ...ticket,
        user: {
          email: candidateEmail,
          full_name: profileRes.data?.full_name || profileRes.data?.name || "Candidate",
        },
      } as SupportTicket,
      messages: formattedMessages as SupportMessage[],
      candidateContext: {
        profile: profileRes.data || null,
        resume: resumeRes.data || null,
        activeApplication: appRes.data || null,
      },
    };
  }

  /**
   * Admin/Staff: Update ticket status or assignment.
   */
  static async updateTicket(params: {
    ticketId: string;
    assignedAgentId?: string | null;
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
  }): Promise<SupportTicket> {
    const adminClient = createAdminClient();

    const updatePayload: any = {
      updated_at: new Date().toISOString(),
    };

    if (params.assignedAgentId !== undefined) {
      updatePayload.assigned_agent_id = params.assignedAgentId;
      if (params.assignedAgentId && !params.status) {
        updatePayload.status = "in_progress";
      }
    }
    if (params.status) {
      updatePayload.status = params.status;
      if (params.status === "resolved") {
        updatePayload.resolved_at = new Date().toISOString();
      }
    }
    if (params.priority) {
      updatePayload.priority = params.priority;
    }

    const { data, error } = await adminClient
      .from("support_tickets")
      .update(updatePayload)
      .eq("id", params.ticketId)
      .select(`
        *,
        assigned_agent:support_staff_profiles!support_tickets_assigned_agent_id_fkey(display_name, avatar_url)
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update ticket: ${error.message}`);
    }

    return data as SupportTicket;
  }

  /**
   * Admin/Staff: Get canned responses list.
   */
  static async getCannedResponses(): Promise<SupportCannedResponse[]> {
    const adminClient = createAdminClient();
    const { data } = await adminClient
      .from("support_canned_responses")
      .select("*")
      .order("category", { ascending: true });

    return (data || []) as SupportCannedResponse[];
  }

  /**
   * Candidate: Get all tickets for the authenticated user.
   */
  static async getUserTickets(userId: string): Promise<SupportTicket[]> {
    const adminClient = createAdminClient();
    const { data: tickets, error } = await adminClient
      .from("support_tickets")
      .select(`
        *,
        assigned_agent:support_staff_profiles!support_tickets_assigned_agent_id_fkey(display_name, avatar_url)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user tickets: ${error.message}`);
    }

    return (tickets || []) as SupportTicket[];
  }

  /**
   * Candidate: Get a specific ticket and its non-internal message history.
   */
  static async getUserTicketDetail(userId: string, ticketId: string): Promise<{
    ticket: SupportTicket;
    messages: SupportMessage[];
  }> {
    const adminClient = createAdminClient();

    const { data: ticket, error } = await adminClient
      .from("support_tickets")
      .select(`
        *,
        assigned_agent:support_staff_profiles!support_tickets_assigned_agent_id_fkey(display_name, avatar_url)
      `)
      .eq("id", ticketId)
      .eq("user_id", userId)
      .single();

    if (error || !ticket) {
      throw new Error(`Ticket not found: ${error?.message}`);
    }

    const { data: messages } = await adminClient
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .eq("is_internal_note", false)
      .order("created_at", { ascending: true });

    // Resolve agent sender profiles
    const agentIds = Array.from(new Set(
      (messages || [])
        .filter((m: any) => m.sender_type === "agent")
        .map((m: any) => m.sender_id)
    ));

    const staffMap = new Map<string, { display_name: string; avatar_url: string | null }>();
    if (agentIds.length > 0) {
      const { data: staffList } = await adminClient
        .from("support_staff_profiles")
        .select("id, display_name, avatar_url")
        .in("id", agentIds);

      (staffList || []).forEach((s: any) => {
        staffMap.set(s.id, { display_name: s.display_name, avatar_url: s.avatar_url });
      });
    }

    const formattedMessages = (messages || []).map((m: any) => {
      const staff = staffMap.get(m.sender_id);
      return {
        ...m,
        sender_name: m.sender_type === "agent" 
          ? (staff?.display_name || "Support Specialist") 
          : (m.sender_type === "system" ? "JobVanta System" : "You"),
        sender_avatar: m.sender_type === "agent" ? (staff?.avatar_url || null) : null,
      };
    });

    return {
      ticket: ticket as SupportTicket,
      messages: formattedMessages as SupportMessage[],
    };
  }
}
