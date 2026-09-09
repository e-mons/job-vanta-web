import { Metadata } from "next";
import Link from "next/link";
import JobApplications from "@/components/jobs/JobApplications";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Clock, Briefcase, ArrowRight, Sparkles, Bot } from "lucide-react";

export const metadata: Metadata = {
  title: "Applications Hub & Status Tracker | JobVanta",
  description: "Track and manage your automated AI agent and manual job applications in real time on JobVanta.",
};

export default function ApplicationsPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-10 pb-24 lg:pb-12 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-blue-600 mb-1.5">
              <Bot className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">
                Applications Command Center
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              My <span className="text-blue-600">Applications</span>
            </h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm mt-1">
              Live tracking of AI Agent autonomous submissions, screening statuses, and role-specific interview preparation.
            </p>
          </div>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition-all shadow-md shadow-blue-600/20 self-start sm:self-auto"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Discover More Jobs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Application List & Management */}
        <JobApplications />
      </div>
    </DashboardLayout>
  );
}
