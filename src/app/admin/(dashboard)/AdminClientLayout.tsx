"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  LogOut, 
  Sliders,
  Users,
  Headphones,
  LayoutDashboard,
  TrendingUp,
  CreditCard,
  Tag,
  Cpu,
  UserCheck
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface AdminClientLayoutProps {
  adminEmail: string;
  adminRole: string;
  children: React.ReactNode;
}

export default function AdminClientLayout({
  adminEmail,
  adminRole,
  children,
}: AdminClientLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const navSections = [
    {
      title: "Commercial & Revenue",
      items: [
        { icon: <LayoutDashboard className="w-4 h-4" />, label: "Executive Overview", href: "/admin", exact: true },
        { icon: <CreditCard className="w-4 h-4" />, label: "Subscriptions & Billing", href: "/admin/billing" },
        { icon: <Tag className="w-4 h-4" />, label: "Promo Codes & Discounts", href: "/admin/promos" },
      ]
    },
    {
      title: "Operations & Intelligence",
      items: [
        { icon: <Users className="w-4 h-4" />, label: "Candidate Directory", href: "/admin/users" },
        { icon: <Cpu className="w-4 h-4" />, label: "AI Margin & Quotas", href: "/admin/ai-costs" },
        { icon: <UserCheck className="w-4 h-4" />, label: "Staff & Team Roster", href: "/admin/staff" },
      ]
    },
    {
      title: "Service & Quality",
      items: [
        { icon: <Headphones className="w-4 h-4" />, label: "Live Customer Support", href: "/admin/support" },
        { icon: <Sparkles className="w-4 h-4" />, label: "AI Q&A Operations", href: "/admin/qa" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-[#0d1b2e] text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 border-r border-slate-800">
        <div className="p-6 flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block">JobVanta SuperAdmin</span>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                Executive Control Suite
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-5 flex-1">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400/80 mb-2">
                  {section.title}
                </p>
                {section.items.map((item, i) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={i}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all ${
                        active
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer Navigation */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to App</span>
            </Link>

            {/* Admin Badge, Password Change & Sign Out */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/60 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                    {adminEmail?.[0] || "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{adminEmail}</p>
                    <p className="text-[10px] text-emerald-400 font-medium capitalize">
                      {adminRole?.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    title="Change Staff Password"
                    className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Sliders className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      const supabase = createClient();
                      await supabase.auth.signOut();
                      router.push("/admin/login");
                    }}
                    title="Sign out of Operations Portal"
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Staff Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Change Staff Password</h3>
              <button
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setPasswordMsg(null);
                }}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {passwordMsg && (
              <div className={`p-3 rounded-xl text-xs font-semibold ${
                passwordMsg.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {passwordMsg.text}
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordLoading(true);
                setPasswordMsg(null);
                if (newPassword.length < 6) {
                  setPasswordMsg({ type: "error", text: "Password must be at least 6 characters." });
                  setPasswordLoading(false);
                  return;
                }
                const supabase = createClient();
                const { error } = await supabase.auth.updateUser({ password: newPassword });
                if (error) {
                  setPasswordMsg({ type: "error", text: error.message });
                } else {
                  setPasswordMsg({ type: "success", text: "Password updated successfully!" });
                  setNewPassword("");
                  setTimeout(() => setIsPasswordModalOpen(false), 2000);
                }
                setPasswordLoading(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading || !newPassword}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
              >
                {passwordLoading ? "Updating..." : "Save New Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Administration</span>
            <span className="text-slate-300">/</span>
            <h1 className="text-sm font-bold text-slate-800">
              {pathname === "/admin"
                ? "Executive Command & Financial Hub"
                : pathname.includes("/billing")
                ? "Subscriptions & Revenue Ledger"
                : pathname.includes("/promos")
                ? "Promo Codes & Discount Engine"
                : pathname.includes("/users")
                ? "Candidate User Directory & Usage"
                : pathname.includes("/ai-costs")
                ? "AI Margin Defense & Dynamic Quotas"
                : pathname.includes("/support") 
                ? "Live Customer Support & Queue" 
                : pathname.includes("/staff") 
                ? "Staff & Operations Roster" 
                : "Job-Specific AI Q&A Governance"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified Staff Session
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
