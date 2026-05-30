"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, EyeOff, Server, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';

const BADGES = [
  {
    icon: <CreditCard className="w-6 h-6 text-blue-600" />,
    title: "Secure Payments",
    desc: "100% encrypted checkout billing powered by Stripe. We never store your card information."
  },
  {
    icon: <Lock className="w-6 h-6 text-blue-600" />,
    title: "AES-256 Encryption",
    desc: "All personal information and resume files are encrypted both at rest and in transit."
  },
  {
    icon: <EyeOff className="w-6 h-6 text-blue-600" />,
    title: "Privacy First",
    desc: "Your data is private. JobVanta never sells, shares, or monetizes your data with third-party advertisers."
  },
  {
    icon: <Server className="w-6 h-6 text-blue-600" />,
    title: "Reliable Cloud",
    desc: "Built on Supabase enterprise architecture, ensuring 99.9% availability and data integrity."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-blue-600" />,
    title: "Safe AI Generation",
    desc: "Our AI integrations process queries securely under privacy policies that prohibit training on user data."
  },
  {
    icon: <ShieldCheck className="w-6 h-6 text-blue-600" />,
    title: "Account Control",
    desc: "Full rights to your profile. Delete your resume files and account data instantly at any time."
  }
];

export default function TrustAndSecurity() {
  return (
    <section id="trust-security" className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-80 h-80 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-6">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Security & Privacy</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            Designed to Protect <br />
            <span className="text-blue-600">Your Personal Career Data</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Your trust is our most valuable asset. We employ modern security protocols and rigid privacy standards to safeguard your data.
          </p>
        </div>

        {/* Badges Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {BADGES.map((badge, i) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="p-8 rounded-[2.5rem] bg-white border border-slate-200/50 shadow-xl shadow-blue-900/5 hover:border-blue-200 transition-colors text-left flex flex-col justify-start"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 shrink-0">
                {badge.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{badge.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-semibold">{badge.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Compliance info strip */}
        <div className="p-8 rounded-[2rem] bg-white border border-slate-200/50 shadow-xl shadow-blue-900/5 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-base">Privacy Compliance Verified</p>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Aligned with international GDPR & CCPA privacy protection guidelines.</p>
            </div>
          </div>
          <a
            href="/privacy"
            className="w-full md:w-auto px-6 py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 font-bold text-xs text-center shrink-0 transition-colors"
          >
            Read Privacy Policy
          </a>
        </div>

      </div>
    </section>
  );
}
