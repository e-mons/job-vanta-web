"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  FileText, 
  Search, 
  BarChart3, 
  Bell,
  Sparkles
} from 'lucide-react';

const leftFeatures = [
  {
    icon: <FileText className="w-8 h-8 text-blue-600" />,
    title: "One-Tap ATS Optimizer",
    desc: "Automatically adjust your resume keywords for any job description in seconds."
  },
  {
    icon: <Search className="w-8 h-8 text-blue-600" />,
    title: "Smart Matching Engine",
    desc: "Our AI identifies roles where you have a 90%+ skill alignment instantly."
  }
];

const rightFeatures = [
  {
    icon: <BarChart3 className="w-8 h-8 text-blue-600" />,
    title: "Success Analytics",
    desc: "Visual charts to understand your application conversion and market value."
  },
  {
    icon: <Bell className="w-8 h-8 text-blue-600" />,
    title: "Intelligent Alerts",
    desc: "Stay updated with real-time notifications for roles that fit your criteria."
  }
];

export default function AIFeatures() {
  return (
    <section id="features" className="py-24 bg-[#f8faff] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Core Features</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6"
          >
            The AI-First Career App
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 font-medium leading-relaxed"
          >
            Experience the next generation of job hunting. JobVanta combines advanced <br className="hidden md:block" /> 
            AI with a seamless mobile-first experience to elevate your career.
          </motion.p>
        </div>

        {/* Features Content */}
        <div className="relative flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0">
          
          {/* Left Features */}
          <div className="flex flex-col gap-12 lg:w-1/3">
            {leftFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative p-8 rounded-[2.5rem] bg-white shadow-xl shadow-blue-900/5 border border-white flex flex-col items-center text-center group hover:scale-105 transition-transform"
              >
                <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                
                {/* Connector Line SVG (Desktop) */}
                <div className="absolute top-1/2 -right-12 w-12 h-px border-t-2 border-dashed border-slate-200 hidden lg:block" />
              </motion.div>
            ))}
          </div>

          {/* Center Phone Mockup */}
          <div className="lg:w-1/3 flex justify-center relative">
            {/* Connection Circles Background (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden lg:block" viewBox="0 0 400 600">
               <path d="M50 150 Q 150 150 200 300" stroke="#e2e8f0" strokeWidth="2" fill="none" strokeDasharray="6 6" />
               <path d="M50 450 Q 150 450 200 300" stroke="#e2e8f0" strokeWidth="2" fill="none" strokeDasharray="6 6" />
               <path d="M350 150 Q 250 150 200 300" stroke="#e2e8f0" strokeWidth="2" fill="none" strokeDasharray="6 6" />
               <path d="M350 450 Q 250 450 200 300" stroke="#e2e8f0" strokeWidth="2" fill="none" strokeDasharray="6 6" />
            </svg>

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              className="relative w-[280px] aspect-[9/19] rounded-[3rem] border-[8px] border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-20"
            >
              <Image 
                src="/assets/jobvanta_app_preview.png" 
                alt="JobVanta AI Dashboard Preview" 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </motion.div>
          </div>

          {/* Right Features */}
          <div className="flex flex-col gap-12 lg:w-1/3">
            {rightFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative p-8 rounded-[2.5rem] bg-white shadow-xl shadow-blue-900/5 border border-white flex flex-col items-center text-center group hover:scale-105 transition-transform"
              >
                <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                
                {/* Connector Line SVG (Desktop) */}
                <div className="absolute top-1/2 -left-12 w-12 h-px border-t-2 border-dashed border-slate-200 hidden lg:block" />
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
