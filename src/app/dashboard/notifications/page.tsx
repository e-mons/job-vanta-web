"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Briefcase,
  CheckCheck,
  ChevronRight,
  FileText,
  Star,
  Trash2,
  Zap,
  Clock,
  Search,
  ArrowRight,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useNotificationStore, type Notification } from "@/store/useNotificationStore";

const TYPE_CONFIG: Record<
  Notification["type"],
  { icon: React.ReactNode; color: string; bg: string; border: string; label: string }
> = {
  job_saved: {
    icon: <Search className="w-5 h-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    label: "Job Saved",
  },
  status_change: {
    icon: <Briefcase className="w-5 h-5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    label: "Status Update",
  },
  resume_created: {
    icon: <FileText className="w-5 h-5" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    label: "Resume",
  },
  resume_optimized: {
    icon: <Zap className="w-5 h-5" />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    label: "AI Optimized",
  },
  subscription: {
    icon: <Star className="w-5 h-5" />,
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    label: "Subscription",
  },
  system: {
    icon: <Zap className="w-5 h-5" />,
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    label: "System",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const FILTER_TABS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "job_saved", label: "Jobs" },
  { id: "status_change", label: "Applications" },
  { id: "resume_created", label: "Resumes" },
] as const;

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const filtered = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const handleClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.actionUrl) {
      router.push(notif.actionUrl);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/20">
                <Bell className="w-6 h-6 text-white" />
              </div>
              {unreadCount > 0 && (
                <span className="px-3.5 py-1 rounded-full bg-red-500 text-white text-xs font-black animate-pulse">
                  {unreadCount} new
                </span>
              )}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Notifi<span className="text-blue-600">cations</span>
            </h1>
            <p className="text-slate-500 font-medium text-lg mt-1">
              Real-time updates from your job search activity, resume changes, and account events.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-black text-sm transition-all active:scale-95 border border-blue-100"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 font-black text-sm transition-all active:scale-95 border border-slate-200 hover:border-red-100"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 overflow-x-auto scrollbar-hide">
          <div className="inline-flex p-1.5 bg-slate-100 rounded-[2rem] gap-1 shadow-inner min-w-max">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-6 py-3 rounded-[1.5rem] text-sm font-black transition-all whitespace-nowrap ${
                  filter === tab.id
                    ? "bg-white text-blue-600 shadow-lg shadow-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                }`}
              >
                {tab.label}
                {tab.id === "unread" && unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-6"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 flex items-center justify-center">
              <BellOff className="w-10 h-10 text-slate-300" />
            </div>
            <div className="text-center max-w-md">
              <h3 className="text-xl font-black text-slate-900 mb-2">No notifications yet</h3>
              <p className="text-slate-500 font-medium mb-6">
                Notifications will appear here as you use the platform — saving jobs, updating applications, creating resumes, and more.
              </p>
              <button
                onClick={() => router.push("/jobs")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
              >
                Start Searching Jobs <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-6"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 flex items-center justify-center">
              <CheckCheck className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900 mb-2">
                {filter === "unread" ? "All caught up!" : "Nothing here"}
              </h3>
              <p className="text-slate-500 font-medium">
                {filter === "unread"
                  ? "You've read all your notifications. Great job staying on top of things!"
                  : "No notifications match this filter. Try switching to \"All\"."}
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((notif, index) => {
                const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04 } }}
                    exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                    className={`group relative rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden ${
                      notif.read
                        ? "bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/40"
                        : "bg-white border-blue-200 shadow-xl shadow-blue-100/40 hover:shadow-2xl hover:shadow-blue-200/50"
                    }`}
                    onClick={() => handleClick(notif)}
                  >
                    {/* Unread indicator bar */}
                    {!notif.read && (
                      <div className="absolute left-0 top-6 bottom-6 w-1 bg-blue-600 rounded-r-full" />
                    )}

                    <div className="flex items-start gap-5 p-6 md:p-8">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-2xl ${config.bg} ${config.border} border flex items-center justify-center shrink-0 ${config.color} group-hover:scale-110 transition-transform duration-300`}
                      >
                        {config.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color} ${config.border} border`}
                          >
                            {config.label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(notif.createdAt)}
                          </span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                          )}
                        </div>

                        <h3
                          className={`text-[15px] font-black tracking-tight mb-1 ${
                            notif.read ? "text-slate-700" : "text-slate-900"
                          }`}
                        >
                          {notif.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                          }}
                          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-red-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {notif.actionUrl && (
                          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
