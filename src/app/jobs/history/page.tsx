import { Metadata } from "next";
import Link from "next/link";
import JobApplications from "@/components/jobs/JobApplications";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Clock, Briefcase, ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Application Status & Timeline | JobVanta",
  description: "Track and manage your automated and manual job applications on JobVanta.",
};

export default function HistoryPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-10 pb-24 lg:pb-12 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1.5">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">
                Career Outreach Timeline
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Application <span className="text-blue-600">Status & History</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
              Live tracking of AI Agent automated submissions and manual applications.
            </p>
          </div>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-xs transition-all border border-blue-200 shadow-sm self-start sm:self-auto"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Search More Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Application List & Management */}
        <JobApplications />
      </div>
    </DashboardLayout>
  );
}
