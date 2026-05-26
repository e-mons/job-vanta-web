"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const messageEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom of chat log when new message is added
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  if (checkingAuth || !user) return null;

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) {
      setInputText("");
    }

    const userMessage: Message = {
      id: Math.random().toString(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
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

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: "assistant",
        content: `Error: ${err.message || "Failed to connect to assistant. Please try again."}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full text-white flex items-center justify-center shadow-xl shadow-blue-500/20 hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer z-50 group border-2 border-white overflow-hidden bg-blue-600"
      >
        <Image src="/avatar_2.jpg" alt="Lady on call" width={56} height={56} className="object-cover" />
      </button>

      {/* Chat Window Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 h-[520px] max-h-[calc(100vh-120px)] bg-white rounded-[2rem] border border-slate-200 shadow-2xl flex flex-col overflow-hidden z-50"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/20">
                  <Image src="/avatar_2.jpg" alt="Avatar" width={32} height={32} className="object-cover" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight leading-tight">Jobvanta AI Assistant</h3>
                  <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase leading-none mt-1">General Support & Coach</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 bg-slate-50/50 p-5 overflow-y-auto flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex-grow flex flex-col justify-center items-center text-center p-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg">
                    <Image src="/avatar_2.jpg" alt="Avatar" width={80} height={80} className="object-cover" />
                  </div>
                  <h4 className="font-black text-slate-900 text-lg mb-2">How can I help you today?</h4>
                  <p className="text-sm text-slate-500 font-medium mb-6 max-w-[240px]">
                    Ask me any questions about resume building, ATS scores, cover letters, or subscription packages.
                  </p>
                  
                  {/* Suggested Quick Questions */}
                  <div className="w-full text-left space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Suggested Questions</p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTIONS.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSend(suggestion)}
                          className="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-left text-xs font-bold text-blue-600 hover:border-blue-500 transition-all shadow-sm shadow-slate-100 hover:scale-[1.02] cursor-pointer"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message) => {
                    const isUser = message.role === "user";
                    return (
                      <div
                        key={message.id}
                        className={`flex gap-3 max-w-[85%] ${
                          isUser ? "self-end flex-row-reverse" : "self-start"
                        }`}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-1 border border-slate-200 shadow-sm bg-white">
                            <Image src="/avatar_2.jpg" alt="Avatar" width={28} height={28} className="object-cover" />
                          </div>
                        )}
                        <div
                          className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? "bg-blue-600 text-white font-semibold rounded-tr-none shadow-md shadow-blue-500/10"
                              : "bg-white border border-slate-200 text-slate-800 font-medium rounded-tl-none shadow-sm"
                          }`}
                        >
                          {message.content}
                        </div>
                      </div>
                    );
                  })}
                  
                  {isLoading && (
                    <div className="flex gap-3 self-start items-center text-slate-500 text-xs font-semibold bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      Jobvanta AI is typing...
                    </div>
                  )}
                  <div ref={messageEndRef} />
                </>
              )}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-4 bg-white border-t border-slate-200 flex items-center gap-3"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask anything about Jobvanta..."
                className="flex-grow h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all cursor-pointer shadow-md ${
                  inputText.trim()
                    ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-95"
                    : "bg-slate-200 cursor-not-allowed shadow-none"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
