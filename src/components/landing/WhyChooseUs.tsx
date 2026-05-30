"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  Zap, 
  ShieldCheck, 
  Users, 
  Headset,
  CheckCircle2,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';

const tabs = [
  {
    id: 'ai-precision',
    label: 'AI Precision',
    icon: <Zap className="w-4 h-4" />,
    title: "Unmatched Skill Matching",
    desc: "Our deep-learning algorithms analyze your skill set and match you with roles that perfectly align with your career goals.",
    featureTitle: "Smart Match Engine",
    featureDesc: "Identify high-impact roles based on deep semantic skill overlap, experience matching, and career goals.",
    mainImage: "/assets/professional_job_seeker_blue.png"
  },
  {
    id: 'verified-jobs',
    label: 'Verified Jobs',
    icon: <ShieldCheck className="w-4 h-4" />,
    title: "100% Verified Opportunities",
    desc: "We partner directly with top-tier companies to ensure every job posting on JobVanta is authentic and active.",
    featureTitle: "Top Companies",
    featureDesc: "Skip the spam and focus on roles that are actually hiring today.",
    mainImage: "/assets/professional_job_seeker_blue.png"
  },
  {
    id: 'real-time-alerts',
    label: 'Real-Time Alerts',
    icon: <Users className="w-4 h-4" />,
    title: "Never Miss a Match",
    desc: "Get instant notifications the second a role that fits your profile is posted, giving you the early applicant advantage.",
    featureTitle: "Instant Alerts",
    featureDesc: "Stay ahead of the competition with real-time career notifications.",
    mainImage: "/assets/professional_job_seeker_blue.png"
  },
  {
    id: 'career-coaching',
    label: 'Career Coaching',
    icon: <Headset className="w-4 h-4" />,
    title: "AI-Driven Insights",
    desc: "Get personalized tips on how to improve your profile, what skills to learn next, and how to ace your interviews.",
    featureTitle: "Pro Insights",
    featureDesc: "Level up your career with data-backed professional guidance.",
    mainImage: "/assets/professional_job_seeker_blue.png"
  }
];

export default function WhyChooseUs() {
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <section id="why-choose-us" className="py-24 bg-[#f8faff] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-6"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Why Choose Us</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight"
          >
            The Smartest Way to <br />
            <span className="text-blue-600">Navigate Your Career</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 font-medium leading-relaxed"
          >
            Built for modern professionals who want to skip the noise and land high-impact roles with AI-powered precision.
          </motion.p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 md:gap-12 mb-20 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab)}
              className={`relative pb-6 text-sm font-bold transition-all ${
                activeTab.id === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab.label}
              </div>
              {activeTab.id === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid lg:grid-cols-3 gap-12 items-center"
            >
              {/* Left Card */}
              <div className="order-2 lg:order-1">
                <div className="p-8 rounded-[2.5rem] bg-white shadow-xl shadow-blue-900/5 border border-white relative group">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-8 shadow-lg shadow-blue-600/30">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{activeTab.featureTitle}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    {activeTab.featureDesc}
                  </p>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full -z-10 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              {/* Center Image */}
              <div className="order-1 lg:order-2 flex justify-center">
                <div className="relative w-full max-w-[400px] aspect-[4/5] rounded-[3.5rem] overflow-hidden shadow-2xl border-[12px] border-white">
                  <Image 
                    src={activeTab.mainImage}
                    alt={activeTab.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  {/* Bottom Float */}
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-slate-900/80 to-transparent">
                    <div className="glass px-6 py-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Career Match</p>
                        <p className="text-white font-bold">High Alignment</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Floating Cards */}
              <div className="order-3 space-y-8">
                <div className="glass p-6 rounded-3xl shadow-xl border border-white/50 flex items-center gap-6 animate-float">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Top Role</p>
                    <p className="text-slate-900 font-bold">Senior Product Designer</p>
                  </div>
                </div>

                <div className="glass p-6 rounded-3xl shadow-xl border border-white/50 flex items-center gap-6 animate-float" style={{ animationDelay: '1s' }}>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Insights</p>
                    <p className="text-slate-900 font-bold">Market Value Alignment</p>
                  </div>
                </div>

                <div className="p-8">
                  <h4 className="text-xl font-bold text-slate-900 mb-4">{activeTab.title}</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    {activeTab.desc}
                  </p>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}
