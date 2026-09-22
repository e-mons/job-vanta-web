"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  X, 
  Send, 
  Headphones, 
  Star, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  Paperclip,
  AlertCircle,
  LogIn,
  History,
  ExternalLink,
  Plus
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import type { SupportTicket, SupportMessage } from "@shared/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "How do I build a resume?",
  "What is an ATS score?",
  "How do I generate a cover letter?",
  "How do I upgrade to Pro?",
  "Can I apply for jobs directly?",
];

export default function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "human">("ai");

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiInputText, setAiInputText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Human Support state
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [humanInputText, setHumanInputText] = useState("");
  const [humanSending, setHumanSending] = useState(false);
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingValue, setRatingValue] = useState<number>(5);
  const [escalateError, setEscalateError] = useState<string | null>(null);

  // Ticket history sub-view for Human tab
  const [humanViewMode, setHumanViewMode] = useState<"chat" | "history">("chat");
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const aiEndRef = useRef<HTMLDivElement>(null);
  const humanEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // File upload for screenshots/documents
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeTicket || !user) return;
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
      if (!fileUrl) throw new Error("Could not get signed URL");

      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          content: `Attached screenshot: ${file.name}`,
          attachments: [{ name: file.name, url: fileUrl, size: file.size, type: file.type }],
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        playChime("sent");
        setTicketMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error("Failed to upload screenshot:", err);
    } finally {
      setUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Pleasant Web Audio synthesizer for incoming message chime
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
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(554.37, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio playback fails gracefully
    }
  }, []);

  // Fetch active ticket for candidate
  const fetchActiveTicket = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/support/tickets/active");
      const data = await res.json();
      if (data.success && data.ticket) {
        setActiveTicket(data.ticket);
        setTicketMessages(data.messages || []);
      } else {
        setActiveTicket(null);
        setTicketMessages([]);
      }
    } catch (err) {
      console.error("Error fetching active ticket:", err);
    }
  }, [user]);

  // Fetch all user tickets for history
  const fetchUserTickets = useCallback(async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/support/tickets");
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        setUserTickets(data.tickets);
      }
    } catch (err) {
      console.error("Failed to load user tickets:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [user]);

  const handleSelectTicketFromHistory = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setHumanViewMode("chat");
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setTicketMessages(data.messages);
      }
    } catch (err) {
      console.error("Failed to load ticket messages:", err);
    }
  };

  const handleStartNewRequest = () => {
    setActiveTicket(null);
    setTicketMessages([]);
    setHumanViewMode("chat");
  };

  useEffect(() => {
    const supabase = createClient();

    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setCheckingAuth(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setCheckingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchActiveTicket();
      fetchUserTickets();
    }
  }, [user, fetchActiveTicket, fetchUserTickets]);

  // Realtime subscription for human support messages
  useEffect(() => {
    if (!user || !activeTicket) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`candidate-ticket-${activeTicket.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${activeTicket.id}`,
        },
        (payload: any) => {
          const newMsg = payload.new as SupportMessage;
          if (newMsg.is_internal_note) return;

          setTicketMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (newMsg.sender_type === "agent") {
            playChime("incoming");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_tickets",
          filter: `id=eq.${activeTicket.id}`,
        },
        (payload: any) => {
          setActiveTicket((prev: SupportTicket | null) => (prev ? { ...prev, ...payload.new } : payload.new));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeTicket, playChime]);

  // Auto-scroll
  useEffect(() => {
    if (activeTab === "ai") {
      aiEndRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      humanEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, ticketMessages, aiLoading, activeTab]);

  if (checkingAuth || !user) return null;

  // AI Send
  const handleAiSend = async (textToSend?: string) => {
    const text = (textToSend || aiInputText).trim();
    if (!text) return;

    if (!textToSend) setAiInputText("");

    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: text,
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setAiLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...aiMessages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to get reply");

      const botMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: data.reply || "I'm sorry, I couldn't generate a response. Please try again.",
      };

      setAiMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: `Error: ${err.message || "Failed to connect to assistant. Please try again."}`,
      };
      setAiMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAiLoading(false);
    }
  };

  // 1-Tap Escalation from AI Assistant to Live Human Agent
  const handleEscalateToHuman = async () => {
    if (!user) {
      const returnUrl = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
      window.location.href = `/login?redirect=${encodeURIComponent(returnUrl)}`;
      return;
    }

    setEscalating(true);
    setEscalateError(null);
    try {
      // Summarize recent AI conversation context
      const lastMessages = aiMessages.slice(-4).map((m) => `${m.role}: ${m.content}`).join("\n");
      const summary = lastMessages 
        ? `Candidate requested live human support after discussing:\n${lastMessages}`
        : "Candidate requested human agent assistance from the AI Assistant.";

      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Assistance requested via Jobvanta AI Assistant",
          source: "ai_assistant_handoff",
          category: "general",
          contextSnapshot: {
            aiAssistantSummary: summary,
            recentAiMessages: aiMessages.slice(-6),
            currentPath: typeof window !== "undefined" ? window.location.pathname : "/",
          },
          initialMessage: aiMessages.length > 0 
            ? `Hello, I was asking the AI Assistant about this and would love help from a person: "${aiMessages[aiMessages.length - 1].content}"`
            : "Hello! I would like to speak with a human support specialist.",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.ticket) {
        throw new Error(data.error || "Failed to start live support session. Please try again.");
      }

      setActiveTicket(data.ticket);
      if (data.firstMessage) {
        setTicketMessages([data.firstMessage]);
      }
      setShowEscalateConfirm(false);
      setActiveTab("human");
      playChime("sent");

      await fetchActiveTicket();
    } catch (err: any) {
      console.error("Failed to escalate:", err);
      setEscalateError(err.message || "Failed to connect to human support. Please try again.");
    } finally {
      setEscalating(false);
    }
  };

  // Human Message Send
  const handleHumanSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = humanInputText.trim();
    if (!content || !activeTicket || humanSending) return;

    setHumanSending(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: activeTicket.id,
          content,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setHumanInputText("");
        playChime("sent");
        setTicketMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setHumanSending(false);
    }
  };

  // Submit 5-star rating
  const handleRateSupport = async (rating: number) => {
    if (!activeTicket) return;
    try {
      await fetch(`/api/support/tickets/${activeTicket.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setRatingSubmitted(true);
      setActiveTicket((prev: SupportTicket | null) => prev ? { ...prev, status: "closed", user_satisfaction_rating: rating } : null);
    } catch (err) {
      console.error("Failed to submit rating:", err);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer z-50 group border-2 border-white overflow-hidden bg-blue-600"
        title="JobVanta Support & Assistant"
      >
        <Image 
          src="/avatar_2.jpg" 
          alt="Support specialist" 
          width={56} 
          height={56} 
          className="object-cover" 
          loading="eager" 
          priority 
        />
        {activeTicket && activeTicket.status !== "closed" && (
          <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 h-[540px] max-h-[calc(100vh-120px)] bg-white rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 text-white flex flex-col gap-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/20">
                    <Image src="/avatar_2.jpg" alt="Avatar" width={32} height={32} className="object-cover" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm tracking-tight leading-tight">JobVanta Support</h3>
                    <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase leading-none mt-0.5">
                      {activeTab === "ai" ? "AI Coach & Guide" : "Live Human Specialist"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center p-1 bg-white/10 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "ai"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Assistant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("human")}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                    activeTab === "human"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Human Agent</span>
                  {activeTicket && activeTicket.status !== "closed" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* TAB 1: AI Assistant */}
            {activeTab === "ai" && (
              <>
                <div className="flex-1 bg-slate-50/50 p-4 overflow-y-auto flex flex-col gap-3">
                  {/* Banner to escalate to human agent */}
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Headphones className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-900 leading-tight">Need personal help?</p>
                        <p className="text-[10px] text-blue-700 font-medium">Our team is online right now.</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEscalateConfirm(true)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] shrink-0 cursor-pointer shadow-sm transition-all"
                    >
                      Talk to Human
                    </button>
                  </div>

                  {aiMessages.length === 0 ? (
                    <div className="flex-grow flex flex-col justify-center items-center text-center p-3">
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border-4 border-white shadow-md">
                        <Image src="/avatar_2.jpg" alt="Avatar" width={64} height={64} className="object-cover" />
                      </div>
                      <h4 className="font-black text-slate-900 text-base mb-1">How can I help you today?</h4>
                      <p className="text-xs text-slate-500 font-medium mb-4 max-w-[240px]">
                        Ask about resume building, ATS match scores, or speak directly with our human specialists.
                      </p>
                      
                      <div className="w-full text-left space-y-1.5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Suggested Questions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {SUGGESTIONS.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleAiSend(suggestion)}
                              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-left text-xs font-bold text-blue-600 hover:border-blue-500 transition-all shadow-sm hover:scale-[1.02] cursor-pointer"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {aiMessages.map((message) => {
                        const isUser = message.role === "user";
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-2.5 max-w-[85%] ${
                              isUser ? "self-end flex-row-reverse" : "self-start"
                            }`}
                          >
                            {!isUser && (
                              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mt-1 border border-slate-200 shadow-sm bg-white">
                                <Image src="/avatar_2.jpg" alt="Avatar" width={24} height={24} className="object-cover" />
                              </div>
                            )}
                            <div
                              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                isUser
                                  ? "bg-blue-600 text-white font-semibold rounded-tr-none shadow-sm"
                                  : "bg-white border border-slate-200 text-slate-800 font-medium rounded-tl-none shadow-sm"
                              }`}
                            >
                              {message.content}
                            </div>
                          </div>
                        );
                      })}
                      
                      {aiLoading && (
                        <div className="flex gap-2 self-start items-center text-slate-500 text-xs font-semibold bg-white border border-slate-200 px-3 py-2 rounded-2xl rounded-tl-none shadow-sm">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                          Jobvanta AI is typing...
                        </div>
                      )}
                      <div ref={aiEndRef} />
                    </>
                  )}
                </div>

                {/* AI Input Footer */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAiSend();
                  }}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={aiInputText}
                    onChange={(e) => setAiInputText(e.target.value)}
                    placeholder="Ask anything about JobVanta..."
                    className="flex-grow h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!aiInputText.trim()}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer shadow-md ${
                      aiInputText.trim()
                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-95"
                        : "bg-slate-200 cursor-not-allowed shadow-none"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}

            {/* TAB 2: Live Human Specialist */}
            {activeTab === "human" && (
              <>
                {/* Sub-header navigation: Live Chat vs All Requests */}
                {user && (
                  <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200/80 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setHumanViewMode("chat")}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                          humanViewMode === "chat"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Headphones className="w-3 h-3" />
                        <span>Live Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHumanViewMode("history");
                          fetchUserTickets();
                        }}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                          humanViewMode === "history"
                            ? "bg-blue-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <History className="w-3 h-3" />
                        <span>History ({userTickets.length})</span>
                      </button>
                    </div>

                    <Link
                      href="/dashboard/support"
                      onClick={() => setIsOpen(false)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                    >
                      <span>Full Hub</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}

                {/* VIEW 1: Ticket History List */}
                {humanViewMode === "history" ? (
                  <div className="flex-1 bg-slate-50/50 p-4 overflow-y-auto flex flex-col gap-2.5">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Past Support Requests
                      </p>
                      <button
                        type="button"
                        onClick={handleStartNewRequest}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
                      >
                        <Plus className="w-3 h-3" />
                        <span>New Request</span>
                      </button>
                    </div>

                    {loadingHistory ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-medium">
                        Loading requests...
                      </div>
                    ) : userTickets.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">No previous requests</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Click 'New Request' to chat with a specialist!</p>
                      </div>
                    ) : (
                      userTickets.map((t) => {
                        const isResolved = t.status === "resolved" || t.status === "closed";
                        const isCurrent = activeTicket?.id === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => handleSelectTicketFromHistory(t)}
                            className={`p-3 rounded-2xl border bg-white cursor-pointer transition-all hover:border-blue-400 shadow-xs ${
                              isCurrent ? "border-blue-500 shadow-sm ring-1 ring-blue-500/20" : "border-slate-200/80"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-xs font-bold text-blue-600">
                                {t.ticket_number}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                isResolved
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : t.assigned_agent_id
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {isResolved ? "Resolved" : t.assigned_agent ? t.assigned_agent.display_name : "Waiting"}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-1.5">
                              {t.subject}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                              <span>
                                {new Date(t.created_at).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              {t.user_satisfaction_rating && (
                                <span className="text-amber-500 font-bold flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-400" />
                                  <span>{t.user_satisfaction_rating}★</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <>
                    <div className="flex-1 bg-slate-50/50 p-4 overflow-y-auto flex flex-col gap-3">
                  {!user && !checkingAuth ? (
                    <div className="flex-grow flex flex-col justify-center items-center text-center p-6">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100 shadow-sm">
                        <Headphones className="w-8 h-8" />
                      </div>
                      <h4 className="font-black text-slate-900 text-base mb-1">
                        Connect with Live Support
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mb-6 max-w-[260px] leading-relaxed">
                        Please sign in to your JobVanta account to chat with our support team and carry your resume and job details along.
                      </p>

                      <a
                        href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/dashboard")}`}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In to Continue</span>
                      </a>
                    </div>
                  ) : !activeTicket ? (
                    <div className="flex-grow flex flex-col justify-center items-center text-center p-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100 shadow-sm">
                        <Headphones className="w-8 h-8" />
                      </div>
                      <h4 className="font-black text-slate-900 text-base mb-1">
                        Connect with a Live Specialist
                      </h4>
                      <p className="text-xs text-slate-500 font-medium mb-6 max-w-[260px] leading-relaxed">
                        Need help with your resume ATS score, job applications, or an interview question? Our dedicated support team is ready to assist you.
                      </p>

                      {escalateError && (
                        <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 text-left">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{escalateError}</span>
                        </div>
                      )}

                      <button
                        onClick={handleEscalateToHuman}
                        disabled={escalating}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-lg shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        {escalating ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            <span>Start Live Chat with a Human Agent</span>
                          </>
                        )}
                      </button>

                      <p className="text-[11px] text-slate-400 font-medium mt-3 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        We automatically attach your resume context for faster support.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Ticket Status Bar */}
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            activeTicket.status === "resolved" 
                              ? "bg-blue-500" 
                              : activeTicket.assigned_agent_id 
                              ? "bg-emerald-500 animate-pulse" 
                              : "bg-amber-500 animate-ping"
                          }`} />
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-tight">
                              {activeTicket.status === "resolved"
                                ? "Issue Resolved"
                                : activeTicket.assigned_agent
                                ? `With ${activeTicket.assigned_agent.display_name}`
                                : "Connecting to a Specialist..."}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              Ticket {activeTicket.ticket_number}
                            </p>
                          </div>
                        </div>

                        {activeTicket.status === "resolved" && !ratingSubmitted && (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[10px] font-bold">
                            Rate your chat below
                          </span>
                        )}
                      </div>

                      {/* Messages Stream */}
                      {ticketMessages.map((msg) => {
                        if (msg.sender_type === "system") {
                          return (
                            <div key={msg.id} className="text-center my-1">
                              <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium border border-slate-200/60">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }

                        const isUser = msg.sender_type === "user";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${
                              isUser ? "self-end items-end" : "self-start items-start"
                            }`}
                          >
                            {!isUser && (
                              <span className="text-[10px] font-bold text-slate-400 mb-0.5 px-1">
                                {msg.sender_name || "Support Specialist"}
                              </span>
                            )}
                            <div
                              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                                isUser
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
                                        alt={att.name || "Screenshot"}
                                        className="max-h-36 w-full object-cover"
                                      />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Resolution Rating Card */}
                      {activeTicket.status === "resolved" && !ratingSubmitted && (
                        <div className="p-4 bg-gradient-to-tr from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-center space-y-3 shadow-sm my-2">
                          <h4 className="text-xs font-black text-slate-900">
                            Did this help solve your issue?
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Tap a star to rate your support experience:
                          </p>
                          <div className="flex items-center justify-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRateSupport(star)}
                                className="p-1 hover:scale-125 transition-all cursor-pointer"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= ratingValue
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-slate-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {ratingSubmitted && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Thank you for your feedback!</span>
                        </div>
                      )}

                      <div ref={humanEndRef} />
                    </>
                  )}
                    </div>

                    {/* Human Chat Footer */}
                    {activeTicket && activeTicket.status !== "closed" && (
                      <form
                        onSubmit={handleHumanSend}
                        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
                      >
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
                          title="Upload screenshot or document"
                          className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                        >
                          {uploadingAttachment ? (
                            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Paperclip className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          type="text"
                          value={humanInputText}
                          onChange={(e) => setHumanInputText(e.target.value)}
                          placeholder="Type a message to your specialist..."
                          className="flex-grow h-10 bg-slate-50 border border-slate-200 rounded-xl px-3.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!humanInputText.trim() || humanSending}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer shadow-md shrink-0 ${
                            humanInputText.trim() && !humanSending
                              ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-95"
                              : "bg-slate-200 cursor-not-allowed shadow-none"
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    )}
                  </>
                )}
              </>
            )}

            {/* 1-Tap Escalation Confirmation Modal */}
            {showEscalateConfirm && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-5 z-50">
                <div className="bg-white rounded-3xl p-5 w-full shadow-2xl border border-slate-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
                    <Headphones className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Speak with a Real Person
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      We'll connect you directly with a JobVanta human specialist and bring your current career details along so you don't have to repeat yourself.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEscalateConfirm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEscalateToHuman}
                      disabled={escalating}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {escalating ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span>Connect Now</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
