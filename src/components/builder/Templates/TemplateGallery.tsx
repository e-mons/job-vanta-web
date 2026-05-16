"use client";

import React from 'react';
import { useResumeStore, ResumeData } from '@/store/useResumeStore';
import { Check, Crown, Layout, Palette, Zap, X, Sparkles } from 'lucide-react';
import { TEMPLATES, CATEGORIES } from '@/constants/templates';
import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function TemplateGallery({ onClose }: { onClose?: () => void }) {
  const { templateId, setTemplateId } = useResumeStore();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const filteredTemplates = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === activeCategory);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="p-8 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Switch <span className="text-blue-600">Template</span></h2>
            <p className="text-sm font-medium text-slate-500">Pick a professional design to transform your resume.</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Category Tabs */}
        <div className="px-8 pt-8 pb-8 sticky top-0 bg-slate-50/95 backdrop-blur-md z-[15]">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-xs font-black transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/25'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-12">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((t, index) => {
                const isSelected = templateId === t.id;
                
                return (
                  <motion.div
                    key={t.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="space-y-4"
                  >
                    <button
                      onClick={() => {
                        setTemplateId(t.id);
                        if (onClose) setTimeout(onClose, 300);
                      }}
                      className={`group relative w-full aspect-[1/1.4] rounded-[28px] border-4 transition-all duration-500 overflow-hidden shadow-2xl ${
                        isSelected 
                          ? 'border-blue-600 ring-8 ring-blue-500/10 scale-[1.02]' 
                          : 'border-white hover:border-blue-400/50 hover:scale-[1.02]'
                      }`}
                    >
                      {/* Image Preview */}
                      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                        <Image 
                          src={t.image} 
                          alt={t.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex flex-col items-center justify-end pb-8">
                        <div className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-bold shadow-2xl text-xs flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          Apply {t.name}
                        </div>
                      </div>

                      {/* Selection Overlay */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl animate-in zoom-in duration-300">
                            <Check className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Premium Badge */}
                      {t.premium && (
                        <div className="absolute top-5 left-5">
                          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black flex items-center gap-1.5 shadow-xl border border-white/20">
                            <Crown className="w-3 h-3" /> PREMIUM
                          </div>
                        </div>
                      )}
                    </button>
                    
                    <div className="px-2">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-black text-slate-900 tracking-tight text-sm">{t.name}</h3>
                        {t.tag && (
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                            {t.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-wider">{t.category}</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer / Tip */}
      <div className="p-8 bg-white border-t border-slate-200">
        <div className="max-w-2xl mx-auto flex items-center gap-4 text-blue-600 bg-blue-50 p-6 rounded-3xl border border-blue-100">
          <Zap className="w-6 h-6 shrink-0 animate-pulse" />
          <p className="text-xs font-bold leading-relaxed">
            Your content is safe. You can switch templates at any time to see which one works best for your specific industry or experience level. All data is automatically preserved.
          </p>
        </div>
      </div>
    </div>
  );
}
