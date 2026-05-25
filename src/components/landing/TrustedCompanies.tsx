"use client";

import { motion } from 'framer-motion';

const companies = [
  "Google", "Microsoft", "Amazon", "Meta", "Netflix", "Airbnb", "Uber", "Dodo"
];

export default function TrustedCompanies() {
  return (
    <section className="py-12 bg-white border-y border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8"
        >
          Jobs from top global companies
        </motion.p>
        
        <div className="relative flex overflow-hidden group">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
            className="flex animate-scroll hover:pause gap-16 sm:gap-24 lg:gap-32 items-center"
          >
            {[...companies, ...companies].map((company, i) => (
              <div 
                key={i}
                className="flex items-center justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700 hover:scale-110"
              >
                <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter whitespace-nowrap">
                  {company}
                </span>
              </div>
            ))}
          </motion.div>
          
          {/* Edge Fades */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent z-10" />
        </div>
      </div>
    </section>
  );
}
