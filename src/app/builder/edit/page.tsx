"use client";

import { useEffect, useState, Suspense } from 'react';
import { useResumeStore, OnboardingStatus } from '@/store/useResumeStore';
import { useSubscriptionStore } from '@/store/useSubscription';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Wand2, GripVertical, ChevronLeft, Save, Sparkles, ShieldCheck, Crown, FileText, Download, ZoomIn, ZoomOut, CheckCircle2, AlertTriangle, X, ArrowRight, ArrowLeft, Loader2, Mail, Target, Layout, Palette } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams, useRouter } from 'next/navigation';
import { useJobStore } from '@/store/useJobStore';
import UpgradeModal from '@/components/shared/UpgradeModal';
import { z } from 'zod';
import { createClient } from '@/utils/supabase/client';

const resumeSchema = z.object({
  personalInfo: z.object({
    fullName: z.string().min(2, "Full Name is required (at least 2 characters)."),
    email: z.string().email("A valid email address is required."),
    phone: z.string().optional(),
    location: z.string().optional(),
    website: z.string().optional(),
    photo: z.string().optional(),
  }),
  experience: z.array(z.object({
    id: z.string(),
    company: z.string().min(1, "Company name is required."),
    role: z.string().min(1, "Job title is required."),
    dates: z.string().min(1, "Duration is required."),
    bullets: z.array(z.string()),
  })).optional(),
  education: z.array(z.object({
    id: z.string(),
    school: z.string(),
    degree: z.string(),
    year: z.string(),
  })).optional(),
  skills: z.array(z.string()).optional(),
  projects: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string()),
    link: z.string().optional(),
  })).optional(),
});

import HTMLPreview from '@/components/builder/Preview/HTMLPreview';
const PDFPreview = dynamic(() => import('@/components/builder/Preview/PDFPreview'), { ssr: false });
import TemplateGallery from '@/components/builder/Templates/TemplateGallery';

function BuilderEditContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeId = searchParams.get('id');
  const { data, updatePersonalInfo, updateExperience, updateEducation, updateSkills, updateProjects, updateCertifications, updateLanguages, updateInterests, updateReferences, lastSaved, setCurrentResumeId, fetchUserResumes, userResumes, setResumeData, templateId, setTemplateId, updateOnboardingStatus } = useResumeStore();
  const { isPremium, fetchSubscription } = useSubscriptionStore();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationToast, setShowValidationToast] = useState(false);

  // ATS Scan State
  const [isATSModalOpen, setIsATSModalOpen] = useState(false);
  const [atsTargetJob, setAtsTargetJob] = useState("");
  const [atsJobDescription, setAtsJobDescription] = useState("");
  const [atsResult, setAtsResult] = useState<{ score: number, feedback: string, keywordsMissing: string[], improvements: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [hasPrefilledAts, setHasPrefilledAts] = useState(false);

  // Onboarding state
  const currentResume = userResumes.find(r => r.id === resumeId);
  const onboardingStatus: OnboardingStatus = currentResume?.onboarding_status || 'completed';
  const isOnboarding = onboardingStatus !== 'completed';

  // Cover Letter state (Step 3)
  const [clJobTitle, setClJobTitle] = useState('');
  const [clCompany, setClCompany] = useState('');
  const [clContent, setClContent] = useState('');
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);

  // Active Tab for completed mode
  const initialTab = searchParams.get('tab') as 'edit' | 'optimize' | 'cover_letter';
  const [activeTab, setActiveTab] = useState<'edit' | 'optimize' | 'cover_letter'>(initialTab || 'edit');

  // Preview state
  const [isPreviewMode, setIsPreviewMode] = useState<'live' | 'pdf'>('live');
  const [zoomScale, setZoomScale] = useState(0.6);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const handleGenerateCoverLetter = async () => {
    if (!clJobTitle.trim()) return;
    setIsGeneratingCL(true);
    try {
      const res = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: data, jobTitle: clJobTitle, company: clCompany }),
      });
      const result = await res.json();
      if (result.content) setClContent(result.content);
      else throw new Error(result.error || 'Generation failed');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to generate cover letter');
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const advanceStep = async (next: OnboardingStatus) => {
    if (resumeId) {
      await updateOnboardingStatus(resumeId, next);
      if (next === 'completed') {
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleGetMatchingJobs = () => {
    if (resumeId) {
      router.push(`/jobs?resumeId=${resumeId}`);
    } else {
      router.push('/jobs');
    }
  };

  const handleExportPDF = () => {
    const result = resumeSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues.map(e => e.message);
      setValidationErrors(errors);
      setShowValidationToast(true);
      // Auto-dismiss after 6 seconds
      setTimeout(() => setShowValidationToast(false), 6000);
      return;
    }
    setValidationErrors([]);
    setShowValidationToast(false);
    // Trigger the actual PDF download via the PDFPreview component
    window.print();
  };

  const handleATSAnalysis = async () => {
    if (!atsTargetJob.trim()) {
      alert("Please enter a target job title to analyze against.");
      return;
    }

    setIsAnalyzing(true);
    setAtsResult(null);

    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeData: data, 
          targetJobTitle: atsTargetJob,
          jobDescription: atsJobDescription
        }),
      });

      const responseText = await res.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error("Server returned non-JSON response:", responseText);
        throw new Error("The server encountered an error and returned an invalid response. Please check the server logs.");
      }

      if (!res.ok) throw new Error(responseData.error || "Failed to analyze");
      
      setAtsResult(responseData.data);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAIOptimization = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/resume/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData: data, jobTitle: atsTargetJob, jobDescription: atsJobDescription }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Optimization failed');
      setResumeData(result.optimizedData);
      setIsATSModalOpen(false);
    } catch (err: any) {
      console.error('Optimization Error:', err);
      alert(err.message || 'AI optimization failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
    if (resumeId) {
      setCurrentResumeId(resumeId);
      const resume = userResumes.find(r => r.id === resumeId);
      if (resume) {
        setResumeData(resume.content);
      } else {
        fetchUserResumes().then(() => {
          const r = useResumeStore.getState().userResumes.find(res => res.id === resumeId);
          if (r) setResumeData(r.content);
        });
      }
    }

    // Handle Job Matching from URL
    const matchJobId = searchParams.get('matchJobId');
    if (matchJobId) {
      const job = useJobStore.getState().savedJobs.find(j => j.id === matchJobId);
      if (job) {
        setAtsTargetJob(job.job_title || "");
        setAtsJobDescription(job.metadata?.description || "");
        setIsATSModalOpen(true);
        setIsMatching(true);
      }
    }
  }, [resumeId, setCurrentResumeId, fetchSubscription, userResumes, fetchUserResumes, setResumeData, searchParams]);

  // Auto-prefill target job from resume experience if not set
  useEffect(() => {
    const matchJobId = searchParams.get('matchJobId');
    if (!hasPrefilledAts && !matchJobId && data?.experience && data.experience.length > 0) {
      const firstRole = data.experience[0].role;
      if (firstRole) {
        setAtsTargetJob(prev => prev || firstRole);
        setClJobTitle(prev => prev || firstRole);
        setHasPrefilledAts(true);
      }
    }
  }, [data?.experience, hasPrefilledAts, searchParams]);

  const premium = isPremium();

  const addExperience = () => {
    updateExperience([...data.experience, { id: uuidv4(), company: '', role: '', dates: '', bullets: [''] }]);
  };

  const removeExperience = (id: string) => {
    updateExperience(data.experience.filter(exp => exp.id !== id));
  };

  const updateExperienceItem = (id: string, field: string, value: any) => {
    updateExperience(data.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const addEducation = () => {
    updateEducation([...data.education, { id: uuidv4(), school: '', degree: '', year: '' }]);
  };
  const updateEducationItem = (id: string, field: string, value: any) => {
    updateEducation(data.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };
  const removeEducation = (id: string) => {
    updateEducation(data.education.filter(edu => edu.id !== id));
  };

  const addSkill = () => updateSkills([...data.skills, '']);
  const updateSkill = (index: number, value: string) => {
    const newSkills = [...data.skills];
    newSkills[index] = value;
    updateSkills(newSkills);
  };
  const removeSkill = (index: number) => updateSkills(data.skills.filter((_, i) => i !== index));

  const addProject = () => updateProjects([...data.projects, { id: uuidv4(), name: '', description: '', technologies: [], link: '' }]);
  const updateProjectItem = (id: string, field: string, value: any) => updateProjects(data.projects.map(p => p.id === id ? { ...p, [field]: value } : p));
  const removeProject = (id: string) => updateProjects(data.projects.filter(p => p.id !== id));

  const addCertification = () => updateCertifications([...(data.certifications || []), { id: uuidv4(), name: '', issuer: '', date: '', link: '' }]);
  const updateCertificationItem = (id: string, field: string, value: any) => updateCertifications((data.certifications || []).map(c => c.id === id ? { ...c, [field]: value } : c));
  const removeCertification = (id: string) => updateCertifications((data.certifications || []).filter(c => c.id !== id));

  const addLanguage = () => updateLanguages([...(data.languages || []), { id: uuidv4(), name: '', fluency: '' }]);
  const updateLanguageItem = (id: string, field: string, value: any) => updateLanguages((data.languages || []).map(l => l.id === id ? { ...l, [field]: value } : l));
  const removeLanguage = (id: string) => updateLanguages((data.languages || []).filter(l => l.id !== id));

  const addInterest = () => updateInterests([...(data.interests || []), '']);
  const updateInterest = (index: number, value: string) => {
    const newInterests = [...(data.interests || [])];
    newInterests[index] = value;
    updateInterests(newInterests);
  };
  const removeInterest = (index: number) => updateInterests((data.interests || []).filter((_, i) => i !== index));

  const addReference = () => updateReferences([...(data.references || []), { id: uuidv4(), name: '', position: '', company: '', contactInfo: '' }]);
  const updateReferenceItem = (id: string, field: string, value: any) => updateReferences((data.references || []).map(r => r.id === id ? { ...r, [field]: value } : r));
  const removeReference = (id: string) => updateReferences((data.references || []).filter(r => r.id !== id));

  const handleAIImprove = async (text: string, section: string, callback: (improved: string) => void) => {
    try {
      const response = await fetch('/api/resume/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, section }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'AI improvement failed');
      callback(result.improvedText);
    } catch (error: any) {
      console.error('AI Error:', error);
      alert(error.message || 'AI improvement failed. Please try again.');
    }
  };

  const moveExperience = (index: number, direction: 'up' | 'down') => {
    const newExperience = [...data.experience];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newExperience.length) return;
    [newExperience[index], newExperience[newIndex]] = [newExperience[newIndex], newExperience[index]];
    updateExperience(newExperience);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-20 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 z-30 sticky top-0">
        <div className="flex items-center gap-6">
          <Link href="/builder" className="group flex items-center gap-2 px-3 py-2 rounded-2xl hover:bg-slate-50 transition-all">
            <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-900 transition-colors">Back</span>
          </Link>
          <div className="h-8 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight flex items-center gap-1">
                JobVanta <span className="text-slate-400 font-medium">|</span> <span className="text-slate-500 font-bold">Resume Editor</span>
              </span>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${lastSaved ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse'}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {lastSaved ? 'Saved to cloud' : 'Syncing changes...'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {premium ? (
            <div className="px-4 py-2 rounded-2xl bg-blue-50 border border-blue-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Premium Access</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{userResumes.length}/2 Resumes Used</span>
            </div>
          )}
          
          {/* Always show actions for completed resumes */}
          {!isOnboarding ? (
            <>
              <button 
                onClick={() => setIsATSModalOpen(true)}
                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> ATS Scan
              </button>
              <button 
                onClick={handleExportPDF}
                className="ml-2 px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {onboardingStatus !== 'step_1_edit' && (
                <button
                  onClick={() => {
                    if (onboardingStatus === 'step_2_optimize') advanceStep('step_1_edit');
                    else if (onboardingStatus === 'step_3_cover_letter') advanceStep('step_2_optimize');
                  }}
                  className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4" /> Previous
                </button>
              )}
              <button
                onClick={() => {
                  if (onboardingStatus === 'step_1_edit') advanceStep('step_2_optimize');
                  else if (onboardingStatus === 'step_2_optimize') advanceStep('step_3_cover_letter');
                  else advanceStep('completed');
                }}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:shadow-xl hover:shadow-blue-500/25 transition-all flex items-center gap-2 active:scale-95"
              >
                {onboardingStatus === 'step_3_cover_letter' ? 'Complete & Find Jobs' : 'Next Step'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Navigation for Completed Resumes / Progress for Onboarding */}
      <div className="bg-white border-b border-slate-200/60 px-8 py-4">
        <div className="max-w-4xl mx-auto">
          {!isOnboarding ? (
            <div className="flex items-center justify-center p-1 bg-slate-100 rounded-2xl w-fit mx-auto">
              {([
                { key: 'edit', label: 'Edit Resume', icon: <FileText className="w-4 h-4" /> },
                { key: 'optimize', label: 'ATS Optimize', icon: <Target className="w-4 h-4" /> },
                { key: 'cover_letter', label: 'Cover Letter', icon: <Mail className="w-4 h-4" /> },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    activeTab === tab.key 
                      ? 'bg-white text-blue-600 shadow-md shadow-slate-200 ring-1 ring-slate-200' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Resume Setup</span>
                <span className="text-xs font-bold text-blue-600">
                  Step {onboardingStatus === 'step_1_edit' ? '1' : onboardingStatus === 'step_2_optimize' ? '2' : '3'} of 3
                </span>
              </div>
              <div className="flex gap-3">
                {([
                  { key: 'step_1_edit', label: 'Edit Resume', icon: '✏️' },
                  { key: 'step_2_optimize', label: 'ATS Optimize', icon: '🎯' },
                  { key: 'step_3_cover_letter', label: 'Cover Letter', icon: '✉️' },
                ] as const).map((step, i) => {
                  const stepKeys = ['step_1_edit', 'step_2_optimize', 'step_3_cover_letter'];
                  const currentIndex = stepKeys.indexOf(onboardingStatus);
                  const isActive = step.key === onboardingStatus;
                  const isDone = i < currentIndex;
                  return (
                    <button 
                      key={step.key} 
                      onClick={() => advanceStep(step.key as OnboardingStatus)}
                      className="flex-1 text-left group transition-all active:scale-[0.98]"
                    >
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${isDone ? 'bg-emerald-500' : isActive ? 'bg-blue-600' : 'bg-slate-200 group-hover:bg-slate-300'}`} />
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-sm transition-transform group-hover:scale-110 duration-300">{step.icon}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-600' : isDone ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{step.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Form Builder */}
        <aside className="w-full lg:w-1/2 overflow-y-auto p-8 md:p-12 border-r border-slate-200 bg-white custom-scrollbar">
          <div className="max-w-2xl mx-auto space-y-16">
            
            {/* Step 1: Edit Resume / Completed: Full Editor */}
            {(onboardingStatus === 'step_1_edit' || (!isOnboarding && activeTab === 'edit')) && (<>
              {/* Template Selection CTA */}
              <div className="mb-12 p-8 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-white/20 transition-colors duration-700" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                      <Layout className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100">Design System</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2 tracking-tight">Professional Templates</h3>
                  <p className="text-blue-100/80 text-sm font-medium mb-8 max-w-md">
                    Switch between our premium, recruiter-tested layouts instantly while keeping all your content.
                  </p>
                  <button 
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-sm hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group/btn"
                  >
                    <Palette className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" />
                    Change Template
                  </button>
                </div>
              </div>
            {/* Personal Info */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm">👤</div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Personal Details</h2>
                  <p className="text-slate-500 font-medium">How recruiters will contact you</p>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[24px] border border-slate-200">
                <div className="w-20 h-20 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {data.personalInfo.photo ? (
                    <>
                      <img src={data.personalInfo.photo} alt="Profile" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => updatePersonalInfo({ photo: undefined })}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-2xl">📸</span>
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-slate-900 text-sm">Profile Photo</h3>
                  <p className="text-xs text-slate-500 font-medium mb-3">Optional. Displayed only on supported templates.</p>
                  <label className="cursor-pointer px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors inline-block active:scale-95">
                    Upload Image
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Check size (max 2MB)
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Image must be smaller than 2MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            updatePersonalInfo({ photo: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] ml-1">Full Name</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
                    value={data.personalInfo.fullName}
                    onChange={(e) => updatePersonalInfo({ fullName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
                    value={data.personalInfo.email}
                    onChange={(e) => updatePersonalInfo({ email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] ml-1">Phone Number</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
                    value={data.personalInfo.phone}
                    onChange={(e) => updatePersonalInfo({ phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] ml-1">Location</label>
                  <input 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all font-medium"
                    value={data.personalInfo.location}
                    onChange={(e) => updatePersonalInfo({ location: e.target.value })}
                    placeholder="New York, NY"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] ml-1">Professional Summary</label>
                <div className="relative group/field">
                  <textarea 
                    className="w-full h-40 bg-slate-50 border border-slate-200 rounded-[24px] px-5 py-4 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all resize-none font-medium leading-relaxed"
                    value={data.personalInfo.summary}
                    onChange={(e) => updatePersonalInfo({ summary: e.target.value })}
                    placeholder="Describe your professional background and key achievements..."
                  />
                  <button 
                    onClick={() => handleAIImprove(data.personalInfo.summary, 'summary', (val) => updatePersonalInfo({ summary: val }))}
                    className="absolute bottom-4 right-4 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-white transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:scale-105 active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> AI Polish
                  </button>
                </div>
              </div>
            </section>

            {/* Experience */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl shadow-sm">💼</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Work Experience</h2>
                    <p className="text-slate-500 font-medium">Your career journey so far</p>
                  </div>
                </div>
                <button 
                  onClick={addExperience}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 font-bold text-xs hover:bg-blue-100 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Add Role
                </button>
              </div>

              <div className="space-y-8">
                {data.experience.map((exp, index) => (
                  <div key={exp.id} className="p-8 rounded-[32px] bg-slate-50/50 border border-slate-200/60 space-y-6 relative group/card hover:bg-white hover:border-blue-200 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-300">
                    <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-all">
                      <button onClick={() => moveExperience(index, 'up')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-colors"><GripVertical className="w-4 h-4" /></button>
                      <button onClick={() => removeExperience(exp.id)} className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Company Name</label>
                        <input 
                          placeholder="e.g. Google" 
                          className="bg-transparent text-xl font-black text-slate-900 outline-none border-b-2 border-slate-200 focus:border-blue-500 w-full transition-all pb-2"
                          value={exp.company}
                          onChange={(e) => updateExperienceItem(exp.id, 'company', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-right block">Duration</label>
                        <input 
                          placeholder="Jan 2022 — Present" 
                          className="bg-transparent text-sm font-bold text-slate-500 text-right outline-none w-full border-b-2 border-transparent focus:border-slate-200 transition-all pb-2"
                          value={exp.dates}
                          onChange={(e) => updateExperienceItem(exp.id, 'dates', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Job Title</label>
                      <input 
                        placeholder="e.g. Senior Frontend Engineer" 
                        className="bg-transparent text-slate-600 font-bold outline-none w-full border-b-2 border-slate-200 focus:border-blue-500 transition-all pb-2"
                        value={exp.role}
                        onChange={(e) => updateExperienceItem(exp.id, 'role', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-4 pt-4">
                       <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Key Responsibilities</label>
                         <button 
                           onClick={() => updateExperienceItem(exp.id, 'bullets', [...exp.bullets, ''])}
                           className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider"
                         >
                           <Plus className="w-3.5 h-3.5" /> Add Point
                         </button>
                       </div>
                       <div className="space-y-3">
                         {exp.bullets.map((bullet, i) => (
                           <div key={i} className="flex gap-4 group/bullet items-start">
                             <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-focus-within/bullet:bg-blue-600 group-focus-within/bullet:text-white transition-all mt-2 flex-shrink-0">
                               {i+1}
                             </div>
                             <textarea 
                               rows={1}
                               className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 w-full outline-none focus:bg-white focus:border-blue-400 transition-all resize-none font-medium"
                               value={bullet}
                               onChange={(e) => {
                                 const newBullets = [...exp.bullets];
                                 newBullets[i] = e.target.value;
                                 updateExperienceItem(exp.id, 'bullets', newBullets);
                               }}
                               onInput={(e) => {
                                 const target = e.target as HTMLTextAreaElement;
                                 target.style.height = 'auto';
                                 target.style.height = target.scrollHeight + 'px';
                               }}
                             />
                             <button 
                               onClick={() => {
                                 const newBullets = exp.bullets.filter((_, idx) => idx !== i);
                                 updateExperienceItem(exp.id, 'bullets', newBullets);
                               }}
                               className="opacity-0 group-hover/bullet:opacity-100 p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all mt-1"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Education */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xl shadow-sm">🎓</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Education</h2>
                    <p className="text-slate-500 font-medium">Your academic background</p>
                  </div>
                </div>
                <button 
                  onClick={addEducation}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Degree
                </button>
              </div>

              <div className="space-y-6">
                {data.education.map((edu, index) => (
                  <div key={edu.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group">
                    <button 
                      onClick={() => removeEducation(edu.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">School</label>
                        <input 
                          placeholder="e.g. University of Example" 
                          className="bg-transparent text-lg font-black text-slate-900 outline-none border-b-2 border-slate-200 focus:border-indigo-500 w-full transition-all pb-2"
                          value={edu.school}
                          onChange={(e) => updateEducationItem(edu.id, 'school', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] text-right block">Year / Dates</label>
                        <input 
                          placeholder="2018 — 2022" 
                          className="bg-transparent text-sm font-bold text-slate-500 text-right outline-none w-full border-b-2 border-transparent focus:border-slate-200 transition-all pb-2"
                          value={edu.year}
                          onChange={(e) => updateEducationItem(edu.id, 'year', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Degree</label>
                      <input 
                        placeholder="e.g. Bachelor of Science in Computer Science" 
                        className="bg-transparent text-slate-600 font-bold outline-none w-full border-b-2 border-slate-200 focus:border-indigo-500 transition-all pb-2"
                        value={edu.degree}
                        onChange={(e) => updateEducationItem(edu.id, 'degree', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-xl shadow-sm">💡</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Skills</h2>
                    <p className="text-slate-500 font-medium">Highlight your core competencies</p>
                  </div>
                </div>
                <button 
                  onClick={addSkill}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {data.skills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-1 bg-white border border-slate-200 rounded-full pl-4 pr-1 py-1 shadow-sm focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all">
                    <input 
                      placeholder="e.g. React"
                      className="bg-transparent text-sm font-bold text-slate-700 outline-none w-24 focus:w-32 transition-all"
                      value={skill}
                      onChange={(e) => updateSkill(index, e.target.value)}
                    />
                    <button 
                      onClick={() => removeSkill(index)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Projects */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-xl shadow-sm">🚀</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Projects</h2>
                    <p className="text-slate-500 font-medium">Showcase your notable work</p>
                  </div>
                </div>
                <button 
                  onClick={addProject}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Project
                </button>
              </div>

              <div className="space-y-6">
                {(data.projects || []).map((proj) => (
                  <div key={proj.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group">
                    <button 
                      onClick={() => removeProject(proj.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="space-y-2 mb-4">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Project Name</label>
                      <input 
                        placeholder="e.g. E-Commerce Platform" 
                        className="bg-transparent text-lg font-black text-slate-900 outline-none border-b-2 border-slate-200 focus:border-orange-500 w-full transition-all pb-2"
                        value={proj.name}
                        onChange={(e) => updateProjectItem(proj.id, 'name', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Description</label>
                      <textarea 
                        rows={2}
                        placeholder="Built a full-stack platform processing 10k orders daily..." 
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 w-full outline-none focus:bg-white focus:border-orange-400 transition-all resize-none font-medium"
                        value={proj.description}
                        onChange={(e) => updateProjectItem(proj.id, 'description', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Certifications */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl shadow-sm">🏆</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Certifications</h2>
                    <p className="text-slate-500 font-medium">Validations of your expertise</p>
                  </div>
                </div>
                <button 
                  onClick={addCertification}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Cert
                </button>
              </div>

              <div className="space-y-6">
                {(data.certifications || []).map((cert) => (
                  <div key={cert.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group">
                    <button 
                      onClick={() => removeCertification(cert.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Certification Name</label>
                        <input 
                          placeholder="e.g. AWS Solutions Architect" 
                          className="bg-transparent text-lg font-black text-slate-900 outline-none border-b-2 border-slate-200 focus:border-emerald-500 w-full transition-all pb-2"
                          value={cert.name}
                          onChange={(e) => updateCertificationItem(cert.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Issuer</label>
                        <input 
                          placeholder="e.g. Amazon Web Services" 
                          className="bg-transparent text-sm font-bold text-slate-500 outline-none w-full border-b-2 border-slate-200 focus:border-emerald-500 transition-all pb-2"
                          value={cert.issuer}
                          onChange={(e) => updateCertificationItem(cert.id, 'issuer', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Languages */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-xl shadow-sm">🌍</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Languages</h2>
                    <p className="text-slate-500 font-medium">What languages do you speak?</p>
                  </div>
                </div>
                <button 
                  onClick={addLanguage}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Language
                </button>
              </div>

              <div className="space-y-6">
                {(data.languages || []).map((lang) => (
                  <div key={lang.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group">
                    <button 
                      onClick={() => removeLanguage(lang.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Language</label>
                        <input 
                          placeholder="e.g. Spanish" 
                          className="bg-transparent text-lg font-black text-slate-900 outline-none border-b-2 border-slate-200 focus:border-cyan-500 w-full transition-all pb-2"
                          value={lang.name}
                          onChange={(e) => updateLanguageItem(lang.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Fluency</label>
                        <input 
                          placeholder="e.g. Native, Fluent" 
                          className="bg-transparent text-sm font-bold text-slate-500 outline-none w-full border-b-2 border-slate-200 focus:border-cyan-500 transition-all pb-2"
                          value={lang.fluency}
                          onChange={(e) => updateLanguageItem(lang.id, 'fluency', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Interests */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-xl shadow-sm">🎨</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Interests</h2>
                    <p className="text-slate-500 font-medium">Hobbies and personal interests</p>
                  </div>
                </div>
                <button 
                  onClick={addInterest}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Interest
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {(data.interests || []).map((interest, index) => (
                  <div key={index} className="flex items-center gap-1 bg-white border border-slate-200 rounded-full pl-4 pr-1 py-1 shadow-sm focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                    <input 
                      placeholder="e.g. Photography"
                      className="bg-transparent text-sm font-bold text-slate-700 outline-none w-24 focus:w-32 transition-all"
                      value={interest}
                      onChange={(e) => updateInterest(index, e.target.value)}
                    />
                    <button 
                      onClick={() => removeInterest(index)}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
            
            {/* References */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-xl shadow-sm">👥</div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">References</h2>
                    <p className="text-slate-500 font-medium">People who can vouch for you</p>
                  </div>
                </div>
                <button 
                  onClick={addReference}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Reference
                </button>
              </div>

              <div className="space-y-6">
                {(data.references || []).map((ref) => (
                  <div key={ref.id} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative group">
                    <button 
                      onClick={() => removeReference(ref.id)}
                      className="absolute top-4 right-4 p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Name</label>
                        <input 
                          placeholder="e.g. Jane Smith" 
                          className="bg-transparent text-lg font-black text-slate-900 outline-none border-b-2 border-slate-200 focus:border-pink-500 w-full transition-all pb-2"
                          value={ref.name}
                          onChange={(e) => updateReferenceItem(ref.id, 'name', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Position</label>
                        <input 
                          placeholder="e.g. Senior Manager" 
                          className="bg-transparent text-sm font-bold text-slate-500 outline-none w-full border-b-2 border-slate-200 focus:border-pink-500 transition-all pb-2"
                          value={ref.position}
                          onChange={(e) => updateReferenceItem(ref.id, 'position', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Company</label>
                        <input 
                          placeholder="e.g. Tech Corp" 
                          className="bg-transparent text-sm font-bold text-slate-500 outline-none w-full border-b-2 border-slate-200 focus:border-pink-500 transition-all pb-2"
                          value={ref.company}
                          onChange={(e) => updateReferenceItem(ref.id, 'company', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Contact Info</label>
                        <input 
                          placeholder="e.g. jane@example.com" 
                          className="bg-transparent text-sm font-bold text-slate-500 outline-none w-full border-b-2 border-slate-200 focus:border-pink-500 transition-all pb-2"
                          value={ref.contactInfo}
                          onChange={(e) => updateReferenceItem(ref.id, 'contactInfo', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            {/* Step 1 Navigation */}
            {((!isOnboarding && activeTab === 'edit') || (isOnboarding && onboardingStatus === 'step_1_edit')) && (
              <div className="pt-12 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => isOnboarding ? advanceStep('step_2_optimize') : setActiveTab('optimize')}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95"
                >
                  Next: Optimize Resume <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
            </>)}

            {/* Step 2: ATS Optimization */}
            {(onboardingStatus === 'step_2_optimize' || (!isOnboarding && activeTab === 'optimize')) && (
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">ATS Optimization</h2>
                    <p className="text-slate-500 font-medium">Scan your resume against a target job to maximize your chances</p>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Target Job Title</label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="flex-1 bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
                        placeholder="e.g. Senior Frontend Developer"
                        value={atsTargetJob}
                        onChange={(e) => setAtsTargetJob(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleATSAnalysis()}
                      />
                      <button
                        onClick={handleATSAnalysis}
                        disabled={isAnalyzing}
                        className="px-6 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 active:scale-95"
                      >
                        {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</> : <><Wand2 className="w-4 h-4" /> Analyze</>}
                      </button>
                    </div>
                  </div>

                  {atsResult && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div className="relative flex items-center justify-center w-20 h-20">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent"
                              strokeDasharray={213.6}
                              strokeDashoffset={213.6 - (213.6 * atsResult.score) / 100}
                              className={`${atsResult.score >= 80 ? 'text-emerald-500' : atsResult.score >= 60 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`}
                            />
                          </svg>
                          <span className="absolute text-xl font-black text-slate-900">{atsResult.score}</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">Match Score</h4>
                          <p className="text-slate-600 text-sm mt-1">{atsResult.feedback}</p>
                        </div>
                      </div>

                      {atsResult.keywordsMissing.length > 0 && (
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {atsResult.keywordsMissing.map((kw, i) => (
                              <span key={i} className="px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700">{kw}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {atsResult.improvements.length > 0 && (
                        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Improvements</h4>
                          <ul className="space-y-2">
                            {atsResult.improvements.map((imp, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" /><span>{imp}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {((!isOnboarding && activeTab === 'optimize') || (isOnboarding && onboardingStatus === 'step_2_optimize')) && (
                  <div className="pt-12 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => isOnboarding ? advanceStep('step_1_edit') : setActiveTab('edit')}
                      className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Edit
                    </button>
                    <button
                      onClick={() => isOnboarding ? advanceStep('step_3_cover_letter') : setActiveTab('cover_letter')}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95"
                    >
                      Next: Cover Letter <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Step 3: Cover Letter Generator */}
            {(onboardingStatus === 'step_3_cover_letter' || (!isOnboarding && activeTab === 'cover_letter')) && (
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Cover Letter Generator</h2>
                    <p className="text-slate-500 font-medium">AI-powered cover letter tailored to your target role</p>
                  </div>
                </div>

                <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Target Job Title</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                        placeholder="e.g. Product Manager"
                        value={clJobTitle}
                        onChange={(e) => setClJobTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Company Name</label>
                      <input
                        type="text"
                        className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium"
                        placeholder="e.g. Google"
                        value={clCompany}
                        onChange={(e) => setClCompany(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateCoverLetter}
                    disabled={isGeneratingCL || !clJobTitle.trim()}
                    className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    {isGeneratingCL ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Cover Letter</>}
                  </button>
                </div>

                {clContent && (
                  <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Your Cover Letter</h3>
                      <button
                        onClick={() => navigator.clipboard.writeText(clContent)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
                      >
                        Copy to Clipboard
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {clContent}
                    </div>
                  </div>
                )}

                {((!isOnboarding && activeTab === 'cover_letter') || (isOnboarding && onboardingStatus === 'step_3_cover_letter')) && (
                  <div className="pt-12 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => isOnboarding ? advanceStep('step_2_optimize') : setActiveTab('optimize')}
                      className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 active:scale-95"
                    >
                      <ChevronLeft className="w-4 h-4" /> Back to Optimize
                    </button>
                    <button
                      onClick={() => isOnboarding ? advanceStep('completed') : handleGetMatchingJobs()}
                      className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95"
                    >
                      {isOnboarding ? 'Complete & Find Jobs' : 'Find Matching Jobs'} <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </section>
            )}
            
          </div>
        </aside>

        {/* Right: Live Preview */}
        <section className="hidden lg:flex lg:w-1/2 bg-slate-100/50 p-12 flex-col items-center justify-center relative overflow-hidden">
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />
          
          <div className="absolute top-12 left-12 right-12 flex items-center justify-between z-20">
            <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md border border-slate-200 px-6 py-3 rounded-2xl shadow-xl shadow-slate-900/5">
              <div className="relative flex items-center justify-center">
                <div className={`w-2.5 h-2.5 rounded-full ${isPreviewMode === 'live' ? 'bg-emerald-500' : 'bg-blue-600'}`} />
                <div className={`absolute w-2.5 h-2.5 rounded-full ${isPreviewMode === 'live' ? 'bg-emerald-500' : 'bg-blue-600'} animate-ping opacity-40`} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {isPreviewMode === 'live' ? 'Real-time Editing' : 'High-Fidelity PDF'}
              </span>
              <div className="h-4 w-px bg-slate-200 mx-1" />
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setIsPreviewMode('live')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isPreviewMode === 'live' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Edit
                </button>
                <button 
                  onClick={() => setIsPreviewMode('pdf')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isPreviewMode === 'pdf' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  PDF
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <div className="px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                 Template: <span className="text-slate-900">{templateId}</span>
               </div>
            </div>
          </div>

          <div className="w-full h-full relative z-10 flex items-start justify-center pt-32 pb-32 overflow-y-auto custom-scrollbar">
            <div 
              className={`transition-all duration-500 ease-in-out ${isPreviewMode === 'live' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}
              style={{ 
                width: `calc(210mm * ${zoomScale})`,
                minHeight: `calc(297mm * ${zoomScale})`
              }}
            >
              <HTMLPreview data={data} templateId={templateId} scale={zoomScale} />
            </div>

            {isPreviewMode === 'pdf' && (
              <div className="w-full max-w-[850px] aspect-[1/1.41] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] rounded-sm overflow-hidden border border-slate-200 bg-white animate-in fade-in zoom-in duration-300">
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                }>
                  <PDFPreview data={data} templateId={templateId} />
                </Suspense>
              </div>
            )}
          </div>
          
          {/* Zoom Controls Overlay */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-white border border-slate-200 px-8 py-3.5 rounded-[24px] z-20 shadow-2xl shadow-slate-900/10">
             <button 
               onClick={() => setZoomScale(prev => Math.max(0.4, prev - 0.05))}
               className="text-slate-400 hover:text-blue-600 transition-all p-1 hover:scale-110 active:scale-90"
             >
               <ZoomOut className="w-5 h-5" />
             </button>
             <div className="h-5 w-px bg-slate-100" />
             <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest min-w-[60px] text-center">
               {Math.round(zoomScale * 100)}%
             </span>
             <div className="h-5 w-px bg-slate-100" />
             <button 
               onClick={() => setZoomScale(prev => Math.min(1, prev + 0.05))}
               className="text-slate-400 hover:text-blue-600 transition-all p-1 hover:scale-110 active:scale-90"
             >
               <ZoomIn className="w-5 h-5" />
             </button>
          </div>
        </section>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        reason={upgradeReason}
      />

      {/* ATS Scan Modal */}
      {isATSModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">ATS Optimizer Scan</h3>
                  <p className="text-slate-500 font-medium mt-1">Analyze your resume against a target job title</p>
                </div>
              </div>
              <button 
                onClick={() => setIsATSModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8 bg-slate-50">
              <div className="space-y-6 mb-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-500" /> Target Job Title
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Senior Frontend Developer" 
                    className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-900"
                    value={atsTargetJob}
                    onChange={(e) => setAtsTargetJob(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" /> Job Description
                  </label>
                  <textarea 
                    placeholder="Paste the full job description here for deeper analysis..." 
                    className="w-full h-40 px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-slate-600 resize-none"
                    value={atsJobDescription}
                    onChange={(e) => setAtsJobDescription(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleATSAnalysis}
                  disabled={isAnalyzing}
                  className="w-full p-5 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98] group"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing requirements...</>
                  ) : (
                    <><Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Scan for ATS Compatibility</>
                  )}
                </button>
              </div>

              {atsResult && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  <div className="flex items-center gap-6 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="relative flex items-center justify-center w-24 h-24">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={251.2} 
                          strokeDashoffset={251.2 - (251.2 * atsResult.score) / 100}
                          className={`${atsResult.score >= 80 ? 'text-emerald-500' : atsResult.score >= 60 ? 'text-amber-500' : 'text-red-500'} transition-all duration-1000`} 
                        />
                      </svg>
                      <span className="absolute text-2xl font-black text-slate-900">{atsResult.score}</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">Match Score</h4>
                      <p className="text-slate-600 text-sm mt-1">{atsResult.feedback}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Keywords
                      </h4>
                      <ul className="space-y-2">
                        {atsResult.keywordsMissing.map((kw, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {kw}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Actionable Improvements
                      </h4>
                      <ul className="space-y-3">
                        {atsResult.improvements.map((imp, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> 
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-200">
                    <button 
                      onClick={handleApplyAIOptimization}
                      disabled={isAnalyzing}
                      className="w-full p-6 rounded-[24px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-3 relative overflow-hidden group"
                    >
                       <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                       <Sparkles className="w-6 h-6" />
                       Apply AI Optimizations
                    </button>
                    <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">
                      This will intelligently rewrite sections of your resume for this specific job
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Selection Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsTemplateModalOpen(false)}
          />
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500">
            <TemplateGallery onClose={() => setIsTemplateModalOpen(false)} />
          </div>
        </div>
      )}

      {/* Validation Error Toast */}
      {showValidationToast && validationErrors.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md animate-in slide-in-from-bottom-4">
          <div className="bg-white border border-rose-200 rounded-2xl shadow-2xl shadow-rose-500/10 p-5 relative">
            <button 
              onClick={() => setShowValidationToast(false)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 mb-2">Please fix the following before exporting:</p>
                <ul className="space-y-1">
                  {validationErrors.map((err, i) => (
                    <li key={i} className="text-xs font-bold text-rose-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" />
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuilderEditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-white shadow-xl flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Initializing Editor...</p>
        </div>
      </div>
    }>
      <BuilderEditContent />
    </Suspense>
  );
}
