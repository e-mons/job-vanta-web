import { Metadata } from "next";
import JobApplications from "@/components/jobs/JobApplications";
import MobileBottomNav from "@/components/navigation/MobileBottomNav";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Application History | JobVanta",
  description: "Track and manage your job applications on JobVanta.",
};

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Clock className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">History</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Application <span className="text-blue-600">Timeline</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              Track your career journey and professional outreach.
            </p>
          </div>

          <JobApplications />
        </div>
      </div>
    </DashboardLayout>
  );
}
