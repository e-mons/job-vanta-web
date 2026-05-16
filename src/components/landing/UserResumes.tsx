"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from "framer-motion";
import { Plus, FileText, Sparkles, Clock, ArrowRight, ShieldCheck, Copy, Trash2, Loader2 } from "lucide-react";
import { useResumeStore } from '@/store/useResumeStore';
import { useSubscriptionStore } from '@/store/useSubscription';
import UpgradeModal from '@/components/shared/UpgradeModal';

export default function UserResumes() {
  const { userResumes, fetchUserResumes, isLoading: resumesLoading, deleteResume, duplicateResume } = useResumeStore();
  const { isPremium, status, fetchSubscription } = useSubscriptionStore();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  useEffect(() => {
    fetchUserResumes();
    fetchSubscription();
  }, [fetchUserResumes, fetchSubscription]);

  const handleCreateNew = (e: React.MouseEvent) => {
    if (!isPremium() && userResumes.length >= 2) {
      e.preventDefault();
      setUpgradeReason("You've reached the limit of 2 resumes on the Free plan. Upgrade to Premium for unlimited resumes!");
      setIsUpgradeModalOpen(true);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    if (!isPremium() && userResumes.length >= 2) {
      setUpgradeReason("You've reached the limit of 2 resumes on the Free plan. Upgrade to Premium for unlimited resumes!");
      setIsUpgradeModalOpen(true);
      return;
    }
    setIsDuplicating(id);
    await duplicateResume(id, `${title || "Untitled"} (Copy)`);
    setIsDuplicating(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (confirm("Are you sure you want to delete this resume?")) {
      setIsDeleting(id);
      await deleteResume(id);
      setIsDeleting(null);
    }
  };

  const premium = isPremium();

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Your Resumes</h2>
            {!premium && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Free: {userResumes.length}/2
              </span>
            )}
            {premium && (
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Premium Member
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm font-medium">Manage and edit your professional resumes.</p>
        </div>
        <Link href="/builder" className="group flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
          View All
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Create New Card */}
        <Link 
          href="/builder" 
          onClick={handleCreateNew}
          className="group relative p-8 rounded-[40px] border-2 border-dashed border-slate-200 bg-white hover:border-blue-600/40 hover:bg-blue-50/20 transition-all flex flex-col items-center justify-center min-h-[300px] gap-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative w-16 h-16 rounded-[22px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-white group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-600/10 transition-all duration-500">
            <Plus className="w-8 h-8" />
          </div>
          
          <div className="text-center relative z-10">
            <span className="block text-slate-900 font-bold text-xl mb-2">Create New</span>
            <span className="text-slate-500 text-sm font-medium">Start fresh or import with AI</span>
          </div>
          
          {!premium && userResumes.length >= 2 && (
            <div className="absolute top-8 right-8">
              <div className="relative">
                <div className="absolute -inset-2 bg-amber-400/20 rounded-full blur-md animate-pulse" />
                <Sparkles className="relative w-5 h-5 text-amber-500" />
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
        </Link>

        {/* Real Resumes */}
        {userResumes.map((resume, index) => (
          <motion.div
            key={resume.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative p-8 rounded-[40px] bg-white border border-slate-200/60 hover:border-blue-400 hover:shadow-[0_20px_50px_-20px_rgba(30,58,138,0.15)] transition-all duration-500 overflow-hidden flex flex-col"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-[22px] bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">Last Updated</div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    {new Date(resume.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors truncate">
                {resume.title || "Untitled Resume"}
              </h3>
              <p className="text-[15px] text-slate-500 font-medium mb-10 line-clamp-2 leading-relaxed flex-1">
                Your professional profile is ready for new opportunities. Keep it updated for better AI matching.
              </p>

              <div className="flex items-center gap-3 mt-auto">
                <Link 
                  href={`/builder/edit?id=${resume.id}`} 
                  className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 text-white font-bold text-sm text-center hover:bg-blue-700 shadow-xl shadow-blue-600/10 transition-all active:scale-95"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={(e) => handleDuplicate(e, resume.id, resume.title)}
                  disabled={isDuplicating === resume.id}
                  title="Duplicate Resume"
                  className="w-14 h-13 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                >
                  {isDuplicating === resume.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={(e) => handleDelete(e, resume.id)}
                  disabled={isDeleting === resume.id}
                  title="Delete Resume"
                  className="w-14 h-13 rounded-2xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                >
                  {isDeleting === resume.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Loading state placeholders */}
        {resumesLoading && userResumes.length === 0 && Array(1).fill(0).map((_, i) => (
           <div key={i} className="p-6 rounded-[32px] bg-white border border-slate-100 animate-pulse min-h-[280px]" />
        ))}
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        reason={upgradeReason}
      />
    </div>
  );
}
