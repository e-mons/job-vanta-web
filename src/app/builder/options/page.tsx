"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import StartMethodCard from '@/components/builder/StartMethodCard';
import Link from 'next/link';
import { ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import { useResumeStore } from '@/store/useResumeStore';

function BuilderOptionsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setTemplateId = useResumeStore(s => s.setTemplateId);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const tid = searchParams.get('templateId');
    if (tid) {
      setTemplateId(tid);
    }
  }, [searchParams, setTemplateId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(30);
      
      const response = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData,
      });

      let resultData;
      try {
        resultData = await response.json();
      } catch (e) {
        throw new Error('Failed to parse server response');
      }

      if (!response.ok) {
        throw new Error(resultData.error || 'Failed to parse resume');
      }
      
      setUploadProgress(80);
      const { success, data, error } = resultData;
      
      if (!success || error) {
        throw new Error(error || 'Failed to extract resume data');
      }

      setUploadProgress(90);
      
      const { createResume } = useResumeStore.getState();
      
      const newId = await createResume(
        data.personalInfo?.fullName ? `${data.personalInfo.fullName}'s Resume` : 'Imported Resume',
        data
      );

      setUploadProgress(100);

      setTimeout(() => {
        if (newId) {
          router.push(`/builder/edit?id=${newId}`);
        } else {
          router.push('/builder/edit');
        }
      }, 400);

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to parse resume. Please try starting from scratch.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateScratch = async () => {
    setIsUploading(true);
    try {
      const { createResume, data } = useResumeStore.getState();
      const newId = await createResume('Untitled Resume', data);
      
      if (newId) {
        router.push(`/builder/edit?id=${newId}`);
      } else {
        router.push('/builder/edit');
      }
    } catch (error) {
      console.error(error);
      router.push('/builder/edit');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 text-slate-900 font-sans relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-blue-100/30 rounded-full blur-[120px] -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-100/20 rounded-full blur-[120px] -z-10" />

      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 h-20 flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              src="/logo.png" 
              alt="JobVanta Logo" 
              className="w-8 h-8 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
            />
            <span className="font-bold text-xl tracking-tight text-slate-900">
              JobVanta
            </span>
          </Link>
          
          <Link 
            href="/builder" 
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Templates
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-16 py-12 md:py-20 pb-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-bold text-blue-600 uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4" />
            Step 2 of 3
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
            How do you want <br />
            <span className="text-blue-600">to start?</span>
          </h1>
          <p className="text-base text-slate-500 max-w-xl mx-auto font-medium">
            Choose a method that works best for you. Whether starting fresh or optimizing an existing profile, we've got you covered.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <StartMethodCard
            title="From Scratch"
            description="Start with a blank canvas and build step-by-step with AI guidance."
            icon="✨"
            onClick={handleCreateScratch}
            isLoading={isUploading}
          />
          
          <div className="relative">
            <input 
              type="file" 
              id="upload-resume" 
              className="hidden" 
              accept=".pdf,.docx,.txt" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <StartMethodCard
              title="Upload Resume"
              description="Import your current resume and let AI structure it perfectly."
              icon="📁"
              onClick={() => document.getElementById('upload-resume')?.click()}
              isLoading={isUploading}
            />
          </div>

          <StartMethodCard
            title="Scan & Optimize"
            description="AI analyzes your resume for ATS scoring and keyword gaps."
            icon="🔍"
            onClick={() => document.getElementById('upload-resume')?.click()}
            isLoading={isUploading}
          />
        </div>

        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-16 p-10 rounded-[40px] bg-white border border-blue-100 shadow-2xl shadow-blue-900/5 flex flex-col items-center gap-8 text-center"
            >
              <div>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 mx-auto">
                   <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Analyzing with JobVanta AI</h3>
                <p className="text-slate-500 font-medium">Our Gemini engine is extracting your career highlights and expertise...</p>
              </div>
              
              <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Progress</span>
                  <span className="text-sm font-bold text-blue-600">{uploadProgress}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadProgress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MobileBottomNav />
    </div>
  );
}

export default function BuilderEntryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    }>
      <BuilderOptionsContent />
    </Suspense>
  );
}
