"use client";

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface StartMethodCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  isLoading?: boolean;
}

export default function StartMethodCard({ title, description, icon, onClick, isLoading }: StartMethodCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03, translateY: -8 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={isLoading}
      className="w-full text-left p-10 rounded-[40px] bg-white border border-slate-100/60 hover:border-blue-300 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] transition-all duration-300 relative overflow-hidden group shadow-md shadow-slate-200/50"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-3xl mb-8 group-hover:from-blue-100 group-hover:to-indigo-50 group-hover:border-blue-200 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-sm group-hover:shadow-md group-hover:shadow-blue-500/20">
          {isLoading ? (
            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="group-hover:drop-shadow-sm">{icon}</span>
          )}
        </div>
        
        <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-300">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed mb-8 group-hover:text-slate-600">{description}</p>
        
        <div className="flex items-center gap-2 text-sm font-black text-blue-600 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-500">
          Get Started
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>

      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-indigo-400/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full -ml-16 -mb-16 blur-2xl group-hover:opacity-100 transition-opacity duration-700" />
    </motion.button>
  );
}
