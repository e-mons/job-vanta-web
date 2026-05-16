"use client";

import { motion, AnimatePresence } from "framer-motion";
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
  ExternalLink
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

  if (!job) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl shadow-blue-900/20 overflow-hidden flex flex-col"
          >
            {/* Header / Banner Area */}
            <div className="relative h-48 md:h-64 bg-slate-50 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5" />
              
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-3 rounded-2xl bg-white/80 backdrop-blur-md text-slate-400 hover:text-slate-900 transition-all border border-white/20 z-10"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="absolute -bottom-10 left-12 flex items-end gap-8">
                {job.companyLogo ? (
                  <div className="w-32 h-32 rounded-[32px] bg-white border-4 border-white shadow-2xl p-4 flex items-center justify-center">
                    <img src={job.companyLogo} alt={job.company} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-600 border-4 border-white shadow-2xl flex items-center justify-center text-white text-4xl font-black">
                    {job.company.charAt(0)}
                  </div>
                )}
                
                <div className="mb-6">
                  <h2 className="text-3xl font-black text-slate-900 mb-2">{job.title}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                      <Building2 className="w-4 h-4" />
                      {job.company}
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pt-16 px-12 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-12">
                  <section>
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      Job Description
                    </h3>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-slate-600 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                        {job.description}
                      </p>
                    </div>
                  </section>

                  {job.skills && job.skills.length > 0 && (
                    <section>
                      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                          <Zap className="w-4 h-4" />
                        </div>
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {job.skills.map((skill) => (
                          <span 
                            key={skill}
                            className="px-5 py-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                  <div className="p-8 rounded-[40px] bg-slate-50 border border-slate-100 space-y-8">
                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Job Overview</h4>
                    
                    <div className="space-y-6">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-sm">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Salary Range</p>
                          <p className="font-bold text-slate-900">{job.salary || "Competitive"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 flex-shrink-0 shadow-sm">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Posted On</p>
                          <p className="font-bold text-slate-900">{new Date(job.postedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 flex-shrink-0 shadow-sm">
                          <Globe className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Remote Status</p>
                          <p className="font-bold text-slate-900">{job.isRemote ? "Fully Remote" : "On-site / Hybrid"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-rose-600 flex-shrink-0 shadow-sm">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-0.5">Source</p>
                          <p className="font-bold text-slate-900">{job.source}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button className="flex-1 p-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 font-bold text-slate-600 hover:bg-slate-50 transition-all">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <a 
                      href={job.applyLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 p-4 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Source
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-8 border-t border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verified Application</p>
                  <p className="text-xs font-bold text-slate-900">Your data is safe & encrypted</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="px-8 py-4 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
                <button
                  onClick={onApply}
                  className="px-12 py-4 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 transition-all shadow-2xl shadow-blue-600/30 active:scale-95 flex items-center gap-3"
                >
                  Apply Now
                  <Briefcase className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
