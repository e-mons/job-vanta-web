"use client";

import { motion } from 'framer-motion';
import { 
  Rocket, 
  Users, 
  Target, 
  Heart, 
  Shield, 
  Sparkles,
  ArrowRight,
  Briefcase,
  CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const stats = [
  { label: "Successful Hires", value: "50k+" },
  { label: "Partner Companies", value: "1.2k+" },
  { label: "AI Matches Daily", value: "200k+" },
  { label: "Resume Revisions", value: "1M+" }
];

const values = [
  {
    icon: <Target className="w-6 h-6 text-blue-600" />,
    title: "Precision First",
    desc: "We believe in matching skills, not just keywords, to create lasting career fits."
  },
  {
    icon: <Users className="w-6 h-6 text-blue-600" />,
    title: "User Empowered",
    desc: "Putting the tools of professional success into the hands of every job seeker."
  },
  {
    icon: <Shield className="w-6 h-6 text-blue-600" />,
    title: "Verified Quality",
    desc: "Authenticity is our core promise. Every job and every profile is verified."
  }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-40 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-8">
                <Rocket className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Our Mission</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-8 leading-[1.1]">
                Democratizing <br />
                <span className="text-blue-600">Career Success.</span>
              </h1>
              
              <p className="text-xl text-slate-500 font-medium leading-relaxed mb-10">
                JobVanta started with a simple idea: job hunting should be about potential, not just paperwork. We've built an AI ecosystem that levels the playing field for professionals everywhere.
              </p>

              <div className="grid grid-cols-2 gap-6 sm:gap-8">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="text-3xl font-black text-slate-900 mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-square rounded-[4rem] bg-blue-50 overflow-hidden shadow-2xl border-[16px] border-white"
            >
              <Image 
                src="/assets/professional_job_seeker_blue.png" 
                alt="Our Team" 
                fill 
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-[#f8faff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6">Our Core Values</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              What drives us to build the future of hiring every single day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-10 rounded-[3rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-blue-200 transition-all group text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 mx-auto group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{value.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {value.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 text-center">
          <div className="glass p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 relative z-10">
              Ready to take the <br className="sm:hidden" /><span className="text-blue-600">next step?</span>
            </h2>
            <p className="text-lg text-slate-500 font-medium mb-12 max-w-2xl mx-auto relative z-10">
              Join thousands of professionals who have transformed their career journey with JobVanta.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <Link 
                href="/signup" 
                className="px-10 py-5 rounded-2xl bg-blue-600 text-white font-black shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all flex items-center gap-3"
              >
                <span>Get Started Now</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/jobs" 
                className="px-10 py-5 rounded-2xl bg-slate-50 text-slate-900 font-black hover:bg-slate-100 transition-all"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
