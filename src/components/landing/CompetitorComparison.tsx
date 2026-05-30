"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Scale } from 'lucide-react';

const COMPETITORS = [
  { name: 'JobVanta', highlighted: true },
  { name: 'Teal', highlighted: false },
  { name: 'Resume.io', highlighted: false },
  { name: 'Rezi', highlighted: false },
  { name: 'Jobscan', highlighted: false },
  { name: 'LinkedIn Premium', highlighted: false }
];

const FEATURES = [
  {
    name: 'ATS Keyword Scoring',
    values: [true, true, false, true, true, false] // JobVanta, Teal, Resume.io, Rezi, Jobscan, LinkedIn Premium
  },
  {
    name: 'Multi-Device Live Sync (Mobile + Web)',
    values: [true, false, false, false, false, true]
  },
  {
    name: 'Active Skill-Based Job Matching',
    values: [true, false, false, false, false, true]
  },
  {
    name: '24/7 AI Career Coach Chat',
    values: [true, false, false, true, false, false]
  },
  {
    name: 'Tailored Cover Letter Writer',
    values: [true, true, true, true, false, false]
  },
  {
    name: 'Pricing (Starts At)',
    values: ['$9.99/mo', '$29.00/mo', '$24.95/mo', '$29.00/mo', '$49.00/mo', '$39.99/mo']
  }
];

export default function CompetitorComparison() {
  return (
    <section id="comparison" className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-6">
            <Scale className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Compare & Save</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
            How JobVanta <br />
            <span className="text-blue-600">Compares to Alternatives</span>
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            See how JobVanta stacks up against leading career platforms in features, automation quality, and affordability.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto rounded-[2rem] border border-slate-200/80 shadow-2xl shadow-blue-900/5 bg-white">
          <table className="w-full min-w-[800px] border-collapse text-left font-sans">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-6 text-sm font-black text-slate-500 uppercase tracking-wider w-1/4">Features</th>
                {COMPETITORS.map((c) => (
                  <th 
                    key={c.name} 
                    className={`p-6 text-center text-sm font-black ${
                      c.highlighted ? 'text-blue-600 bg-blue-50/30' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {c.highlighted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 text-[8px] text-white uppercase font-black tracking-widest leading-none">
                          <Sparkles className="w-2.5 h-2.5 fill-white" />
                          AI-First
                        </span>
                      )}
                      <span>{c.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, idx) => {
                const isPricingRow = feature.name === 'Pricing (Starts At)';
                return (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                    <td className="p-6 text-sm font-bold text-slate-800 tracking-tight">{feature.name}</td>
                    {feature.values.map((val, competitorIdx) => {
                      const isHighlightedCol = COMPETITORS[competitorIdx].highlighted;
                      return (
                        <td 
                          key={competitorIdx} 
                          className={`p-6 text-center text-sm font-semibold ${
                            isHighlightedCol ? 'bg-blue-50/15' : ''
                          }`}
                        >
                          {typeof val === 'boolean' ? (
                            <div className="flex justify-center">
                              {val ? (
                                <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100/50 flex items-center justify-center text-emerald-600 shadow-sm">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                  <X className="w-4 h-4 stroke-[2.5]" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className={`font-black ${
                              isHighlightedCol ? 'text-blue-600 text-base' : 'text-slate-500'
                            }`}>
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Small footprint */}
        <div className="mt-8 text-center text-xs text-slate-400 font-medium">
          * Competitor data as of May 2026. Subscriptions are billed monthly and subject to terms.
        </div>

      </div>
    </section>
  );
}
