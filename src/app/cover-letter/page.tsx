"use client";

import { useEffect, useState } from 'react';
import { Plus, FileText, ChevronRight, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useResumeStore } from '@/store/useResumeStore';
import { useJobStore } from '@/store/useJobStore';
import DashboardLayout from '@/components/layouts/DashboardLayout';

export default function CoverLettersPage() {
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const resetJobs = useJobStore(s => s.reset);
  const resetResumes = useResumeStore(s => s.reset);

  useEffect(() => {
    fetchCoverLetters();
  }, []);

  const fetchCoverLetters = async () => {
    setIsLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (!error && data) {
      setCoverLetters(data);
    }
    setIsLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetJobs();
    resetResumes();
    router.push("/");
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <Mail className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Outreach</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                Cover <span className="text-blue-600">Letters</span>
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                Manage your AI-tailored cover letters.
              </p>
            </div>
            
            <Link 
              href="/cover-letter/builder"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all flex items-center gap-2 w-fit shadow-xl shadow-blue-600/20"
            >
              <Plus className="w-5 h-5" />
              New Cover Letter
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-100 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : coverLetters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coverLetters.map((cl) => (
                <div 
                  key={cl.id} 
                  className="group bg-white rounded-3xl p-6 border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative z-10 space-y-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-blue-600 flex items-center justify-center transition-colors">
                      <FileText className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors mb-2 line-clamp-1">
                        {cl.title}
                      </h3>
                      <div className="space-y-1">
                        {cl.target_job_title && (
                          <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            {cl.target_job_title}
                          </p>
                        )}
                        {cl.company_name && (
                          <p className="text-sm font-bold text-slate-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {cl.company_name}
                          </p>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-widest">
                        Updated {new Date(cl.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <Link 
                      href={`/cover-letter/builder?id=${cl.id}`}
                      className="w-full py-3 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-600 group-hover:text-blue-700 font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      Edit Cover Letter <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-4">No Cover Letters Yet</h2>
              <p className="text-slate-500 font-medium mb-8">
                Generate tailored cover letters instantly using AI. Stand out from the crowd and land your dream job.
              </p>
              <Link 
                href="/cover-letter/builder"
                className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all inline-flex items-center gap-2 shadow-xl shadow-blue-600/20"
              >
                <Plus className="w-5 h-5" />
                Create First Cover Letter
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
