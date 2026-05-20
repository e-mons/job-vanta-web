"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Settings, 
  Bell, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  Plus,
  Briefcase,
  LogOut,
  Building2,
  Mail
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CompanyLogo from "@/components/jobs/CompanyLogo";

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useJobStore } from '@/store/useJobStore';
import { useResumeStore } from '@/store/useResumeStore';
import { useSubscriptionStore } from '@/store/useSubscription';
import HTMLPreview from '@/components/builder/Preview/HTMLPreview';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>("Loading...");
  const [coverLetterCount, setCoverLetterCount] = useState(0);
  const [resumeCount, setResumeCount] = useState(0);
  const router = useRouter();
  const { savedJobs, fetchSavedJobs, reset: resetJobs } = useJobStore();
  const { status: subStatus, fetchSubscription } = useSubscriptionStore();
  const resetResumes = useResumeStore(s => s.reset);
  const userResumes = useResumeStore(s => s.userResumes);
  const fetchUserResumes = useResumeStore(s => s.fetchUserResumes);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");

        // Fetch cover letter count
        const { count: clCount } = await supabase
          .from('cover_letters')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
        setCoverLetterCount(clCount || 0);
      }
    };
    fetchDashboardData();
    fetchSavedJobs();
    fetchUserResumes();
    fetchSubscription();
  }, [fetchSavedJobs, fetchUserResumes, fetchSubscription]);

  useEffect(() => {
    setResumeCount(userResumes.length);
  }, [userResumes]);



  const applications = savedJobs.filter(job => job.status !== 'saved');

  const stats = [
    { label: "Total Applications", value: applications.length.toString(), change: "Active applications", icon: <FileText className="w-5 h-5" /> },
    { label: "My Resumes", value: resumeCount.toString(), change: "Resumes created", icon: <FileText className="w-5 h-5" /> },
    { label: "Saved Jobs", value: savedJobs.length.toString(), change: "Total tracked", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Cover Letters", value: coverLetterCount.toString(), change: "Generated", icon: <Mail className="w-5 h-5" /> }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  return (
    <DashboardLayout>
      {/* Main Content */}
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-slate-900 mb-2">Welcome back, {userName}! 👋</h1>
            <p className="text-slate-500 font-medium">Here is an overview of your career progress.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/jobs"
              className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm relative hover:bg-slate-50 transition-colors"
            >
              <Search className="w-6 h-6 text-slate-600" />
            </Link>
            <Link 
              href="/builder?new=true"
              className="px-6 py-4 rounded-2xl bg-blue-600 text-white font-black flex items-center gap-3 shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>Create Resume</span>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white border border-slate-200 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                {stat.icon}
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{stat.value}</h3>
              <p className="text-xs font-bold text-blue-600">{stat.change}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-12">
            {/* My Resumes Section */}
            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">My Resumes</h2>
                </div>
                <Link 
                  href="/builder?new=true" 
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Resume
                </Link>
              </div>
              <div className="grid sm:grid-cols-2 gap-8">
                {userResumes.length > 0 ? userResumes.map((resume, i) => (
                  <Link 
                    key={resume.id}
                    href={`/builder/edit?id=${resume.id}`}
                    className="group relative p-8 rounded-[40px] bg-white border-2 border-slate-100 hover:border-blue-600 hover:shadow-[0_20px_50px_-15px_rgba(37,99,235,0.15)] transition-all duration-500 overflow-hidden"
                  >
                    {/* Realistic Resume Preview - Exact Match to Jobs Page Card Style */}
                    <div className="mb-8">
                      <div className="aspect-[1/1.41] w-full rounded-2xl border-2 border-slate-100 overflow-hidden relative transition-all duration-500 group-hover:border-blue-200">
                        {/* Scaled HTML Preview */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.42] w-[210mm] h-[297mm] pointer-events-none">
                          <HTMLPreview 
                            data={resume.content} 
                            templateId={resume.template_id || 'modern'} 
                          />
                        </div>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-transparent transition-colors duration-500" />
                        
                        {/* Selection/Hover Icon */}
                        <div className="absolute top-4 right-4 p-2.5 rounded-xl bg-white text-blue-600 shadow-2xl opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{resume.title || 'Untitled Resume'}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Last edited {formatDate(resume.updated_at)}
                      </p>
                    </div>

                    {/* Quick Stats Overlay (Optional but premium) */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  </Link>
                )) : (
                  <div className="col-span-2 text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">No resumes yet</h3>
                    <p className="text-sm text-slate-500 mb-6">Create your first professional resume in minutes.</p>
                    <Link href="/builder" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
                      Start Building
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Applications Table */}
            <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-slate-600" />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">Recent Applications</h2>
                </div>
                <Link href="/jobs/saved" className="text-sm font-bold text-blue-600 hover:underline">View All</Link>
              </div>
              <div className="space-y-6">
                {applications.length > 0 ? applications.map((app, i) => (
                  <div key={app.id || i} className="flex items-center justify-between p-4 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-4">
                      <CompanyLogo 
                        logoUrl={app.metadata?.companyLogo} 
                        companyName={app.company_name} 
                        size="sm" 
                      />
                      <div>
                        <h4 className="font-bold text-slate-900">{app.job_title}</h4>
                        <p className="text-xs text-slate-500 font-medium">{app.company_name} • {formatDate(app.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                        app.status === 'interviewing' ? 'bg-green-50 text-green-600' :
                        app.status === 'offered' ? 'bg-emerald-50 text-emerald-600' :
                        app.status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">No applications yet</h3>
                    <p className="text-sm text-slate-500 mb-6">Start applying to jobs to track your progress here.</p>
                    <Link href="/jobs" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-colors">
                      Browse Jobs
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
              <h3 className="text-2xl font-black mb-6 relative z-10 leading-tight">Ready to <span className="text-blue-400">optimize</span> your resume?</h3>
              <p className="text-slate-400 font-medium mb-8 text-sm leading-relaxed relative z-10">Our AI analyzes your resume against real job descriptions to maximize your ATS match score.</p>
              <Link href="/builder?optimize=true" className="w-full py-4 rounded-2xl bg-blue-600 font-black text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors relative z-10">
                Optimize Now <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            {applications.filter(a => a.status === 'interviewing').length > 0 && (
              <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-6">Upcoming Interviews</h3>
                <div className="space-y-4">
                  {applications.filter(a => a.status === 'interviewing').slice(0, 3).map((app, i) => (
                    <div key={app.id || i} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Interview - {app.company_name}</p>
                        <p className="text-xs text-slate-500 font-medium">{app.job_title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
