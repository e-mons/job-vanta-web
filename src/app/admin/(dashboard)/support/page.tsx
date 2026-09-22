"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Headphones, 
  MessageSquare, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Send, 
  Lock, 
  Sparkles, 
  FileText, 
  Briefcase, 
  Star, 
  Volume2, 
  VolumeX, 
  Tag, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  User,
  Zap,
  Paperclip
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { SupportTicket, SupportMessage, SupportCannedResponse } from "@shared/types";

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetail, setTicketDetail] = useState<{
    ticket: SupportTicket;
    messages: SupportMessage[];
    candidateContext: any;
  } | null>(null);
  const [cannedResponses, setCannedResponses] = useState<SupportCannedResponse[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "unassigned" | "mine" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyMode, setReplyMode] = useState<"reply" | "note">("reply");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // File upload for staff screenshots/documents
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicketId) return;
    setUploadingAttachment(true);
    try {
      const supabase = createClient();
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `staff/${Date.now()}-${cleanFileName}`;
      const { error: uploadError } = await supabase.storage
        .from("support_attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from("support_attachments")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);

      const fileUrl = signedData?.signedUrl;
      if (!fileUrl) throw new Error("Could not get signed URL");

      const isInternal = replyMode === "note";
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          content: `${isInternal ? "[Internal Attachment]" : "Attached file"}: ${file.name}`,
          isInternalNote: isInternal,
          attachments: [{ name: file.name, url: fileUrl, size: file.size, type: file.type }],
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        playChime("sent");
        setTicketDetail((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message],
          };
        });
      }
    } catch (err) {
      console.error("Failed to upload file:", err);
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Synthesize pleasant UI chimes using Web Audio API (zero external asset dependencies)
  const playChime = useCallback((type: "incoming" | "sent") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "incoming") {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio playback fails gracefully if browser blocked autoplay
    }
  }, [soundEnabled]);

  // Initial load
  const fetchTickets = useCallback(async (selectFirst = false) => {
    try {
      let url = "/api/admin/support/tickets";
      const params = new URLSearchParams();
      if (filterTab === "unassigned") params.set("unassigned", "true");
      if (filterTab === "mine" && currentAgentId) params.set("agentId", currentAgentId);
      if (filterTab === "resolved") params.set("status", "resolved");
      if (searchQuery) params.set("search", searchQuery);

      const qs = params.toString();
      if (qs) url += `?${qs}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
        setMetrics(data.metrics || null);
        if (data.currentAgentId) {
          setCurrentAgentId(data.currentAgentId);
        }
        if (selectFirst && data.tickets?.length > 0 && !selectedTicketId) {
          setSelectedTicketId(data.tickets[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      setLoading(false);
    }
  }, [filterTab, currentAgentId, searchQuery, selectedTicketId]);

  useEffect(() => {
    fetchTickets(true);
  }, [fetchTickets]);

  // Load canned responses
  useEffect(() => {
    async function loadCanned() {
      try {
        const res = await fetch("/api/admin/support/canned-responses");
        const data = await res.json();
        if (data.success) {
          setCannedResponses(data.cannedResponses || []);
        }
      } catch (err) {
        console.error("Failed to load canned responses:", err);
      }
    }
    loadCanned();
  }, []);

  // Fetch ticket details when selected
  const fetchTicketDetail = useCallback(async (ticketId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/support/tickets/${ticketId}`);
      const data = await res.json();
      if (data.success) {
        setTicketDetail(data);
      }
    } catch (err) {
      console.error("Failed to load ticket detail:", err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetail(selectedTicketId);
    }
  }, [selectedTicketId, fetchTicketDetail]);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticketDetail?.messages]);

  // Set up Realtime Subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("admin-support-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        (payload: any) => {
          const newMsg = payload.new as SupportMessage;
          if (newMsg.ticket_id === selectedTicketId) {
            setTicketDetail((prev) => {
              if (!prev) return prev;
              // Avoid duplicates
              if (prev.messages.some((m) => m.id === newMsg.id)) return prev;
              return {
                ...prev,
                messages: [...prev.messages, newMsg],
              };
            });
            if (newMsg.sender_type === "user") {
              playChime("incoming");
            }
          }
          // Refresh list to update unread state and last updated
          fetchTickets();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          fetchTickets();
          if (selectedTicketId) {
            fetchTicketDetail(selectedTicketId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicketId, fetchTickets, fetchTicketDetail, playChime]);

  // Send message or internal note
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputText.trim();
    if (!content || !selectedTicketId || sending) return;

    setSending(true);
    try {
      const isInternal = replyMode === "note";
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicketId,
          content,
          isInternalNote: isInternal,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setInputText("");
        playChime("sent");
        setTicketDetail((prev) => {
          if (!prev) return prev;
          if (prev.messages.some((m) => m.id === data.message.id)) return prev;
          return {
            ...prev,
            messages: [...prev.messages, data.message],
          };
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  // Claim ticket
  const handleClaimTicket = async () => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claim: true }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTicketDetail(selectedTicketId);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to claim ticket:", err);
    }
  };

  // Update status
  const handleUpdateStatus = async (status: string) => {
    if (!selectedTicketId) return;
    try {
      const res = await fetch(`/api/admin/support/tickets/${selectedTicketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTicketDetail(selectedTicketId);
        fetchTickets();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const selectedTicket = ticketDetail?.ticket;

  return (
    <div className="space-y-6">
      {/* Top Operations Header & Metric Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900">
                Customer Support & Live Queue
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Real-time ticketing, 1-tap AI Assistant escalation triage, and customer chat.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
              soundEnabled
                ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            }`}
            title={soundEnabled ? "Mute audio chimes" : "Unmute audio chimes"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? "Audio On" : "Muted"}</span>
          </button>

          <button
            onClick={() => fetchTickets()}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 flex items-center gap-2 cursor-pointer shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Active Tickets
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {metrics.openTickets + metrics.inProgressTickets}
              </span>
              <span className="text-xs font-bold text-blue-600">Total Live</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block mb-1">
              Unassigned
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600">
                {metrics.unassignedTickets}
              </span>
              <span className="text-xs font-bold text-amber-600">Needs Claim</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              In Progress
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {metrics.inProgressTickets}
              </span>
              <span className="text-xs font-bold text-emerald-600">Active Chat</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Resolved Today
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {metrics.resolvedToday}
              </span>
              <span className="text-xs font-bold text-slate-400">Closed</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Customer Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 flex items-center gap-1">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                {metrics.averageRating}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                ({metrics.totalRatingsCount} reviews)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Split-View Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[780px]">
        {/* Left Column: Tickets Queue (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
          {/* Search & Tabs */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket # or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {[
                { id: "all", label: "All" },
                { id: "unassigned", label: "Unassigned" },
                { id: "mine", label: "Mine" },
                { id: "resolved", label: "Resolved" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                    filterTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Loading tickets...</p>
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                <p className="text-xs font-bold text-slate-700">Inbox is all clear!</p>
                <p className="text-[11px] mt-1">No active tickets matching this filter.</p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                const isUnassigned = !t.assigned_agent_id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 transition-all cursor-pointer border-l-4 ${
                      isSelected
                        ? "bg-blue-50/60 border-l-blue-600"
                        : "hover:bg-slate-50 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {t.ticket_number}
                        </span>
                        {isUnassigned ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                            Unassigned
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                            {t.assigned_agent?.display_name || "Assigned"}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-400">
                        {new Date(t.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                      {t.subject}
                    </h4>

                    <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-slate-500">
                      <span className="truncate max-w-[160px]">
                        {t.user?.email || "Candidate"}
                      </span>
                      <span className={`capitalize font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        t.status === "open" ? "bg-amber-100 text-amber-800" :
                        t.status === "in_progress" ? "bg-emerald-100 text-emerald-800" :
                        t.status === "waiting_user" ? "bg-purple-100 text-purple-800" :
                        "bg-slate-100 text-slate-600"
                      }`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Live Conversation & Actions (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col h-full overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">
                      {selectedTicket.ticket_number}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-bold text-slate-600 truncate">
                      {selectedTicket.subject}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    User: {selectedTicket.user?.email}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!selectedTicket.assigned_agent_id ? (
                    <button
                      onClick={handleClaimTicket}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 cursor-pointer transition-all flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Claim</span>
                    </button>
                  ) : (
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="h-8 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 px-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_user">Waiting User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Message Stream */}
              <div className="flex-1 p-5 overflow-y-auto bg-slate-50/30 flex flex-col gap-3">
                {detailLoading ? (
                  <div className="m-auto text-center">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Loading thread...</p>
                  </div>
                ) : (
                  ticketDetail?.messages.map((msg) => {
                    if (msg.sender_type === "system") {
                      return (
                        <div key={msg.id} className="text-center my-1">
                          <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold border border-slate-200/50">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    if (msg.is_internal_note) {
                      return (
                        <div
                          key={msg.id}
                          className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-sm"
                        >
                          <div className="flex items-center gap-1.5 font-bold text-amber-700 text-[10px] uppercase tracking-wider mb-1">
                            <Lock className="w-3 h-3" />
                            <span>Internal Staff Note (Hidden from candidate)</span>
                          </div>
                          <p className="font-medium whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      );
                    }

                    const isAgent = msg.sender_type === "agent";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isAgent ? "self-end items-end" : "self-start items-start"
                        }`}
                      >
                        <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                          {isAgent ? (msg.sender_name || "Support Specialist") : "Candidate"} •{" "}
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isAgent
                              ? "bg-blue-600 text-white font-medium rounded-tr-none shadow-sm"
                              : "bg-white border border-slate-200 text-slate-800 font-medium rounded-tl-none shadow-sm"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {msg.attachments.map((att: any, idx: number) => (
                                <a
                                  key={idx}
                                  href={att.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block rounded-xl overflow-hidden border border-black/10 hover:opacity-90 transition-opacity"
                                >
                                  <img
                                    src={att.url}
                                    alt={att.name || "Attachment"}
                                    className="max-h-40 w-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="p-4 border-t border-slate-100 bg-white space-y-3">
                {/* Reply Mode Toggle & Canned Responses Selector */}
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setReplyMode("reply")}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        replyMode === "reply"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Reply to Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyMode("note")}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        replyMode === "note"
                          ? "bg-amber-500 text-white shadow-sm"
                          : "text-amber-700 hover:text-amber-900"
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      Internal Note
                    </button>
                  </div>

                  {cannedResponses.length > 0 && (
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          setInputText((prev) => (prev ? `${prev}\n${val}` : val));
                        }
                        e.target.value = "";
                      }}
                      defaultValue=""
                      className="h-7 text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="" disabled>
                        ⚡ Insert Canned Response...
                      </option>
                      {cannedResponses.map((c) => (
                        <option key={c.id} value={c.content}>
                          {c.shortcut ? `${c.shortcut} - ` : ""}{c.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    title="Upload file or screenshot"
                    className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                  >
                    {uploadingAttachment ? (
                      <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Paperclip className="w-4 h-4" />
                    )}
                  </button>

                  <textarea
                    rows={2}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      replyMode === "reply"
                        ? "Type your response to the candidate (Shift+Enter for new line)..."
                        : "Write a private internal note for other staff members..."
                    }
                    className={`flex-1 p-3 rounded-xl border text-xs font-medium focus:outline-none resize-none transition-all ${
                      replyMode === "note"
                        ? "bg-amber-50/50 border-amber-200 focus:border-amber-400 placeholder-amber-700/60"
                        : "bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500"
                    }`}
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className={`h-11 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                      replyMode === "note"
                        ? "bg-amber-500 hover:bg-amber-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="m-auto text-center p-8 text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">Select a Ticket</h3>
              <p className="text-xs mt-1 max-w-[240px]">
                Choose a ticket from the inbox queue to view conversation history and customer details.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: JobVanta Context Card (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-5 h-full overflow-y-auto space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Zap className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Candidate Context Card
            </h3>
          </div>

          {selectedTicket ? (
            <>
              {/* Profile Card */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Candidate Profile
                </span>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                  <p className="text-xs font-bold text-slate-900">
                    {ticketDetail?.candidateContext?.profile?.full_name || "Candidate User"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {selectedTicket.user?.email}
                  </p>
                  <div className="pt-1 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      Verified Member
                    </span>
                  </div>
                </div>
              </div>

              {/* AI Assistant Handoff Summary */}
              {selectedTicket.context_snapshot?.aiAssistantSummary && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Assistant Escalation Summary
                  </span>
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs text-blue-950 leading-relaxed font-medium">
                    {selectedTicket.context_snapshot.aiAssistantSummary}
                  </div>
                </div>
              )}

              {/* Active Application Context */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  Active Job Application
                </span>
                {ticketDetail?.candidateContext?.activeApplication ? (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <p className="text-xs font-bold text-slate-900">
                      {ticketDetail.candidateContext.activeApplication.job?.title || "Target Position"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {ticketDetail.candidateContext.activeApplication.job?.company || "Company"} •{" "}
                      {ticketDetail.candidateContext.activeApplication.status || "Applied"}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-400 italic">
                    No active job application linked.
                  </div>
                )}
              </div>

              {/* Resume & ATS Context */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Latest Resume & ATS Score
                </span>
                {ticketDetail?.candidateContext?.resume ? (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {ticketDetail.candidateContext.resume.title || "Default Resume"}
                      </p>
                      {ticketDetail.candidateContext.resume.ats_score && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                          {ticketDetail.candidateContext.resume.ats_score}% ATS
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Updated: {new Date(ticketDetail.candidateContext.resume.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-400 italic">
                    No resume uploaded yet.
                  </div>
                )}
              </div>

              {/* Customer Satisfaction Feedback (if resolved) */}
              {selectedTicket.user_satisfaction_rating && (
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500" />
                    Customer Feedback
                  </span>
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 space-y-1">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(selectedTicket.user_satisfaction_rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    {selectedTicket.feedback_note && (
                      <p className="text-xs text-amber-950 font-medium italic">
                        "{selectedTicket.feedback_note}"
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center pt-8">
              Select a ticket to view applicant details.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
