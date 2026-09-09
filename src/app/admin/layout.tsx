"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowLeft, 
  LogOut, 
  Activity,
  Sliders,
  AlertTriangle,
  FileCheck2,
  Users
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAdmin() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login?redirect=/admin/qa");
          return;
        }

        // Check admin access via API
        const res = await fetch("/api/admin/qa/overview?range=today");
        if (res.status === 401 || res.status === 403) {
          router.push("/dashboard");
          return;
        }

        setAdminUser({
          email: user.email || "admin@jobvanta.com",
          role: "Authorized Administrator",
        });
      } catch {
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }
    verifyAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: <Sparkles className="w-5 h-5" />, label: "AI Q&A Operations", href: "/admin/qa" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-[#0d1b2e] text-white hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 border-r border-slate-800">
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight block">JobVanta Admin</span>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                Ops & Governance
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 flex-1">
            {menuItems.map((item, i) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={i}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
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

            {/* Admin Badge */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/60 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                {adminUser?.email?.[0] || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{adminUser?.email}</p>
                <p className="text-[10px] text-emerald-400 font-medium">Verified Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Administration</span>
            <span className="text-slate-300">/</span>
            <h1 className="text-sm font-bold text-slate-800">Job-Specific AI Q&A</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Production MCP Synced
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
