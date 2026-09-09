"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Bookmark, 
  Send, 
  Sparkles, 
  Clock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react";
import { UserResume } from "@/store/useResumeStore";
import { createClient } from "@/utils/supabase/client";

interface ResumeCompletenessSidebarProps {
  resume: UserResume | null;
}

interface RecentActivityItem {
  id: string;
  type: "application" | "saved";
  title: string;
  company: string;
  date: string;
  url?: string;
}

export default function ResumeCompletenessSidebar({ resume }: ResumeCompletenessSidebarProps) {
  const [recentActivities, setRecentActivities] = useState<RecentActivityItem[]>([]);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [totalSaved, setTotalSaved] = useState<number>(0);
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(true);

  // 1. Calculate Resume Completeness
  const completeness = useMemo(() => {
    if (!resume || !resume.content) return { score: 0, items: [], tips: [] };

    const c = resume.content;
    const items: { label: string; done: boolean; points: number }[] = [];
    const tips: string[] = [];

    // Personal info
    const hasName = !!c.personalInfo?.fullName;
    const hasEmail = !!c.personalInfo?.email;
    const hasPhone = !!c.personalInfo?.phone;
    const hasLocation = !!c.personalInfo?.location;
    const hasWebsite = !!c.personalInfo?.website;
    const personalInfoDone = hasName && hasEmail && (hasPhone || hasLocation);
    items.push({ label: "Contact Details", done: personalInfoDone, points: 20 });
    if (!hasWebsite) tips.push("Add a portfolio or LinkedIn URL");

    // Summary
    const hasSummary = !!c.personalInfo?.summary && c.personalInfo.summary.length >= 30;
    items.push({ label: "Professional Summary", done: hasSummary, points: 15 });
    if (!hasSummary) tips.push("Write a concise summary to catch recruiters' attention");

    // Experience
    const expCount = Array.isArray(c.experience) ? c.experience.length : 0;
    const expDone = expCount >= 1;
    items.push({ label: "Work Experience", done: expDone, points: 25 });
    if (expCount < 2) tips.push("Add at least 2 roles with measurable achievements");

    // Skills
    const skillsCount = Array.isArray(c.skills) ? c.skills.length : 0;
    const skillsDone = skillsCount >= 3;
    items.push({ label: "Core Skills", done: skillsDone, points: 15 });
    if (skillsCount < 5) tips.push("Include at least 5 target skills to improve matching");

    // Education
    const eduCount = Array.isArray(c.education) ? c.education.length : 0;
    const eduDone = eduCount >= 1;
    items.push({ label: "Education", done: eduDone, points: 15 });

    // Projects or Certifications
    const projCount = Array.isArray(c.projects) ? c.projects.length : 0;
    const certCount = Array.isArray(c.certifications) ? c.certifications.length : 0;
    const projDone = projCount > 0 || certCount > 0;
    items.push({ label: "Projects & Certs", done: projDone, points: 10 });
    if (!projDone) tips.push("Showcase projects or certifications to stand out");

    const totalScore = items.reduce((acc, curr) => (curr.done ? acc + curr.points : acc), 0);

    return { score: totalScore, items, tips };
  }, [resume]);

  // 2. Fetch User's Recent Activities from Supabase
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function loadActivities() {
      setIsLoadingActivity(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (isMounted) setIsLoadingActivity(false);
          return;
        }

        // Fetch applications
        const { data: apps, count: appCount } = await supabase
          .from("job_applications")
          .select("id, metadata, created_at", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch saved jobs
        const { data: saved, count: savedCount } = await supabase
          .from("saved_jobs")
          .select("id, job_title, company_name, job_url, created_at", { count: "exact" })
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(3);

        if (!isMounted) return;

        setTotalApplications(appCount || 0);
        setTotalSaved(savedCount || 0);

        const activities: RecentActivityItem[] = [];

        apps?.forEach((a: any) => {
          activities.push({
            id: `app-${a.id}`,
            type: "application",
            title: a.metadata?.title || "Job Application",
            company: a.metadata?.company || "Tech Company",
            date: a.created_at,
            url: a.metadata?.applyLink,
          });
        });

        saved?.forEach((s: any) => {
          activities.push({
            id: `saved-${s.id}`,
            type: "saved",
            title: s.job_title || "Saved Opportunity",
            company: s.company_name || "Company",
            date: s.created_at,
            url: s.job_url,
          });
        });

        // Sort by latest date
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentActivities(activities.slice(0, 4));
      } catch (err) {
        console.error("[Sidebar] Error fetching activities:", err);
      } finally {
        if (isMounted) setIsLoadingActivity(false);
      }
    }

    loadActivities();
    return () => {
      isMounted = false;
    };
  }, [resume?.id]);

  return (
    <aside className="space-y-6 w-full">
      {/* Widget 1: Resume Completeness */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 leading-tight">Resume Completeness</h4>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[170px]">
                {resume ? resume.title : "No resume selected"}
              </p>
            </div>
          </div>

          {resume && (
            <Link
              href={`/builder/edit?id=${resume.id}`}
              className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-400 transition-colors"
              title="Edit in Resume Builder"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Progress Display */}
        {resume ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-600">Profile Strength</span>
                <span className={completeness.score >= 85 ? "text-emerald-600" : completeness.score >= 65 ? "text-blue-600" : "text-amber-600"}>
                  {completeness.score}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    completeness.score >= 85
                      ? "bg-gradient-to-r from-blue-500 to-emerald-500"
                      : completeness.score >= 65
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                      : "bg-gradient-to-r from-amber-400 to-orange-500"
                  }`}
                  style={{ width: `${completeness.score}%` }}
                />
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {completeness.items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-[11px] font-bold border ${
                    item.done
                      ? "bg-emerald-50/50 text-emerald-800 border-emerald-100"
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3 h-3 text-slate-300 shrink-0" />
                  )}
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Improvement Tip */}
            {completeness.tips.length > 0 && (
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">
                  <strong className="font-bold">Tip:</strong> {completeness.tips[0]}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 font-medium">
            Select a resume to evaluate your profile strength and match accuracy.
          </div>
        )}
      </div>

      {/* Widget 2: Recent Activity */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black text-slate-900 leading-tight">Recent Activity</h4>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
              {totalApplications} applied
            </span>
          </div>
        </div>

        {/* Activity Feed */}
        {recentActivities.length > 0 ? (
          <div className="space-y-2.5">
            {recentActivities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-2xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-200/60 transition-colors flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    act.type === "application"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-rose-100 text-rose-700"
                  }`}>
                    {act.type === "application" ? (
                      <Send className="w-3 h-3" />
                    ) : (
                      <Bookmark className="w-3 h-3" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {act.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {act.company}
                    </div>
                  </div>
                </div>

                {act.url && (
                  <a
                    href={act.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500 font-medium">
            {isLoadingActivity ? "Loading activity..." : "No job applications or saved jobs yet. Click Apply Now to track your first application!"}
          </div>
        )}

        {/* Quick Links */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
          <Link href="/jobs/saved" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            Saved Jobs ({totalSaved})
            <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/jobs/history" className="hover:text-blue-600 transition-colors flex items-center gap-1">
            History
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
