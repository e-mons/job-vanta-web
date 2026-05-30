"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Sparkles, TrendingUp, Search, ShieldCheck, Star } from 'lucide-react';

const floatingCards = [
  {
    icon: <ShieldCheck className="w-5 h-5 text-blue-400" />,
    title: "ATS Scorer",
    value: "Score Verified",
    pos: "top-[15%] left-[5%] lg:left-[15%]",
    delay: 0.2
  },
  {
    icon: <Search className="w-5 h-5 text-blue-400" />,
    title: "Verified Jobs",
    value: "Active Only",
    pos: "top-[25%] right-[5%] lg:right-[15%]",
    delay: 0.4
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-blue-400" />,
    title: "Resume Tailoring",
    value: "Keyword Optimised",
    pos: "bottom-[25%] left-[2%] lg:left-[10%]",
    delay: 0.6
  },
  {
    icon: <Star className="w-5 h-5 text-blue-400" />,
    title: "AI Career Coach",
    value: "24/7 Support ⚡",
    pos: "bottom-[15%] right-[2%] lg:right-[10%]",
    delay: 0.8
  }
];

export default function Hero() {
  return (
    <section className="relative min-h-[110vh] flex flex-col items-center justify-start overflow-hidden bg-dark-hero pt-32 pb-20">
      {/* Ribbed Background Overlay */}
      <div className="absolute inset-0 ribbed-background opacity-20 pointer-events-none" />
      
      {/* Animated Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
        >
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-black tracking-[0.2em] uppercase text-white/80">AI-Powered Job Success</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-white mb-8 leading-[0.95]"
        >
          Land your dream <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600">
            career with AI precision.
          </span>
        </motion.h1>

        {/* Hero Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
        >
          The AI-first platform for modern job seekers. Build ATS-optimized resumes, discover verified opportunities, and automate your application workflow.
        </motion.p>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-24"
        >
          <Link 
            href="/signup" 
            className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-blue-600 font-black text-lg transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-95"
          >
            Get Started for Free
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Mockup & Floating Cards Container */}
        <div className="relative w-full max-w-5xl mx-auto mt-20">
          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            className="relative mx-auto w-[280px] md:w-[320px] aspect-[9/19] rounded-[3rem] border-[8px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden"
          >
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-2xl z-20" />
            
            {/* App Screen Content */}
            <div className="relative w-full h-full">
              <Image 
                src="/assets/jobvanta_app_preview.png" 
                alt="JobVanta AI Dashboard Preview" 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </motion.div>

          {/* Floating Cards */}
          {floatingCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8, x: i % 2 === 0 ? -50 : 50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: card.delay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={`absolute z-20 ${card.pos} hidden md:block animate-float`}
              style={{ animationDelay: `${i * 0.8}s` }}
            >
              <div className="p-4 rounded-3xl glass-dark-premium flex items-center gap-4 min-w-[220px]">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400">
                  {card.icon}
                </div>
                <div className="text-left">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{card.title}</div>
                  <div className="text-base font-bold text-white">{card.value}</div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Connection Lines (Optional SVG Decor) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 hidden lg:block" viewBox="0 0 1000 600">
             <motion.path 
               initial={{ pathLength: 0 }}
               animate={{ pathLength: 1 }}
               transition={{ duration: 2, delay: 1 }}
               d="M200 150 Q 350 150 480 300" 
               stroke="white" strokeWidth="1" fill="none" strokeDasharray="5 5" 
             />
             <motion.path 
               initial={{ pathLength: 0 }}
               animate={{ pathLength: 1 }}
               transition={{ duration: 2, delay: 1.2 }}
               d="M800 200 Q 650 200 520 350" 
               stroke="white" strokeWidth="1" fill="none" strokeDasharray="5 5" 
             />
          </svg>
        </div>
      </div>
    </section>
  );
}
