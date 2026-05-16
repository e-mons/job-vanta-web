"use client";

import { motion } from 'framer-motion';

export default function About() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex flex-col gap-6"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              We believe your potential shouldn't be filtered by a machine.
            </h2>
            <p className="text-lg text-white/60 leading-relaxed">
              Every day, thousands of highly qualified candidates are rejected by Applicant Tracking Systems (ATS) simply because their resume wasn't formatted correctly or lacked the right keywords. 
            </p>
            <p className="text-lg text-white/60 leading-relaxed">
              JobVanta bridges the gap between your true capability and what recruiters see. Our AI doesn't just format your resume; it understands your career trajectory and strategically positions you as the perfect candidate.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[500px] w-full rounded-3xl glass border border-white/10 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-64 h-64 rounded-full border border-cyan-500/30 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                 <div className="w-48 h-48 rounded-full border border-indigo-500/30 flex items-center justify-center animate-[spin_7s_linear_infinite_reverse]">
                   <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 shadow-[0_0_50px_rgba(6,182,212,0.4)]" />
                 </div>
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
