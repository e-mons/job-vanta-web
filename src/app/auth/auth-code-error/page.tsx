"use client";

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[3rem] p-12 shadow-2xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden"
        >
          {/* Subtle accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />
          
          <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>

          <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Authentication Error</h1>
          <p className="text-slate-500 font-medium mb-10 leading-relaxed">
            We couldn't verify your session. This might be because the link expired or has already been used.
          </p>

          <div className="flex flex-col gap-4">
            <Link 
              href="/login"
              className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
            >
              <RefreshCcw className="w-4 h-4" />
              Try Signing In Again
            </Link>
            <Link 
              href="/"
              className="w-full py-4 rounded-2xl bg-slate-100 text-slate-900 font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
