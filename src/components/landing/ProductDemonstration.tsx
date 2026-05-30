"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Sparkles, 
  Search, 
  MessageSquare, 
  CheckCircle2, 
  Plus, 
  Send,
  Loader2,
  TrendingUp,
  Percent,
  ListTodo
} from 'lucide-react';

const TABS = [
  {
    id: 'builder',
    label: 'Resume Builder',
    icon: <FileText className="w-4 h-4" />,
    title: 'Build ATS-Friendly Resumes',
    subtitle: 'Craft professional resumes with real-time formatting, tailored templates, and AI assistant suggestions.',
    features: [
      'Modern, Executive, Creative, and Tech templates',
      'One-tap formatting alignment',
      'Dynamic section builder (Experience, Skills, Education)',
      'Export directly to clean PDF format'
    ]
  },
  {
    id: 'ats',
    label: 'ATS Optimization',
    icon: <Percent className="w-4 h-4" />,
    title: 'Beat Applicant Tracking Systems',
    subtitle: 'Upload a job description and compare it against your resume to identify missing keywords and formatting improvements.',
    features: [
      'Comprehensive ATS compatibility score',
      'Semantic keyword extraction and suggestions',
      'Missing skills identification analysis',
      'Actionable tailoring guide'
    ]
  },
  {
    id: 'coach',
    label: 'AI Career Coach',
    icon: <MessageSquare className="w-4 h-4" />,
    title: 'Personal Career Advisor 24/7',
    subtitle: 'Chat with our AI career guide for interview prep, salary negotiation, resume reviews, and career roadmap planning.',
    features: [
      'Real-time career roadmap guidance',
      'Mock interview question trainer',
      'Tailored resume phrasing advice',
      'No appointment needed, always available'
    ]
  },
  {
    id: 'matching',
    label: 'Smart Job Match',
    icon: <Search className="w-4 h-4" />,
    title: 'Verified Skill-Based Job Search',
    subtitle: 'Match your verified resume skills against hundreds of active job listings to find the roles with the highest alignment.',
    features: [
      'Instant skill gap matching analysis',
      'Direct, spam-free company listings',
      'High-alignment filter (>80% skill match)',
      'Track applications directly in the platform'
    ]
  }
];

