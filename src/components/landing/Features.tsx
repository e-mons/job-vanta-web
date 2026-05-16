"use client";

import { motion } from 'framer-motion';

const features = [
  {
    title: "AI Resume Builder",
    description: "Our Gemini-powered engine crafts ATS-optimized bullets from your raw experience. No more writer's block.",
    icon: "✨",
    color: "from-blue-500/20 to-cyan-500/20"
  },
  {
    title: "AI Job Matching",
    description: "Stop scrolling. Our algorithm analyzes your resume and delivers highly curated job listings directly to your dashboard.",
    icon: "🎯",
    color: "from-indigo-500/20 to-purple-500/20"
  },
  {
    title: "Resume Scanning",
    description: "Upload your current resume and get an instant score on ATS readability, keyword density, and overall impact.",
    icon: "🔍",
    color: "from-emerald-500/20 to-teal-500/20"
  },
  {
    title: "Live Preview Builder",
    description: "See your changes in real-time. What you see on the screen is exactly what exports to the pixel-perfect PDF.",
    icon: "⚡",
    color: "from-orange-500/20 to-red-500/20"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative z-10 bg-slate-50">
      <div className="max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
            The ultimate toolset for your career.
          </h2>
          <p className="text-base text-slate-500 max-w-2xl mx-auto font-medium">
            Everything you need to build a compelling professional narrative and get your application to the top of the stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="p-8 rounded-[32px] bg-white border border-slate-200/60 hover:border-blue-300 hover:shadow-[0_15px_30px_-10px_rgba(30,58,138,0.1)] transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl mb-6 bg-gradient-to-br ${feature.color} border border-slate-100 group-hover:scale-110 transition-transform shadow-sm`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed font-medium">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
