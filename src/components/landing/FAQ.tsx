"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "What is JobVanta exactly?",
    answer: "JobVanta is an AI-powered career platform designed to help you build professional, ATS-optimized resumes and find job matches that perfectly align with your skills and experience."
  },
  {
    question: "Is the AI resume builder free to use?",
    answer: "We offer a selection of professional templates for free. Our premium 'AI Enhancement' features, which provide real-time optimization and professional content suggestions, are available with a Pro subscription."
  },
  {
    question: "How does the AI job matching work?",
    answer: "Our advanced algorithms analyze your resume content against thousands of live job descriptions, calculating a 'Match Score' to prioritize the roles where you have the highest chance of success."
  },
  {
    question: "Can I download my resume in PDF format?",
    answer: "Yes, all resumes created on JobVanta can be exported as high-quality, ATS-friendly PDFs that are ready to be uploaded to any job application portal."
  },
  {
    question: "Does the platform support multiple languages?",
    answer: "Currently, JobVanta is optimized for English-language resumes and job markets. We are actively working on expanding support for international markets and additional languages."
  }
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="pb-12 pt-12 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6"
          >
            FAQs
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-slate-900"
          >
            Frequently Asked Question
          </motion.h2>
        </div>

        {/* FAQ List */}
        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-slate-100 last:border-0"
            >
              <button
                onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                className="w-full py-8 flex items-center justify-between group transition-all"
              >
                <span className={`text-xl md:text-2xl font-bold transition-colors text-left pr-8 ${activeIndex === index ? 'text-blue-600' : 'text-slate-900'}`}>
                  {faq.question}
                </span>
                
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border flex items-center justify-center transition-all duration-300 ${
                  activeIndex === index 
                    ? 'bg-blue-600 border-blue-600 text-white rotate-45' 
                    : 'bg-white border-slate-200 text-slate-400 group-hover:border-blue-600 group-hover:text-blue-600'
                }`}>
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </button>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="pb-8 text-lg text-slate-500 leading-relaxed max-w-3xl font-medium">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
