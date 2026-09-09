"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight, 
  Search, 
  Calendar, 
  Building2, 
  MapPin, 
  Sparkles, 
  AlertTriangle, 
  Bot, 
  User, 
  Eye, 
  Loader2,
  DollarSign,
  RotateCcw,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import MissingFieldsModal from "./MissingFieldsModal";
import { toast } from "sonner";
import { FormFieldDefinition, getApplicationStatusMeta, mapToCanonicalStatus } from "@/services/automation/types";
import { useSubscriptionStore } from "@/store/useSubscription";
import UpgradeModal from "@/components/shared/UpgradeModal";

interface Application {
  id: string;
  user_id: string;
  resume_id: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
  metadata: any;
  resume_snapshot?: any;
  browserbase_session_id?: string | null;
  detected_fields?: FormFieldDefinition[];
  missing_fields?: FormFieldDefinition[];
  filled_fields?: Record<string, string>;
  application_type?: string;
  error_message?: string | null;
  resumes?: {
    id: string;
    title: string;
  };
}

export default function JobApplications() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filterTab, setFilterTab] = useState<"all" | "automated" | "needs_info" | "submitted" | "manual">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  // Missing Fields Modal State
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [missingModalFields, setMissingModalFields] = useState<FormFieldDefinition[]>([]);
  const [missingModalAppId, setMissingModalAppId] = useState<string | null>(null);

  // Subscription gating for Prepare Me
  const { getPlanTier } = useSubscriptionStore();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select(`
          *,
          resumes (id, title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const apps = (data as Application[]) || [];
      setApplications(apps);
      if (apps.length > 0 && !selectedApp) {
        setSelectedApp(apps[0]);
      }
    } catch (err: any) {
      console.error("Error fetching applications:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }

  // Filter applications
  const filteredApps = applications.filter((app) => {
    const canonical = mapToCanonicalStatus(app.status);
    const matchesSearch =
      !searchQuery ||
      app.metadata?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.metadata?.company?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "all") return true;
    if (filterTab === "automated") return app.application_type === "automated";
    if (filterTab === "manual") return app.application_type === "manual";
    if (filterTab === "needs_info") return canonical === "needs_info";
    if (filterTab === "submitted") return canonical === "submitted";
    return true;
  });

  const handleOpenMissingModal = (app: Application) => {
    setMissingModalAppId(app.id);
    setMissingModalFields(app.missing_fields || []);
    setIsMissingModalOpen(true);
  };

  const handleRetryApplication = async (app: Application) => {
    setIsRetrying(true);
    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: app.resume_id,
          applicationType: "automated",
          jobMetadata: {
            title: app.metadata?.title,
            company: app.metadata?.company,
            applyLink: app.metadata?.applyLink || app.metadata?.job_url,
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to retry application");

      toast.success("Application restarted! Jobvanta is checking requirements.");
      await fetchApplications();
    } catch (err: any) {
      toast.error(err.message || "Failed to retry application");
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Loading Applications...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 shadow-sm max-w-xl mx-auto p-8">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
          <Briefcase className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">No Job Applications Yet</h3>
        <p className="text-slate-500 font-medium mb-6 max-w-sm mx-auto text-xs sm:text-sm leading-relaxed">
          Find your dream role on the Job Search page. Apply with one click manually or let Auto Apply handle it hands-free!
        </p>
        <Link 
          href="/jobs" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 text-xs"
        >
          <span>Discover Job Matches</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All", count: applications.length },
            { id: "automated", label: "Auto Apply", count: applications.filter(a => a.application_type === "automated").length },
            { id: "needs_info", label: "Needs Info", count: applications.filter(a => mapToCanonicalStatus(a.status) === "needs_info").length },
            { id: "submitted", label: "Submitted", count: applications.filter(a => mapToCanonicalStatus(a.status) === "submitted").length },
            { id: "manual", label: "Manual", count: applications.filter(a => a.application_type === "manual").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                filterTab === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                filterTab === tab.id ? "bg-white/25 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by role or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Main Layout: List & Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Applications List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredApps.map((app) => {
            const isSelected = selectedApp?.id === app.id;
            const canonical = mapToCanonicalStatus(app.status);
            const statusMeta = getApplicationStatusMeta(canonical);
            const isAutomated = app.application_type === "automated";

            return (
              <div
                key={app.id}
                onClick={() => setSelectedApp(app)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected 
                    ? "bg-white border-blue-600 shadow-md ring-2 ring-blue-600/20" 
                    : canonical === "needs_info"
                    ? "bg-amber-50/50 border-amber-300 hover:border-amber-400"
                    : "bg-white border-slate-200/80 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-xs shrink-0 ${
                      canonical === "needs_info" ? "bg-amber-500" : isAutomated ? "bg-indigo-600" : "bg-blue-600"
                    }`}>
                      {app.metadata?.company?.charAt(0) || "J"}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-tight">
                        {app.metadata?.title}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">
                        {app.metadata?.company}
                      </p>
                    </div>
                  </div>

                  {/* Canonical Status Pill */}
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 border ${statusMeta.badgeBg} ${statusMeta.badgeText} ${statusMeta.badgeBorder}`}>
                    {statusMeta.label}
                  </span>
                </div>

                {/* Sub Metadata Row */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    {isAutomated ? (
                      <span className="text-indigo-600 flex items-center gap-1 font-bold">
                        <Bot className="w-3 h-3" />
                        Auto Apply
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Manual
                      </span>
                    )}
                    {app.metadata?.platform && (
                      <span>• {app.metadata.platform}</span>
                    )}
                  </span>

                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(app.created_at), "MMM d")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Application Details Inspector */}
        <div className="lg:col-span-7 sticky top-24">
          <AnimatePresence mode="wait">
            {selectedApp ? (
              <motion.div
                key={selectedApp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-sm space-y-5"
              >
                {/* Header Info */}
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        selectedApp.application_type === "automated" 
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {selectedApp.application_type === "automated" ? "Auto Apply" : "Manual Apply"}
                      </span>
                      {selectedApp.metadata?.platform && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {selectedApp.metadata.platform}
                        </span>
                      )}
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                      {selectedApp.metadata?.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-semibold pt-0.5">
                      <span className="flex items-center gap-1 text-slate-800 font-bold">
                        <Building2 className="w-3.5 h-3.5 text-blue-600" />
                        {selectedApp.metadata?.company}
                      </span>
                      {selectedApp.metadata?.location && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" />
                          {selectedApp.metadata.location}
                        </span>
                      )}
                      {selectedApp.metadata?.salary && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <DollarSign className="w-3.5 h-3.5" />
                          {selectedApp.metadata.salary}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedApp.metadata?.applyLink && (
                    <a 
                      href={selectedApp.metadata.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Open Job URL"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                {/* Status Box & Plain-English Explanation */}
                {(() => {
                  const canonical = mapToCanonicalStatus(selectedApp.status);
                  const meta = getApplicationStatusMeta(canonical);

                  return (
                    <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${meta.badgeBg} ${meta.badgeBorder}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${
                            canonical === "submitted" ? "bg-emerald-500" :
                            canonical === "failed" ? "bg-rose-500" :
                            canonical === "needs_info" ? "bg-amber-500 animate-bounce" :
                            canonical === "action_required" ? "bg-orange-500" :
                            "bg-blue-600 animate-pulse"
                          }`} />
                          <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                            {meta.label}
                          </span>
                        </div>

                        <span className="text-[11px] font-semibold text-slate-400">
                          Updated: {format(new Date(selectedApp.updated_at || selectedApp.created_at), "MMM d, h:mm a")}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                        {selectedApp.error_message || meta.description}
                      </p>

                      {/* Primary Next Action */}
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        {canonical === "needs_info" && (
                          <button
                            onClick={() => handleOpenMissingModal(selectedApp)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            <span>Complete & Continue</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canonical === "action_required" && selectedApp.metadata?.applyLink && (
                          <a
                            href={selectedApp.metadata.applyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl transition-colors"
                          >
                            <span>Open Application Page</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {canonical === "failed" && (
                          <button
                            onClick={() => handleRetryApplication(selectedApp)}
                            disabled={isRetrying}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`} />
                            <span>{isRetrying ? "Retrying..." : "Retry Auto Apply"}</span>
                          </button>
                        )}

                        {canonical === "submitted" && (
                          <button
                            onClick={() => {
                              const tier = getPlanTier();
                              if (tier === 'free') {
                                setIsUpgradeModalOpen(true);
                              } else {
                                router.push(`/applications/${selectedApp.id}/prepare`);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Prepare Me (Interview Q&A)</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Resume Snapshot & Linked Documents */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Resume Used
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {selectedApp.resumes?.title || "Profile Resume"}
                      </span>
                      {selectedApp.resume_id && (
                        <Link
                          href={`/resumes/${selectedApp.resume_id}`}
                          className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Application Type
                    </span>
                    <span className="font-bold text-slate-900 text-xs capitalize">
                      {selectedApp.application_type === "automated" ? "AI Agent Autonomous" : "Direct Manual"}
                    </span>
                  </div>
                </div>

                {/* Direct Prepare Me Promotion Bar */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white border border-blue-100/80 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-slate-900 text-xs sm:text-sm">
                      Prepare for {selectedApp.metadata?.company || "Interviews"}
                    </h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Practice role-predicted questions, STAR answers, and Truth Lock talking points.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const tier = getPlanTier();
                      if (tier === 'free') {
                        setIsUpgradeModalOpen(true);
                      } else {
                        router.push(`/applications/${selectedApp.id}/prepare`);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0"
                  >
                    <span>Prepare Me</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
                <Briefcase className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-slate-400 font-bold uppercase tracking-wider text-xs">Select an application to view details</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Missing Fields Modal */}
      <MissingFieldsModal
        isOpen={isMissingModalOpen}
        onClose={() => setIsMissingModalOpen(false)}
        applicationId={missingModalAppId}
        missingFields={missingModalFields}
        jobTitle={selectedApp?.metadata?.title}
        company={selectedApp?.metadata?.company}
        onSuccess={() => {
          fetchApplications();
        }}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        targetTier="pro"
        featureContext="prepare_me"
        reason="The Prepare Me feature (Job-Specific AI Questions & Answers) is available exclusively on Pro and Unlimited plans. Upgrade to Pro Plan to continue."
      />
    </div>
  );
}
