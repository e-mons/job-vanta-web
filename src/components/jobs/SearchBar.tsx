"use client";

import { Search, MapPin, Sparkles, Loader2 } from "lucide-react";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import UpgradeModal from "@/components/shared/UpgradeModal";
import { z } from "zod";

const searchSchema = z.string().min(2, "Please enter at least 2 characters to search.");

export default function SearchBar() {
  const { searchJobs, searchByResume, isLoading, searchQuery, locationFilter, setSearchQuery, setLocationFilter } = useJobStore();
  const { isPremium } = useSubscriptionStore();
  const resumeData = useResumeStore((s) => s.data);
  const [isFocused, setIsFocused] = useState<"query" | "location" | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        setSearchError("");
        searchJobs(searchQuery, locationFilter || undefined);
      } else if (searchQuery.trim().length > 0 && searchQuery.trim().length < 2) {
        // Optional: you could set an error here too, but normally we just wait for more typing
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, locationFilter, searchJobs]);

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (!query) return; // Don't show error if completely empty and they hit search
    
    const result = searchSchema.safeParse(query);
    if (!result.success) {
      setSearchError(result.error.issues[0].message);
      return;
    }
    
    setSearchError("");
    searchJobs(query, locationFilter || undefined);
  };

  const handleResumeSearch = () => {
    if (!isPremium()) {
      setIsUpgradeModalOpen(true);
      return;
    }

    const skills = resumeData.skills.filter((s) => s.trim() !== "");
    if (skills.length === 0) {
      alert("Add skills to your resume first to use AI search!");
      return;
    }
    searchByResume(skills);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Main search container */}
        <div className="relative group/search">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-[36px] blur-xl opacity-0 group-hover/search:opacity-100 transition-opacity duration-500" />
          
          <div className="relative p-1.5 rounded-[32px] bg-white border border-slate-200 shadow-2xl shadow-blue-900/5">
            <div className="flex flex-col sm:flex-row items-stretch gap-0 rounded-[26px] overflow-hidden relative">
              {/* Query input */}
              <div className={`flex-1 flex items-center gap-4 px-6 py-4 transition-all ${isFocused === "query" ? "bg-blue-50/50" : ""}`}>
                <Search className={`w-5 h-5 shrink-0 transition-colors ${isFocused === "query" ? "text-blue-600" : "text-slate-400"}`} />
                <input
                  type="text"
                  placeholder="Job title, keyword, or company"
                  className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-base font-bold"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError("");
                  }}
                  onFocus={() => setIsFocused("query")}
                  onBlur={() => setIsFocused(null)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div className="hidden sm:block w-px h-10 my-auto bg-slate-200" />

              {/* Location input */}
              <div className={`flex items-center gap-4 px-6 py-4 sm:w-72 transition-all ${isFocused === "location" ? "bg-blue-50/50" : ""}`}>
                <MapPin className={`w-5 h-5 shrink-0 transition-colors ${isFocused === "location" ? "text-blue-600" : "text-slate-400"}`} />
                <input
                  type="text"
                  placeholder="City or Remote"
                  className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-base font-bold"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  onFocus={() => setIsFocused("location")}
                  onBlur={() => setIsFocused(null)}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {/* Search button */}
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-10 py-4 bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group active:scale-[0.98] shadow-lg shadow-blue-600/20"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="tracking-tight">Search Jobs</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Validation Error Message */}
            <AnimatePresence>
              {searchError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 pb-2 pt-1 text-sm font-bold text-rose-500"
                >
                  {searchError}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* AI Resume Search button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={handleResumeSearch}
            disabled={isLoading}
            className="group relative flex items-center gap-4 px-10 py-4 rounded-full bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-sm font-bold text-slate-600 hover:text-blue-700 disabled:opacity-50 shadow-xl shadow-blue-900/5 overflow-hidden"
          >
            <div className="p-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
              <Sparkles className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
            </div>
            Find jobs that match my skills
            <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20">
              Premium AI
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
          </button>
        </div>
      </motion.div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        reason="AI Skill Matching is a Premium feature. Let us find the perfect jobs for you based on your unique profile!"
      />
    </>
  );
}
