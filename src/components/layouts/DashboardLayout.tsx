"use client";

import DashboardSidebar from "@/components/navigation/DashboardSidebar";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import DashboardHeader from "@/components/navigation/DashboardHeader";
import LiveAgentTrackerModal from "@/components/jobs/LiveAgentTrackerModal";
import FloatingApplicationDock from "@/components/jobs/FloatingApplicationDock";

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
      {/* Global Live AI Agent Application Tracker & Minimized Dock */}
      <LiveAgentTrackerModal />
      <FloatingApplicationDock />
    </div>
  );
}
