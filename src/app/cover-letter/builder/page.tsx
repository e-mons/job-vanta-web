"use client";

import { useEffect, useState, Suspense } from 'react';
import { ChevronLeft, Save, Sparkles, Download, FileText, Settings2, Building2, Briefcase, AlignLeft, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useSubscriptionStore } from '@/store/useSubscription';
import { useJobStore } from '@/store/useJobStore';
import UpgradeModal from '@/components/shared/UpgradeModal';

function CoverLetterBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [title, setTitle] = useState("My Cover Letter");
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("Professional and confident");
  const [content, setContent] = useState("");
  
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { isPremium, fetchSubscription } = useSubscriptionStore();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");

  useEffect(() => {
    fetchSubscription();
    fetchResumes();
    if (id) {
      loadCoverLetter(id);
    }

    const matchJobId = searchParams.get('matchJobId');
    if (matchJobId) {
      const job = useJobStore.getState().savedJobs.find(j => j.id === matchJobId);
      if (job) {
        setTargetJobTitle(job.job_title || "");
        setCompanyName(job.company_name || "");
        setJobDescription(job.metadata?.description || "");
      }
    }
  }, [id, fetchSubscription, searchParams]);

  const premium = isPremium();

  const fetchResumes = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_resumes')
      .select('id, title, content')
      .eq('user_id', user.id);

    if (data) {
      setResumes(data);
      if (data.length > 0) setSelectedResumeId(data[0].id);
    }
  };

  const loadCoverLetter = async (clId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', clId)
      .single();

    if (data) {
      setTitle(data.title);
      setTargetJobTitle(data.target_job_title || "");
      setCompanyName(data.company_name || "");
      setContent(data.content.text || "");
      if (data.content.jobDescription) setJobDescription(data.content.jobDescription);
      if (data.content.tone) setTone(data.content.tone);
    }
  };

  const handleGenerate = async () => {
    if (!premium) {
      setUpgradeReason("AI Cover Letter Generation is a Premium feature. Unlock it to generate tailored cover letters instantly!");
      setIsUpgradeModalOpen(true);
      return;
    }

    if (!targetJobTitle || !companyName) {
      alert("Please enter the target job title and company name.");
      return;
    }

    setIsGenerating(true);

    try {
      const selectedResume = resumes.find(r => r.id === selectedResumeId);
      const resumeData = selectedResume ? selectedResume.content : null;

      const res = await fetch("/api/cover-letter/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetJobTitle,
          companyName,
          tone,
          jobDescription,
          resumeData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setContent(data.data.content);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const clData = {
        user_id: user.id,
        title,
        target_job_title: targetJobTitle,
        company_name: companyName,
        content: { text: content, jobDescription, tone }
      };

      if (id) {
        await supabase.from('cover_letters').update(clData).eq('id', id);
      } else {
        const { data } = await supabase.from('cover_letters').insert([clData]).select().single();
        if (data) {
          router.replace(`/cover-letter/builder?id=${data.id}`);
        }
      }
    } catch (error: any) {
      console.error(error);
      alert("Failed to save cover letter.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans print:bg-white">
      {/* Top Bar - Hidden in print */}
      <header className="h-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 z-30 sticky top-0 print:hidden">
        <div className="flex items-center gap-6">
          <Link href="/cover-letter" className="group flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Back</span>
          </Link>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-black tracking-tight text-slate-900 bg-transparent border-none outline-none hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Settings - Hidden in print */}
        <aside className="w-full lg:w-[450px] overflow-y-auto p-8 border-r border-slate-200 bg-white custom-scrollbar print:hidden flex-shrink-0">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 mb-2">
                <Settings2 className="w-6 h-6 text-indigo-600" />
                Settings
              </h2>
              <p className="text-slate-500 font-medium">Configure your AI cover letter.</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Target Job Title
                </label>
                <input 
                  value={targetJobTitle}
                  onChange={e => setTargetJobTitle(e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-indigo-500" /> Company Name
                </label>
                <input 
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Google"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-indigo-500" /> Source Resume
                </label>
                <select
                  value={selectedResumeId}
                  onChange={e => setSelectedResumeId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700 appearance-none"
                >
                  <option value="">Do not use resume data</option>
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tone & Style</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700 appearance-none"
                >
                  <option value="Professional and confident">Professional & Confident</option>
                  <option value="Friendly and approachable">Friendly & Approachable</option>
                  <option value="Enthusiastic and passionate">Enthusiastic & Passionate</option>
                  <option value="Direct and concise">Direct & Concise</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <AlignLeft className="w-3.5 h-3.5 text-indigo-500" /> Job Description (Optional)
                </label>
                <textarea 
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here for better tailoring..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700 resize-none"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Generate Cover Letter</>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Right Panel: Editor / Preview */}
        <main className="flex-1 bg-slate-100 overflow-y-auto p-8 flex justify-center print:bg-white print:p-0">
          <div className="w-full max-w-[800px] min-h-[1056px] bg-white shadow-2xl rounded-sm print:shadow-none print:w-full print:max-w-none">
            <div className="p-12 md:p-16 h-full flex flex-col">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Your cover letter content will appear here..."
                className="w-full h-full flex-1 resize-none border-none outline-none text-slate-800 font-serif leading-relaxed text-base placeholder:text-slate-300 print:text-black"
              />
            </div>
          </div>
        </main>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        reason={upgradeReason} 
      />
    </div>
  );
}

export default function CoverLetterBuilder() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CoverLetterBuilderContent />
    </Suspense>
  );
}
