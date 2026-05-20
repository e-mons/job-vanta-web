"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CompanyLogo from "./CompanyLogo";

import { 
  X, 
  MapPin, 
  Building2, 
  Clock, 
  Zap, 
  DollarSign, 
  Globe, 
  ShieldCheck, 
  Calendar,
  Briefcase,
  Share2,
  ExternalLink,
  Sparkles,
  ArrowUpRight,
  Bookmark
} from "lucide-react";
import { Job } from "@/store/useJobStore";
import { useSubscriptionStore } from "@/store/useSubscription";

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
}

export default function JobDetailsModal({ job, isOpen, onClose, onApply }: JobDetailsModalProps) {
  const { isPremium } = useSubscriptionStore();
  const premium = isPremium();
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8 overflow-hidden">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
          />
          
          {/* Main Premium Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-[32px] shadow-[0_0_50px_rgba(37,99,235,0.15)] overflow-hidden flex flex-col text-slate-100"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header / Banner Area */}
            <div className="relative h-28 md:h-32 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex-shrink-0 border-b border-slate-800 overflow-hidden flex items-end">
              {/* Pattern Overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white transition-all border border-slate-700/50 z-20 hover:scale-105 active:scale-95 group"
              >
                <X className="w-4.5 h-4.5 group-hover:rotate-90 transition-transform duration-200" />
              </button>

              {/* Title & Info Wrapper */}
              <div className="relative z-10 w-full px-6 md:px-8 pb-4 flex flex-row items-center gap-4">
                <div className="relative flex-shrink-0 rounded-xl overflow-hidden border border-blue-500 bg-slate-900 shadow-[0_0_15px_rgba(59,130,246,0.25)] hover:scale-105 transition-transform duration-300">
                  <CompanyLogo 
                    logoUrl={job.companyLogo} 
                    companyName={job.company} 
                    size="md"
                    className="p-1"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Premium Badge */}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-wide uppercase">
                      <Sparkles className="w-2.5 h-2.5" />
                      AI Verified Match
                    </div>
                  </div>
                  <h2 className="text-lg md:text-2xl font-extrabold tracking-tight text-white mb-1 leading-tight drop-shadow-sm truncate">
                    {job.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-y-0.5 gap-x-3 text-xs font-semibold text-slate-400">
                    <div className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors">
                      <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{job.company}</span>
                    </div>
                    <span className="w-1 h-1 rounded-full bg-slate-700 hidden sm:inline" />
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>{job.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto premium-scrollbar-dark px-6 md:px-8 py-6 relative">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Details Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Job Description Card */}
                  <section className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                    <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                      <Briefcase className="w-4.5 h-4.5 text-blue-400" />
                      About The Role
                    </h3>
                    <p className="text-slate-300 leading-relaxed text-xs md:text-sm whitespace-pre-wrap font-medium">
                      {job.description}
                    </p>
                  </section>

                  {/* Skills Section */}
                  {job.skills && job.skills.length > 0 && (
                    <section className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-inner relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-violet-600" />
                      <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                        <Zap className="w-4.5 h-4.5 text-indigo-400 animate-pulse" />
                        Key Skills Required
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skills.map((skill) => (
                          <span 
                            key={skill}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-300 hover:border-blue-500/50 hover:text-white transition-all duration-200 cursor-default"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar Info Column */}
                <div className="space-y-4">
                  {/* Glassmorphic Overview Panel */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950/70 to-slate-950/30 border border-slate-800 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800/60 pb-2">
                      Overview Details
                    </h4>
                    
                    <div className="space-y-3">
                      {/* Salary */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                          <DollarSign className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Salary Range</p>
                          <p className="text-xs font-semibold text-slate-200 truncate">{job.salary || "Competitive"}</p>
                        </div>
                      </div>

                      {/* Posted On */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                          <Calendar className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Posted Date</p>
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            {new Date(job.postedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Remote */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Location Model</p>
                          <p className="text-xs font-semibold text-slate-200 truncate">{job.isRemote ? "100% Remote" : "On-site / Hybrid"}</p>
                        </div>
                      </div>

                      {/* Source */}
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Platform Source</p>
                          <p className="text-xs font-semibold text-slate-200 truncate">{job.source}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Share & Source Links */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button 
                      onClick={handleShare}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {copied ? "Copied!" : "Share"}
                    </button>
                    <a 
                      href={job.applyLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center gap-1.5 text-[11px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Source
                    </a>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Premium Action Bar */}
            <div className="py-4 px-6 md:px-8 border-t border-slate-800 bg-slate-950/70 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 z-10">
              <div className="flex items-center gap-2.5 self-start sm:self-auto">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-0.5">End-to-End Encrypted</p>
                  <p className="text-[11px] font-bold text-slate-400 leading-none">Applications are safe and secure</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white font-bold text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={onApply}
                  className="flex-1 sm:flex-none px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs hover:from-blue-500 hover:to-indigo-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 group cursor-pointer"
                >
                  Apply Instantly
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

