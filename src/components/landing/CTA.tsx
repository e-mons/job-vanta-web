"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function CTA() {
  return (
    <section className="pb-24 pt-12 relative px-6 lg:px-8 bg-white overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-slate-900 rounded-[56px] p-8 md:p-16 lg:p-24 overflow-hidden shadow-2xl"
        >
          {/* Internal Gradient Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
          <div className="absolute -bottom-48 -right-48 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />

          <div className="relative z-10 text-center flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-blue-400 text-sm font-bold mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ready to level up your career?</span>
            </motion.div>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-white mb-8 leading-[1.05]">
              Join the <span className="text-blue-400">future</span> of <br />
              modern job searching.
            </h2>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
              Don&apos;t leave your career to chance. Join ambitious professionals using AI to land higher-paying roles at top-tier tech companies.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link
                href="/signup"
                className="w-full sm:w-auto px-12 py-5 rounded-full bg-blue-600 text-white text-lg font-bold shadow-glow-blue hover:bg-blue-700 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                Create Your Account
                <ChevronRight className="w-5 h-5" />
              </Link>
              <div className="flex flex-col items-start gap-2 text-white/60">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Free forever core features
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  No credit card required
                </div>
              </div>
            </div>

            {/* Floating Avatars / Proof */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-12 pt-16 border-t border-white/5 w-full">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">High</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">AI Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">100+</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Resume Templates</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
