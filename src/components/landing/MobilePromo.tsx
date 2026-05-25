"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Apple, PlayCircle, Smartphone, CheckCircle2, QrCode, Sparkles, Bell, Zap } from 'lucide-react';

export default function MobilePromo() {
  return (
    <section id="mobile-app" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        
        {/* Main Dark Container */}
        <div className="relative rounded-[3rem] bg-[#020617] overflow-hidden p-12 md:p-20 shadow-2xl shadow-blue-900/20">
          
          {/* Background Decor */}
          <div className="absolute inset-0 ribbed-background opacity-10" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]" />

          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            
            {/* Left Content */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col gap-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-white/10 text-blue-400 text-[10px] font-black uppercase tracking-widest w-fit">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Experience</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Your Career, <br />
                <span className="text-blue-500">Always Within Reach.</span>
              </h2>
              
              <p className="text-lg text-slate-400 leading-relaxed max-w-xl font-medium">
                Track applications, receive real-time job matches, and optimize your resume on the go. Our mobile app keeps your journey moving wherever you are.
              </p>

              <div className="grid sm:grid-cols-2 gap-6 mb-4">
                {[
                  { icon: <Bell className="w-4 h-4" />, text: "Real-time Alerts" },
                  { icon: <Zap className="w-4 h-4" />, text: "One-Tap Apply" },
                  { icon: <Sparkles className="w-4 h-4" />, text: "AI Optimization" },
                  { icon: <Smartphone className="w-4 h-4" />, text: "Offline Access" }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-white/80 font-bold text-sm">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
                      {feature.icon}
                    </div>
                    {feature.text}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <div className="flex items-center gap-3 px-8 py-4 rounded-2xl glass-dark border border-white/10 text-white shadow-xl opacity-80 cursor-not-allowed">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase font-black tracking-wider leading-none">In Development</span>
                    <span className="text-lg font-black leading-tight">Mobile Apps Coming Soon</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-6 p-6 rounded-[2rem] glass-dark border border-white/10 w-fit group opacity-50">
                 <div className="p-3 bg-white rounded-2xl">
                   <QrCode className="w-12 h-12 text-slate-900" />
                 </div>
                 <div>
                   <div className="font-black text-white text-base">App in Review</div>
                   <div className="text-slate-400 text-xs font-medium">Coming soon for iOS & Android</div>
                 </div>
              </div>
            </motion.div>

            {/* Right Visual */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Floating App Cards */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 -left-10 z-20 hidden md:block"
              >
                <div className="glass-dark-premium px-6 py-4 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                     <Sparkles className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI Status</p>
                     <p className="text-white text-sm font-bold">Resumes Optimized</p>
                   </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-20 -right-10 z-20 hidden md:block"
              >
                <div className="glass-dark-premium px-6 py-4 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                     <Bell className="w-5 h-5 text-white" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Live Alert</p>
                     <p className="text-white text-sm font-bold">New Job Match Found</p>
                   </div>
                </div>
              </motion.div>

              {/* Central Phone Mockup */}
              <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                className="relative w-[280px] aspect-[9/19] rounded-[3rem] border-[8px] border-slate-800 bg-slate-900 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden z-10"
              >
                <Image 
                  src="/assets/jobvanta_app_preview.png" 
                  alt="JobVanta Mobile App Preview" 
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </motion.div>
              
              {/* Radial Background Glow */}
              <div className="absolute inset-0 bg-blue-600/20 blur-[100px] -z-10 rounded-full scale-150" />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
