"use client";

import DashboardSidebar from "@/components/navigation/DashboardSidebar";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import DashboardHeader from "@/components/navigation/DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8faff] flex flex-col lg:flex-row">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col lg:ml-72">
        <DashboardHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
