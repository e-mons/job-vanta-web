"use client";

import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useResumeStore } from '@/store/useResumeStore';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Layout, CheckCircle2, Star } from 'lucide-react';

const templates = [
  {
    id: 'modern',
    name: "Modern Professional",
    category: "Tech & Startup",
    image: "/assets/template_modern.png",
    rating: 4.9,
    uses: "12k+"
  },
  {
    id: 'executive',
    name: "Executive Leadership",
    category: "Corporate & Finance",
    image: "/assets/template_executive.png",
    rating: 5.0,
    uses: "8k+"
  },
  {
    id: 'creative',
    name: "Creative Portfolio",
    category: "Design & Arts",
    image: "/assets/template_creative.png",
    rating: 4.8,
    uses: "15k+"
  },
  {
    id: 'minimalist',
    name: "Minimalist Elite",
    category: "Engineering",
    image: "/assets/template_minimalist.png",
    rating: 4.9,
    uses: "20k+"
  },
  {
    id: 'corporate',
    name: "Corporate Classic",
    category: "Business",
    image: "/assets/template_corporate.png",
    rating: 4.8,
    uses: "9.2k+"
  },
  {
    id: 'techpro',
    name: "Tech Pro",
    category: "Software & IT",
    image: "/assets/template_techpro.png",
    rating: 4.9,
    uses: "11k+"
  },
  {
    id: 'elegant',
    name: "Elegant Serif",
    category: "Executive",
    image: "/assets/template_elegant.png",
    rating: 5.0,
    uses: "5.4k+"
  },
  {
    id: 'bold',
    name: "Bold Impact",
    category: "Sales & Marketing",
    image: "/assets/template_bold.png",
    rating: 4.7,
    uses: "7.8k+"
  },
  {
    id: 'clean',
    name: "Clean Slate",
    category: "Design",
    image: "/assets/template_clean.png",
    rating: 4.9,
    uses: "6.7k+"
  },
  {
    id: 'professional_dark',
    name: "Professional Dark",
    category: "Management",
    image: "/assets/template_professional_dark.png",
    rating: 4.8,
    uses: "4.5k+"
  }
];

export default function Templates() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const setTemplateId = useResumeStore(s => s.setTemplateId);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };


  return (
    <section id="templates" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-6"
            >
              <Layout className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Resume Templates</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]"
            >
              Pick a Template and <br />
              <span className="text-blue-600">Create Your Resume</span>
            </motion.h2>
          </div>

          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={`p-4 rounded-full border transition-all ${
                canScrollLeft 
                ? 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-600 hover:text-blue-600 shadow-sm' 
                : 'border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={`p-4 rounded-full border transition-all ${
                canScrollRight 
                ? 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-600 hover:text-blue-600 shadow-sm' 
                : 'border-slate-100 text-slate-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Templates Slider */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-8 overflow-x-auto pb-12 premium-scrollbar snap-x snap-mandatory"
        >
          {templates.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[320px] md:min-w-[400px] snap-start group"
            >
              <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-xl shadow-slate-200/50 transition-all duration-500 group-hover:-translate-y-4 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                <Image 
                  src={template.image}
                  alt={template.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                
                {/* Overlay Info */}
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-widest mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Recruiter Approved
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{template.name}</h3>
                  <Link 
                    href={`/builder/options?templateId=${template.id}`}
                    onClick={() => setTemplateId(template.id)}
                    className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-center font-bold rounded-2xl transition-colors shadow-lg shadow-blue-600/30"
                  >
                    Use This Template
                  </Link>
                </div>

                {/* Top Badge */}
                <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span className="text-xs font-black text-slate-900">{template.rating}</span>
                </div>
              </div>

              {/* Card Meta */}
              <div className="mt-6 px-2">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{template.category}</p>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-slate-900">{template.name}</h4>
                  <span className="text-xs text-slate-400 font-medium">{template.uses} Users</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 pt-12 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-700">100% ATS-Friendly</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-700">One-Click Optimization</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-bold text-slate-700">Professional Layouts</p>
          </div>
        </div>

      </div>
    </section>
  );
}
