"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, LayoutTemplate, Check, Star, Crown, Sparkles, Plus, FileText, ArrowUpRight, Search, Trash2, Target } from 'lucide-react';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { useResumeStore } from '@/store/useResumeStore';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TEMPLATES, CATEGORIES } from '@/constants/templates';
import HTMLPreview from '@/components/builder/Preview/HTMLPreview';
import { useSubscriptionStore } from '@/store/useSubscription';



function BuilderContent() {
  const router = useRouter();
  const { 
    templateId, 
    setTemplateId, 
    userResumes, 
    fetchUserResumes, 
    deleteResume,
    isLoading 
  } = useResumeStore();
  const { isPremium } = useSubscriptionStore();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';
  const isOptimizeMode = searchParams.get('optimize') === 'true';
  const [view, setView] = useState<'list' | 'templates'>('list');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    fetchUserResumes().then(() => {
      // If no resumes exist, default to templates view
      // But we can check userResumes.length in the render
    });
  }, [fetchUserResumes]);

  // Handle default view based on resume count and query params
  useEffect(() => {
    if (!isLoading) {
      if (isNew || userResumes.length === 0) {
        setView('templates');
      } else {
        setView('list');
      }
    }
  }, [userResumes.length, isLoading, isNew]);

  const filteredTemplates = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === activeCategory);

  const handleSelect = (id: string) => {
    if (!isPremium() && userResumes.length >= 2) {
      alert("Free accounts are limited to 2 resumes. Please upgrade to Premium or delete an existing resume to create a new one.");
      return;
    }
    setTemplateId(id);
    router.push(`/builder/options?templateId=${id}`);
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-2">
                <LayoutTemplate className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-widest">Builder</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                {view === 'templates' ? (
                  <>Create New <span className="text-blue-600">Resume</span></>
                ) : (
                  <>My <span className="text-blue-600">Documents</span></>
                )}
              </h1>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setView('list')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  view === 'list' ? 'bg-white text-blue-600 shadow-md shadow-blue-900/5' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                My Resumes
              </button>
              <button 
                onClick={() => setView('templates')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  view === 'templates' ? 'bg-white text-blue-600 shadow-md shadow-blue-900/5' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Templates
              </button>
            </div>
          </div>
        <AnimatePresence mode="wait">
          {view === 'list' ? (
            <motion.div
              key="list-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
                    {isOptimizeMode ? 'Select Resume to Optimize' : 'My Resumes'}
                  </h1>
                  <p className="text-slate-500 font-medium">
                    {isOptimizeMode ? 'Choose a resume to scan against your target job description.' : 'Continue building your professional story.'}
                  </p>
                </div>
                {!isOptimizeMode && (
                  <button
                    onClick={() => setView('templates')}
                    className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Resume
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {userResumes.map((resume) => (
                  <div 
                    key={resume.id}
                    className="group relative bg-white rounded-[32px] border border-slate-200/60 p-2 hover:border-blue-200 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/5"
                  >
                    <Link href={`/builder/edit?id=${resume.id}${isOptimizeMode ? '&tab=optimize' : ''}`} className="block">
                      <div className="aspect-[1/1.41] bg-white rounded-2xl mb-4 relative overflow-hidden border-2 border-slate-100 group-hover:border-blue-200 transition-all duration-500 shadow-sm group-hover:shadow-md">
                        {/* Realistic Resume Preview */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 origin-top scale-[0.38] md:scale-[0.42] w-[210mm] h-[297mm] pointer-events-none">
                          <HTMLPreview 
                            data={resume.content} 
                            templateId={resume.template_id || 'modern'} 
                          />
                        </div>
                        
                        {/* Overlay to match Jobs page aesthetic */}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-transparent transition-colors duration-500" />
                        
                        {/* Hover Overlay Actions */}
                        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/5 transition-all flex items-center justify-center">
                          <div className="w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                            {isOptimizeMode ? <Target className="w-6 h-6 text-blue-600" /> : <ArrowUpRight className="w-6 h-6 text-blue-600" />}
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className="p-4 pt-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-900 truncate flex-1">{resume.title || 'Untitled'}</h3>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            if(confirm('Are you sure you want to delete this resume?')) deleteResume(resume.id);
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(resume.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="templates-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center gap-4 mb-10">
                <button 
                  onClick={() => setView('list')}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-3xl font-black text-slate-900">Choose a Template</h1>
                  <p className="text-slate-500 font-medium text-sm">Pick a professional design to get started.</p>
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-12">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                      activeCategory === cat
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredTemplates.map((template, index) => {
                  const isSelected = templateId === template.id;
                  
                  return (
                    <motion.div
                      key={template.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      onClick={() => handleSelect(template.id)}
                      className={`group relative rounded-[28px] cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? 'ring-4 ring-blue-600 ring-offset-4 ring-offset-slate-50 scale-[1.02]' 
                          : 'hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/10'
                      }`}
                    >
                      <div className="w-full aspect-[1/1.4] bg-slate-100 rounded-[28px] border border-slate-200 overflow-hidden relative">
                        <Image 
                          src={template.image}
                          alt={template.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex flex-col items-center justify-end pb-8">
                          <div className="px-8 py-3.5 rounded-2xl bg-white text-slate-900 font-bold shadow-xl text-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                            Use This Template
                          </div>
                        </div>
                      </div>
                      <div className="mt-5 px-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{template.category}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{template.name}</h3>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </DashboardLayout>
  );
}

import { Suspense as ReactSuspense } from 'react';
export default function BuilderPage() {
  return (
    <ReactSuspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <BuilderContent />
    </ReactSuspense>
  );
}
