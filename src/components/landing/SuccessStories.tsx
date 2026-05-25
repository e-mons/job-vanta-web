"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Michael Chen",
    role: "Senior Software Engineer",
    image: "/assets/avatar_1.png",
    quote: "JobVanta's AI matching is scarily accurate. It found roles I didn't even know were open, and the ATS optimization helped me land my dream role in Tech in just 3 weeks.",
    success: "Landed role in Tech"
  },
  {
    id: 2,
    name: "Sarah Jenkins",
    role: "Product Marketing Manager",
    image: "/assets/avatar_2.png",
    quote: "The resume builder is a game changer. I used to spend hours tweaking my CV for every application. Now, I do it in one tap and the results speak for themselves.",
    success: "3x More Interviews"
  },
  {
    id: 3,
    name: "David Rodriguez",
    role: "Data Analyst",
    image: "/assets/avatar_3.png",
    quote: "As someone transitioning careers, the insights on skill gaps were invaluable. It told me exactly what I needed to learn to be competitive in the job market.",
    success: "Successful Career Pivot"
  }
];

export default function SuccessStories() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background with Solid Gradient & Ribbed Effect */}
      <div className="absolute inset-0 bg-[#020617] bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#0f172a]" />
      <div className="absolute inset-0 ribbed-background opacity-20" />
      
      {/* Decorative Elements */}
      <div className="absolute top-12 right-24 opacity-10">
        <Quote className="w-64 h-64 text-blue-500" />
      </div>
      <div className="absolute top-20 right-40 grid grid-cols-6 gap-4 opacity-10">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative z-10">
        {/* Header */}
        <div className="mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-dark border border-white/10 text-blue-400 mb-6"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">Success Stories</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6"
          >
            What Our Users Say
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-400 font-medium max-w-2xl leading-relaxed"
          >
            Real experiences from professionals who transformed their careers and landed high-impact roles using JobVanta AI.
          </motion.p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={prev}
            className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/5 transition-all shadow-lg"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={next}
            className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col lg:flex-row items-center gap-16"
            >
              {/* Active Portrait Left */}
              <div className="relative group">
                <div className="relative w-[340px] aspect-[4/5] rounded-[2.5rem] overflow-hidden border-[10px] border-white/5 shadow-2xl">
                  <Image 
                    src={testimonials[currentIndex].image}
                    alt={testimonials[currentIndex].name}
                    fill
                    className="object-cover"
                  />
                  {/* Portrait Footer */}
                  <div className="absolute inset-x-0 bottom-0 p-8 bg-white text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{testimonials[currentIndex].name}</h3>
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">{testimonials[currentIndex].role}</p>
                  </div>
                </div>
                {/* Floating Glow */}
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-[60px] -z-10 group-hover:bg-blue-500/30 transition-all" />
              </div>

              {/* Quote Bubble Right */}
              <div className="flex-1 relative">
                <div className="glass-dark-premium p-10 md:p-16 rounded-[3rem] border border-white/10 relative">
                  <p className="text-xl md:text-2xl font-bold text-white leading-relaxed italic">
                    "{testimonials[currentIndex].quote}"
                  </p>
                  
                  {/* Decorative Line */}
                  <div className="absolute -bottom-8 -right-8 w-48 h-24 border-b-2 border-r-2 border-blue-500 rounded-br-[3rem] opacity-50" />
                </div>
                
                {/* Success Highlight */}
                <div className="mt-8 flex items-center gap-3 px-6 py-3 rounded-full bg-blue-600/10 border border-blue-500/20 w-fit">
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                   <span className="text-sm font-black text-blue-400 uppercase tracking-widest">{testimonials[currentIndex].success}</span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Thumbnails Footer */}
        <div className="mt-24 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5 pt-12">
          <div className="flex items-center gap-4">
            <div className="px-5 py-2 rounded-full glass-dark border border-white/10 text-blue-400 text-xs font-black">
              {currentIndex + 1} / {testimonials.length}
            </div>
          </div>
          
          <div className="flex gap-4">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setCurrentIndex(i)}
                className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${
                  currentIndex === i ? 'border-blue-600 scale-110 shadow-lg shadow-blue-600/20' : 'border-white/10 opacity-40 hover:opacity-100'
                }`}
              >
                <Image src={t.image} alt={t.name} fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
