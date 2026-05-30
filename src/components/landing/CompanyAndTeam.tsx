"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowUpRight } from 'lucide-react';

const TEAM = [
  {
    name: "Emanuel Mons",
    role: "Founder & CEO",
    bio: "Passionate about career development and technology. Emanuel founded JobVanta to solve the systemic keyword-filtering biases job seekers face daily.",
    linkedin: "#",
    initial: "EM"
  },
  {
    name: "Elena Rodriguez",
    role: "Head of Product UX/UI",
    bio: "Focused on human-centered design. Elena leads UI/UX design, making sure building and matching resumes is an effortless experience.",
    linkedin: "#",
    initial: "ER"
  },
  {
    name: "Dr. Alex Mercer",
    role: "AI Tech Lead",
    bio: "AI researcher specializing in semantic parsing and NLP. Alex drives our ATS analysis models and career coach chatbot integrations.",
    linkedin: "#",
    initial: "AM"
  }
];

export default function CompanyAndTeam() {
  return (
    <section id="about" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative z-10">
        
        {/* Row 1: Company Mission & Story */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600">
              <Users className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Our Mission</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              We Believe Potential <br />
              <span className="text-blue-600">Should Never Be Filtered</span>
            </h2>
            <p className="text-base text-slate-500 font-medium leading-relaxed">
              Every day, thousands of qualified professionals fail to pass automatic resume-screening machines (ATS) simply due to keywords or formatting issues. This systemic barrier filters out outstanding candidates before they ever have a chance to speak with a hiring manager.
            </p>
            <p className="text-base text-slate-500 font-medium leading-relaxed">
              JobVanta was founded to bridge this gap. We empower job seekers with smart, AI-driven tools that analyze listing requirements and optimize resumes in real-time, helping you present your true professional story with clarity and authority.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 md:p-12 rounded-[3rem] bg-slate-900 text-white text-left relative overflow-hidden shadow-2xl"
          >
            {/* Glowing Accent */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-600/30 rounded-full blur-[80px]" />
            
            <h3 className="text-2xl font-black mb-6 relative z-10">JobVanta in Numbers</h3>
            <div className="grid grid-cols-2 gap-8 relative z-10">
              <div className="space-y-1">
                <p className="text-4xl font-black text-blue-400">100%</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Spam-Free Job Board</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-blue-400">24/7</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Support & Coaching</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-blue-400">4+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pro Resume Styles</p>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-black text-blue-400">Instant</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ATS Optimization</p>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-800 pt-6 text-xs text-slate-400 font-semibold leading-relaxed relative z-10">
              JobVanta is a privacy-first application built to deliver career search precision, resume control, and confidence to candidates globally.
            </div>
          </motion.div>
        </div>

        {/* Row 2: Leadership Team */}
        <div>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Meet the Leaders</h3>
            <p className="text-base text-slate-500 font-medium">The professionals building the future of AI-driven career matching.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-slate-50 border border-slate-200/50 rounded-[2.5rem] p-8 text-left hover:border-blue-200 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-base font-black shadow-md">
                      {member.initial}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg leading-tight">{member.name}</h4>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">{member.role}</p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm font-semibold leading-relaxed mb-6">
                    {member.bio}
                  </p>
                </div>
                
                <a
                  href={member.linkedin}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-blue-600 transition-colors group mt-2"
                >
                  View LinkedIn Profile
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
