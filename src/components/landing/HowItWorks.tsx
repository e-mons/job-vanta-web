"use client";

import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  FileText, 
  Search, 
  Rocket, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  LayoutDashboard,
  CheckCircle2
} from 'lucide-react';

const steps = [
  {
    icon: <FileText className="w-6 h-6 text-white" />,
    title: "Build Your AI Profile",
    desc: "Create an ATS-proof resume and professional profile optimized for modern hiring systems.",
  },
  {
    icon: <Search className="w-6 h-6 text-white" />,
    title: "Smart Job Discovery",
    desc: "Our AI analyzes millions of roles to find the perfect matches for your unique skills and goals.",
  },
  {
    icon: <Rocket className="w-6 h-6 text-white" />,
    title: "Apply & Land the Job",
    desc: "Streamline your applications, track progress, and ace interviews with our AI-guided tools.",
  }
];

const features = [
  {
    icon: <Zap className="w-5 h-5 text-blue-600" />,
    title: "AI Resume Builder",
    desc: "Automatically optimize your resume for specific job descriptions."
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-blue-600" />,
    title: "Market Insights",
    desc: "Get real-time data on salary trends and hiring demand in your field."
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
    title: "Secured Profile",
    desc: "Your data is protected with enterprise-grade security and privacy."
  },
  {
    icon: <LayoutDashboard className="w-5 h-5 text-blue-600" />,
    title: "Success Tracker",
    desc: "Manage all your applications and interview schedules in one place."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Floating Squares */}
      <div className="absolute top-20 left-20 w-8 h-8 bg-blue-400/20 rounded-lg animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-40 left-10 w-12 h-12 bg-blue-400/10 rounded-xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-10 right-20 w-10 h-10 bg-blue-400/20 rounded-lg animate-float" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-20 right-10 w-14 h-14 bg-blue-400/10 rounded-2xl animate-float" style={{ animationDelay: '1.5s' }} />

      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 mb-8"
          >
            <span className="text-xs font-black uppercase tracking-widest">Work Process</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-8 leading-tight"
          >
            JobVanta Work Process <br />
            <span className="text-blue-600">Step by Step</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 font-medium"
          >
            Everything you need to navigate your career journey with AI-powered precision and professional success.
          </motion.p>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-20 items-center mb-32">
          {/* Visual Left */}
          <div className="relative">
            {/* Main Portrait Card */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative w-full aspect-[4/5] max-w-[480px] mx-auto rounded-[3rem] bg-blue-50 overflow-hidden shadow-2xl"
            >
              <Image 
                src="/assets/professional_job_seeker_blue.png" 
                alt="Job Seeker" 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              {/* Floating Label */}
              <div className="absolute top-[60%] right-[-20px] glass px-6 py-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-2 animate-float">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-sm font-bold text-slate-900">Career Matched</span>
                <svg className="w-8 h-8 absolute -bottom-8 -left-4 text-blue-400" viewBox="0 0 40 40">
                  <path d="M5 5 Q 15 35 35 35" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
              </div>
            </motion.div>

            {/* Sub Phone Mockup Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-10 -right-4 w-[240px] aspect-[9/19] rounded-[2.5rem] border-[6px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden hidden sm:block"
            >
              <Image 
                src="/assets/jobvanta_app_preview.png" 
                alt="JobVanta AI Interface Preview" 
                fill 
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </motion.div>
          </div>

          {/* Steps Right */}
          <div className="space-y-12 relative">
            {/* Connecting Vertical Line */}
            <div className="absolute left-8 top-10 bottom-10 w-0.5 bg-slate-100 lg:block hidden" />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex items-start gap-8 group"
              >
                <div className="relative z-10 w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <div className="pt-2">
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Feature Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {feature.icon}
              </div>
              <h4 className="font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                {feature.title}
              </h4>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
