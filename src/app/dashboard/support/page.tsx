"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { 
  Headphones, 
  Search, 
  Plus, 
  Send, 
  Paperclip, 
  Star, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck, 
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { SupportTicket, SupportMessage } from "@shared/types";

export default function CandidateSupportPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // Filtering & search
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Messaging state
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // New ticket modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newInitialMessage, setNewInitialMessage] = useState("");
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // CSAT rating state
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);

  // Web Audio synthesizer for chime
  const playChime = useCallback((type: "incoming" | "sent") => {
    try {
      if (typeof window === "undefined") return;
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "incoming") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(554.37, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio fails gracefully
    }
  }, []);

  // Fetch candidate tickets
  const fetchTickets = useCallback(async (selectFirst = false) => {
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setTickets(data.tickets);
        if (selectFirst && data.tickets.length > 0 && !selectedTicketId) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedTicketId]);

  // Load user session
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    fetchTickets(true);
  }, [fetchTickets]);

  // Load selected ticket details & messages
  useEffect(() => {
    if (!selectedTicketId) {
      setSelectedTicket(null);
      setMessages([]);
      return;
    }

    const loadDetail = async () => {
      setMessagesLoading(true);
      try {
        const res = await fetch(`/api/support/tickets/${selectedTicketId}`);
        const data = await res.json();
        if (data.success && data.ticket) {
          setSelectedTicket(data.ticket);
          setMessages(data.messages || []);
          setRatingSuccess(data.ticket.user_satisfaction_rating !== null);
          if (data.ticket.user_satisfaction_rating) {
            setRatingValue(data.ticket.user_satisfaction_rating);
          }
        }
      } catch (err) {
        console.error("Failed to load ticket detail:", err);
      } finally {
        setMessagesLoading(false);
      }
    };

    loadDetail();
  }, [selectedTicketId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for incoming messages
  useEffect(() => {
    if (!selectedTicketId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`support-channel-${selectedTicketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${selectedTicketId}`,
        },
        (payload: any) => {
          const newMsg = payload.new as SupportMessage;
          if (newMsg.is_internal_note) return;

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_type === "agent") {
            playChime("incoming");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicketId, playChime]);

  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId || sendingReply) return;

    setSendingReply(true);
    const content = replyText.trim();
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          content,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        playChime("sent");
        setMessages((prev) => [...prev, data.message]);
        setReplyText("");
        // If ticket was resolved, sending a message can re-open it
        if (selectedTicket && selectedTicket.status === "resolved") {
          setSelectedTicket((prev) => prev ? { ...prev, status: "in_progress" } : null);
        }
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to send reply:", err);
    } finally {
      setSendingReply(false);
    }
  };

  // Upload attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicketId || !user) return;

    setUploadingAttachment(true);
    try {
      const supabase = createClient();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${user.id}/${Date.now()}-${cleanFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("support_attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from("support_attachments")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      const fileUrl = signedData?.signedUrl;
      if (!fileUrl) throw new Error("Could not generate attachment URL");

      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          content: `Attached file: ${file.name}`,
          attachments: [{ name: file.name, url: fileUrl, size: file.size, type: file.type }],
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        playChime("sent");
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {
      console.error("Failed to upload screenshot:", err);
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Create new ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newInitialMessage.trim() || creatingTicket) return;

    setCreatingTicket(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject.trim(),
          category: newCategory,
          priority: "normal",
          source: "direct_help_button",
          contextSnapshot: {
            currentPath: "/dashboard/support",
          },
          initialMessage: newInitialMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.ticket) {
        throw new Error(data.error || "Failed to submit support request");
      }

      setIsModalOpen(false);
      setNewSubject("");
      setNewInitialMessage("");
      setSelectedTicketId(data.ticket.id);
      playChime("sent");
      await fetchTickets();
    } catch (err: any) {
      setCreateError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setCreatingTicket(false);
    }
  };

  // Submit CSAT Rating
  const handleRatingSubmit = async () => {
    if (!selectedTicketId || submittingRating) return;

    setSubmittingRating(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicketId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: ratingValue,
          feedbackNote: ratingFeedback.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRatingSuccess(true);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to submit rating:", err);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = 
      statusFilter === "all" 
        ? true 
        : statusFilter === "resolved" 
        ? t.status === "resolved" || t.status === "closed"
        : t.status !== "resolved" && t.status !== "closed";

    const matchesSearch = 
      !searchQuery.trim() ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Calculate metrics
  const activeCount = tickets.filter((t) => t.status !== "resolved" && t.status !== "closed").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
  const ratedTickets = tickets.filter((t) => t.user_satisfaction_rating !== null && t.user_satisfaction_rating !== undefined);
  const avgRating = ratedTickets.length > 0 
    ? (ratedTickets.reduce((acc, t) => acc + (t.user_satisfaction_rating || 0), 0) / ratedTickets.length).toFixed(1)
    : "5.0";

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm inline-flex">
                <Headphones className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Support & Help Desk
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Customer Support & Live Assistance
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Track your tickets, view past advice from specialists, and connect with live human assistance.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="self-start md:self-auto px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-blue-500/20 cursor-pointer transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Support Request</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              {activeCount}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Requests</p>
              <p className="text-sm font-black text-slate-900">With Specialist</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              {resolvedCount}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved</p>
              <p className="text-sm font-black text-slate-900">Issues Solved</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
              {tickets.length}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tickets</p>
              <p className="text-sm font-black text-slate-900">Lifetime History</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-6 h-6 fill-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Satisfaction</p>
              <p className="text-sm font-black text-slate-900">{avgRating} / 5.0 Star</p>
            </div>
          </div>
        </div>

        {/* Main Work Area: Split View */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
          {/* Left Column: Ticket List */}
          <div className="lg:col-span-5 border-r border-slate-200 flex flex-col bg-slate-50/50">
            {/* Search & Filter Header */}
            <div className="p-4 border-b border-slate-200 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by subject or ticket #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl gap-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "all"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  All ({tickets.length})
                </button>
                <button
                  onClick={() => setStatusFilter("active")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "active"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter("resolved")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === "resolved"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Resolved ({resolvedCount})
                </button>
              </div>
            </div>

            {/* Ticket Cards Stream */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">
                  Loading your support requests...
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No support requests found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                    {searchQuery ? "Try a different search query" : "Need help? Click 'New Support Request' above!"}
                  </p>
                </div>
              ) : (
                filteredTickets.map((ticket) => {
                  const isSelected = selectedTicketId === ticket.id;
                  const isResolved = ticket.status === "resolved" || ticket.status === "closed";
                  return (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                        isSelected
                          ? "bg-white border-blue-500 shadow-md shadow-blue-500/5 ring-2 ring-blue-500/10"
                          : "bg-white/80 hover:bg-white border-slate-200/70 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-600">
                            {ticket.ticket_number}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {ticket.category.replace("_", " ")}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isResolved
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : ticket.assigned_agent_id
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}>
                          {isResolved 
                            ? "Resolved" 
                            : ticket.assigned_agent 
                            ? `With ${ticket.assigned_agent.display_name}`
                            : "Waiting for Agent"}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1 mb-2">
                        {ticket.subject}
                      </h4>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {new Date(ticket.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        {ticket.user_satisfaction_rating && (
                          <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{ticket.user_satisfaction_rating}★</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation Viewer */}
          <div className="lg:col-span-7 flex flex-col bg-white">
            {selectedTicket ? (
              <>
                {/* Detail Header */}
                <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-black text-blue-600">
                        {selectedTicket.ticket_number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedTicket.status === "resolved"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {selectedTicket.status === "resolved" ? "Issue Resolved" : "Active Conversation"}
                      </span>
                    </div>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {selectedTicket.subject}
                    </h3>
                  </div>

                  {selectedTicket.assigned_agent ? (
                    <div className="flex items-center gap-2.5 p-2 px-3 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                        {selectedTicket.assigned_agent.display_name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">
                          {selectedTicket.assigned_agent.display_name}
                        </p>
                        <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Dedicated Specialist
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Connecting Specialist...</span>
                    </div>
                  )}
                </div>

                {/* Messages Stream */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                  {messagesLoading ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-medium">
                      Loading conversation...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No messages yet in this request.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      if (msg.sender_type === "system") {
                        return (
                          <div key={msg.id} className="text-center my-2">
                            <span className="inline-block px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200/80">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      const isCandidate = msg.sender_type === "user";
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isCandidate ? "items-end" : "items-start"}`}
                        >
                          {!isCandidate && (
                            <div className="flex items-center gap-1.5 mb-1 ml-1 text-slate-500 text-[11px] font-bold">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                              <span>{msg.sender_name || "JobVanta Specialist"}</span>
                            </div>
                          )}

                          <div
                            className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                              isCandidate
                                ? "bg-blue-600 text-white rounded-tr-sm"
                                : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {/* Attachments */}
                            {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1">
                                {msg.attachments.map((att: any, idx: number) => (
                                  <a
                                    key={idx}
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[11px] font-bold transition-all ${
                                      isCandidate 
                                        ? "bg-white/10 hover:bg-white/20 text-white" 
                                        : "bg-slate-50 hover:bg-slate-100 text-blue-600"
                                    }`}
                                  >
                                    <Paperclip className="w-3 h-3" />
                                    <span className="truncate">{att.name || "Attachment"}</span>
                                    <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>

                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* CSAT Rating Card for Resolved Tickets */}
                {selectedTicket.status === "resolved" && (
                  <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-t border-blue-100">
                    {ratingSuccess ? (
                      <div className="flex items-center justify-between gap-3 text-emerald-700 bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Thank you for your rating! ({ratingValue} / 5 Stars)</span>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-semibold">Saved</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-slate-800">
                            How was your experience with {selectedTicket.assigned_agent?.display_name || "our specialist"}?
                          </p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRatingValue(star)}
                                className="p-1 text-slate-300 hover:text-amber-400 cursor-pointer"
                              >
                                <Star
                                  className={`w-5 h-5 ${
                                    star <= ratingValue
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Optional feedback note..."
                            value={ratingFeedback}
                            onChange={(e) => setRatingFeedback(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-blue-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <button
                            onClick={handleRatingSubmit}
                            disabled={submittingRating}
                            className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer"
                          >
                            {submittingRating ? "Saving..." : "Submit Rating"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Reply Composer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-slate-200 bg-white flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-900 cursor-pointer transition-colors shrink-0"
                    title="Attach screenshot or document"
                  >
                    {uploadingAttachment ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={
                      selectedTicket.status === "resolved"
                        ? "Reply to re-open this ticket..."
                        : "Type your reply to the specialist..."
                    }
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />

                  <button
                    type="submit"
                    disabled={!replyText.trim() || sendingReply}
                    className="p-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {sendingReply ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
                  <Headphones className="w-8 h-8" />
                </div>
                <h3 className="text-base font-black text-slate-800 mb-1">
                  Select a Support Request
                </h3>
                <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed mb-6">
                  Choose a ticket from the left list to view conversation history, read advice, or send a reply.
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Request</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Support Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Create Support Request</h3>
                  <p className="text-xs text-slate-500">Connect with our dedicated career support team</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "general", label: "General Question" },
                    { id: "interview_prep", label: "Interview Q&A" },
                    { id: "resume_tools", label: "Resume & ATS" },
                    { id: "billing_subscription", label: "Billing & Plans" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewCategory(cat.id)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                        newCategory === cat.id
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  What do you need help with?
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question about my Google interview questions"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message Details
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your question or issue in detail. We'll review your active resume and application context automatically."
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {creatingTicket ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
