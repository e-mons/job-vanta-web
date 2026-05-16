"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  LogOut, 
  Briefcase, 
  ChevronDown, 
  Settings,
  Bell,
  Mail,
  Shield,
  Star
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useSubscriptionStore } from "@/store/useSubscription";

export default function DashboardHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const resetJobs = useJobStore((s) => s.reset);
  const resetResumes = useResumeStore((s) => s.reset);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const subStatus = useSubscriptionStore((s) => s.status);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetJobs();
    resetResumes();
    router.push("/");
  };

  return (
    <header className="lg:hidden h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 px-4 flex items-center justify-between">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2">
        <img 
          src="/logo.png" 
          alt="JobVanta Logo" 
          className="w-8 h-8 rounded-lg object-cover shadow-sm"
        />
        <span className="text-lg font-black text-slate-900 tracking-tight italic">JobVanta</span>
      </Link>

      {/* User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-50 border border-slate-100 active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md shadow-blue-600/20">
            {user?.email?.[0].toUpperCase() || "?"}
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute right-0 mt-3 w-72 origin-top-right z-50"
            >
              <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden">
                {/* Profile Header */}
                <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-blue-600 text-lg font-black shadow-sm border border-slate-100">
                      {user?.email?.[0].toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 truncate tracking-tight">{user?.email?.split('@')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest leading-none mt-1">{user?.email}</p>
                    </div>
                  </div>
                  
                  {/* Subscription Badge */}
                  <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    subStatus === 'active' || subStatus === 'trialing' 
                    ? 'bg-blue-600 text-white shadow-glow-blue' 
                    : 'bg-slate-200 text-slate-500'
                  }`}>
                    <Star className={`w-3 h-3 ${subStatus === 'active' || subStatus === 'trialing' ? 'fill-white' : ''}`} />
                    {subStatus === 'active' || subStatus === 'trialing' ? 'Premium Member' : 'Free Plan'}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-3">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-black text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 transition-all">
                      <Bell className="w-4 h-4" />
                    </div>
                    <span className="flex-1">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/cover-letter"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-black text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 transition-all">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="flex-1">Cover Letters</span>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-black text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 transition-all">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="flex-1">Settings</span>
                  </Link>
                </div>

                {/* Footer Action */}
                <div className="p-3 pt-0 mt-1 border-t border-slate-50">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-black text-red-500 hover:bg-red-50 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-400 group-hover:bg-white group-hover:text-red-600 transition-all">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-left">Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
