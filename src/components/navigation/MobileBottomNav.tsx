"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Bell, 
  Settings 
} from "lucide-react";
import { useNotificationStore } from "@/store/useNotificationStore";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const links = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { href: "/jobs", icon: Search, label: "Jobs" },
    { href: "/builder", icon: FileText, label: "Builder" },
    { href: "/dashboard/notifications", icon: Bell, label: "Inbox" },
    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
      <nav className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all relative ${
                isActive ? "text-blue-600" : "text-slate-400"
              }`}
            >
              <div
                className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 ${
                  isActive ? "bg-blue-50" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "scale-110" : ""}`} />
                
                {/* Notification Badge */}
                {link.href === "/dashboard/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? "text-blue-600" : "text-slate-500"}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
