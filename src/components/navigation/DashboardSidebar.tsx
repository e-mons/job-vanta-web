"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Briefcase, 
  Clock, 
  Mail, 
  LogOut,
  Plus,
  Bell,
  Settings
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useJobStore } from "@/store/useJobStore";
import { useResumeStore } from "@/store/useResumeStore";
import { useSubscriptionStore } from "@/store/useSubscription";
import { useNotificationStore } from "@/store/useNotificationStore";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { reset: resetJobs } = useJobStore();
  const { reset: resetResumes } = useResumeStore();
  const { status: subStatus } = useSubscriptionStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetJobs();
    resetResumes();
    router.push("/");
  };

  const menuItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: "Dashboard", href: "/dashboard" },
    { icon: <FileText className="w-5 h-5" />, label: "My Resumes", href: "/builder" },
    { icon: <Mail className="w-5 h-5" />, label: "Cover Letters", href: "/cover-letter" },
    { icon: <Search className="w-5 h-5" />, label: "Job Search", href: "/jobs" },
    { icon: <Briefcase className="w-5 h-5" />, label: "Saved Jobs", href: "/jobs/saved" },
    { icon: <Clock className="w-5 h-5" />, label: "Application History", href: "/jobs/history" },
    { icon: <Bell className="w-5 h-5" />, label: "Notifications", href: "/dashboard/notifications" },
    { icon: <Settings className="w-5 h-5" />, label: "Settings", href: "/dashboard/settings" }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/jobs') {
      // Active for exact /jobs or sub-paths like /jobs/123, but NOT for saved/history
      return pathname === '/jobs' || (pathname.startsWith('/jobs/') && !pathname.startsWith('/jobs/saved') && !pathname.startsWith('/jobs/history'));
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-72 bg-white border-r border-slate-100 hidden lg:flex flex-col p-8 fixed h-full z-50">
      <Link href="/" className="flex items-center gap-3 mb-12">
        <img src="/logo.png" alt="JobVanta Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
        <span className="text-xl font-black text-[#11253E] tracking-tight">JobVanta</span>
      </Link>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item, i) => {
          const active = isActive(item.href);
          return (
            <Link 
              key={i}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all ${
                active 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.label === "Notifications" && unreadCount > 0 && (
                <span className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                  active ? 'bg-white text-blue-600' : 'bg-red-500 text-white animate-pulse'
                }`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
        
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl font-bold transition-all text-slate-400 hover:text-red-500 hover:bg-red-50 mt-4"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </nav>

      <div className="mt-auto pt-8">
        <div className="glass p-6 rounded-[2rem] border border-blue-100 bg-blue-50/50">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-2">
            {subStatus === 'active' || subStatus === 'trialing' ? 'Premium Plan' : 'Standard Plan'}
          </p>
          <p className="text-sm font-bold text-slate-900 mb-4">
            {subStatus === 'active' || subStatus === 'trialing' 
              ? 'You have full access to AI features' 
              : 'Upgrade to unlock AI resume optimization'}
          </p>
          <Link href="/pricing" className="text-xs font-black text-blue-600 underline">
            {subStatus === 'active' || subStatus === 'trialing' ? 'View Details' : 'Upgrade Now'}
          </Link>
        </div>
      </div>
    </aside>
  );
}