export default function ProductDemonstration() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  
  // States for AI Coach Simulator
  const [chatMessages, setChatMessages] = useState<Array<{role: 'user' | 'assistant', text: string}>>([
    { role: 'assistant', text: "Hello! I am your JobVanta Career Coach. Ask me how to improve your resume, prep for an interview, or target a new role!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const simulateBotResponse = (userText: string) => {
    setIsTyping(true);
    setTimeout(() => {
      let reply = "That's a great question! For this role, I recommend optimizing your skills section to include keywords directly matching the job description, such as React, TypeScript, and state management.";
      if (userText.toLowerCase().includes('interview')) {
        reply = "When preparing for interviews, try using the STAR method (Situation, Task, Action, Result) to structure your answers. Would you like to practice a mock behavioral question?";
      } else if (userText.toLowerCase().includes('ats')) {
        reply = "ATS algorithms filter resumes based on keyword relevance. JobVanta scans job listings and identifies missing keywords, helping you tailor your CV for each application.";
      }
      setChatMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    setChatInput('');
    simulateBotResponse(text);
  };

  const handleSuggestionClick = (text: string) => {
    setChatMessages(prev => [...prev, { role: 'user', text }]);
    simulateBotResponse(text);
  };

  return (
    <section id="demo" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-100/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-indigo-100/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Interactive Tour</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            See How JobVanta <br />
            <span className="text-blue-600">Accelerates Your Career</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Explore the core features JobVanta offers to transform your job search, refine your credentials, and land interview offers.
          </p>
        </div>

        {/* Tabs Bar */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-bold transition-all ${
                activeTab.id === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105'
                  : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panel */}
        <div className="bg-white border border-slate-200/60 rounded-[3rem] shadow-2xl shadow-blue-900/5 overflow-hidden min-h-[560px] grid lg:grid-cols-2 gap-8 p-8 md:p-12 items-center">
          
          {/* Left: Info Content */}
          <div className="space-y-8 text-left">
            <div>
              <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight">
                {activeTab.title}
              </h3>
              <p className="text-slate-500 font-medium leading-relaxed text-base">
                {activeTab.subtitle}
              </p>
            </div>

            <div className="space-y-3.5">
              {activeTab.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-4">
              <a
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4.5 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
              >
                Try this Feature
                <Sparkles className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right: Mockup Previews */}
          <div className="bg-slate-50 border border-slate-100 rounded-[2.5rem] p-6 min-h-[420px] flex items-center justify-center relative overflow-hidden shadow-inner w-full">
            <AnimatePresence mode="wait">
              {activeTab.id === 'builder' && (
                <motion.div
                  key="builder"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 max-w-sm space-y-5 text-left font-sans"
                >
                  <div className="border-b border-slate-100 pb-4">
                    <h4 className="font-extrabold text-slate-800 text-lg">Alex Mercer</h4>
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">Frontend Engineer</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Experience</span>
                      <Plus className="w-4 h-4 text-slate-400 hover:text-blue-600 cursor-pointer" />
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1">
                      <p className="text-xs font-bold text-slate-700">Senior React Developer at Acme Corp</p>
                      <p className="text-[10px] text-slate-400 font-semibold">2023 - Present (San Francisco, CA)</p>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        • Built responsive web dashboards utilizing React, Next.js, and TypeScript.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {['React', 'Next.js', 'TypeScript', 'Tailwind', 'GraphQL'].map(s => (
                        <span key={s} className="px-2.5 py-1 bg-blue-50 border border-blue-100/50 text-blue-600 rounded-lg text-[10px] font-bold">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab.id === 'ats' && (
                <motion.div
                  key="ats"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 max-w-sm text-left space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-slate-700 text-sm">Resume Tailoring Scorer</span>
                    <span className="text-xs font-bold text-slate-400">ATS optimization</span>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Dial */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                        <motion.circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          stroke="#2563eb" 
                          strokeWidth="8" 
                          fill="transparent" 
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 251.2 * (1 - 0.85) }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-extrabold text-slate-800">85%</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Match</span>
                      </div>
                    </div>
                    {/* Insights */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-emerald-600">Great Keyword Match!</p>
                      <p className="text-[11px] text-slate-400 font-medium">Your resume matches 14 out of 18 essential skills.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Missing Keywords</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl">
                        <span className="text-[11px] font-bold text-amber-700">GraphQL</span>
                        <span className="text-[9px] font-bold bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">High Priority</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <span className="text-[11px] font-bold text-slate-600">CI/CD Pipeline</span>
                        <span className="text-[9px] font-bold bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">Medium</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab.id === 'coach' && (
                <motion.div
                  key="coach"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-lg flex flex-col h-[380px] max-w-sm"
                >
                  {/* Chat Header */}
                  <div className="bg-slate-900 p-4 flex items-center gap-3 border-b border-slate-800 rounded-t-2xl">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-xs font-black">JV</div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white">JobVanta AI Coach</p>
                      <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Active Now</p>
                    </div>
                  </div>
                  {/* Chat Body */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-left text-xs text-slate-700 max-h-[220px]">
                    {chatMessages.map((m, idx) => (
                      <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-[80%] font-medium leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-none'
                            : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start items-center gap-2 text-slate-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-[10px] font-semibold">typing...</span>
                      </div>
                    )}
                  </div>
                  {/* Suggestions Pills */}
                  <div className="px-4 py-2 border-t border-slate-50 flex gap-2 overflow-x-auto whitespace-nowrap">
                    <button 
                      onClick={() => handleSuggestionClick("How do I fix my resume?")}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500"
                    >
                      💡 Optimize Resume
                    </button>
                    <button 
                      onClick={() => handleSuggestionClick("Give me interview tips")}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-500"
                    >
                      🎯 Prep Interview
                    </button>
                  </div>
                  {/* Input form */}
                  <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 flex gap-2 bg-slate-50 rounded-b-2xl">
                    <input 
                      type="text" 
                      placeholder="Ask the coach anything..." 
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 font-semibold"
                    />
                    <button 
                      type="submit" 
                      disabled={!chatInput.trim()}
                      className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </motion.div>
              )}

              {activeTab.id === 'matching' && (
                <motion.div
                  key="matching"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full bg-white rounded-2xl border border-slate-200/80 shadow-lg p-6 max-w-sm text-left space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-bold text-slate-700 text-sm">Smart Job Matches</span>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Active Matches</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-800">Frontend Engineer</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Vercel • Remote</p>
                      </div>
                      <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-center shrink-0">
                        <p className="text-[11px] font-black text-emerald-600 leading-none">94%</p>
                        <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 leading-none">Match</p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-800">React Specialist</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stripe • San Francisco</p>
                      </div>
                      <div className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-center shrink-0">
                        <p className="text-[11px] font-black text-emerald-600 leading-none">88%</p>
                        <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest mt-0.5 leading-none">Match</p>
                      </div>
                    </div>
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between opacity-60">
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-slate-800">Full-Stack Engineer</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Linear • Remote</p>
                      </div>
                      <div className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-center shrink-0">
                        <p className="text-[11px] font-black text-slate-500 leading-none">75%</p>
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-0.5 leading-none">Match</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>

      </div>
    </section>
  );
}
