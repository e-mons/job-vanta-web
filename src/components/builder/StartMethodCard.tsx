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
      whileHover={{ scale: 1.02, translateY: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading}
      className="w-full text-left p-10 rounded-[40px] bg-white border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 relative overflow-hidden group shadow-sm shadow-slate-200/50"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl mb-8 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
          {isLoading ? (
            <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <span className="group-hover:drop-shadow-sm">{icon}</span>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-slate-500 font-medium leading-relaxed mb-6">{description}</p>
        
        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
          Get Started
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full -mr-16 -mt-16 blur-2xl group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}
